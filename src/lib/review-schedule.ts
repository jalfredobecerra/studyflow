export type Difficulty = "easy" | "medium" | "hard";

export type MasteryState = "learning" | "reviewing" | "mastered";

export type ReviewRating = "hard" | "remembered" | "mastered";

export interface ReviewScheduleInput {
  cadenceDays: number;
  difficulty: Difficulty;
  mastery: MasteryState;
  rating: ReviewRating;
}

export interface ReviewScheduleResult {
  intervalDays: number;
  dueAt: Date;
}

const DAY_MS = 24 * 60 * 60 * 1000;

export function calculateNextReview(
  input: ReviewScheduleInput,
  now = new Date()
): ReviewScheduleResult {
  const cadence = Math.max(1, Math.min(30, Math.round(input.cadenceDays)));

  const ratingFactor = {
    hard: 0.5,
    remembered: 1,
    mastered: 2,
  }[input.rating];

  const difficultyFactor = {
    hard: 0.5,
    medium: 1,
    easy: 1.5,
  }[input.difficulty];

  const masteryFactor = {
    learning: 1,
    reviewing: 1.5,
    mastered: 3,
  }[input.mastery];

  const intervalDays = Math.max(
    1,
    Math.round(cadence * ratingFactor * difficultyFactor * masteryFactor)
  );

  return {
    intervalDays,
    dueAt: new Date(now.getTime() + intervalDays * DAY_MS),
  };
}

export function calculateReviewStreak(
  completedDates: string[],
  today = new Date()
): number {
  const days = new Set(completedDates.map((date) => date.slice(0, 10)));

  const cursor = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())
  );

  const dateKey = () => cursor.toISOString().slice(0, 10);

  // A streak remains active until the end of the next UTC day.
  if (!days.has(dateKey())) {
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }

  let streak = 0;

  while (days.has(dateKey())) {
    streak += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }

  return streak;
}
