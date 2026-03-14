# Milestone 5 — Testing

## Objetivo
Añadir tests unitarios y E2E básico para garantizar que el flujo crítico de la aplicación funciona correctamente y detectar regresiones.

## Tareas

- [x] Instalar Vitest, React Testing Library, jsdom, @testing-library/jest-dom
- [x] Configurar Vitest en vite.config.ts (test)
- [x] Crear vitest.setup.ts para matchers de jest-dom
- [x] Test unitario: resolveVotes (ganador claro, empate, votos vacíos)
- [x] Test unitario: Bracket (renderiza partidos, muestra ganador reciente)
- [x] Test unitario: VotingScreen (muestra propuestas, botón confirmar)
- [x] Instalar Playwright para E2E
- [x] E2E básico: crear torneo → sorteo → bracket (modo vs máquina)
- [x] Añadir script "test" en package.json

## Mapa de Ruta / Pseudocódigo

```
package.json:
  scripts: "test": "vitest", "test:run": "vitest run", "test:e2e": "playwright test"
  devDependencies: vitest, @testing-library/react, @testing-library/jest-dom, jsdom, @playwright/test

vite.config.ts:
  export default defineConfig({
    ...
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './src/test/setup.ts',
      include: ['src/**/*.{test,spec}.{ts,tsx}'],
    },
  });

src/test/setup.ts:
  import '@testing-library/jest-dom/vitest';

src/lib/supabase.test.ts:
  describe('resolveVotes', () => {
    - ganador claro: 3 votos vs 1
    - empate: 2 vs 2
    - votos vacíos: winner = primera propuesta, isTied = false
  });

src/components/Bracket.test.tsx:
  - render con matches mock
  - verifica que muestra partidos
  - verifica recentWinner si se pasa

src/components/VotingScreen.test.tsx:
  - render con match, proposals, votes mock
  - verifica que muestra las dos propuestas
  - verifica botón Confirmar

e2e/tournament.spec.ts (Playwright):
  - page.goto('/')
  - Modo vs máquina: rellenar nombre, elegir tamaño 2, pulsar Jugar
  - Esperar lobby, pulsar Comenzar sorteo
  - Esperar bracket, pulsar partido (si proposing)
  - Rellenar propuesta, enviar
  - Esperar votación, seleccionar propuesta, confirmar
  - Verificar pantalla ganador
```

## Criterios de Aceptación

- [x] `npm run test` ejecuta la suite de tests unitarios
- [x] `npm run test:run` ejecuta tests sin watch (para CI)
- [x] resolveVotes tiene tests para ganador, empate y edge cases
- [x] Bracket y VotingScreen tienen tests de renderizado
- [x] `npm run test:e2e` ejecuta E2E (crear → sorteo → bracket)
- [x] Todos los tests pasan
