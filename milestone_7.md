# Milestone 7 — Rendimiento

## Objetivo
Optimizar el rendimiento de la aplicación: polling adaptativo según visibilidad de pestaña, lazy loading de componentes pesados, memoización en Bracket y caché ligera para evitar refetches redundantes.

## Tareas

- [x] Polling adaptativo en useTournamentData: Page Visibility API (tab oculta → menos polling)
- [x] Lazy load DrawAnimation y WinnerScreen con React.lazy + Suspense
- [x] Memoizar Bracket: React.memo, useMemo para quarterMatches/semiMatches/finalMatch
- [x] useCallback para handlers en Bracket (onMatchClick, onStartMatch, handleCopy)
- [x] Throttle en loadTournamentData (loadWithThrottle 1.5s) para evitar refetches en ráfaga
- [x] Añadir Suspense fallback para pantallas lazy (Loader2 inline)

## Mapa de Ruta / Pseudocódigo

```
useTournamentData.ts:
  - usePageVisibility() hook: document.hidden → interval 10s, visible → 2.5s
  - lastFetchRef para evitar refetch si < 1.5s desde último

App.tsx:
  const DrawAnimation = lazy(() => import('./components/DrawAnimation'));
  const WinnerScreen = lazy(() => import('./components/WinnerScreen'));
  <Suspense fallback={<LoadingOverlay />}>{renderScreen()}</Suspense>

Bracket.tsx:
  export default React.memo(Bracket);
  quarterMatches = useMemo(() => matches.filter(...), [matches])
  semiMatches = useMemo(...)
  finalMatch = useMemo(...)
  handleCopy, onMatchClick handlers con useCallback si se pasan
  (Bracket recibe onMatchClick/onStartMatch como props - esos están en App)
```

## Criterios de Aceptación

- [x] El polling se ralentiza cuando la pestaña está oculta (document.hidden)
- [x] DrawAnimation y WinnerScreen se cargan bajo demanda (lazy)
- [x] Bracket usa React.memo y useMemo para derivaciones de matches
- [x] No hay refetches redundantes en ráfaga (< 1.5s entre llamadas)
- [x] Tests unitarios y build pasan
