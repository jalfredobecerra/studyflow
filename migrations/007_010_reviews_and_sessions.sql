
-- Study Flow: Issues 7 through 10
-- Back up the database before running.

ALTER TABLE flashcards
  ADD COLUMN IF NOT EXISTS due_at TIMESTAMPTZ;

ALTER TABLE flashcards
  ADD COLUMN IF NOT EXISTS interval_days INTEGER
  NOT NULL DEFAULT 1;

ALTER TABLE flashcards
  ADD COLUMN IF NOT EXISTS review_count INTEGER
  NOT NULL DEFAULT 0;

ALTER TABLE flashcards
  ADD COLUMN IF NOT EXISTS last_reviewed_at TIMESTAMPTZ;

-- Existing accepted flashcards become eligible for review.
UPDATE flashcards
SET due_at = NOW()
WHERE status = 'accepted'
  AND due_at IS NULL;

CREATE TABLE IF NOT EXISTS study_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  user_id UUID NOT NULL
    REFERENCES users(id),

  study_set_id UUID
    REFERENCES study_sets(id),

  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,

  target_minutes INTEGER NOT NULL DEFAULT 25,
  cards_reviewed INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS review_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  user_id UUID NOT NULL
    REFERENCES users(id),

  session_id UUID NOT NULL
    REFERENCES study_sessions(id)
    ON DELETE CASCADE,

  flashcard_id UUID NOT NULL
    REFERENCES flashcards(id)
    ON DELETE CASCADE,

  rating TEXT NOT NULL
    CHECK (rating IN ('hard', 'remembered', 'mastered')),

  reviewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_flashcards_due
  ON flashcards(status, due_at);

CREATE INDEX IF NOT EXISTS idx_flashcards_study_set
  ON flashcards(study_set_id);

CREATE INDEX IF NOT EXISTS idx_study_sessions_user_completed
  ON study_sessions(user_id, completed_at DESC);

CREATE INDEX IF NOT EXISTS idx_review_attempts_user
  ON review_attempts(user_id, reviewed_at DESC);
