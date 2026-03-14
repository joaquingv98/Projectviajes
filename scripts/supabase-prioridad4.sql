-- ============================================================
-- PRIORIDAD 4 — Migración participant_claims (seguridad)
-- Ejecuta esto en el SQL Editor de tu proyecto Supabase
-- ============================================================
-- Crea: tabla participant_claims, funciones claim_participant,
--       submit_proposal_secure, cast_vote_secure
-- Requiere: tablas tournaments, matches, proposals, votes
-- ============================================================

CREATE TABLE IF NOT EXISTS participant_claims (
  tournament_id uuid NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  participant_name text NOT NULL,
  participant_token text NOT NULL UNIQUE,
  claimed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tournament_id, participant_name)
);

ALTER TABLE participant_claims ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_participant_claims_tournament
  ON participant_claims(tournament_id);

DROP POLICY IF EXISTS "Participants can insert votes" ON votes;
DROP POLICY IF EXISTS "Participants can update votes" ON votes;
DROP POLICY IF EXISTS "Match players can insert proposals" ON proposals;

CREATE OR REPLACE FUNCTION claim_participant(
  p_tournament_id uuid,
  p_participant_name text
) RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_token text;
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM tournaments t
    WHERE t.id = p_tournament_id
      AND p_participant_name IN (
        SELECT jsonb_array_elements_text(t.participants)::text
      )
  ) THEN
    RAISE EXCEPTION 'Participant not found in tournament';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM participant_claims pc
    WHERE pc.tournament_id = p_tournament_id
      AND pc.participant_name = p_participant_name
  ) THEN
    RAISE EXCEPTION 'Participant already claimed';
  END IF;

  v_token := gen_random_uuid()::text;

  INSERT INTO participant_claims (tournament_id, participant_name, participant_token)
  VALUES (p_tournament_id, p_participant_name, v_token);

  RETURN v_token;
END;
$$;

CREATE OR REPLACE FUNCTION submit_proposal_secure(
  p_match_id uuid,
  p_player_name text,
  p_participant_token text,
  p_flight_link text,
  p_price numeric,
  p_destination text,
  p_dates text
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tournament_id uuid;
BEGIN
  SELECT m.tournament_id
  INTO v_tournament_id
  FROM matches m
  WHERE m.id = p_match_id
    AND (m.player1_name = p_player_name OR m.player2_name = p_player_name);

  IF v_tournament_id IS NULL THEN
    RAISE EXCEPTION 'Player not allowed for this match';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM participant_claims pc
    WHERE pc.tournament_id = v_tournament_id
      AND pc.participant_name = p_player_name
      AND pc.participant_token = p_participant_token
  ) THEN
    RAISE EXCEPTION 'Invalid participant token';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM proposals p
    WHERE p.match_id = p_match_id
      AND p.player_name = p_player_name
  ) THEN
    RAISE EXCEPTION 'Proposal already submitted';
  END IF;

  INSERT INTO proposals (match_id, player_name, flight_link, price, destination, dates)
  VALUES (p_match_id, p_player_name, p_flight_link, p_price, p_destination, p_dates);
END;
$$;

CREATE OR REPLACE FUNCTION cast_vote_secure(
  p_match_id uuid,
  p_voter_name text,
  p_participant_token text,
  p_proposal_id uuid
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tournament_id uuid;
BEGIN
  SELECT m.tournament_id
  INTO v_tournament_id
  FROM matches m
  WHERE m.id = p_match_id;

  IF v_tournament_id IS NULL THEN
    RAISE EXCEPTION 'Match not found';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM tournaments t
    WHERE t.id = v_tournament_id
      AND p_voter_name IN (
        SELECT jsonb_array_elements_text(t.participants)::text
      )
  ) THEN
    RAISE EXCEPTION 'Voter not part of tournament';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM participant_claims pc
    WHERE pc.tournament_id = v_tournament_id
      AND pc.participant_name = p_voter_name
      AND pc.participant_token = p_participant_token
  ) THEN
    RAISE EXCEPTION 'Invalid participant token';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM proposals p
    WHERE p.id = p_proposal_id
      AND p.match_id = p_match_id
  ) THEN
    RAISE EXCEPTION 'Proposal does not belong to match';
  END IF;

  INSERT INTO votes (match_id, voter_name, proposal_id)
  VALUES (p_match_id, p_voter_name, p_proposal_id)
  ON CONFLICT (match_id, voter_name)
  DO UPDATE SET proposal_id = EXCLUDED.proposal_id;
END;
$$;

GRANT EXECUTE ON FUNCTION claim_participant(uuid, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION submit_proposal_secure(uuid, text, text, text, numeric, text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION cast_vote_secure(uuid, text, text, uuid) TO anon, authenticated;
