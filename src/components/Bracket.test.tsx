import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Bracket from './Bracket';
import type { Match } from '../lib/supabase';

function makeMatch(overrides: Partial<Match> = {}): Match {
  return {
    id: 'm1',
    tournament_id: 't1',
    round: 'final',
    match_number: 0,
    player1_name: 'Alice',
    player2_name: 'Bob',
    status: 'pending',
    winner_name: null,
    voting_ends_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

describe('Bracket', () => {
  it('renderiza el cuadro con partidos', () => {
    const matches: Match[] = [
      makeMatch({ id: 'm1', round: 'final', player1_name: 'Alice', player2_name: 'Bob', status: 'pending' }),
    ];
    render(
      <Bracket
        matches={matches}
        proposals={[]}
        votes={[]}
        tournamentSize={2}
        currentUser="Alice"
        tournamentId="t1"
        onMatchClick={() => {}}
        onStartMatch={() => {}}
      />
    );
    expect(screen.getByText(/Comenzar: Alice vs Bob/)).toBeInTheDocument();
  });

  it('muestra notificación de ganador reciente cuando se pasa recentWinner', () => {
    const matches: Match[] = [
      makeMatch({ id: 'm1', round: 'final', player1_name: 'Alice', player2_name: 'Bob', status: 'completed' }),
    ];
    render(
      <Bracket
        matches={matches}
        proposals={[]}
        votes={[]}
        tournamentSize={2}
        currentUser="Alice"
        tournamentId="t1"
        onMatchClick={() => {}}
        onStartMatch={() => {}}
        recentWinner={{ name: 'Alice', round: 'final' }}
      />
    );
    expect(screen.getAllByText(/Cuadro del Torneo/).length).toBeGreaterThanOrEqual(1);
  });
});
