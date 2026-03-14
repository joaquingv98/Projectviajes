import type { Match } from './supabase';

export type MatchInsert = Omit<Match, 'id' | 'created_at' | 'updated_at'>;

const ROUND_SEQUENCE: Record<2 | 4 | 8, Match['round'][]> = {
  2: ['final'],
  4: ['semifinals', 'final'],
  8: ['quarterfinals', 'semifinals', 'final'],
};

function shuffleArray<T>(items: T[]): T[] {
  const next = [...items];

  for (let i = next.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }

  return next;
}

function getBracketSize(contestantCount: number): 2 | 4 | 8 {
  if (contestantCount <= 2) return 2;
  if (contestantCount <= 4) return 4;
  return 8;
}

function createMatch(
  tournamentId: string,
  round: Match['round'],
  matchNumber: number,
  player1Name: string,
  player2Name: string | null,
  status: Match['status']
): MatchInsert {
  return {
    tournament_id: tournamentId,
    round,
    match_number: matchNumber,
    player1_name: player1Name,
    player2_name: player2Name,
    status,
    winner_name: null,
    voting_ends_at: null,
  };
}

function createEmptyMatch(
  tournamentId: string,
  round: Match['round'],
  matchNumber: number
): MatchInsert {
  return createMatch(tournamentId, round, matchNumber, 'TBD', null, 'pending');
}

function buildFirstRoundPairs(contestants: string[], bracketSize: 2 | 4 | 8) {
  const firstRoundMatchCount = bracketSize / 2;
  const byeCount = bracketSize - contestants.length;
  const byeMatchIndexes = new Set(
    shuffleArray(Array.from({ length: firstRoundMatchCount }, (_, index) => index)).slice(0, byeCount)
  );

  const shuffledContestants = shuffleArray(contestants);
  const pairs: Array<[string | null, string | null]> = [];
  let cursor = 0;

  for (let matchIndex = 0; matchIndex < firstRoundMatchCount; matchIndex++) {
    if (byeMatchIndexes.has(matchIndex)) {
      const contestant = shuffledContestants[cursor++] ?? null;
      pairs.push(Math.random() < 0.5 ? [contestant, null] : [null, contestant]);
      continue;
    }

    pairs.push([
      shuffledContestants[cursor++] ?? null,
      shuffledContestants[cursor++] ?? null,
    ]);
  }

  return pairs;
}

function advanceByeWinner(
  matches: MatchInsert[],
  rounds: Match['round'][],
  sourceRound: Match['round'],
  matchNumber: number,
  winnerName: string
) {
  const sourceRoundIndex = rounds.indexOf(sourceRound);
  const nextRound = rounds[sourceRoundIndex + 1];

  if (!nextRound) return;

  const nextMatchNumber = Math.floor(matchNumber / 2);
  const targetMatch = matches.find(
    match => match.round === nextRound && match.match_number === nextMatchNumber
  );

  if (!targetMatch) return;

  if (matchNumber % 2 === 0) {
    targetMatch.player1_name = winnerName;
    return;
  }

  targetMatch.player2_name = winnerName;
}

export function buildTournamentMatches(
  tournamentId: string,
  rawContestants: string[]
): MatchInsert[] {
  const contestants = rawContestants.map(name => name.trim()).filter(Boolean);

  if (contestants.length < 2 || contestants.length > 8) {
    throw new Error('Tournament contestants must be between 2 and 8');
  }

  const bracketSize = getBracketSize(contestants.length);
  const rounds = ROUND_SEQUENCE[bracketSize];

  if (bracketSize === 2) {
    return [
      createMatch(
        tournamentId,
        'final',
        0,
        contestants[0],
        contestants[1],
        'proposing'
      ),
    ];
  }

  const matches: MatchInsert[] = [];

  for (let roundIndex = 1; roundIndex < rounds.length; roundIndex++) {
    const round = rounds[roundIndex];
    const matchCount = bracketSize / 2 ** (roundIndex + 1);

    for (let matchNumber = 0; matchNumber < matchCount; matchNumber++) {
      matches.push(createEmptyMatch(tournamentId, round, matchNumber));
    }
  }

  const firstRound = rounds[0];
  const firstRoundPairs = buildFirstRoundPairs(contestants, bracketSize);

  firstRoundPairs.forEach(([player1, player2], matchNumber) => {
    if (player1 && player2) {
      matches.push(createMatch(tournamentId, firstRound, matchNumber, player1, player2, 'pending'));
      return;
    }

    const autoWinner = player1 ?? player2;
    if (autoWinner) {
      advanceByeWinner(matches, rounds, firstRound, matchNumber, autoWinner);
    }
  });

  const roundOrder = new Map(rounds.map((round, index) => [round, index]));

  return matches.sort((a, b) => {
    const roundDiff = (roundOrder.get(a.round) ?? 0) - (roundOrder.get(b.round) ?? 0);
    if (roundDiff !== 0) return roundDiff;
    return a.match_number - b.match_number;
  });
}
