-- Fix: no activar partidos de la siguiente ronda hasta que termine toda la ronda actual
-- (ej: no jugar semifinales hasta terminar los 4 cuartos de final)

CREATE OR REPLACE FUNCTION advance_tiebreaker_phase(p_match_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_match matches%ROWTYPE;
  v_winner_name text;
  v_roulette_winner text;
  v_count1 int;
  v_count2 int;
  v_next_round text;
  v_next_match_number int;
  v_next_match matches%ROWTYPE;
  v_is_even boolean;
  v_winning_proposal_id uuid;
  v_round_complete boolean;
  v_m matches%ROWTYPE;
BEGIN
  SELECT * INTO v_match FROM matches WHERE id = p_match_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Match not found';
  END IF;
  IF v_match.status NOT IN ('tiebreak_d1', 'tiebreak_d2', 'tiebreak_vote', 'tiebreak_roulette') THEN
    RAISE EXCEPTION 'Match is not in tiebreaker phase';
  END IF;

  IF v_match.status = 'tiebreak_d1' THEN
    UPDATE matches SET
      status = 'tiebreak_d2',
      voting_ends_at = now() + interval '1 minute'
    WHERE id = p_match_id;
    RETURN;
  END IF;

  IF v_match.status = 'tiebreak_d2' THEN
    DELETE FROM votes WHERE match_id = p_match_id;
    UPDATE matches SET
      status = 'tiebreak_vote',
      voting_ends_at = now() + interval '5 minutes'
    WHERE id = p_match_id;
    RETURN;
  END IF;

  IF v_match.status = 'tiebreak_vote' THEN
    WITH vote_counts AS (
      SELECT proposal_id, count(*) AS cnt
      FROM votes WHERE match_id = p_match_id
      GROUP BY proposal_id
    ),
    ranked AS (
      SELECT p.player_name, COALESCE(vc.cnt, 0) AS cnt,
             ROW_NUMBER() OVER (ORDER BY COALESCE(vc.cnt, 0) DESC) AS rn
      FROM proposals p
      LEFT JOIN vote_counts vc ON vc.proposal_id = p.id
      WHERE p.match_id = p_match_id
    )
    SELECT
      (SELECT player_name FROM ranked WHERE rn = 1 LIMIT 1),
      (SELECT cnt FROM ranked WHERE rn = 1 LIMIT 1),
      COALESCE((SELECT cnt FROM ranked WHERE rn = 2 LIMIT 1), 0)
    INTO v_winner_name, v_count1, v_count2;

    IF v_count1 = v_count2 THEN
      SELECT player_name INTO v_roulette_winner
      FROM proposals
      WHERE match_id = p_match_id
      ORDER BY random()
      LIMIT 1;
      UPDATE matches SET
        status = 'tiebreak_roulette',
        winner_name = v_roulette_winner,
        voting_ends_at = now() + interval '6 seconds'
      WHERE id = p_match_id;
    ELSE
      UPDATE matches SET status = 'completed', winner_name = v_winner_name
      WHERE id = p_match_id;

      IF v_match.round = 'final' THEN
        SELECT id INTO v_winning_proposal_id FROM proposals
        WHERE match_id = p_match_id AND player_name = v_winner_name LIMIT 1;
        UPDATE tournaments SET status = 'completed', winner_proposal_id = v_winning_proposal_id
        WHERE id = v_match.tournament_id;
        RETURN;
      END IF;

      v_next_round := CASE v_match.round
        WHEN 'quarterfinals' THEN 'semifinals'
        WHEN 'semifinals' THEN 'final'
        ELSE NULL
      END;
      v_next_match_number := v_match.match_number / 2;

      SELECT * INTO v_next_match FROM matches
      WHERE tournament_id = v_match.tournament_id AND round = v_next_round AND match_number = v_next_match_number;
      IF NOT FOUND THEN RETURN; END IF;

      v_is_even := (v_match.match_number % 2) = 0;
      IF v_is_even THEN
        UPDATE matches SET player1_name = v_winner_name, status = 'pending' WHERE id = v_next_match.id;
      ELSE
        UPDATE matches SET player2_name = v_winner_name, status = 'pending' WHERE id = v_next_match.id;
      END IF;

      SELECT NOT EXISTS (
        SELECT 1 FROM matches
        WHERE tournament_id = v_match.tournament_id AND round = v_match.round AND status != 'completed'
      ) INTO v_round_complete;

      IF v_round_complete THEN
        FOR v_m IN
          SELECT * FROM matches
          WHERE tournament_id = v_match.tournament_id AND round = v_next_round
            AND player1_name IS NOT NULL AND player1_name != 'TBD'
            AND player2_name IS NOT NULL AND player2_name != 'TBD'
            AND status = 'pending'
        LOOP
          UPDATE matches SET status = 'proposing' WHERE id = v_m.id;
        END LOOP;
      END IF;
    END IF;
    RETURN;
  END IF;

  IF v_match.status = 'tiebreak_roulette' AND v_match.winner_name IS NOT NULL THEN
    v_winner_name := v_match.winner_name;
    UPDATE matches SET status = 'completed' WHERE id = p_match_id;

    IF v_match.round = 'final' THEN
      SELECT id INTO v_winning_proposal_id FROM proposals
      WHERE match_id = p_match_id AND player_name = v_winner_name LIMIT 1;
      UPDATE tournaments SET status = 'completed', winner_proposal_id = v_winning_proposal_id
      WHERE id = v_match.tournament_id;
      RETURN;
    END IF;

    v_next_round := CASE v_match.round
      WHEN 'quarterfinals' THEN 'semifinals'
      WHEN 'semifinals' THEN 'final'
      ELSE NULL
    END;
    v_next_match_number := v_match.match_number / 2;

    SELECT * INTO v_next_match FROM matches
    WHERE tournament_id = v_match.tournament_id AND round = v_next_round AND match_number = v_next_match_number;
    IF NOT FOUND THEN RETURN; END IF;

    v_is_even := (v_match.match_number % 2) = 0;
    IF v_is_even THEN
      UPDATE matches SET player1_name = v_winner_name, status = 'pending' WHERE id = v_next_match.id;
    ELSE
      UPDATE matches SET player2_name = v_winner_name, status = 'pending' WHERE id = v_next_match.id;
    END IF;

    SELECT NOT EXISTS (
      SELECT 1 FROM matches
      WHERE tournament_id = v_match.tournament_id AND round = v_match.round AND status != 'completed'
    ) INTO v_round_complete;

    IF v_round_complete THEN
      FOR v_m IN
        SELECT * FROM matches
        WHERE tournament_id = v_match.tournament_id AND round = v_next_round
          AND player1_name IS NOT NULL AND player1_name != 'TBD'
          AND player2_name IS NOT NULL AND player2_name != 'TBD'
          AND status = 'pending'
      LOOP
        UPDATE matches SET status = 'proposing' WHERE id = v_m.id;
      END LOOP;
    END IF;
  END IF;
END;
$$;
