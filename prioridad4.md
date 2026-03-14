# Prioridad 4 — Aplicar migración de Supabase en producción

## Objetivo
Ejecutar la migración `participant_claims_secure_actions` en el proyecto Supabase real para que las RPCs `claim_participant`, `submit_proposal_secure` y `cast_vote_secure` existan y la app funcione correctamente en producción.

## Estado actual detectado

- [x] La migración está implementada en `supabase/migrations/20260314110000_participant_claims_secure_actions.sql`
- [x] El frontend ya usa `claimParticipant`, `submitProposalSecure` y `castVoteSecure` (Prioridad 3)
- [x] La migración está aplicada en el entorno Supabase real
- [x] La app funciona correctamente al reclamar participante, proponer y votar

## Dependencias previas

El proyecto Supabase debe tener creadas las tablas base:

- `tournaments`
- `matches`
- `proposals`
- `votes`

Si usaste `supabase_setup.sql` o las migraciones anteriores, ya las tienes.

## Tareas

- [x] Confirmar acceso al proyecto Supabase (dashboard en supabase.com)
- [x] Abrir el SQL Editor del proyecto Supabase
- [x] Ejecutar el contenido de `scripts/supabase-prioridad4.sql` (o `supabase/migrations/20260314110000_participant_claims_secure_actions.sql`)
- [x] Verificar que la ejecución termina sin errores
- [x] Comprobar que existen la tabla `participant_claims` y las funciones RPC
- [x] Probar en local o preview que el flujo funciona (crear torneo → identificar → proponer → votar)

## Orden de implementación recomendado

1. Ir a [app.supabase.com](https://app.supabase.com) y seleccionar el proyecto
2. **SQL Editor** → **New query**
3. Copiar y pegar el contenido de `scripts/supabase-prioridad4.sql`
4. **Run** (o Ctrl+Enter)
5. Confirmar mensaje "Success" en la ejecución
6. Opcional: ejecutar `SELECT * FROM participant_claims LIMIT 1;` para validar que la tabla existe

## Mapa de Ruta / Pseudocódigo

```text
Abrir Supabase Dashboard
  seleccionar proyecto correcto (el que usa VITE_SUPABASE_URL)

SQL Editor
  New query
  pegar script de prioridad4

Ejecutar
  Run
  si hay error:
    revisar que tournaments, matches, proposals, votes existen
    revisar mensaje de error (permisos, sintaxis, etc.)

Si éxito:
  tabla participant_claims creada
  funciones claim_participant, submit_proposal_secure, cast_vote_secure creadas
  políticas antiguas de insert en proposals/votes eliminadas

Validar
  arrancar app local con npm run dev
  crear torneo modo solo
  verificar que llega a lobby y puede comenzar sorteo
  verificar que puede proponer y votar en un partido
```

## Criterios de Aceptación

- [x] La migración se ejecuta sin errores en el SQL Editor de Supabase
- [x] La tabla `participant_claims` existe en la base de datos
- [x] Las funciones `claim_participant`, `submit_proposal_secure` y `cast_vote_secure` existen y están disponibles para `anon`
- [x] El flujo de crear torneo → identificar → proponer → votar funciona sin errores de RPC

## Contenido de la migración (resumen)

La migración:

1. Crea la tabla `participant_claims` (tournament_id, participant_name, participant_token)
2. Elimina políticas antiguas de insert/update en `votes` y `proposals`
3. Crea la función `claim_participant` para reclamar un participante y obtener token
4. Crea la función `submit_proposal_secure` para enviar propuestas validando el token
5. Crea la función `cast_vote_secure` para votar validando el token
6. Concede permisos de ejecución a `anon` y `authenticated`

## Implementación realizada

- [x] Script SQL preparado en `scripts/supabase-prioridad4.sql`
- [x] Migración ejecutada en Supabase
- [x] Flujo validado manualmente

## Referencias

- Migración original: `supabase/migrations/20260314110000_participant_claims_secure_actions.sql`
- Código que usa las RPCs: `src/lib/participantIdentity.ts`, `src/hooks/useMatchActions.ts`
- Prioridad 3 (seguridad): `prioridad3.md`
