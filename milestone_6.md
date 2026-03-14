# Milestone 6 — UX y accesibilidad

## Objetivo
Mejorar la experiencia de uso y cumplir criterios básicos de accesibilidad WCAG AA: aria-label en controles, contraste, focus visible, landmarks y Bracket responsive en móvil.

## Tareas

- [x] Añadir aria-label en botones de icono (×, chevrons, copiar) y inputs sin label
- [x] Añadir aria-label en tarjetas del Bracket (partido X vs Y, estado)
- [x] Implementar focus-visible con anillo de contraste ≥3:1 (index.css + Tailwind)
- [x] Revisar contraste: placeholder, text-slate-400, estados deshabilitados
- [x] Añadir skip link "Saltar al contenido" en index.html / App
- [x] Envolver contenido en <main> con id="main-content"
- [x] Tabs TournamentSetup: role="tablist", role="tab", aria-selected
- [x] Bracket responsive: mejorar tipografía y tap targets en móvil
- [x] type="button" en botones no-submit del Bracket

## Mapa de Ruta / Pseudocódigo

```
index.html / App.tsx:
  <a href="#main-content" class="skip-link">Saltar al contenido</a>
  <main id="main-content" tabIndex={-1}>

index.css:
  .skip-link: posicionar off-screen, visible en :focus
  focus-visible en botones: ring-2 ring-blue-400 ring-offset-2 ring-offset-[#0a0e1a]
  .input-modern:focus-visible: box-shadow más visible

Bracket.tsx:
  button renderCard: aria-label="Partido: {p1} vs {p2}, {estado}"
  button × cerrar: aria-label="Cerrar compartir"
  input share-url: aria-label="Enlace del torneo para compartir"
  button Copiar: aria-label="Copiar enlace del torneo"
  Botones Comenzar/Ir a votar/etc: aria-label descriptivos
  type="button" en todos los <button>

MatchSubmission.tsx:
  DateRangePicker trigger: aria-label, aria-expanded, aria-haspopup="dialog"
  button × limpiar: aria-label="Borrar fechas seleccionadas"
  Chevrons: aria-label="Mes anterior" / "Mes siguiente"

LobbyScreen.tsx:
  input lobby-url: aria-label="Enlace del lobby"
  button Copiar: aria-label="Copiar enlace"

TournamentSetup.tsx:
  div tabs: role="tablist"
  button tab: role="tab", aria-selected={tab==='solo'}, aria-controls
  Botones 2/4/8: aria-label="Seleccionar N participantes", aria-pressed

VotingScreen, TiebreakerScreen, MusicPlayer, UserIdentification:
  aria-label en botones críticos

Bracket responsive:
  @media 768px: min-width tarjetas, font-size legible, padding tap targets
```

## Criterios de Aceptación

- [x] Todos los botones de icono (×, chevrons, copiar) tienen aria-label
- [x] Los inputs sin label visible tienen aria-label
- [x] focus-visible muestra un anillo claramente visible (contraste ≥3:1)
- [x] Skip link visible al recibir foco con Tab
- [x] Contenido principal dentro de <main id="main-content">
- [x] Tabs en TournamentSetup tienen roles ARIA correctos
- [x] Bracket se muestra correctamente en móvil (768px)
- [x] Todos los botones no-submit tienen type="button"
