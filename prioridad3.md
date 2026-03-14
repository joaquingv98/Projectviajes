# Prioridad 3 — Endurecer seguridad mínima de Supabase

## Objetivo
Reducir el riesgo de suplantación lógica en propuestas y votos antes del release, y dejar explícita la decisión de seguridad del proyecto según el tipo de lanzamiento: beta cerrada o producción pública.

## Estado actual detectado

- [x] Confirmado que el cliente usa `VITE_SUPABASE_ANON_KEY` desde frontend en `src/lib/supabase.ts`
- [x] Confirmado que la identidad funcional actual se basa en `player_name` y `voter_name`
- [x] Confirmado que `UserIdentification` permite elegir nombre por presencia en tiempo real, no por autenticación fuerte
- [x] Confirmado que la lógica de propuestas y votos envía `player_name` / `voter_name` directamente desde cliente en `src/hooks/useMatchActions.ts`
- [x] Confirmado que la migración RLS actual restringe pertenencia al torneo/partido, pero no prueba identidad real del usuario
- [x] Confirmado que el riesgo principal no es de build sino de seguridad lógica si el proyecto se expone públicamente

## Riesgo resumido

- [x] Estado actual aceptable para demo privada o beta cerrada entre personas de confianza
- [ ] Estado actual no ideal para producción pública abierta
- [x] Riesgo principal: un cliente que conozca el `tournamentId` podría intentar operar como otro participante si llama directamente a Supabase
- [x] La presencia del lobby evita colisiones de UX, pero no sustituye autenticación
- [x] Se elige ejecutar la ruta `beta cerrada` como endurecimiento mínimo de esta fase
- [ ] Sigue pendiente una solución de identidad fuerte para `producción pública`

## Tareas

- [x] Decidir formalmente el objetivo del release: `beta cerrada` o `producción pública`
- [x] Documentar el nivel de riesgo aceptado si se mantiene el modelo actual basado en nombres
- [x] Revisar qué operaciones críticas deben dejar de confiar solo en datos enviados por el cliente
- [x] Definir una estrategia de identidad/autorización para votos y propuestas
- [x] Elegir una de estas rutas:
- [x] Ruta A: endurecimiento mínimo para beta cerrada
- [ ] Ruta B: autenticación real o backend intermedio para producción pública
- [x] Definir cómo se validará que un usuario solo pueda actuar como sí mismo
- [x] Definir cómo se validará que un jugador solo pueda proponer en su partido
- [x] Definir cómo se validará que un participante solo pueda votar una vez por ronda/partido
- [ ] Añadir plan de pruebas de seguridad lógica tras la implementación

## Orden de implementación recomendado

1. Tomar la decisión de release:
   - `beta cerrada`
   - `producción pública`
2. Si es `beta cerrada`, aplicar endurecimiento mínimo y dejar riesgo documentado
3. Si es `producción pública`, diseñar identidad real antes de seguir añadiendo features
4. Implementar protecciones y después validar con pruebas manuales/técnicas

## Opciones de solución

### Ruta A — Beta cerrada / endurecimiento mínimo

- [x] Mantener Supabase `anon` temporalmente
- [x] Documentar explícitamente que no hay identidad fuerte
- [ ] Reducir superficie pública de uso
- [x] Añadir validaciones adicionales de consistencia en cliente y base de datos
- [ ] Limitar el uso a torneos compartidos entre personas de confianza

### Ruta B — Producción pública / solución recomendada

- [ ] Incorporar autenticación real de usuario
- [ ] Asociar cada acción a un `user id` verificable, no a un nombre libre
- [ ] Reescribir RLS para validar por identidad autenticada en vez de `player_name` / `voter_name`
- [ ] Evaluar si las mutaciones críticas deben pasar por Edge Functions o backend intermedio
- [ ] Definir relación clara entre `usuario autenticado` y `participant slot` del torneo

## Mapa de Ruta / Pseudocódigo

```text
Analizar release esperado
  si el proyecto es demo/beta cerrada:
    aceptar riesgo limitado
    documentar restricciones de uso
    endurecer validaciones mínimas

  si el proyecto será público:
    introducir identidad real
    mapear auth user -> participante del torneo
    reescribir reglas RLS
    impedir que el cliente decida libremente voter_name/player_name

Para propuestas
  validar que el usuario autenticado corresponde al jugador del partido

Para votos
  validar que el usuario autenticado pertenece al torneo
  validar que no puede votar como otro participante
  validar unicidad por usuario + partido

Después
  probar intentos de suplantación
  probar votos duplicados
  probar propuestas de usuarios no autorizados
```

## Criterios de Aceptación

- [x] Existe una decisión explícita entre `beta cerrada` y `producción pública`
- [x] La estrategia de identidad queda definida por escrito
- [x] Las operaciones críticas dejan de confiar únicamente en nombres enviados por cliente, o el riesgo queda aceptado y documentado
- [ ] Se define cómo probar intentos de suplantación de voto/propuesta
- [x] El proyecto queda con una postura de seguridad entendible antes del release

## Implementación prevista

- [x] Revisar y decidir la estrategia de identidad del producto
- [x] Rediseñar o endurecer RLS según la estrategia elegida
- [x] Ajustar frontend para dejar de depender de `player_name` / `voter_name` como identidad primaria
- [ ] Añadir validación/pruebas de seguridad lógica

## Implementación realizada

- [x] Añadido `src/lib/participantIdentity.ts` para guardar identidad por torneo con `token` y `botTokens`
- [x] `src/App.tsx` ya restaura y persiste identidad con token en lugar de sesión basada solo en nombre
- [x] `src/components/UserIdentification.tsx` reclama el participante con RPC antes de entrar al lobby
- [x] El modo `solo` reclama token para usuario humano y bots al crear el torneo
- [x] `src/hooks/useMatchActions.ts` usa `submit_proposal_secure` y `cast_vote_secure` en vez de inserciones directas para propuestas y votos
- [x] Añadida migración `supabase/migrations/20260314110000_participant_claims_secure_actions.sql`
- [x] La migración crea `participant_claims`, `claim_participant`, `submit_proposal_secure` y `cast_vote_secure`
- [x] La migración elimina las políticas directas de insert/update sobre `proposals` y `votes`
- [x] `npm run lint` pasa
- [x] `npm run typecheck` pasa
- [x] `npm run test:run` pasa

## Riesgo residual

- [x] Esta implementación mejora la seguridad lógica para `beta cerrada`, pero no equivale a autenticación fuerte
- [x] `matches` y `tournaments` siguen dependiendo de mutaciones directas del cliente y requerirán otra fase de hardening si el objetivo pasa a `producción pública`
- [x] Falta aplicar la nueva migración de Supabase en el entorno real para que el flujo quede operativo
- [ ] Falta ejecutar pruebas manuales de intentos de suplantación y de flujo completo con la migración aplicada

## Referencias actuales del código

- [x] `src/lib/supabase.ts`: cliente público con `anon key`
- [x] `src/components/UserIdentification.tsx`: selección de nombre basada en presencia
- [x] `src/hooks/useMatchActions.ts`: propuestas y votos enviados desde cliente con nombres
- [x] `supabase/migrations/20260311120000_rls_validate_participants.sql`: RLS basada en pertenencia por nombre
