-- ============================================================
-- MIGRATION: Tiebreak phases support
-- Ejecuta esto en el SQL Editor de tu proyecto Supabase
-- Solo actualiza el constraint de status — NO añade columnas nuevas
-- ============================================================

-- Eliminar el constraint antiguo (si existe — si no existe, no pasa nada)
ALTER TABLE matches
  DROP CONSTRAINT IF EXISTS matches_status_check;

-- Añadir el constraint actualizado incluyendo las fases de tiebreak
ALTER TABLE matches
  ADD CONSTRAINT matches_status_check
  CHECK (status IN (
    'pending',
    'proposing',
    'voting',
    'tiebreak_d1',
    'tiebreak_d2',
    'tiebreak_vote',
    'tiebreak_roulette',
    'completed'
  ));
