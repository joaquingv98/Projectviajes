# Milestone 9 — Endurecimiento mínimo de identidad

## Objetivo
Reducir el riesgo de suplantación lógica en propuestas y votos para una beta cerrada, introduciendo una identidad de participante basada en token y mutaciones seguras vía RPC en Supabase.

## Tareas

- [x] Crear almacenamiento de identidad de participante en frontend
- [x] Reemplazar sesión basada solo en nombre por sesión con token de participante
- [x] Añadir claim de participante al seleccionar nombre
- [x] Añadir claim automático de participante y bots en modo solo
- [x] Crear migración con tabla de claims y funciones RPC seguras
- [x] Reemplazar inserciones directas de propuestas por RPC segura
- [x] Reemplazar inserciones/upserts directos de votos por RPC segura
- [x] Restringir inserciones directas de propuestas y votos desde cliente
- [x] Validar lint y typecheck
- [x] Actualizar `prioridad3.md` y marcar progreso

## Mapa de Ruta / Pseudocódigo

```text
frontend:
  guardar { tournamentId, name, token, botTokens? } en sessionStorage
  al identificar usuario:
    reclamar nombre con RPC
    guardar token

solo mode:
  tras crear torneo:
    reclamar token para jugador humano
    reclamar tokens para bots
    guardar mapa de tokens en sesión

supabase:
  crear tabla participant_claims
  crear función claim_participant()
  crear función submit_proposal_secure()
  crear función cast_vote_secure()
  eliminar políticas de insert/update directas para proposals/votes

acciones de juego:
  proposals -> usar token + RPC segura
  votes -> usar token + RPC segura
```

## Criterios de Aceptación

- [x] La identidad de participante ya no depende solo de `player_name` / `voter_name`
- [x] Las propuestas usan una RPC validada por token
- [x] Los votos usan una RPC validada por token
- [ ] El modo solo conserva funcionamiento para humano + bots
- [x] `npm run lint` pasa
- [x] `npm run typecheck` pasa

## Estado

- [x] Implementación completada a nivel de código y migración
- [x] `npm run test:run` pasa
- [ ] Pendiente aplicar la migración de Supabase en el entorno real
- [ ] Pendiente validar manualmente el flujo completo con claims y RPCs activas
