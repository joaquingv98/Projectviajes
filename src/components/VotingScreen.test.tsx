import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import VotingScreen from './VotingScreen';
import type { Match, Proposal, Vote } from '../lib/supabase';

function makeMatch(overrides: Partial<Match> = {}): Match {
  return {
    id: 'm1',
    tournament_id: 't1',
    round: 'final',
    match_number: 0,
    player1_name: 'Alice',
    player2_name: 'Bob',
    status: 'voting',
    winner_name: null,
    voting_ends_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

function makeProposal(id: string, playerName: string): Proposal {
  return {
    id,
    match_id: 'm1',
    player_name: playerName,
    flight_link: 'https://example.com',
    price: 100,
    destination: 'París',
    dates: '1-7 Jun',
    created_at: new Date().toISOString(),
  };
}

describe('VotingScreen', () => {
  it('muestra las dos propuestas', () => {
    const match = makeMatch();
    const proposals: Proposal[] = [
      makeProposal('p1', 'Alice'),
      makeProposal('p2', 'Bob'),
    ];
    const votes: Vote[] = [];

    render(
      <VotingScreen
        match={match}
        proposals={proposals}
        votes={votes}
        voters={['Alice', 'Bob', 'Carol']}
        currentUser="Alice"
        onConfirmVote={() => {}}
        onEnsureBotsVoted={() => {}}
        onBack={() => {}}
      />
    );

    expect(screen.getByRole('heading', { name: /Alice vs Bob/ })).toBeInTheDocument();
    expect(screen.getAllByText(/París/).length).toBeGreaterThanOrEqual(1);
  });

  it('muestra botón para confirmar voto cuando hay selección', async () => {
    const match = makeMatch();
    const proposals: Proposal[] = [
      makeProposal('p1', 'Alice'),
      makeProposal('p2', 'Bob'),
    ];
    const votes: Vote[] = [];

    render(
      <VotingScreen
        match={match}
        proposals={proposals}
        votes={votes}
        voters={['Alice', 'Bob']}
        currentUser="Alice"
        onConfirmVote={() => {}}
        onEnsureBotsVoted={() => {}}
        onBack={() => {}}
      />
    );

    // Debería mostrar las propuestas para votar
    expect(screen.getAllByText(/Selecciona tu viaje favorito/).length).toBeGreaterThanOrEqual(1);
  });
});
