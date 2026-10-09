
-- =========================================================
-- Study Flow
-- Migration 012: Fix Flashcard Difficulty Constraint
-- =========================================================
--
-- Problem:
-- The application supports three difficulty levels:
--
-- easy
-- medium
-- hard
--
-- However, the existing PostgreSQL check constraint
-- does not permit the value 'hard'.
--
-- This migration preserves the original constraint
-- and extends it to support 'hard'.
--
-- Existing flashcards are not deleted or modified.
-- =========================================================

BEGIN;

DO $$
DECLARE
    existing_rule TEXT;
BEGIN

    -- Retrieve the original difficulty constraint.
    SELECT pg_get_expr(
        c.conbin,
        c.conrelid
    )
    INTO existing_rule
    FROM pg_constraint AS c
    JOIN pg_class AS t
        ON t.oid = c.conrelid
    JOIN pg_namespace AS n
        ON n.oid = t.relnamespace
    WHERE n.nspname = 'public'
      AND t.relname = 'flashcards'
      AND c.conname = 'flashcards_difficulty_check'
      AND c.contype = 'c';

    -- Stop safely if the expected constraint is missing.
    IF existing_rule IS NULL THEN
        RAISE EXCEPTION
            'flashcards_difficulty_check does not exist';
    END IF;

    -- Skip the migration if the constraint already
    -- includes the application's hard difficulty value.
    IF POSITION(
        '''hard''' IN existing_rule
    ) > 0 THEN

        RAISE NOTICE
            'The hard difficulty value is already supported';

        RETURN;
    END IF;

    -- Remove the old constraint.
    ALTER TABLE public.flashcards
    DROP CONSTRAINT flashcards_difficulty_check;

    -- Restore the original rule and also permit 'hard'.
    EXECUTE format(
        'ALTER TABLE public.flashcards
         ADD CONSTRAINT flashcards_difficulty_check
         CHECK (
             (%s)
             OR difficulty = ''hard''
         )',
        existing_rule
    );

    RAISE NOTICE
        'Flashcard difficulty constraint updated successfully';

END
$$;

COMMIT;

-- Verify the final constraint.
SELECT
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid = 'public.flashcards'::regclass
  AND conname = 'flashcards_difficulty_check';
