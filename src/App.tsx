import { useState, useEffect, useCallback } from 'react';
import { Match, TIEBREAKER_PHASES } from './lib/supabase';
import { useTournamentData } from './hooks/useTournamentData';
import { useMatchActions } from './hooks/useMatchActions';
import { useAutoNavigate, type AppState } from './hooks/useAutoNavigate';
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

function App() {
  const [state, setState] = useState<AppState>({ screen: 'setup' });
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [recentWinner, setRecentWinner] = useState<{ name: string; round: string } | null>(null);

  const onDataLoaded = useAutoNavigate(state, setState, currentUser, setRecentWinner);
  const onTournamentCompleted = useCallback((winningProposalId: string) => {
    setState({ screen: 'winner', winningProposalId });
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
  } = useMatchActions(tournament);

  // Restaurar sesión desde URL hash o sessionStorage
  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    if (!hash || hash.length <= 10) return;

    const saved = sessionStorage.getItem('tournament_user');
    if (saved) {
      try {
        const { tournamentId: savedId, name } = JSON.parse(saved);
        if (savedId === hash) {
          setCurrentUser(name);
          setState({ screen: 'lobby', tournamentId: hash });
          return;
        }
      } catch { /* ignorar */ }
    }
    setState({ screen: 'identify', tournamentId: hash });
  }, []);

  // Comprobar si algún partido ha terminado su tiempo
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
  }, [matches, completeMatch, advanceTiebreakerPhase]);

  const handleCreateLobby = async (participants: string[], currentUserForMobile?: string) => {
    const result = await createLobby(participants);
    if (result) {
      window.location.hash = result.tournamentId;
      if (currentUserForMobile) {
        setCurrentUser(currentUserForMobile);
        sessionStorage.setItem('tournament_user', JSON.stringify({ tournamentId: result.tournamentId, name: currentUserForMobile }));
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

  const handleIdentify = (name: string, tid: string) => {
    setCurrentUser(name);
    sessionStorage.setItem('tournament_user', JSON.stringify({ tournamentId: tid, name }));
    setState({ screen: 'lobby', tournamentId: tid });
    loadTournamentData(tid);
  };

  const handleStartMatch = async (match: Match) => {
    await startMatch(match);
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

  const handleNewTournament = () => {
    resetData();
    setCurrentUser(null);
    sessionStorage.removeItem('tournament_user');
    window.location.hash = '';
    setState({ screen: 'setup' });
  };

  const renderScreen = () => {
    if (state.screen === 'setup') {
      return (
        <TournamentSetup
          onStart={handleCreateLobby}
          onJoin={(tid) => setState({ screen: 'identify', tournamentId: tid })}
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
          onVote={(proposalId) => {
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
          onNewTournament={handleNewTournament}
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
