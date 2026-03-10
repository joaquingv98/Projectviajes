# Milestone 3 — Acceso móvil y modo solo vs máquina

## Objetivo
Hacer la web accesible desde el móvil en la red local y permitir jugar en solitario contra oponentes simulados (solo en móvil).

## Tareas

- [x] Vite: configurar `server.host: true` para exponer en la red local
- [x] Añadir `--host` al script `dev` para mostrar IP de red en consola
- [x] Crear `src/lib/mobile.ts` con `isMobileDevice()`, `isBot()`, `getBotNames()`, `generateMockProposal()`
- [x] TournamentSetup: pestaña "Jugar vs máquina" (solo en móvil)
- [x] App: `handleCreateLobby` acepta `currentUserForMobile` y salta identificación
- [x] LobbyScreen: considerar "todos unidos" cuando hay bots
- [x] useMatchActions: auto-propuesta bot cuando usuario envía; auto-propuestas si ambos son bots
- [x] useMatchActions: auto-voto de bots en votación y tiebreak
- [x] TiebreakerScreen: auto-avanzar fase defensa cuando el defensor es bot
- [x] Mejoras responsive: padding, tamaños de fuente, calendario móvil, bracket scroll

## Criterios de Aceptación

- [x] Con `npm run dev`, la consola muestra la URL de red (ej. http://192.168.x.x:5173)
- [x] En móvil se puede acceder usando la IP del ordenador en la misma red
- [x] En móvil aparece la opción "Jugar vs máquina"
- [x] El usuario elige su nombre y tamaño (2/4/8) y comienza sin esperar a nadie
- [x] Los bots generan propuestas automáticas
- [x] Los bots votan automáticamente cuando el usuario vota
- [x] El tiebreaker con bot defensor avanza solo tras unos segundos
- [x] La UI es usable en pantallas pequeñas
