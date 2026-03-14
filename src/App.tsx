import { useState, useEffect, useCallback, useRef, lazy, Suspense } from 'react';
import { Toaster } from 'sonner';
import { toast } from 'sonner';
import { Match, TIEBREAKER_PHASES } from './lib/supabase';
import { setSoloModeBots } from './lib/mobile';
import {
  claimSoloIdentity,
  clearParticipantIdentity,
  getParticipantIdentity,
  saveParticipantIdentity,
} from './lib/participantIdentity';
import { addToTournamentHistory } from './lib/tournamentHistory';
import { useTournamentData } from './hooks/useTournamentData';
import { useMatchActions } from './hooks/useMatchActions';
import { useAutoNavigate, type AppState } from './hooks/useAutoNavigate';
import TournamentSetup from './components/TournamentSetup';
import Bracket from './components/Bracket';
import MatchSubmission from './components/MatchSubmission';
import VotingScreen from './components/VotingScreen';
import TiebreakerScreen from './components/TiebreakerScreen';
import UserIdentification from './components/UserIdentification';
import LobbyScreen from './components/LobbyScreen';
import MusicPlayer from './components/MusicPlayer';
import ThemeToggle from './components/ThemeToggle';
import { Loader2 } from 'lucide-react';

const DrawAnimation = lazy(() => import('./components/DrawAnimation'));
const FinalRevealScreen = lazy(() => import('./components/FinalRevealScreen'));
const WinnerScreen = lazy(() => import('./components/WinnerScreen'));

function App() {
  const [state, setState] = useState<AppState>({ screen: 'setup' });
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [recentWinner, setRecentWinner] = useState<{ name: string; round: string } | null>(null);

  const onDataLoaded = useAutoNavigate(state, setState, currentUser, setRecentWinner);
  const onTournamentCompleted = useCallback((winningProposalId: string, tournamentId: string) => {
    setState({ screen: 'winner', winningProposalId, tournamentId });
  }, []);

  const tournamentId = 'tournamentId' in state ? state.tournamentId : undefined;
  const { tournament, matches, proposals, votes, loadTournamentData, resetData } = useTournamentData(
    state.screen,
    tournamentId,
    onDataLoaded,
    onTournamentCompleted
  );

  const {
    createLobby,
    startDraw,
    handleStartMatch: startMatch,
    handleSubmitProposal,
    handleVote,
    handleTiebreakerVote,
    completeMatch,
    advanceTiebreakerPhase,
    ensureBotsVoted,
  } = useMatchActions(tournament);

  // Restaurar sesión desde URL hash o sessionStorage
  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    if (!hash || hash.length <= 10) return;

    const saved = getParticipantIdentity(hash);
    if (saved) {
      setCurrentUser(saved.name);
      setState({ screen: 'lobby', tournamentId: hash });
      return;
    }
    setState({ screen: 'identify', tournamentId: hash });
  }, []);

  const advancingRef = useRef<Set<string>>(new Set());

  // Comprobar si algún partido ha terminado su tiempo (al cambiar matches)
  useEffect(() => {
    matches.forEach(async (match) => {
      if (match.status === 'voting' && match.voting_ends_at) {
        const endTime = new Date(match.voting_ends_at).getTime();
        if (Date.now() >= endTime && !match.winner_name) {
          try {
            await completeMatch(match.id);
          } catch {
            toast.error('Error al completar el partido. Inténtalo de nuevo.');
          }
        }
      }
      if (TIEBREAKER_PHASES.includes(match.status as typeof TIEBREAKER_PHASES[number]) && match.voting_ends_at) {
        const endTime = new Date(match.voting_ends_at).getTime();
        if (Date.now() >= endTime && !advancingRef.current.has(match.id)) {
          advancingRef.current.add(match.id);
          try {
            await advanceTiebreakerPhase(match.id);
          } catch {
            toast.error('Error al avanzar. Inténtalo de nuevo.');
          } finally {
            advancingRef.current.delete(match.id);
          }
        }
      }
    });
  }, [matches, completeMatch, advanceTiebreakerPhase]);

  // Comprobar periódicamente si el tiempo expiró (evita quedarse bloqueado si matches no se actualiza)
  useEffect(() => {
    const interval = setInterval(() => {
      matches.forEach(async (match) => {
        if (match.status === 'voting' && match.voting_ends_at) {
          const endTime = new Date(match.voting_ends_at).getTime();
          if (Date.now() >= endTime && !match.winner_name) {
            try {
              await completeMatch(match.id);
            } catch {
              /* ignorar en polling */
            }
          }
        }
        if (TIEBREAKER_PHASES.includes(match.status as typeof TIEBREAKER_PHASES[number]) && match.voting_ends_at) {
          const endTime = new Date(match.voting_ends_at).getTime();
          if (Date.now() >= endTime && !advancingRef.current.has(match.id)) {
            advancingRef.current.add(match.id);
            try {
              await advanceTiebreakerPhase(match.id);
            } catch {
              advancingRef.current.delete(match.id);
            }
          }
        }
      });
    }, 3000);
    return () => clearInterval(interval);
  }, [matches, completeMatch, advanceTiebreakerPhase]);

  const handleCreateLobby = async (participants: string[], currentUserForMobile?: string, tournamentName?: string) => {
    const result = await createLobby(participants, tournamentName);
    if (result) {
      addToTournamentHistory(result.tournamentId, tournamentName || 'Torneo');
      window.location.hash = result.tournamentId;
      if (currentUserForMobile) {
        const botNames = participants.filter(p => p !== currentUserForMobile);
        try {
          await claimSoloIdentity(result.tournamentId, currentUserForMobile, botNames);
        } catch (error) {
          console.error('Error reclamando identidades del modo solo:', error);
          toast.error('No se pudo asegurar la identidad de los participantes del modo solo.');
          return;
        }
        setCurrentUser(currentUserForMobile);
        setSoloModeBots(result.tournamentId, botNames);
        setState({ screen: 'lobby', tournamentId: result.tournamentId });
        loadTournamentData(result.tournamentId);
      } else {
        setState({ screen: 'identify', tournamentId: result.tournamentId });
      }
    }
  };

  const handleStartDraw = async () => {
    const result = await startDraw();
    if (result) {
      setState({ screen: 'draw', participants: result.participants, tournamentId: result.tournamentId });
    }
  };

  const handleIdentify = (name: string, tid: string, token: string) => {
    setCurrentUser(name);
    saveParticipantIdentity({ tournamentId: tid, name, token });
    setState({ screen: 'lobby', tournamentId: tid });
    loadTournamentData(tid);
  };

  const handleStartMatch = async (match: Match) => {
    if (match.round === 'final') {
      setState({
        screen: 'finalReveal',
        tournamentId: match.tournament_id,
        matchId: match.id,
        nextScreen: 'match',
        pendingStart: true,
      });
      return;
    }
    await startMatch(match);
    setState({ screen: 'match', tournamentId: match.tournament_id, matchId: match.id });
  };

  const handleMatchClick = (match: Match) => {
    if (match.status === 'pending') return;
    if (match.round === 'final' && match.status === 'proposing') {
      setState({
        screen: 'finalReveal',
        tournamentId: match.tournament_id,
        matchId: match.id,
        nextScreen: 'match',
      });
      return;
    }
    if (match.round === 'final' && match.status === 'voting') {
      setState({ screen: 'voting', tournamentId: match.tournament_id, matchId: match.id });
      return;
    }
    if (TIEBREAKER_PHASES.includes(match.status as (typeof TIEBREAKER_PHASES)[number])) {
      setState({ screen: 'tiebreak', tournamentId: match.tournament_id, matchId: match.id });
      return;
    }
    if (match.status === 'proposing') {
      setState({ screen: 'match', tournamentId: match.tournament_id, matchId: match.id });
    } else if (match.status === 'voting' || match.status === 'completed') {
      setState({ screen: 'voting', tournamentId: match.tournament_id, matchId: match.id });
    }
  };

  const handleNewTournament = () => {
    resetData();
    setCurrentUser(null);
    clearParticipantIdentity();
    window.location.hash = '';
    setState({ screen: 'setup' });
  };

  const handleFinalRevealComplete = useCallback(async () => {
    if (state.screen !== 'finalReveal') return;
    const { tournamentId: tid, matchId: mid, nextScreen, pendingStart } = state;
    if (nextScreen === 'voting') {
      setState({ screen: 'voting', tournamentId: tid, matchId: mid });
      return;
    }
    if (nextScreen === 'match') {
      if (pendingStart) {
        const m = matches.find(x => x.id === mid);
        if (m) {
          await startMatch(m);
        }
      }
      setState({ screen: 'match', tournamentId: tid, matchId: mid });
    }
  }, [state, matches, startMatch]);

  const renderScreen = () => {
    if (state.screen === 'setup') {
      return (
        <TournamentSetup
          onStart={handleCreateLobby}
          onJoin={(tid) => {
            window.location.hash = tid;
            setState({ screen: 'identify', tournamentId: tid });
          }}
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
          onStart={handleStartDraw}
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
          tournamentName={tournament.name}
          onMatchClick={handleMatchClick}
          onStartMatch={handleStartMatch}
          recentWinner={recentWinner}
        />
      );
    }

    if (state.screen === 'finalReveal') {
      const finalMatch = matches.find(m => m.id === state.matchId);
      if (!finalMatch) return null;
      return (
        <FinalRevealScreen
          player1Name={finalMatch.player1_name}
          player2Name={finalMatch.player2_name ?? 'Por definir'}
          onComplete={handleFinalRevealComplete}
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
          onSubmit={async (proposalData) => {
            const playerName = currentUser || match.player1_name;
            await handleSubmitProposal(match.id, playerName, proposalData);
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
          onConfirmVote={async (proposalId) => {
            if (currentUser) await handleVote(match.id, currentUser, proposalId);
          }}
          onEnsureBotsVoted={() => ensureBotsVoted(match.id)}
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
          onAdvancePhase={async () => {
            try {
              await advanceTiebreakerPhase(match.id);
            } catch (err) {
              toast.error('Error al resolver. Inténtalo de nuevo.');
              throw err;
            }
          }}
          onVote={(proposalId) => {
            if (currentUser) handleTiebreakerVote(match.id, currentUser, proposalId);
          }}
          onEnsureBotsVoted={() => ensureBotsVoted(match.id)}
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
          participants={tournament?.participants ?? []}
          tournamentName={tournament?.name}
          onNewTournament={handleNewTournament}
        />
      );
    }

    return null;
  };

  return (
    <>
      <a
        href="#main-content"
        className="skip-link"
      >
        Saltar al contenido principal
      </a>
      <main id="main-content" tabIndex={-1}>
        <Suspense fallback={
          <div className="min-h-screen flex items-center justify-center" aria-busy="true">
            <Loader2 className="w-10 h-10 text-blue-400 animate-spin" />
          </div>
        }>
          {renderScreen()}
        </Suspense>
      </main>
      <ThemeToggle />
      <MusicPlayer />
      <Toaster position="top-center" richColors />
    </>
  );
}

export default App;
