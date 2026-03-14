# Milestone 4 — Seguridad y validación

## Objetivo
Reforzar la seguridad del backend con RLS restrictivo, validar que solo participantes puedan votar, eliminar el uso deprecado de execCommand y sanitizar los inputs del usuario.

## Tareas

- [x] Crear migración RLS: restringir votes a participantes del torneo
- [x] Crear migración RLS: restringir proposals a jugadores del partido
- [x] Eliminar execCommand: fallback con toast "Copia manualmente" en Bracket y LobbyScreen
- [x] Crear src/lib/sanitize.ts: sanitizeUrl, sanitizeText, validatePrice
- [x] Aplicar sanitización en handleSubmitProposal (flight_link, destination, price)
- [x] Aplicar validación en MatchSubmission antes de enviar

## Mapa de Ruta / Pseudocódigo

```
supabase/migrations/YYYYMMDD_rls_validate_participants.sql:
  DROP POLICY "Public can create votes"
  DROP POLICY "Public can update votes"
  CREATE POLICY "Participants can insert votes" ON votes FOR INSERT
    WITH CHECK (voter_name IN (SELECT jsonb_array_elements_text(t.participants) FROM tournaments t JOIN matches m ON m.tournament_id = t.id WHERE m.id = match_id))
  CREATE POLICY "Participants can update votes" ON votes FOR UPDATE
    USING (misma condición)

  DROP POLICY "Public can create proposals"
  CREATE POLICY "Match players can insert proposals" ON proposals FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM matches m WHERE m.id = match_id AND (m.player1_name = player_name OR m.player2_name = player_name)))

Bracket.tsx / LobbyScreen.tsx handleCopy:
  navigator.clipboard.writeText(url).then(...).catch(() => {
    input.select();
    toast.error('Copia manualmente (Ctrl+C)');
    setCopied(false);
  });
  // Eliminar document.execCommand

src/lib/sanitize.ts:
  sanitizeUrl(s: string): string | null  // solo http(s), max 2000 chars
  sanitizeText(s: string, maxLen?: number): string  // trim, strip control chars
  validatePrice(n: number): number | null  // >= 0, <= 999999, 2 decimals

useMatchActions handleSubmitProposal:
  proposalData sanitizado antes de insert
MatchSubmission:
  validar/sanitar al cambiar o al submit
```

## Criterios de Aceptación

- [x] RLS impide insertar votos si voter_name no es participante del torneo
- [x] RLS impide insertar propuestas si player_name no es jugador del partido
- [x] No se usa document.execCommand en el proyecto
- [x] flight_link solo acepta URLs http/https válidas
- [x] destination y price tienen longitud/límites razonables
- [x] Los tests unitarios pasan
