# Prioridad 2 — Dejar el lint en verde

## Objetivo
Eliminar los errores y warnings actuales de ESLint para que la rama quede más estable antes del release y el proyecto tenga una validación estática fiable.

## Estado actual detectado

- [x] Ejecutado `npm run lint`
- [x] Confirmado que el lint falla con `2 errors` y `4 warnings`
- [x] Identificado error en `src/lib/mobile.ts` por parámetro no usado (`_playerName`)
- [x] Identificado error en `src/lib/sanitize.ts` por `no-control-regex`
- [x] Identificado warning en `src/components/Bracket.tsx` por dependencia faltante en `useMemo`
- [x] Identificados warnings en `src/components/TiebreakerScreen.tsx` por dependencias faltantes en `useEffect`
- [x] Identificado warning en `src/contexts/ThemeContext.tsx` por `react-refresh/only-export-components`
- [x] Corregidos los `2 errors` iniciales de lint
- [x] Corregidos los `4 warnings` iniciales de lint
- [x] Validado que `npm run lint` termina en verde
- [x] Validado que `npm run typecheck` sigue pasando tras los cambios

## Tareas

- [x] Corregir el error de `src/lib/mobile.ts` eliminando o aprovechando el parámetro no usado
- [x] Corregir el error de `src/lib/sanitize.ts` reemplazando la regex de caracteres de control por una alternativa compatible con ESLint
- [x] Revisar `src/components/Bracket.tsx` y estabilizar la dependencia `roundOrder` en el `useMemo`
- [x] Revisar `src/components/TiebreakerScreen.tsx` y completar dependencias reales en los `useEffect`
- [x] Revisar `src/contexts/ThemeContext.tsx` para separar exports no-component de los componentes o ajustar la estructura
- [x] Ejecutar `npm run lint` tras los cambios
- [x] Confirmar que no aparecen nuevos warnings ni errores por efectos secundarios
- [x] Documentar en este archivo qué se tocó y qué problema resolvía cada cambio

## Orden de implementación recomendado

1. Resolver primero los `errors`:
   - `src/lib/mobile.ts`
   - `src/lib/sanitize.ts`
2. Resolver después los warnings funcionales de hooks:
   - `src/components/Bracket.tsx`
   - `src/components/TiebreakerScreen.tsx`
3. Resolver al final el warning estructural de Fast Refresh:
   - `src/contexts/ThemeContext.tsx`
4. Reejecutar lint y validar resultado final

## Mapa de Ruta / Pseudocódigo

```text
Ejecutar lint
  detectar archivos con error

Corregir mobile.ts
  si el parámetro no se usa:
    eliminarlo de la firma
  si sí debe usarse:
    incorporarlo a la lógica

Corregir sanitize.ts
  sustituir regex con control chars explícitos por una versión que no dispare no-control-regex
  mantener el comportamiento de sanitización

Corregir Bracket.tsx
  evitar dependencia inestable dentro de useMemo
  mover roundOrder fuera del componente o memoizarlo correctamente

Corregir TiebreakerScreen.tsx
  añadir dependencias reales de los efectos
  comprobar que no se introducen re-render loops

Corregir ThemeContext.tsx
  separar hook/contexto compartido si Fast Refresh lo exige

Ejecutar lint de nuevo
  si sale verde:
    marcar prioridad completada
  si aparece algo nuevo:
    iterar hasta dejarlo limpio
```

## Criterios de Aceptación

- [x] `npm run lint` termina sin errores
- [x] `npm run lint` termina sin warnings relevantes
- [x] No se modifica el comportamiento funcional esperado de la app
- [x] Las correcciones de hooks no introducen bucles ni efectos colaterales
- [x] La solución de `sanitize.ts` mantiene la misma intención de seguridad

## Implementación prevista

- [x] `src/lib/mobile.ts`: limpiada la firma de `generateMockProposal` y actualizados sus usos en `src/hooks/useMatchActions.ts`
- [x] `src/lib/sanitize.ts`: sustituida la regex conflictiva por una función `stripControlChars` sin `no-control-regex`
- [x] `src/components/Bracket.tsx`: movido `ROUND_ORDER` fuera del componente para estabilizar el `useMemo`
- [x] `src/components/TiebreakerScreen.tsx`: completadas las dependencias reales de los `useEffect`
- [x] `src/contexts/ThemeContext.tsx`: separado el contexto y el hook en archivos auxiliares (`theme-context.ts` y `useTheme.ts`)

## Implementación realizada

- [x] `src/lib/mobile.ts`: `generateMockProposal` ya no declara un parámetro no usado
- [x] `src/hooks/useMatchActions.ts`: actualizadas todas las llamadas a `generateMockProposal`
- [x] `src/lib/sanitize.ts`: centralizada la limpieza de caracteres de control con una función reusable
- [x] `src/components/Bracket.tsx`: eliminado el warning por dependencia inestable en `roundOrder`
- [x] `src/components/TiebreakerScreen.tsx`: eliminados los warnings de dependencias faltantes
- [x] `src/contexts/theme-context.ts`: nuevo archivo para tipos, constante y contexto
- [x] `src/contexts/useTheme.ts`: nuevo archivo para el hook `useTheme`
- [x] `src/components/ThemeToggle.tsx`: actualizado para importar `useTheme` desde su nuevo módulo
- [x] `npm run lint`: OK
- [x] `npm run typecheck`: OK
