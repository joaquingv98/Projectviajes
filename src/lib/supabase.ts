import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface Tournament {
  id: string;
  name: string;
  num_participants: number;
  participants: string[];
  status: 'setup' | 'in_progress' | 'completed';
  winner_proposal_id: string | null;
  created_at: string;
  updated_at: string;
}

// Fases del tiebreak codificadas directamente en status (sin columna extra)
export type TiebreakerPhase = 'tiebreak_d1' | 'tiebreak_d2' | 'tiebreak_vote' | 'tiebreak_roulette';

export const TIEBREAKER_PHASES: TiebreakerPhase[] = [
  'tiebreak_d1', 'tiebreak_d2', 'tiebreak_vote', 'tiebreak_roulette',
];

export interface Match {
  id: string;
  tournament_id: string;
  round: 'quarterfinals' | 'semifinals' | 'final';
  match_number: number;
  player1_name: string;
  player2_name: string | null;
  status: 'pending' | 'proposing' | 'voting' | TiebreakerPhase | 'completed';
  winner_name: string | null;
  voting_ends_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Proposal {
  id: string;
  match_id: string;
  player_name: string;
  flight_link: string;
  price: number;
  destination: string | null;
  dates: string | null;
  created_at: string;
}

export interface Vote {
  id: string;
  match_id: string;
  voter_name: string;
  proposal_id: string;
  created_at: string;
}

/** Función pura: determina ganador o empate a partir de votos y propuestas */
export function resolveVotes(matchVotes: Vote[], matchProposals: Proposal[]) {
  const voteCounts: Record<string, number> = {};
  matchVotes.forEach(v => { voteCounts[v.proposal_id] = (voteCounts[v.proposal_id] || 0) + 1; });
  const sorted = [...matchProposals].sort(
    (a, b) => (voteCounts[b.id] || 0) - (voteCounts[a.id] || 0)
  );
  const topCount = voteCounts[sorted[0]?.id] || 0;
  const secondCount = voteCounts[sorted[1]?.id] || 0;
  return { winner: sorted[0], isTied: topCount === secondCount };
}
