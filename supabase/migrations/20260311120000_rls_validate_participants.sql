-- RLS: validar que solo participantes del torneo puedan votar
-- y solo jugadores del partido puedan enviar propuestas

-- Votes: eliminar políticas permisivas y crear restrictivas
DROP POLICY IF EXISTS "Public can create votes" ON votes;
DROP POLICY IF EXISTS "Public can update votes" ON votes;

-- Solo participantes del torneo pueden insertar votos
CREATE POLICY "Participants can insert votes"
  ON votes FOR INSERT
  TO public
  WITH CHECK (
    voter_name IN (
      SELECT jsonb_array_elements_text(t.participants)::text
      FROM tournaments t
      JOIN matches m ON m.tournament_id = t.id
      WHERE m.id = match_id
    )
  );

-- Solo participantes pueden actualizar (upsert) sus votos
CREATE POLICY "Participants can update votes"
  ON votes FOR UPDATE
  TO public
  USING (
    voter_name IN (
      SELECT jsonb_array_elements_text(t.participants)::text
      FROM tournaments t
      JOIN matches m ON m.tournament_id = t.id
      WHERE m.id = match_id
    )
  )
  WITH CHECK (
    voter_name IN (
      SELECT jsonb_array_elements_text(t.participants)::text
      FROM tournaments t
      JOIN matches m ON m.tournament_id = t.id
      WHERE m.id = match_id
    )
  );

-- Proposals: solo jugadores del partido pueden crear propuestas
DROP POLICY IF EXISTS "Public can create proposals" ON proposals;

CREATE POLICY "Match players can insert proposals"
  ON proposals FOR INSERT
  TO public
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM matches m
      WHERE m.id = match_id
      AND (m.player1_name = player_name OR m.player2_name = player_name)
    )
  );
