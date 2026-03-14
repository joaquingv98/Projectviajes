# Prioridad 1 — Alinear y validar el E2E crítico

## Objetivo
Dejar operativo el test E2E principal para que refleje la UI actual de la aplicación y sirva como validación fiable del flujo base de release: setup -> lobby -> sorteo -> bracket.

## Estado actual detectado

- [x] Identificado el fallo actual en `e2e/tournament.spec.ts`
- [x] Confirmado que el test busca `Jugar vs máquina` como `button`
- [x] Confirmado que la UI actual renderiza `Jugar vs máquina` como `tab` en `src/components/TournamentSetup.tsx`
- [x] Confirmado que en desktop la pestaña inicial es `create`, no `solo`
- [x] Confirmado que `npm run test:e2e` falla por desalineación entre test y UI
- [x] Corregido el selector del modo `solo` para usar la `tab` accesible real
- [x] Ajustado el selector de tamaño de torneo para usar `aria-label`
- [x] Añadido timeout de test más holgado para el flujo completo
- [x] Validado que `npm run test:e2e` pasa (`2/2`)

## Tareas

- [x] Actualizar `e2e/tournament.spec.ts` para seleccionar primero la pestaña `Jugar vs máquina`
- [x] Reemplazar selectores frágiles por selectores accesibles y estables (`getByRole`, `getByLabel`, `getByPlaceholder` solo si es necesario)
- [x] Validar que el flujo `solo` de 2 participantes llega correctamente a `Sala de espera`
- [x] Validar que desde lobby se puede pulsar `Comenzar sorteo`
- [x] Validar que tras la animación aparece `Cuadro del Torneo`
- [x] Confirmar que el nombre del jugador creado aparece en bracket
- [x] Revisar si el timeout actual del test es suficiente para build + preview + animación
- [x] Ejecutar `npm run test:e2e` y confirmar que el smoke principal queda en verde
- [x] Documentar cualquier selector o espera especial que quede justificada por la UI

## Mapa de Ruta / Pseudocódigo

```text
Abrir home
  esperar heading "Torneo de Viajes"

Ir a modo solo
  click en tab "Jugar vs máquina"

Completar formulario solo
  fill "Tu nombre" con "TestE2E"
  seleccionar torneo de 2 participantes
  click en "Jugar contra la máquina"

Validar lobby
  esperar heading "Sala de espera" o nombre del torneo
  click en "Comenzar sorteo"

Validar bracket
  esperar heading "Cuadro del Torneo"
  comprobar que aparece "TestE2E"

Si falla por timing
  revisar timeout del test
  revisar timeout del webServer
  revisar selectores que dependan del rol incorrecto
```

## Criterios de Aceptación

- [x] El test E2E ya no depende de un rol incorrecto para `Jugar vs máquina`
- [x] El flujo `setup -> lobby -> draw -> bracket` pasa en local con Playwright
- [x] El test usa selectores coherentes con la accesibilidad real de la UI
- [x] No hay esperas arbitrarias innecesarias si puede verificarse por estado visible
- [x] `npm run test:e2e` pasa al menos con el smoke principal sin intervención manual

## Implementación realizada

- [x] `Jugar vs máquina` actualizado en el test para usar `getByRole('tab', ...)`
- [x] Selector del tamaño `2` actualizado para usar `aria-label` (`Seleccionar 2 participantes`)
- [x] Se mantiene `getByPlaceholder(/Ej: Joaco/i)` porque el input visible no expone label asociada programáticamente
- [x] Se añadió `test.setTimeout(45_000)` para absorber navegación, arranque del preview y animación sin falsos negativos
