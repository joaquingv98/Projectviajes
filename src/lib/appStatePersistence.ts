import type { AppState } from '../hooks/useAutoNavigate';

const STORAGE_KEY = 'tournament_app_state';

function canPersistState(state: AppState): boolean {
  return state.screen !== 'setup';
}

export function saveAppState(state: AppState) {
  if (typeof sessionStorage === 'undefined' || !canPersistState(state)) return;
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function getSavedAppState(tournamentId?: string): AppState | null {
  if (typeof sessionStorage === 'undefined') return null;

  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const state = JSON.parse(raw) as AppState;
    if (!state || typeof state !== 'object' || !('screen' in state)) return null;

    if (tournamentId && 'tournamentId' in state && state.tournamentId !== tournamentId) {
      return null;
    }

    return state;
  } catch {
    return null;
  }
}

export function clearSavedAppState() {
  if (typeof sessionStorage === 'undefined') return;
  sessionStorage.removeItem(STORAGE_KEY);
}
