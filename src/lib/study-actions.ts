"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { signOut } from "@/auth";

import { requireStudyUser, studySql } from "./study-data";

import {
  calculateNextReview,
  type Difficulty,
  type MasteryState,
  type ReviewRating,
} from "./review-schedule";

export interface StudyActionState {
  error?: string;
  success?: string;
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function validUuid(value: string): boolean {
  return UUID_PATTERN.test(value);
}

function getString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function isDifficulty(value: string): value is Difficulty {
  return ["easy", "medium", "hard"].includes(value);
}

function isMastery(value: string): value is MasteryState {
  return ["learning", "reviewing", "mastered"].includes(value);
}

export async function saveStudyPreferences(
  _previousState: StudyActionState,
  formData: FormData
): Promise<StudyActionState> {
  const user = await requireStudyUser();

  const studyGoal = getString(formData, "studyGoal");
  const courseArea = getString(formData, "courseArea");
  const cadenceDays = Number(getString(formData, "cadenceDays"));
  const sessionMinutes = Number(getString(formData, "sessionMinutes"));

  if (
    studyGoal.length < 2 ||
    studyGoal.length > 120 ||
    courseArea.length < 2 ||
    courseArea.length > 120
  ) {
    return {
      error: "Enter a valid study goal and course area.",
    };
  }

  if (!Number.isInteger(cadenceDays) || cadenceDays < 1 || cadenceDays > 30) {
    return {
      error: "Review cadence must be between 1 and 30 days.",
    };
  }

  if (
    !Number.isInteger(sessionMinutes) ||
    sessionMinutes < 5 ||
    sessionMinutes > 120
  ) {
    return {
      error: "Session length must be between 5 and 120 minutes.",
    };
  }

  await studySql`
    UPDATE users
    SET
      study_goal = ${studyGoal},
      course_area = ${courseArea},
      review_cadence_days = ${cadenceDays},
      preferred_session_minutes = ${sessionMinutes},
      updated_at = NOW()
    WHERE id = ${user.id}
  `;

  revalidatePath("/dashboard");
  revalidatePath("/preferences");
  revalidatePath("/review");

  return { success: "Study preferences saved." };
}

export async function saveFlashcardSettings(
  _previousState: StudyActionState,
  formData: FormData
): Promise<StudyActionState> {
  const user = await requireStudyUser();

  const cardId = getString(formData, "cardId");
  const difficultyValue = getString(formData, "difficulty");
  const masteryValue = getString(formData, "mastery");

  if (
    !validUuid(cardId) ||
    !isDifficulty(difficultyValue) ||
    !isMastery(masteryValue)
  ) {
    return { error: "Invalid flashcard settings." };
  }

  const rating: ReviewRating =
    masteryValue === "mastered"
      ? "mastered"
      : difficultyValue === "hard"
        ? "hard"
        : "remembered";

  const schedule = calculateNextReview({
    cadenceDays: user.cadenceDays,
    difficulty: difficultyValue,
    mastery: masteryValue,
    rating,
  });

  const updated = await studySql`
    UPDATE flashcards AS f
    SET
      difficulty = ${difficultyValue},
      mastery_state = ${masteryValue},
      interval_days = ${schedule.intervalDays},
      due_at = ${schedule.dueAt.toISOString()}
    FROM study_sets AS s
    WHERE f.study_set_id = s.id
      AND s.user_id = ${user.id}
      AND f.id = ${cardId}
      AND f.status <> 'rejected'
    RETURNING f.id, f.study_set_id
  `;

  if (updated.length === 0) {
    return { error: "Flashcard not found or access denied." };
  }

  const studySetId = String(updated[0].study_set_id);

  revalidatePath("/dashboard");
  revalidatePath("/review");
  revalidatePath(`/studysets/manage/${studySetId}`);

  return { success: "Flashcard settings saved." };
}

export async function beginStudySession(): Promise<string> {
  const user = await requireStudyUser();

  const [session] = await studySql`
    INSERT INTO study_sessions (
      user_id,
      target_minutes
    )
    VALUES (
      ${user.id},
      ${user.sessionMinutes}
    )
    RETURNING id
  `;

  return String(session.id);
}

export async function rateReviewCard(
  sessionId: string,
  cardId: string,
  rating: ReviewRating
): Promise<void> {
  const user = await requireStudyUser();

  if (
    !validUuid(sessionId) ||
    !validUuid(cardId) ||
    !["hard", "remembered", "mastered"].includes(rating)
  ) {
    throw new Error("Invalid review request.");
  }

  await studySql.begin(async (tx) => {
    const [session] = await tx`
      SELECT id
      FROM study_sessions
      WHERE id = ${sessionId}
        AND user_id = ${user.id}
        AND completed_at IS NULL
      FOR UPDATE
    `;

    if (!session) {
      throw new Error("Review session is not available.");
    }

    const [card] = await tx`
      SELECT
        f.id,
        COALESCE(f.difficulty, 'medium') AS difficulty,
        COALESCE(f.mastery_state, 'learning') AS mastery_state
      FROM flashcards AS f
      JOIN study_sets AS s
        ON s.id = f.study_set_id
      WHERE f.id = ${cardId}
        AND s.user_id = ${user.id}
        AND f.status = 'accepted'
      FOR UPDATE OF f
    `;

    if (!card) {
      throw new Error("Flashcard not found or access denied.");
    }

    const difficulty: Difficulty =
      rating === "hard"
        ? "hard"
        : rating === "mastered"
          ? "easy"
          : isDifficulty(String(card.difficulty))
            ? (card.difficulty as Difficulty)
            : "medium";

    const mastery: MasteryState =
      rating === "hard"
        ? "learning"
        : rating === "mastered"
          ? "mastered"
          : "reviewing";

    const schedule = calculateNextReview({
      cadenceDays: user.cadenceDays,
      difficulty,
      mastery,
      rating,
    });

    await tx`
      UPDATE flashcards
      SET
        difficulty = ${difficulty},
        mastery_state = ${mastery},
        due_at = ${schedule.dueAt.toISOString()},
        interval_days = ${schedule.intervalDays},
        review_count = review_count + 1,
        last_reviewed_at = NOW()
      WHERE id = ${cardId}
    `;

    await tx`
      INSERT INTO review_attempts (
        user_id,
        session_id,
        flashcard_id,
        rating
      )
      VALUES (
        ${user.id},
        ${sessionId},
        ${cardId},
        ${rating}
      )
    `;

    await tx`
      UPDATE study_sessions
      SET cards_reviewed = cards_reviewed + 1
      WHERE id = ${sessionId}
        AND user_id = ${user.id}
    `;
  });

  // Do not invalidate /review or /dashboard here.
  // Wait until the session finishes to refresh statistics.
}

export async function finishStudySession(sessionId: string): Promise<void> {
  const user = await requireStudyUser();

  if (!validUuid(sessionId)) {
    throw new Error("Invalid session ID.");
  }

  const updated = await studySql`
    UPDATE study_sessions
    SET completed_at = NOW()
    WHERE id = ${sessionId}
      AND user_id = ${user.id}
      AND completed_at IS NULL
      AND cards_reviewed > 0
    RETURNING id
  `;

  if (updated.length === 0) {
    throw new Error("Review at least one card before completing the session.");
  }

  revalidatePath("/dashboard");
}

export async function deleteStudyFlashcard(formData: FormData): Promise<void> {
  const user = await requireStudyUser();

  const cardId = getString(formData, "cardId");
  const confirmation = getString(formData, "confirmation");

  if (!validUuid(cardId) || confirmation !== "yes") {
    throw new Error("Deletion was not confirmed.");
  }

  const owned = await studySql`
    SELECT f.id, f.study_set_id
    FROM flashcards AS f
    JOIN study_sets AS s
      ON s.id = f.study_set_id
    WHERE f.id = ${cardId}
      AND s.user_id = ${user.id}
    LIMIT 1
  `;

  if (owned.length === 0) {
    throw new Error("Flashcard not found.");
  }

  const studySetId = String(owned[0].study_set_id);

  await studySql.begin(async (tx) => {
    await tx`
      DELETE FROM review_attempts
      WHERE flashcard_id = ${cardId}
        AND user_id = ${user.id}
    `;

    await tx`
      DELETE FROM flashcards
      WHERE id = ${cardId}
        AND study_set_id IN (
          SELECT id
          FROM study_sets
          WHERE user_id = ${user.id}
        )
    `;
  });

  revalidatePath("/dashboard");
  revalidatePath("/review");
  revalidatePath(`/studysets/${studySetId}`);
  revalidatePath(`/studysets/manage/${studySetId}`);
}

export async function deleteStudySet(formData: FormData): Promise<void> {
  const user = await requireStudyUser();

  const studySetId = getString(formData, "studySetId");
  const confirmation = getString(formData, "confirmation");

  if (!validUuid(studySetId) || confirmation !== "yes") {
    throw new Error("Deletion was not confirmed.");
  }

  const owned = await studySql`
    SELECT id
    FROM study_sets
    WHERE id = ${studySetId}
      AND user_id = ${user.id}
  `;

  if (owned.length === 0) {
    throw new Error("Study set not found.");
  }

  await studySql.begin(async (tx) => {
    await tx`
      DELETE FROM review_attempts
      WHERE user_id = ${user.id}
        AND (
          flashcard_id IN (
            SELECT id
            FROM flashcards
            WHERE study_set_id = ${studySetId}
          )
          OR session_id IN (
            SELECT id
            FROM study_sessions
            WHERE study_set_id = ${studySetId}
              AND user_id = ${user.id}
          )
        )
    `;

    await tx`
      DELETE FROM study_sessions
      WHERE study_set_id = ${studySetId}
        AND user_id = ${user.id}
    `;

    await tx`
      DELETE FROM flashcards
      WHERE study_set_id = ${studySetId}
    `;

    await tx`
      DELETE FROM study_sets
      WHERE id = ${studySetId}
        AND user_id = ${user.id}
    `;
  });

  revalidatePath("/dashboard");
  revalidatePath("/review");

  redirect("/dashboard");
}

export async function deleteStudyAccount(formData: FormData): Promise<void> {
  const user = await requireStudyUser();

  if (getString(formData, "confirmation") !== "DELETE") {
    throw new Error("Type DELETE to confirm.");
  }

  await studySql.begin(async (tx) => {
    await tx`
      DELETE FROM review_attempts
      WHERE user_id = ${user.id}
    `;

    await tx`
      DELETE FROM study_sessions
      WHERE user_id = ${user.id}
    `;

    await tx`
      DELETE FROM flashcards
      WHERE study_set_id IN (
        SELECT id
        FROM study_sets
        WHERE user_id = ${user.id}
      )
    `;

    await tx`
      DELETE FROM study_sets
      WHERE user_id = ${user.id}
    `;

    await tx`
      DELETE FROM users
      WHERE id = ${user.id}
    `;
  });

  await signOut({
    redirectTo: "/account/deleted",
  });
}
