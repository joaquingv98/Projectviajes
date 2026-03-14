# Milestone 8 — Features incrementales

## Objetivo
Añadir funcionalidades incrementales: nombre del torneo, exportar ganador, modo claro/oscuro e historial de torneos recientes.

## Tareas

- [x] Nombre del torneo: input en TournamentSetup (create + solo), pasar a createLobby
- [x] Mostrar nombre del torneo en LobbyScreen, Bracket y WinnerScreen
- [x] Exportar ganador: botón "Compartir resultado" que copia resumen al portapapeles
- [x] Modo oscuro/claro: ThemeContext + toggle, CSS variables
- [x] Historial de torneos: localStorage últimos 5 IDs, lista en TournamentSetup para reabrir
- [x] Persistir tema elegido en localStorage

## Mapa de Ruta / Pseudocódigo

```
createLobby(participants, name?: string):
  insert { ..., name: name || 'Travel Tournament' }

TournamentSetup:
  - [create/solo] input "Nombre del torneo" (opcional, placeholder "Mi viaje grupal")
  - onStart(participants, currentUser?, tournamentName?)
  - Historial: leer localStorage 'tournament_history' (array {id, name, date})
  - Botón "Reabrir" → onJoin(id)

App handleCreateLobby:
  createLobby(participants, tournamentName)
  addToHistory(tournamentId, tournamentName)

Bracket/LobbyScreen/WinnerScreen:
  Mostrar tournament?.name cuando exista

WinnerScreen:
  - Botón "Compartir resultado" → copiar texto "¡Ganador! {destino} - {player} - {price}€"
  - toast "Resultado copiado"

Theme:
  - src/contexts/ThemeContext.tsx: 'dark'|'light', toggle, localStorage
  - index.css: [data-theme="light"] override variables
  - Toggle en header o footer (MusicPlayer cerca)

src/lib/tournamentHistory.ts:
  getHistory(), addToHistory(id, name), MAX=5
```

## Criterios de Aceptación

- [x] Se puede poner nombre al crear torneo (create y solo)
- [x] El nombre se muestra en lobby, bracket y pantalla ganador
- [x] "Compartir resultado" copia resumen del ganador
- [x] Toggle modo claro/oscuro funciona y persiste
- [x] Historial muestra últimos torneos y permite reabrir
- [x] Tests y build pasan
