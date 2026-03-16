import { useCallback, useRef, useEffect } from 'react';
import { Match, Proposal, Tournament, TIEBREAKER_PHASES } from '../lib/supabase';

export type AppState =
  | { screen: 'setup' }
  | { screen: 'identify'; tournamentId: string }
  | { screen: 'joinVoter'; tournamentId: string }
  | { screen: 'lobby'; tournamentId: string }
  | { screen: 'draw'; participants: string[]; tournamentId: string }
  | { screen: 'bracket'; tournamentId: string }
  | { screen: 'finalReveal'; tournamentId: string; matchId: string; nextScreen: 'voting' | 'match'; pendingStart?: boolean }
  | { screen: 'match'; tournamentId: string; matchId: string }
  | { screen: 'voting'; tournamentId: string; matchId: string }
  | { screen: 'tiebreak'; tournamentId: string; matchId: string }
  | { screen: 'winner'; winningProposalId: string; tournamentId: string };

export function parseVoterLink(hash: string): { tournamentId: string; isVoter: boolean } {
  const content = hash.replace('#', '').trim();
  const [tid, queryPart] = content.split('?');
  const params = new URLSearchParams(queryPart || '');
  const isVoter = params.get('voter') === '1';
  return { tournamentId: tid, isVoter };
}

export function useAutoNavigate(
  state: AppState,
  setState: React.Dispatch<React.SetStateAction<AppState>>,
  currentUser: string | null,
  setRecentWinner: React.Dispatch<React.SetStateAction<{ name: string; round: string } | null>>,
  onBroadcastView?: (tid: string, screen: 'match' | 'voting' | 'tiebreak' | 'finalReveal', matchId: string) => void
) {
  const currentUserRef = useRef<string | null>(null);
  const stateRef = useRef<AppState>(state);

  useEffect(() => { currentUserRef.current = currentUser; }, [currentUser]);
  useEffect(() => { stateRef.current = state; }, [state]);

  return useCallback((
    matchData: Match[],
    _proposalData: Proposal[],
    tournamentData: Tournament,
    tournamentId: string
  ) => {
    const user = currentUserRef.current;
    const currentState = stateRef.current;

    if (currentState.screen === 'draw') return;

    if (tournamentData.status === 'in_progress' && currentState.screen === 'lobby') {
      const competitorNames = new Set(
        matchData.flatMap(m => [m.player1_name, m.player2_name].filter(Boolean))
      );
      if (competitorNames.has(user)) {
        setState({ screen: 'draw', participants: tournamentData.participants, tournamentId });
      } else {
        setState({ screen: 'bracket', tournamentId });
      }
      return;
    }

    if (!user) return;

    const tiebreakerMatch = matchData.find(m =>
      TIEBREAKER_PHASES.includes(m.status as typeof TIEBREAKER_PHASES[number])
    );
    if (tiebreakerMatch) {
      if (
        currentState.screen !== 'tiebreak' ||
        (currentState.screen === 'tiebreak' && currentState.matchId !== tiebreakerMatch.id)
      ) {
        setState({ screen: 'tiebreak', tournamentId, matchId: tiebreakerMatch.id });
        onBroadcastView?.(tournamentId, 'tiebreak', tiebreakerMatch.id);
      }
      return;
    }

    const votingMatch = matchData.find(m => m.status === 'voting');
    if (votingMatch && currentState.screen !== 'bracket') {
      if (
        currentState.screen !== 'voting' ||
        (currentState.screen === 'voting' && currentState.matchId !== votingMatch.id)
      ) {
        setState({ screen: 'voting', tournamentId, matchId: votingMatch.id });
        onBroadcastView?.(tournamentId, 'voting', votingMatch.id);
      }
      return;
    }

    const proposingMatch = matchData.find(m => m.status === 'proposing');
    if (proposingMatch && currentState.screen !== 'bracket') {
      const isUserPlayingThisMatch =
        proposingMatch.player1_name === user || proposingMatch.player2_name === user;

      if (
        isUserPlayingThisMatch && (
          currentState.screen !== 'match' ||
          (currentState.screen === 'match' && currentState.matchId !== proposingMatch.id)
        )
      ) {
        if (proposingMatch.round === 'final') {
          if (currentState.screen !== 'finalReveal' || currentState.matchId !== proposingMatch.id) {
            setState({ screen: 'finalReveal', tournamentId, matchId: proposingMatch.id, nextScreen: 'match' });
            onBroadcastView?.(tournamentId, 'finalReveal', proposingMatch.id);
          }
        } else {
          setState({ screen: 'match', tournamentId, matchId: proposingMatch.id });
          onBroadcastView?.(tournamentId, 'match', proposingMatch.id);
        }
        return;
      }
    }

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
  }, [setState, setRecentWinner, onBroadcastView]);
}
