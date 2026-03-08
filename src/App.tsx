import { useState, useEffect, useRef } from 'react';
import { supabase, Tournament, Match, Proposal, Vote, TIEBREAKER_PHASES } from './lib/supabase';
import TournamentSetup from './components/TournamentSetup';
import DrawAnimation from './components/DrawAnimation';
import Bracket from './components/Bracket';
import MatchSubmission from './components/MatchSubmission';
import VotingScreen from './components/VotingScreen';
import TiebreakerScreen from './components/TiebreakerScreen';
import WinnerScreen from './components/WinnerScreen';
import UserIdentification from './components/UserIdentification';
import LobbyScreen from './components/LobbyScreen';
import MusicPlayer from './components/MusicPlayer';

type AppState =
  | { screen: 'setup' }
  | { screen: 'identify'; tournamentId: string }
  | { screen: 'lobby'; tournamentId: string }
  | { screen: 'draw'; participants: string[]; tournamentId: string }
  | { screen: 'bracket'; tournamentId: string }
  | { screen: 'match'; tournamentId: string; matchId: string }
  | { screen: 'voting'; tournamentId: string; matchId: string }
  | { screen: 'tiebreak'; tournamentId: string; matchId: string }
  | { screen: 'winner'; winningProposalId: string };

function App() {
  const [state, setState] = useState<AppState>({ screen: 'setup' });
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [recentWinner, setRecentWinner] = useState<{ name: string; round: string } | null>(null);

  const currentUserRef = useRef<string | null>(null);
  const stateRef = useRef<AppState>({ screen: 'setup' });

  useEffect(() => { currentUserRef.current = currentUser; }, [currentUser]);
  useEffect(() => { stateRef.current = state; }, [state]);

  // Leer hash de URL al cargar — y restaurar sesión desde sessionStorage si existe
  // (sessionStorage es por pestaña, así que cada pestaña puede tener identidad distinta)
  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    if (!hash || hash.length <= 10) return;

    // ¿El usuario ya se identificó en este torneo en esta sesión?
    const saved = sessionStorage.getItem('tournament_user');
    if (saved) {
      try {
        const { tournamentId: savedId, name } = JSON.parse(saved);
        if (savedId === hash) {
          // Restaurar identidad directamente sin pasar por "¿Quién eres tú?"
          setCurrentUser(name);
          currentUserRef.current = name;
          setState({ screen: 'lobby', tournamentId: hash });
          return;
        }
      } catch { /* ignorar */ }
    }

    setState({ screen: 'identify', tournamentId: hash });
  }, []);

  // Suscripción en tiempo real para cualquier pantalla con torneoId
  const getTournamentIdFromState = (s: AppState): string | null => {
    if (s.screen === 'setup' || s.screen === 'identify') return null;
    if (s.screen === 'winner') return null;
    return s.tournamentId;
  };

  useEffect(() => {
    const tournamentId = getTournamentIdFromState(state);
    if (!tournamentId) return;

    loadTournamentData(tournamentId);

    const matchChannel = supabase
      .channel(`matches-${tournamentId}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'matches',
        filter: `tournament_id=eq.${tournamentId}`,
      }, () => loadTournamentData(tournamentId))
      .subscribe();

    const tournamentChannel = supabase
      .channel(`tournament-${tournamentId}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'tournaments',
        filter: `id=eq.${tournamentId}`,
      }, () => loadTournamentData(tournamentId))
      .subscribe();

    const proposalChannel = supabase
      .channel(`proposals-${tournamentId}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'proposals',
      }, () => loadTournamentData(tournamentId))
      .subscribe();

    const voteChannel = supabase
      .channel(`votes-${tournamentId}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'votes',
      }, () => loadTournamentData(tournamentId))
      .subscribe();

    return () => {
      matchChannel.unsubscribe();
      tournamentChannel.unsubscribe();
      proposalChannel.unsubscribe();
      voteChannel.unsubscribe();
    };
  }, [state.screen]);

  // Polling universal: refresca cada 2.5 segundos en cualquier pantalla activa
  // Es el fallback fiable cuando el real-time de Supabase no llega a tiempo
  useEffect(() => {
    const tournamentId = getTournamentIdFromState(state);
    if (!tournamentId || state.screen === 'draw') return;
    const interval = setInterval(() => {
      loadTournamentData(tournamentId);
    }, 2500);
    return () => clearInterval(interval);
  }, [state.screen]);

  // Comprobar si algún partido ha terminado su tiempo de votación o fase de tiebreak
  useEffect(() => {
    matches.forEach(async (match) => {
      if (match.status === 'voting' && match.voting_ends_at) {
        const endTime = new Date(match.voting_ends_at).getTime();
        if (Date.now() >= endTime && !match.winner_name) {
          await completeMatch(match.id);
        }
      }
      if (TIEBREAKER_PHASES.includes(match.status as typeof TIEBREAKER_PHASES[number]) && match.voting_ends_at) {
        const endTime = new Date(match.voting_ends_at).getTime();
        if (Date.now() >= endTime) {
          await advanceTiebreakerPhase(match.id);
        }
      }
    });
  }, [matches]);

  const autoNavigate = (
    matchData: Match[],
    _proposalData: Proposal[],
    tournamentData: Tournament,
    tournamentId: string
  ) => {
    const user = currentUserRef.current;
    const currentState = stateRef.current;

    // No interrumpir la animación del sorteo
    if (currentState.screen === 'draw') return;

    // Si el torneo estaba en sala de espera y alguien inició el sorteo → ir a draw
    if (tournamentData.status === 'in_progress' && currentState.screen === 'lobby') {
      setState({ screen: 'draw', participants: tournamentData.participants, tournamentId });
      return;
    }

    if (!user) return;

    // Partido en tiebreak (cualquier fase) → redirigir a TODOS
    const tiebreakerMatch = matchData.find(m =>
      TIEBREAKER_PHASES.includes(m.status as typeof TIEBREAKER_PHASES[number])
    );
    if (tiebreakerMatch) {
      if (
        currentState.screen !== 'tiebreak' ||
        (currentState.screen === 'tiebreak' && currentState.matchId !== tiebreakerMatch.id)
      ) {
        setState({ screen: 'tiebreak', tournamentId, matchId: tiebreakerMatch.id });
      }
      return;
    }

    // Partido en votación → redirigir a TODOS (jugadores y espectadores)
    const votingMatch = matchData.find(m => m.status === 'voting');
    if (votingMatch) {
      if (
        currentState.screen !== 'voting' ||
        (currentState.screen === 'voting' && currentState.matchId !== votingMatch.id)
      ) {
        setState({ screen: 'voting', tournamentId, matchId: votingMatch.id });
      }
      return;
    }

    // Partido en propuesta → redirigir a TODOS
    // (jugadores ven el formulario, espectadores ven pantalla de espera)
    const proposingMatch = matchData.find(m => m.status === 'proposing');
    if (proposingMatch) {
      if (
        currentState.screen !== 'match' ||
        (currentState.screen === 'match' && currentState.matchId !== proposingMatch.id)
      ) {
        setState({ screen: 'match', tournamentId, matchId: proposingMatch.id });
      }
      return;
    }

    // Si estaba viendo un partido que ya se completó → volver al cuadro con animación
    if (
      (currentState.screen === 'voting' || currentState.screen === 'match' || currentState.screen === 'tiebreak') &&
      'matchId' in currentState
    ) {
      const watchedMatch = matchData.find(m => m.id === currentState.matchId);
      if (watchedMatch?.status === 'completed' && watchedMatch.winner_name) {
        const toRound =
          watchedMatch.round === 'quarterfinals' ? 'Semifinales' :
          watchedMatch.round === 'semifinals' ? 'la Final' : null;
        if (toRound) {
          setRecentWinner({ name: watchedMatch.winner_name, round: toRound });
          setTimeout(() => setRecentWinner(null), 8000);
        }
        setState({ screen: 'bracket', tournamentId });
      }
    }
  };

  const loadTournamentData = async (tournamentId: string) => {
    const { data: tournamentData } = await supabase
      .from('tournaments').select('*').eq('id', tournamentId).maybeSingle();

    if (tournamentData) {
      setTournament(tournamentData);
      if (tournamentData.status === 'completed' && tournamentData.winner_proposal_id) {
        setState({ screen: 'winner', winningProposalId: tournamentData.winner_proposal_id });
        return;
      }
    }

    const { data: matchData } = await supabase
      .from('matches').select('*')
      .eq('tournament_id', tournamentId)
      .order('round').order('match_number');

    if (matchData) setMatches(matchData);

    if (matchData) {
      const matchIds = matchData.map(m => m.id);

      const { data: proposalData } = await supabase
        .from('proposals').select('*').in('match_id', matchIds);
      if (proposalData) {
        setProposals(proposalData);
        if (tournamentData) {
          autoNavigate(matchData, proposalData, tournamentData, tournamentId);
        }
      }

      const { data: voteData } = await supabase
        .from('votes').select('*').in('match_id', matchIds);
      if (voteData) setVotes(voteData);
    }
  };

  // Crear sala de espera (sin sortear todavía)
  const createLobby = async (participants: string[]) => {
    const { data: tournamentData, error } = await supabase
      .from('tournaments')
      .insert({
        num_participants: participants.length,
        participants,
        status: 'setup',
      })
      .select().single();

    if (error || !tournamentData) {
      console.error('Error al crear sala — revisa la consola del navegador:', error);
      alert('Error al crear la sala. Revisa la consola (F12) para más detalles.');
      return;
    }

    window.location.hash = tournamentData.id;
    setState({ screen: 'identify', tournamentId: tournamentData.id });
  };

  // El creador arranca el sorteo: baraja, crea partidos, actualiza estado
  const startDraw = async () => {
    if (!tournament) return;

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

    // Guardar orden barajado y cambiar estado
    await supabase.from('tournaments').update({
      participants: shuffled,
      status: 'in_progress',
    }).eq('id', tournament.id);

    // El creador navega directamente sin esperar el evento real-time
    setState({ screen: 'draw', participants: shuffled, tournamentId: tournament.id });
  };

  const handleIdentify = (name: string, tournamentId: string) => {
    setCurrentUser(name);
    currentUserRef.current = name;
    // Guardar en sessionStorage (por pestaña) para restaurar tras un refresco
    sessionStorage.setItem('tournament_user', JSON.stringify({ tournamentId, name }));
    setState({ screen: 'lobby', tournamentId });
    loadTournamentData(tournamentId);
  };

  const handleStartMatch = async (match: Match) => {
    await supabase.from('matches')
      .update({ status: 'proposing' })
      .eq('id', match.id);
    // Redirigir al creador directamente (los demás lo detectan por polling)
    setState({ screen: 'match', tournamentId: match.tournament_id, matchId: match.id });
  };

  const handleMatchClick = (match: Match) => {
    if (match.status === 'pending') return;
    if (match.status === 'proposing') {
      setState({ screen: 'match', tournamentId: match.tournament_id, matchId: match.id });
    } else if (match.status === 'voting' || match.status === 'completed') {
      setState({ screen: 'voting', tournamentId: match.tournament_id, matchId: match.id });
    }
  };

  const handleSubmitProposal = async (
    matchId: string,
    playerName: string,
    proposalData: { flight_link: string; price: number; destination?: string; dates?: string; }
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
  };

  const handleVote = async (matchId: string, voterName: string, proposalId: string) => {
    await supabase.from('votes').upsert(
      { match_id: matchId, voter_name: voterName, proposal_id: proposalId },
      { onConflict: 'match_id,voter_name' }
    );

    // Si ya han votado todos los participantes, cerrar el partido inmediatamente
    if (tournament) {
      const { data: allVotes } = await supabase
        .from('votes').select('*').eq('match_id', matchId);
      if (allVotes && allVotes.length >= tournament.participants.length) {
        await completeMatch(matchId);
      }
    }
  };

  const resolveVotes = (matchVotes: Vote[], matchProposals: Proposal[]) => {
    const voteCounts: Record<string, number> = {};
    matchVotes.forEach(v => { voteCounts[v.proposal_id] = (voteCounts[v.proposal_id] || 0) + 1; });
    const sorted = [...matchProposals].sort(
      (a, b) => (voteCounts[b.id] || 0) - (voteCounts[a.id] || 0)
    );
    const topCount = voteCounts[sorted[0]?.id] || 0;
    const secondCount = voteCounts[sorted[1]?.id] || 0;
    return { winner: sorted[0], isTied: topCount === secondCount };
  };

  const completeMatch = async (matchId: string) => {
    // Guardia: no completar si ya está cerrado o en tiebreak
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
      // ⚡ Empate → Minuto de Oro: status = 'tiebreak_d1' (player1 defiende)
      const { error } = await supabase.from('matches').update({
        status: 'tiebreak_d1',
        voting_ends_at: new Date(Date.now() + 60_000).toISOString(),
      }).eq('id', matchId);
      if (error) console.error('Error iniciando tiebreak:', error);
      return;
    }

    const { data: currentMatch } = await supabase.from('matches').select('*').eq('id', matchId).single();
    if (!currentMatch) return;
    await supabase.from('matches').update({ status: 'completed', winner_name: winner.player_name }).eq('id', matchId);
    await advanceWinner(currentMatch.tournament_id, currentMatch, winner.player_name);
  };

  const advanceTiebreakerPhase = async (matchId: string) => {
    const { data: match } = await supabase.from('matches').select('*').eq('id', matchId).single();
    if (!match) return;

    // Guardia: verificar que sigue en la fase esperada
    if (!TIEBREAKER_PHASES.includes(match.status as typeof TIEBREAKER_PHASES[number])) return;

    if (match.status === 'tiebreak_d1') {
      // Player 1 ha defendido → turno de Player 2
      await supabase.from('matches').update({
        status: 'tiebreak_d2',
        voting_ends_at: new Date(Date.now() + 60_000).toISOString(),
      }).eq('id', matchId);
      return;
    }

    if (match.status === 'tiebreak_d2') {
      // Ambos han defendido → segunda votación (votos anteriores borrados)
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
        // 🎰 Segundo empate → ruleta: winner_name pre-guardado para la animación
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
      // Animación terminada → completar el partido
      await supabase.from('matches').update({ status: 'completed' }).eq('id', matchId);
      await advanceWinner(match.tournament_id, match, match.winner_name);
    }
  };

  const handleTiebreakerVote = async (matchId: string, voterName: string, proposalId: string) => {
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
  };

  const advanceWinner = async (
    tournamentId: string, completedMatch: Match, winnerName: string
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
  };

  const renderScreen = () => {
    if (state.screen === 'setup') {
      return (
        <TournamentSetup
          onStart={createLobby}
          onJoin={(tournamentId) => setState({ screen: 'identify', tournamentId })}
        />
      );
    }

    if (state.screen === 'identify') {
      return (
        <UserIdentification
          tournamentId={state.tournamentId}
          onIdentify={handleIdentify}
        />
      );
    }

    if (state.screen === 'lobby' && tournament) {
      return (
        <LobbyScreen
          tournament={tournament}
          currentUser={currentUser}
          onStart={startDraw}
        />
      );
    }

    if (state.screen === 'draw') {
      return (
        <DrawAnimation
          participants={state.participants}
          onComplete={() => setState({ screen: 'bracket', tournamentId: state.tournamentId })}
        />
      );
    }

    if (state.screen === 'bracket' && tournament) {
      return (
        <Bracket
          matches={matches}
          tournamentSize={tournament.num_participants}
          currentUser={currentUser}
          tournamentId={tournament.id}
          onMatchClick={handleMatchClick}
          onStartMatch={handleStartMatch}
          recentWinner={recentWinner}
        />
      );
    }

    if (state.screen === 'match' && tournament) {
      const match = matches.find(m => m.id === state.matchId);
      if (!match) return null;
      const matchProposals = proposals.filter(p => p.match_id === match.id);

      return (
        <MatchSubmission
          match={match}
          proposals={matchProposals}
          currentUser={currentUser}
          onSubmit={(proposalData) => {
            const playerName = currentUser || match.player1_name;
            handleSubmitProposal(match.id, playerName, proposalData);
          }}
          onBack={() => setState({ screen: 'bracket', tournamentId: state.tournamentId })}
        />
      );
    }

    if (state.screen === 'voting' && tournament) {
      const match = matches.find(m => m.id === state.matchId);
      if (!match) return null;
      const matchProposals = proposals.filter(p => p.match_id === match.id);
      const matchVotes = votes.filter(v => v.match_id === match.id);

      return (
        <VotingScreen
          match={match}
          proposals={matchProposals}
          votes={matchVotes}
          participants={tournament.participants}
          currentUser={currentUser}
          onConfirmVote={(proposalId) => {
            if (currentUser) handleVote(match.id, currentUser, proposalId);
          }}
          onBack={() => setState({ screen: 'bracket', tournamentId: state.tournamentId })}
        />
      );
    }

    if (state.screen === 'tiebreak' && tournament) {
      const match = matches.find(m => m.id === state.matchId);
      if (!match) return null;
      const matchProposals = proposals.filter(p => p.match_id === match.id);
      const matchVotes = votes.filter(v => v.match_id === match.id);

      return (
        <TiebreakerScreen
          match={match}
          proposals={matchProposals}
          votes={matchVotes}
          participants={tournament.participants}
          currentUser={currentUser}
          onAdvancePhase={() => advanceTiebreakerPhase(match.id)}
          onVote={(proposalId: string) => {
            if (currentUser) handleTiebreakerVote(match.id, currentUser, proposalId);
          }}
          onBack={() => setState({ screen: 'bracket', tournamentId: state.tournamentId })}
        />
      );
    }

    if (state.screen === 'winner') {
      const winningProposal = proposals.find(p => p.id === state.winningProposalId);
      if (!winningProposal) return null;
      return (
        <WinnerScreen
          winningProposal={winningProposal}
          onNewTournament={() => {
            setTournament(null);
            setMatches([]);
            setProposals([]);
            setVotes([]);
            setCurrentUser(null);
            sessionStorage.removeItem('tournament_user');
            window.location.hash = '';
            setState({ screen: 'setup' });
          }}
        />
      );
    }

    return null;
  };

  return (
    <>
      {renderScreen()}
      <MusicPlayer />
    </>
  );
}

export default App;
