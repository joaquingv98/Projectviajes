# Roadmap — Torneo de Viajes

Próximos milestones planificados.

---

## Milestone 2 — Refactorización App.tsx

**Objetivo:** Dividir la lógica de App.tsx en hooks reutilizables.

**Pseudocódigo:**
```
useTournamentData(tournamentId, onDataLoaded)
  → Gestiona: loadTournamentData, suscripciones real-time, polling
  → Retorna: tournament, matches, proposals, votes

useMatchActions(tournament)
  → completeMatch, advanceTiebreakerPhase, handleVote, handleSubmitProposal, etc.

App.tsx
  → Orquestador: state, renderScreen, composición de hooks
  → Reducir a ~200-250 líneas
```

---

## Milestone 3 — Manejo de errores y estados de carga

**Pseudocódigo:**
```
ErrorBoundary → captura errores React
LoadingOverlay → spinner/overlay reutilizable
Reemplazar alert() → notificaciones en UI
Estados loading en: createLobby, startDraw, handleSubmitProposal, etc.
```

---

## Milestone 4 — Seguridad y validación

**Pseudocódigo:**
```
RLS en Supabase → políticas por torneo
Validar en backend: solo participantes pueden votar
navigator.clipboard en lugar de execCommand('copy')
Sanitizar inputs (destino, enlaces, precio)
```

---

## Milestone 5 — Testing

**Pseudocódigo:**
```
Vitest + React Testing Library
Tests: resolveVotes, useTournamentData (mock), Bracket, VotingScreen
E2E básico: crear torneo → sorteo → votar → ganador
```

---

## Milestone 6 — UX y accesibilidad

**Pseudocódigo:**
```
aria-label en botones/inputs
Contraste WCAG AA
Navegación por teclado
Focus visible
Bracket responsive en móvil
```

---

## Milestone 7 — Rendimiento

**Pseudocódigo:**
```
Polling adaptativo según pantalla
Lazy load: DrawAnimation, WinnerScreen
Memoización en Bracket
React Query/SWR para caché
```

---

## Milestone 8 — Features incrementales

- Nombre del torneo (campo ya existe en DB)
- Historial de torneos
- Exportar ganador (PDF/enlace)
- Modo oscuro/claro
- i18n
