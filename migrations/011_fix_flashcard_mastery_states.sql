
-- Study Flow
-- Fix the flashcard mastery state constraint.
--
-- The review workflow uses:
-- learning
-- reviewing
-- mastered
--
-- Preserve the existing database rule and extend it
-- to support the application's mastery states.

DO $$
DECLARE
    existing_rule TEXT;
BEGIN
    -- Retrieve the existing check constraint.
    SELECT pg_get_expr(c.conbin, c.conrelid)
    INTO existing_rule
    FROM pg_constraint AS c
    JOIN pg_class AS t
        ON t.oid = c.conrelid
    JOIN pg_namespace AS n
        ON n.oid = t.relnamespace
    WHERE n.nspname = 'public'
      AND t.relname = 'flashcards'
      AND c.conname = 'flashcards_mastery_state_check'
      AND c.contype = 'c';

    -- Do not silently change a schema we cannot identify.
    IF existing_rule IS NULL THEN
        RAISE EXCEPTION
            'flashcards_mastery_state_check was not found';
    END IF;

    -- Avoid modifying an already updated constraint.
    IF POSITION('reviewing' IN existing_rule) > 0 THEN
        RAISE NOTICE
            'The reviewing mastery state is already supported';
        RETURN;
    END IF;

    -- Remove the old constraint.
    EXECUTE
        'ALTER TABLE public.flashcards
         DROP CONSTRAINT flashcards_mastery_state_check';

    -- Restore the original rule while also permitting
    -- the three states used by Study Flow.
    EXECUTE format(
        'ALTER TABLE public.flashcards
         ADD CONSTRAINT flashcards_mastery_state_check
         CHECK (
             (%s)
             OR mastery_state IN (
                 ''learning'',
                 ''reviewing'',
                 ''mastered''
             )
         )',
        existing_rule
    );

    RAISE NOTICE
        'Flashcard mastery states updated successfully';
END
$$;
