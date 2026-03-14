import { describe, it, expect } from 'vitest';
import { resolveVotes, type Proposal, type Vote } from './supabase';

function makeProposal(id: string, playerName: string): Proposal {
  return {
    id,
    match_id: 'm1',
    player_name: playerName,
    flight_link: 'https://example.com',
    price: 100,
    destination: 'Test',
    dates: null,
    created_at: new Date().toISOString(),
  };
}

function makeVote(proposalId: string, voterName: string): Vote {
  return {
    id: `v-${proposalId}-${voterName}`,
    match_id: 'm1',
    voter_name: voterName,
    proposal_id: proposalId,
    created_at: new Date().toISOString(),
  };
}

describe('resolveVotes', () => {
  it('devuelve ganador claro cuando hay más votos para una propuesta', () => {
    const p1 = makeProposal('prop1', 'Alice');
    const p2 = makeProposal('prop2', 'Bob');
    const votes: Vote[] = [
      makeVote('prop1', 'v1'),
      makeVote('prop1', 'v2'),
      makeVote('prop1', 'v3'),
      makeVote('prop2', 'v4'),
    ];
    const { winner, isTied } = resolveVotes(votes, [p1, p2]);
    expect(winner).toEqual(p1);
    expect(isTied).toBe(false);
  });

  it('devuelve empate cuando ambas propuestas tienen mismos votos', () => {
    const p1 = makeProposal('prop1', 'Alice');
    const p2 = makeProposal('prop2', 'Bob');
    const votes: Vote[] = [
      makeVote('prop1', 'v1'),
      makeVote('prop1', 'v2'),
      makeVote('prop2', 'v3'),
      makeVote('prop2', 'v4'),
    ];
    const { winner, isTied } = resolveVotes(votes, [p1, p2]);
    expect(winner).toBeDefined();
    expect(isTied).toBe(true);
  });

  it('con votos vacíos devuelve winner (primera al ordenar) y empate técnico', () => {
    const p1 = makeProposal('prop1', 'Alice');
    const p2 = makeProposal('prop2', 'Bob');
    const { winner, isTied } = resolveVotes([], [p1, p2]);
    expect(winner).toBeDefined();
    // Con 0 votos ambos, topCount === secondCount => isTied = true
    expect(isTied).toBe(true);
  });

  it('con una sola propuesta y votos devuelve esa como ganadora', () => {
    const p1 = makeProposal('prop1', 'Alice');
    const votes = [makeVote('prop1', 'v1')];
    const { winner, isTied } = resolveVotes(votes, [p1]);
    expect(winner).toEqual(p1);
    expect(isTied).toBe(false);
  });
});
