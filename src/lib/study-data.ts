import "server-only";

import postgres from "postgres";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { calculateReviewStreak } from "./review-schedule";

const databaseUrl = process.env.POSTGRES_URL;

if (!databaseUrl) {
  throw new Error("POSTGRES_URL is not configured.");
}

export const studySql = postgres(databaseUrl, {
  max: 5,
});

export interface StudyUser {
  id: string;
  email: string;
  studyGoal: string;
  courseArea: string;
  sessionMinutes: number;
  cadenceDays: number;
}

export async function requireStudyUser(): Promise<StudyUser> {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/login");
  }

  const [row] = await studySql`
    SELECT
      id,
      email,
      COALESCE(study_goal, 'General Study') AS study_goal,
      COALESCE(course_area, 'General') AS course_area,
      COALESCE(
        preferred_session_minutes, 25
      ) AS preferred_session_minutes,
      COALESCE(
        review_cadence_days, 1
      ) AS review_cadence_days
    FROM users
    WHERE LOWER(email) = LOWER(${session.user.email})
    LIMIT 1
  `;

  if (!row) {
    redirect("/login");
  }

  return {
    id: String(row.id),
    email: String(row.email),
    studyGoal: String(row.study_goal),
    courseArea: String(row.course_area),
    sessionMinutes: Number(row.preferred_session_minutes),
    cadenceDays: Number(row.review_cadence_days),
  };
}

export async function getDashboardData(userId: string) {
  const [sets, upcoming, dueCountRows, counts, history] = await Promise.all([
    // Get study sets and their flashcard counts.
    studySql`
        SELECT
          s.id,
          s.title,
          COUNT(f.id) FILTER (
            WHERE f.status <> 'rejected'
          )::int AS card_count,
          COUNT(f.id) FILTER (
            WHERE f.status = 'accepted'
          )::int AS accepted_count
        FROM study_sets AS s
        LEFT JOIN flashcards AS f
          ON f.study_set_id = s.id
        WHERE s.user_id = ${userId}
        GROUP BY s.id, s.title
        ORDER BY s.created_at DESC
      `,

    // Get upcoming reviews.
    // PostgreSQL determines whether each card is due.
    studySql`
        SELECT
          f.id,
          f.front,
          s.title,
          COALESCE(f.due_at, NOW()) AS due_at,
          (
            f.due_at IS NULL
            OR f.due_at <= NOW()
          ) AS is_due
        FROM flashcards AS f
        JOIN study_sets AS s
          ON s.id = f.study_set_id
        WHERE s.user_id = ${userId}
          AND f.status = 'accepted'
        ORDER BY
          COALESCE(f.due_at, NOW()) ASC,
          f.id ASC
        LIMIT 8
      `,

    // Count all flashcards currently due.
    studySql`
        SELECT COUNT(*)::int AS total
        FROM flashcards AS f
        JOIN study_sets AS s
          ON s.id = f.study_set_id
        WHERE s.user_id = ${userId}
          AND f.status = 'accepted'
          AND (
            f.due_at IS NULL
            OR f.due_at <= NOW()
          )
      `,

    // Get progress statistics.
    studySql`
        SELECT
          (
            SELECT COUNT(DISTINCT flashcard_id)::int
            FROM review_attempts
            WHERE user_id = ${userId}
          ) AS reviewed_cards,
          (
            SELECT COUNT(*)::int
            FROM study_sessions
            WHERE user_id = ${userId}
              AND completed_at IS NOT NULL
          ) AS completed_sessions
      `,

    // Get completed study sessions.
    studySql`
        SELECT
          id,
          cards_reviewed,
          target_minutes,
          completed_at
        FROM study_sessions
        WHERE user_id = ${userId}
          AND completed_at IS NOT NULL
        ORDER BY completed_at DESC
        LIMIT 100
      `,
  ]);

  // Calculate streaks using completed study sessions.
  const completedDates = history.map((session) =>
    new Date(session.completed_at).toISOString()
  );

  return {
    // Study set information.
    sets: sets.map((set) => ({
      id: String(set.id),
      title: String(set.title),
      cardCount: Number(set.card_count),
      acceptedCount: Number(set.accepted_count),
    })),

    // Upcoming reviews with database-calculated due status.
    upcoming: upcoming.map((card) => ({
      id: String(card.id),
      front: String(card.front),
      studySetTitle: String(card.title),
      dueAt: new Date(card.due_at).toISOString(),
      isDue: Boolean(card.is_due),
    })),

    // Total number of reviews due.
    dueCount: Number(dueCountRows[0]?.total ?? 0),

    // Number of distinct cards reviewed.
    reviewedCards: Number(counts[0]?.reviewed_cards ?? 0),

    // Number of completed review sessions.
    completedSessions: Number(counts[0]?.completed_sessions ?? 0),

    // Current review streak.
    streak: calculateReviewStreak(completedDates),

    // Recent session history.
    history: history.slice(0, 10).map((session) => ({
      id: String(session.id),
      cardsReviewed: Number(session.cards_reviewed),
      targetMinutes: Number(session.target_minutes),
      completedAt: new Date(session.completed_at).toISOString(),
    })),
  };
}
