import { useCallback } from 'react';
import { supabase, Tournament, Match, TIEBREAKER_PHASES, resolveVotes } from '../lib/supabase';

export function useMatchActions(tournament: Tournament | null) {
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
    if (isEvenMatch || !nextMatch.player2_name) {
      await supabase.from('matches').update({
        player1_name: winnerName,
        status: nextMatch.player2_name ? 'proposing' : 'pending',
      }).eq('id', nextMatch.id);
    } else {
      await supabase.from('matches').update({
        player2_name: winnerName, status: 'proposing',
      }).eq('id', nextMatch.id);
    }
  }, []);

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
    const { data: match } = await supabase.from('matches').select('*').eq('id', matchId).single();
    if (!match) return;
    if (!TIEBREAKER_PHASES.includes(match.status as typeof TIEBREAKER_PHASES[number])) return;

    if (match.status === 'tiebreak_d1') {
      await supabase.from('matches').update({
        status: 'tiebreak_d2',
        voting_ends_at: new Date(Date.now() + 60_000).toISOString(),
      }).eq('id', matchId);
      return;
    }

    if (match.status === 'tiebreak_d2') {
      await supabase.from('votes').delete().eq('match_id', matchId);
      await supabase.from('matches').update({
        status: 'tiebreak_vote',
        voting_ends_at: new Date(Date.now() + 5 * 60_000).toISOString(),
      }).eq('id', matchId);
      return;
    }

    if (match.status === 'tiebreak_vote') {
      const { data: revoteVotes } = await supabase.from('votes').select('*').eq('match_id', matchId);
      const { data: matchProposals } = await supabase.from('proposals').select('*').eq('match_id', matchId);
      if (!revoteVotes || !matchProposals || matchProposals.length < 2) return;

      const { winner, isTied } = resolveVotes(revoteVotes, matchProposals);

      if (isTied) {
        const rouletteWinner = matchProposals[Math.floor(Math.random() * 2)].player_name;
        await supabase.from('matches').update({
          status: 'tiebreak_roulette',
          winner_name: rouletteWinner,
          voting_ends_at: new Date(Date.now() + 6_000).toISOString(),
        }).eq('id', matchId);
      } else {
        await supabase.from('matches').update({ status: 'completed', winner_name: winner.player_name }).eq('id', matchId);
        await advanceWinner(match.tournament_id, match, winner.player_name);
      }
      return;
    }

    if (match.status === 'tiebreak_roulette' && match.winner_name) {
      await supabase.from('matches').update({ status: 'completed' }).eq('id', matchId);
      await advanceWinner(match.tournament_id, match, match.winner_name);
    }
  }, [advanceWinner]);

  const createLobby = useCallback(async (participants: string[]) => {
    const { data: tournamentData, error } = await supabase
      .from('tournaments')
      .insert({
        num_participants: participants.length,
        participants,
        status: 'setup',
      })
      .select().single();

    if (error || !tournamentData) {
      console.error('Error al crear sala:', error);
      alert('Error al crear la sala. Revisa la consola (F12) para más detalles.');
      return null;
    }
    return { tournamentId: tournamentData.id };
  }, []);

  const startDraw = useCallback(async () => {
    if (!tournament) return null;

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

    await supabase.from('matches').insert(matchesToCreate);
    await supabase.from('tournaments').update({
      participants: shuffled,
      status: 'in_progress',
    }).eq('id', tournament.id);

    return { participants: shuffled, tournamentId: tournament.id };
  }, [tournament]);

  const handleStartMatch = useCallback(async (match: Match) => {
    await supabase.from('matches')
      .update({ status: 'proposing' })
      .eq('id', match.id);
  }, []);

  const handleSubmitProposal = useCallback(async (
    matchId: string,
    playerName: string,
    proposalData: { flight_link: string; price: number; destination?: string; dates?: string }
  ) => {
    await supabase.from('proposals').insert({
      match_id: matchId, player_name: playerName, ...proposalData,
    });

    const { data: allProposals } = await supabase
      .from('proposals').select('*').eq('match_id', matchId);

    if (allProposals && allProposals.length === 2) {
      const votingEndsAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
      await supabase.from('matches')
        .update({ status: 'voting', voting_ends_at: votingEndsAt })
        .eq('id', matchId);
    }
  }, []);

  const handleVote = useCallback(async (matchId: string, voterName: string, proposalId: string) => {
    await supabase.from('votes').upsert(
      { match_id: matchId, voter_name: voterName, proposal_id: proposalId },
      { onConflict: 'match_id,voter_name' }
    );

    if (tournament) {
      const { data: allVotes } = await supabase
        .from('votes').select('*').eq('match_id', matchId);
      if (allVotes && allVotes.length >= tournament.participants.length) {
        await completeMatch(matchId);
      }
    }
  }, [tournament, completeMatch]);

  const handleTiebreakerVote = useCallback(async (matchId: string, voterName: string, proposalId: string) => {
    await supabase.from('votes').upsert(
      { match_id: matchId, voter_name: voterName, proposal_id: proposalId },
      { onConflict: 'match_id,voter_name' }
    );
    if (tournament) {
      const { data: allVotes } = await supabase.from('votes').select('*').eq('match_id', matchId);
      if (allVotes && allVotes.length >= tournament.participants.length) {
        await advanceTiebreakerPhase(matchId);
      }
    }
  }, [tournament, advanceTiebreakerPhase]);

  return {
    createLobby,
    startDraw,
    handleStartMatch,
    handleSubmitProposal,
    handleVote,
    handleTiebreakerVote,
    completeMatch,
    advanceTiebreakerPhase,
  };
}
