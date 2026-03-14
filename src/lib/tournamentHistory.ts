const STORAGE_KEY = 'tournament_history';
const MAX_ENTRIES = 5;

export interface HistoryEntry {
  id: string;
  name: string;
  date: string;
}

export function getTournamentHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as HistoryEntry[];
    return Array.isArray(parsed) ? parsed.slice(0, MAX_ENTRIES) : [];
  } catch {
    return [];
  }
}

export function addToTournamentHistory(id: string, name: string): void {
  const entries = getTournamentHistory();
  const filtered = entries.filter(e => e.id !== id);
  const updated = [{ id, name: name || 'Torneo', date: new Date().toISOString() }, ...filtered].slice(0, MAX_ENTRIES);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}
