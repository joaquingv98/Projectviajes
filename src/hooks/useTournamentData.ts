import { useState, useEffect, useCallback } from 'react';
import { supabase, Tournament, Match, Proposal, Vote } from '../lib/supabase';

type OnDataLoaded = (
  matchData: Match[],
  proposalData: Proposal[],
  tournamentData: Tournament,
  tournamentId: string
) => void;

type OnTournamentCompleted = (winningProposalId: string) => void;

function getTournamentIdFromScreen(screen: string, tournamentId?: string): string | null {
  if (!tournamentId) return null;
  if (['setup', 'identify', 'winner'].includes(screen)) return null;
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

  const loadTournamentData = useCallback(async (tid: string) => {
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

    if (tournamentData?.status === 'completed' && tournamentData.winner_proposal_id && onTournamentCompleted) {
      onTournamentCompleted(tournamentData.winner_proposal_id);
    }
  }, [onDataLoaded, onTournamentCompleted]);

  const effectiveTournamentId = getTournamentIdFromScreen(screen, tournamentId);

  useEffect(() => {
    if (!effectiveTournamentId) return;

    loadTournamentData(effectiveTournamentId);

    const matchChannel = supabase
      .channel(`matches-${effectiveTournamentId}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'matches',
        filter: `tournament_id=eq.${effectiveTournamentId}`,
      }, () => loadTournamentData(effectiveTournamentId))
      .subscribe();

    const tournamentChannel = supabase
      .channel(`tournament-${effectiveTournamentId}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'tournaments',
        filter: `id=eq.${effectiveTournamentId}`,
      }, () => loadTournamentData(effectiveTournamentId))
      .subscribe();

    const proposalChannel = supabase
      .channel(`proposals-${effectiveTournamentId}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'proposals',
      }, () => loadTournamentData(effectiveTournamentId))
      .subscribe();

    const voteChannel = supabase
      .channel(`votes-${effectiveTournamentId}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'votes',
      }, () => loadTournamentData(effectiveTournamentId))
      .subscribe();

    return () => {
      matchChannel.unsubscribe();
      tournamentChannel.unsubscribe();
      proposalChannel.unsubscribe();
      voteChannel.unsubscribe();
    };
  }, [screen, effectiveTournamentId, loadTournamentData]);

  useEffect(() => {
    if (!effectiveTournamentId || screen === 'draw') return;
    const interval = setInterval(() => loadTournamentData(effectiveTournamentId), 2500);
    return () => clearInterval(interval);
  }, [screen, effectiveTournamentId, loadTournamentData]);

  const resetData = useCallback(() => {
    setTournament(null);
    setMatches([]);
    setProposals([]);
    setVotes([]);
  }, []);

  return { tournament, matches, proposals, votes, setTournament, loadTournamentData, resetData };
}
