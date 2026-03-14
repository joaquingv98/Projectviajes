import type { Tournament } from './supabase';

export function dedupeNames(names: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const rawName of names) {
    const name = rawName.trim();
    if (!name) continue;

    const key = name.toLocaleLowerCase();
    if (seen.has(key)) continue;

    seen.add(key);
    result.push(name);
  }

  return result;
}

export function getTournamentVoters(
  tournament: Pick<Tournament, 'participants' | 'voters'> | null | undefined
): string[] {
  if (!tournament) return [];

  if (Array.isArray(tournament.voters) && tournament.voters.length > 0) {
    return dedupeNames(tournament.voters);
  }

  return dedupeNames(tournament.participants);
}

export function isTournamentCompetitor(
  tournament: Pick<Tournament, 'participants'> | null | undefined,
  name: string
): boolean {
  if (!tournament) return false;
  return tournament.participants.includes(name);
}
