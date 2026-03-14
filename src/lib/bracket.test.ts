import { describe, expect, it } from 'vitest';
import { buildTournamentMatches } from './bracket';

function getFilledSlots(names: Array<string | null | undefined>) {
  return names.filter(name => name && name !== 'TBD');
}

describe('buildTournamentMatches', () => {
  it('genera semifinal y final para 3 competidores con un bye a la final', () => {
    const matches = buildTournamentMatches('t1', ['Ana', 'Beto', 'Clara']);

    const semifinals = matches.filter(match => match.round === 'semifinals');
    const final = matches.find(match => match.round === 'final');

    expect(semifinals).toHaveLength(1);
    expect(final).toBeDefined();
    expect(getFilledSlots([semifinals[0].player1_name, semifinals[0].player2_name])).toHaveLength(2);
    expect(getFilledSlots([final?.player1_name, final?.player2_name])).toHaveLength(1);
  });

  it('genera cuartos, semifinales y final para 6 competidores con dos byes', () => {
    const matches = buildTournamentMatches('t1', ['A', 'B', 'C', 'D', 'E', 'F']);

    const quarterfinals = matches.filter(match => match.round === 'quarterfinals');
    const semifinals = matches.filter(match => match.round === 'semifinals');
    const final = matches.filter(match => match.round === 'final');

    expect(quarterfinals).toHaveLength(2);
    expect(semifinals).toHaveLength(2);
    expect(final).toHaveLength(1);

    const prefilledSemifinalSlots = semifinals.flatMap(match =>
      getFilledSlots([match.player1_name, match.player2_name])
    );
    expect(prefilledSemifinalSlots).toHaveLength(2);
  });

  it('genera tres cuartos reales y un bye cuando hay 7 competidores', () => {
    const matches = buildTournamentMatches('t1', ['A', 'B', 'C', 'D', 'E', 'F', 'G']);

    const quarterfinals = matches.filter(match => match.round === 'quarterfinals');
    const semifinals = matches.filter(match => match.round === 'semifinals');

    expect(quarterfinals).toHaveLength(3);
    expect(semifinals).toHaveLength(2);

    const prefilledSemifinalSlots = semifinals.flatMap(match =>
      getFilledSlots([match.player1_name, match.player2_name])
    );
    expect(prefilledSemifinalSlots).toHaveLength(1);
  });
});
