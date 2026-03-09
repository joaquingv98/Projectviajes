# Milestone 2 — Refactorización App.tsx (Divide y vencerás)

## Objetivo
Reducir la complejidad de App.tsx (~694 líneas) extrayendo la lógica en custom hooks con responsabilidades claras. Mantener el comportamiento exacto de la aplicación.

## Tareas

- [x] Crear `resolveVotes` en `lib/supabase.ts` como función pura exportada
- [x] Crear hook `useTournamentData(tournamentId, onDataLoaded)`
- [x] Crear hook `useMatchActions(tournament)`
- [x] Crear hook `useAutoNavigate` que devuelve callback para onDataLoaded
- [x] Refactorizar `App.tsx` para usar los hooks y reducir a ~200-250 líneas
- [x] Verificar que el flujo completo funciona igual que antes

## Mapa de Ruta / Pseudocódigo

```
useTournamentData(tournamentId, onDataLoaded):
  state: tournament, matches, proposals, votes
  loadTournamentData = async () =>
    fetch tournaments, matches, proposals, votes
    if (tournamentData) setTournament(...)
    if (matchData) setMatches(...), setProposals(...), setVotes(...)
    onDataLoaded(matchData, proposalData, tournamentData, tournamentId)
  useEffect: subscriptions real-time (matches, tournaments, proposals, votes)
  useEffect: polling 2500ms
  return { tournament, matches, proposals, votes, loadTournamentData }

useMatchActions(tournament):
  completeMatch(matchId)
  advanceTiebreakerPhase(matchId)
  advanceWinner(...) [interno]
  createLobby(participants) -> { tournamentId } | null
  startDraw() -> { participants, tournamentId } | null
  handleStartMatch(match)
  handleSubmitProposal(...)
  handleVote(...)
  handleTiebreakerVote(...)
  return { createLobby, startDraw, handleStartMatch, ... }

useAutoNavigate(setState, setRecentWinner, currentUserRef, stateRef):
  return useCallback((matchData, proposalData, tournamentData, tournamentId) =>
    [lógica actual de autoNavigate]
  , [setState, setRecentWinner])

App:
  useAutoNavigate -> onDataLoaded
  useTournamentData(tournamentId, onDataLoaded) -> { tournament, matches, proposals, votes }
  useMatchActions(tournament) -> actions
  useEffect: match expiration (voting_ends_at, tiebreak) -> completeMatch, advanceTiebreakerPhase
  renderScreen() - sin cambios
```

## Criterios de Aceptación

- [x] Cada hook tiene una única responsabilidad clara
- [x] App.tsx tiene aproximadamente 200-250 líneas (máx 300)
- [x] El flujo de la aplicación es idéntico al anterior (sin regresiones)
- [x] No hay placeholders ni código incompleto
