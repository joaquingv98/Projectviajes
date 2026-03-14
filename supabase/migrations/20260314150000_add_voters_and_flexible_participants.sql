-- Separar competidores del bracket y votantes del torneo
-- Permitir entre 2 y 8 competidores con bracket flexible mediante byes

ALTER TABLE tournaments
ADD COLUMN IF NOT EXISTS voters jsonb NOT NULL DEFAULT '[]'::jsonb;

UPDATE tournaments
SET voters = participants
WHERE voters IS NULL OR voters = '[]'::jsonb;

ALTER TABLE tournaments
DROP CONSTRAINT IF EXISTS tournaments_num_participants_check;

ALTER TABLE tournaments
ADD CONSTRAINT tournaments_num_participants_check
CHECK (num_participants BETWEEN 2 AND 8);

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
        SELECT jsonb_array_elements_text(
          COALESCE(NULLIF(t.voters, '[]'::jsonb), t.participants)
        )::text
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
        SELECT jsonb_array_elements_text(
          COALESCE(NULLIF(t.voters, '[]'::jsonb), t.participants)
        )::text
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
