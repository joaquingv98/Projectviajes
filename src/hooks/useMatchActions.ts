import { useCallback } from 'react';
import { toast } from 'sonner';
import { supabase, Tournament, Match, TIEBREAKER_PHASES, resolveVotes } from '../lib/supabase';
import { getParticipantToken } from '../lib/participantIdentity';
import { validateProposal } from '../lib/sanitize';
import { isBot, generateMockProposal } from '../lib/mobile';

export function useMatchActions(tournament: Tournament | null) {
  const getTokenOrThrow = useCallback((tournamentId: string, participantName: string) => {
    const token = getParticipantToken(tournamentId, participantName);
    if (!token) {
      throw new Error(`Missing participant token for ${participantName}`);
    }
    return token;
  }, []);

  const submitProposalSecure = useCallback(async (
    matchId: string,
    playerName: string,
    tournamentId: string,
    proposal: { flight_link: string; price: number; destination: string | null; dates: string | null }
  ) => {
    const { error } = await supabase.rpc('submit_proposal_secure', {
      p_match_id: matchId,
      p_player_name: playerName,
      p_participant_token: getTokenOrThrow(tournamentId, playerName),
      p_flight_link: proposal.flight_link,
      p_price: proposal.price,
      p_destination: proposal.destination,
      p_dates: proposal.dates,
    });
    if (error) throw error;
  }, [getTokenOrThrow]);

  const castVoteSecure = useCallback(async (
    matchId: string,
    voterName: string,
    tournamentId: string,
    proposalId: string
  ) => {
    const { error } = await supabase.rpc('cast_vote_secure', {
      p_match_id: matchId,
      p_voter_name: voterName,
      p_participant_token: getTokenOrThrow(tournamentId, voterName),
      p_proposal_id: proposalId,
    });
    if (error) throw error;
  }, [getTokenOrThrow]);

  const advanceWinner = useCallback(async (
    tournamentId: string,
    completedMatch: Match,
    winnerName: string
  ) => {
    if (completedMatch.round === 'final') {
      const { data: winningProposal } = await supabase
        .from('proposals').select('*')
        .eq('match_id', completedMatch.id).eq('player_name', winnerName).maybeSingle();
      if (winningProposal) {
        await supabase.from('tournaments').update({
          status: 'completed', winner_proposal_id: winningProposal.id,
        }).eq('id', tournamentId);
      }
      return;
    }

    const nextRound = completedMatch.round === 'quarterfinals' ? 'semifinals' : 'final';
    const nextMatchNumber = Math.floor(completedMatch.match_number / 2);

    const { data: nextMatch } = await supabase
      .from('matches').select('*')
      .eq('tournament_id', tournamentId).eq('round', nextRound)
      .eq('match_number', nextMatchNumber).maybeSingle();

    if (!nextMatch) return;

    const isEvenMatch = completedMatch.match_number % 2 === 0;
    if (isEvenMatch) {
      await supabase.from('matches').update({
        player1_name: winnerName,
        status: 'pending',
      }).eq('id', nextMatch.id);
    } else {
      await supabase.from('matches').update({
        player2_name: winnerName,
        status: 'pending',
      }).eq('id', nextMatch.id);
    }

    const { data: roundMatches } = await supabase.from('matches')
      .select('status').eq('tournament_id', tournamentId).eq('round', completedMatch.round);
    const allRoundComplete = roundMatches?.every(m => m.status === 'completed') ?? false;

    if (allRoundComplete) {
      const { data: nextRoundMatches } = await supabase.from('matches')
        .select('id, player1_name, player2_name, status')
        .eq('tournament_id', tournamentId).eq('round', nextRound);
      for (const m of nextRoundMatches ?? []) {
        if (m.player1_name && m.player1_name !== 'TBD' && m.player2_name && m.player2_name !== 'TBD' && m.status === 'pending') {
          await supabase.from('matches').update({ status: 'proposing' }).eq('id', m.id);
          if (isBot(m.player1_name, tournamentId) && isBot(m.player2_name, tournamentId)) {
            const mock1 = generateMockProposal();
            const mock2 = generateMockProposal();
            await submitProposalSecure(m.id, m.player1_name, tournamentId, mock1);
            await submitProposalSecure(m.id, m.player2_name, tournamentId, mock2);
            const votingEndsAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
            await supabase.from('matches')
              .update({ status: 'voting', voting_ends_at: votingEndsAt })
              .eq('id', m.id);
          }
        }
      }
    }
  }, [submitProposalSecure]);

  const completeMatch = useCallback(async (matchId: string) => {
    const { data: currentMatchCheck } = await supabase
      .from('matches').select('status').eq('id', matchId).single();
    if (!currentMatchCheck) return;
    const s = currentMatchCheck.status;
    if (s === 'completed' || TIEBREAKER_PHASES.includes(s)) return;

    const { data: matchVotes } = await supabase.from('votes').select('*').eq('match_id', matchId);
    const { data: matchProposals } = await supabase.from('proposals').select('*').eq('match_id', matchId);
    if (!matchVotes || !matchProposals || matchProposals.length < 2) return;

    const { winner, isTied } = resolveVotes(matchVotes, matchProposals);

    if (isTied) {
      await supabase.from('matches').update({
        status: 'tiebreak_d1',
        voting_ends_at: new Date(Date.now() + 60_000).toISOString(),
      }).eq('id', matchId);
      return;
    }

    const { data: currentMatch } = await supabase.from('matches').select('*').eq('id', matchId).single();
    if (!currentMatch) return;
    await supabase.from('matches').update({ status: 'completed', winner_name: winner.player_name }).eq('id', matchId);
    await advanceWinner(currentMatch.tournament_id, currentMatch, winner.player_name);
  }, [advanceWinner]);

  const advanceTiebreakerPhase = useCallback(async (matchId: string) => {
    const { error } = await supabase.rpc('advance_tiebreaker_phase', { p_match_id: matchId });
    if (error) throw error;
  }, []);

  const createLobby = useCallback(async (participants: string[], tournamentName?: string) => {
    const { data: tournamentData, error } = await supabase
      .from('tournaments')
      .insert({
        num_participants: participants.length,
        participants,
        status: 'setup',
        name: (tournamentName || 'Travel Tournament').trim() || 'Travel Tournament',
      })
      .select().single();

    if (error || !tournamentData) {
      console.error('Error al crear sala:', error);
      toast.error('Error al crear la sala. Comprueba tu conexión e inténtalo de nuevo.');
      return null;
    }
    return { tournamentId: tournamentData.id };
  }, []);

  const startDraw = useCallback(async () => {
    if (!tournament) return null;

    try {
      const shuffled = [...tournament.participants].sort(() => Math.random() - 0.5);
      const matchesToCreate: Omit<Match, 'id' | 'created_at' | 'updated_at'>[] = [];

      if (shuffled.length === 8) {
        for (let i = 0; i < 4; i++) {
          matchesToCreate.push({
            tournament_id: tournament.id, round: 'quarterfinals', match_number: i,
            player1_name: shuffled[i * 2], player2_name: shuffled[i * 2 + 1],
            status: 'pending', winner_name: null, voting_ends_at: null,
          });
        }
        for (let i = 0; i < 2; i++) {
          matchesToCreate.push({
            tournament_id: tournament.id, round: 'semifinals', match_number: i,
            player1_name: 'TBD', player2_name: null,
            status: 'pending', winner_name: null, voting_ends_at: null,
          });
        }
      } else if (shuffled.length === 4) {
        for (let i = 0; i < 2; i++) {
          matchesToCreate.push({
            tournament_id: tournament.id, round: 'semifinals', match_number: i,
            player1_name: shuffled[i * 2], player2_name: shuffled[i * 2 + 1],
            status: 'pending', winner_name: null, voting_ends_at: null,
          });
        }
      } else if (shuffled.length === 2) {
        matchesToCreate.push({
          tournament_id: tournament.id, round: 'final', match_number: 0,
          player1_name: shuffled[0], player2_name: shuffled[1],
          status: 'proposing', winner_name: null, voting_ends_at: null,
        });
      }

      if (shuffled.length > 2) {
        matchesToCreate.push({
          tournament_id: tournament.id, round: 'final', match_number: 0,
          player1_name: 'TBD', player2_name: null,
          status: 'pending', winner_name: null, voting_ends_at: null,
        });
      }

      const { error: insertError } = await supabase.from('matches').insert(matchesToCreate);
      if (insertError) throw insertError;

      const { error: updateError } = await supabase.from('tournaments').update({
        participants: shuffled,
        status: 'in_progress',
      }).eq('id', tournament.id);

      if (updateError) throw updateError;

      return { participants: shuffled, tournamentId: tournament.id };
    } catch (err) {
      console.error('Error al iniciar sorteo:', err);
      toast.error('Error al iniciar el sorteo. Comprueba tu conexión e inténtalo de nuevo.');
      return null;
    }
  }, [tournament]);

  const handleStartMatch = useCallback(async (match: Match) => {
    const p1 = match.player1_name;
    const p2 = match.player2_name;

    // Si ambos jugadores son bots, generar propuestas y pasar directo a votación
    if (p2 && isBot(p1, match.tournament_id) && isBot(p2, match.tournament_id)) {
      const mock1 = generateMockProposal();
      const mock2 = generateMockProposal();
      await submitProposalSecure(match.id, p1, match.tournament_id, mock1);
      await submitProposalSecure(match.id, p2, match.tournament_id, mock2);
      const votingEndsAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
      await supabase.from('matches')
        .update({ status: 'voting', voting_ends_at: votingEndsAt })
        .eq('id', match.id);
    } else {
      await supabase.from('matches')
        .update({ status: 'proposing' })
        .eq('id', match.id);
    }
  }, [submitProposalSecure]);

  const handleSubmitProposal = useCallback(async (
    matchId: string,
    playerName: string,
    proposalData: { flight_link: string; price: number; destination?: string; dates?: string }
  ) => {
    const sanitized = validateProposal(proposalData);
    if (!sanitized) {
      toast.error('Datos inválidos. Revisa el enlace, precio y destino.');
      throw new Error('Invalid proposal data');
    }
    try {
      const { data: match } = await supabase
        .from('matches')
        .select('player1_name, player2_name, tournament_id')
        .eq('id', matchId)
        .single();

      if (!match) throw new Error('Match not found');

      await submitProposalSecure(matchId, playerName, match.tournament_id, sanitized);

      const otherPlayer = match?.player1_name === playerName ? match?.player2_name : match?.player1_name;

      // Si el oponente es un bot, generar y enviar su propuesta automáticamente
      if (otherPlayer && match && isBot(otherPlayer, match.tournament_id)) {
        const mock = generateMockProposal();
        await submitProposalSecure(matchId, otherPlayer, match.tournament_id, mock);
      }

      const { data: allProposals } = await supabase
        .from('proposals').select('*').eq('match_id', matchId);

      if (allProposals && allProposals.length === 2) {
        const { error: updateError } = await supabase.from('matches')
          .update({ status: 'voting', voting_ends_at: new Date(Date.now() + 5 * 60 * 1000).toISOString() })
          .eq('id', matchId);
        if (updateError) throw updateError;
      }
    } catch (err) {
      console.error('Error al enviar propuesta:', err);
      toast.error('Error al enviar la propuesta. Comprueba tu conexión e inténtalo de nuevo.');
      throw err;
    }
  }, [submitProposalSecure]);

  const handleVote = useCallback(async (matchId: string, voterName: string, proposalId: string) => {
    const tournamentId = tournament?.id;
    if (!tournamentId) return;

    await castVoteSecure(matchId, voterName, tournamentId, proposalId);

    if (tournament) {
      const bots = tournament.participants.filter(p => isBot(p, tournament.id));
      const { data: proposals } = await supabase.from('proposals').select('id').eq('match_id', matchId);
      const proposalIds = proposals?.map(p => p.id) ?? [];

      // Bots votan automáticamente (aleatorio entre las dos propuestas)
      for (const botName of bots) {
        const randomProposalId = proposalIds[Math.floor(Math.random() * proposalIds.length)];
        if (randomProposalId) {
          await castVoteSecure(matchId, botName, tournament.id, randomProposalId);
        }
      }

      const { data: allVotes } = await supabase
        .from('votes').select('*').eq('match_id', matchId);
      if (allVotes && allVotes.length >= tournament.participants.length) {
        await completeMatch(matchId);
      }
    }
  }, [tournament, completeMatch, castVoteSecure]);

  const pickProposalForBot = useCallback(
    (botName: string, proposalIds: string[], proposals: { id: string; player_name: string }[], p1: string, p2: string | null) => {
      const isPlayerInMatch = botName === p1 || botName === p2;
      const ownProposal = proposals.find(pr => pr.player_name === botName);
      const otherProposalIds = proposalIds.filter(id => id !== ownProposal?.id);
      const candidates = isPlayerInMatch && otherProposalIds.length > 0 ? otherProposalIds : proposalIds;
      return candidates[Math.floor(Math.random() * candidates.length)];
    },
    []
  );

  const handleTiebreakerVote = useCallback(async (matchId: string, voterName: string, proposalId: string) => {
    const tournamentId = tournament?.id;
    if (!tournamentId) return;

    await castVoteSecure(matchId, voterName, tournamentId, proposalId);
    if (tournament) {
      const { data: match } = await supabase.from('matches').select('player1_name, player2_name').eq('id', matchId).single();
      const { data: existingVotes } = await supabase.from('votes').select('voter_name').eq('match_id', matchId);
      const voted = new Set((existingVotes ?? []).map(v => v.voter_name));
      const p1 = match?.player1_name ?? '';
      const p2 = match?.player2_name ?? null;
      const bots = tournament.participants.filter(p => isBot(p, tournament.id) && !voted.has(p));
      const { data: proposals } = await supabase.from('proposals').select('id, player_name').eq('match_id', matchId);
      const proposalList = proposals ?? [];
      const proposalIds = proposalList.map(p => p.id).filter(Boolean);

      for (const botName of bots) {
        try {
          const botProposalId = pickProposalForBot(botName, proposalIds, proposalList, p1, p2);
          if (botProposalId) {
            await castVoteSecure(matchId, botName, tournament.id, botProposalId);
          }
        } catch (err) {
          console.warn(`No se pudo votar por bot ${botName}:`, err);
        }
      }

      const { data: allVotes } = await supabase.from('votes').select('*').eq('match_id', matchId);
      if (allVotes && allVotes.length >= tournament.participants.length) {
        await advanceTiebreakerPhase(matchId);
      }
    }
  }, [tournament, advanceTiebreakerPhase, castVoteSecure, pickProposalForBot]);

  const ensureBotsVoted = useCallback(async (matchId: string) => {
    if (!tournament) return;
    const { data: match } = await supabase.from('matches').select('status, player1_name, player2_name').eq('id', matchId).single();
    if (!match) return;
    const isTiebreakVote = match.status === 'tiebreak_vote';
    if (match.status !== 'voting' && !isTiebreakVote) return;
    const { data: existingVotes } = await supabase.from('votes').select('voter_name').eq('match_id', matchId);
    const voted = new Set((existingVotes ?? []).map(v => v.voter_name));
    const bots = tournament.participants.filter(p => isBot(p, tournament!.id) && !voted.has(p));
    // En tiebreak: los bots del partido también deben auto-votar, si no la pantalla se bloquea
    if (bots.length === 0) return;
    const { data: proposals } = await supabase.from('proposals').select('id, player_name').eq('match_id', matchId);
    const proposalList = proposals ?? [];
    const proposalIds = proposalList.map(p => p.id).filter(Boolean);
    if (proposalIds.length === 0) return;
    for (const botName of bots) {
      try {
        const proposalId = pickProposalForBot(
          botName,
          proposalIds,
          proposalList,
          match.player1_name ?? '',
          match.player2_name ?? null
        );
        if (proposalId) {
          await castVoteSecure(matchId, botName, tournament.id, proposalId);
        }
      } catch (err) {
        console.warn(`No se pudo votar por bot ${botName}:`, err);
      }
    }
    const { data: allVotes } = await supabase.from('votes').select('*').eq('match_id', matchId);
    if (allVotes && allVotes.length >= tournament.participants.length) {
      if (isTiebreakVote) await advanceTiebreakerPhase(matchId);
      else await completeMatch(matchId);
    }
  }, [tournament, completeMatch, advanceTiebreakerPhase, castVoteSecure, pickProposalForBot]);

  return {
    createLobby,
    startDraw,
    handleStartMatch,
    handleSubmitProposal,
    handleVote,
    handleTiebreakerVote,
    completeMatch,
    advanceTiebreakerPhase,
    ensureBotsVoted,
  };
}
