import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, Tournament, Match, Proposal, Vote } from '../lib/supabase';
import { usePageVisibility } from './usePageVisibility';

type OnDataLoaded = (
  matchData: Match[],
  proposalData: Proposal[],
  tournamentData: Tournament,
  tournamentId: string
) => void;

type OnTournamentCompleted = (winningProposalId: string, tournamentId: string) => void;

function getTournamentIdFromScreen(screen: string, tournamentId?: string): string | null {
  if (!tournamentId) return null;
  if (['setup', 'identify'].includes(screen)) return null;
  return tournamentId;
}

export function useTournamentData(
  screen: string,
  tournamentId: string | undefined,
  onDataLoaded: OnDataLoaded,
  onTournamentCompleted?: OnTournamentCompleted
) {
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [votes, setVotes] = useState<Vote[]>([]);
  const previousTournamentStatusRef = useRef<string | null>(null);

  const loadTournamentData = useCallback(async (tid: string) => {
    if (!tid || tid.length < 10) return;

    const { data: tournamentData } = await supabase
      .from('tournaments').select('*').eq('id', tid).maybeSingle();

    if (tournamentData) setTournament(tournamentData);

    const { data: matchData } = await supabase
      .from('matches').select('*')
      .eq('tournament_id', tid)
      .order('round').order('match_number');

    if (matchData) setMatches(matchData);

    if (matchData) {
      const matchIds = matchData.map(m => m.id);

      const { data: proposalData } = await supabase
        .from('proposals').select('*').in('match_id', matchIds);
      if (proposalData) {
        setProposals(proposalData);
        if (tournamentData) {
          onDataLoaded(matchData, proposalData, tournamentData, tid);
        }
      }

      const { data: voteData } = await supabase
        .from('votes').select('*').in('match_id', matchIds);
      if (voteData) setVotes(voteData);
    }

    // Solo notificar ganador cuando el torneo pasa a completado (no al recargar ya completado)
    if (tournamentData?.status === 'completed' && tournamentData.winner_proposal_id && onTournamentCompleted) {
      const prev = previousTournamentStatusRef.current;
      if (prev !== 'completed') {
        onTournamentCompleted(tournamentData.winner_proposal_id, tid);
      }
      previousTournamentStatusRef.current = 'completed';
    } else if (tournamentData?.status) {
      previousTournamentStatusRef.current = tournamentData.status;
    }
  }, [onDataLoaded, onTournamentCompleted]);

  const effectiveTournamentId = getTournamentIdFromScreen(screen, tournamentId);
  const isPageVisible = usePageVisibility();
  const lastFetchRef = useRef<number>(0);
  const MIN_FETCH_INTERVAL_MS = 1500;

  const loadWithThrottle = useCallback(async (tid: string) => {
    const now = Date.now();
    if (now - lastFetchRef.current < MIN_FETCH_INTERVAL_MS) return;
    lastFetchRef.current = now;
    await loadTournamentData(tid);
  }, [loadTournamentData]);

  useEffect(() => {
    if (!effectiveTournamentId) return;

    loadTournamentData(effectiveTournamentId);

    const matchChannel = supabase
      .channel(`matches-${effectiveTournamentId}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'matches',
        filter: `tournament_id=eq.${effectiveTournamentId}`,
      }, () => loadWithThrottle(effectiveTournamentId))
      .subscribe();

    const tournamentChannel = supabase
      .channel(`tournament-${effectiveTournamentId}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'tournaments',
        filter: `id=eq.${effectiveTournamentId}`,
      }, () => loadWithThrottle(effectiveTournamentId))
      .subscribe();

    const proposalChannel = supabase
      .channel(`proposals-${effectiveTournamentId}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'proposals',
      }, () => loadWithThrottle(effectiveTournamentId))
      .subscribe();

    const voteChannel = supabase
      .channel(`votes-${effectiveTournamentId}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'votes',
      }, () => loadWithThrottle(effectiveTournamentId))
      .subscribe();

    return () => {
      matchChannel.unsubscribe();
      tournamentChannel.unsubscribe();
      proposalChannel.unsubscribe();
      voteChannel.unsubscribe();
    };
  }, [screen, effectiveTournamentId, loadTournamentData, loadWithThrottle]);

  // Polling adaptativo: 2.5s visible, 10s oculta (ahorra recursos en pestañas en segundo plano)
  useEffect(() => {
    if (!effectiveTournamentId || screen === 'draw') return;
    const intervalMs = isPageVisible ? 2500 : 10000;
    const interval = setInterval(() => loadWithThrottle(effectiveTournamentId), intervalMs);
    return () => clearInterval(interval);
  }, [screen, effectiveTournamentId, loadWithThrottle, isPageVisible]);

  const resetData = useCallback(() => {
    setTournament(null);
    setMatches([]);
    setProposals([]);
    setVotes([]);
  }, []);

  return { tournament, matches, proposals, votes, setTournament, loadTournamentData, resetData };
}
