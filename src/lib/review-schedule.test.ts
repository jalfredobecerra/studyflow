import { describe, expect, it } from "vitest";

import { calculateNextReview, calculateReviewStreak } from "./review-schedule";

describe("calculateNextReview", () => {
  const now = new Date("2026-10-08T12:00:00.000Z");

  it("schedules a remembered card using the saved cadence", () => {
    const result = calculateNextReview(
      {
        cadenceDays: 2,
        difficulty: "medium",
        mastery: "learning",
        rating: "remembered",
      },
      now
    );

    expect(result.intervalDays).toBe(2);

    expect(result.dueAt.toISOString()).toBe("2026-10-10T12:00:00.000Z");
  });

  it("schedules difficult cards sooner", () => {
    const difficult = calculateNextReview(
      {
        cadenceDays: 4,
        difficulty: "hard",
        mastery: "learning",
        rating: "hard",
      },
      now
    );

    const normal = calculateNextReview(
      {
        cadenceDays: 4,
        difficulty: "medium",
        mastery: "reviewing",
        rating: "remembered",
      },
      now
    );

    expect(difficult.intervalDays).toBeLessThan(normal.intervalDays);
  });

  it("schedules mastered cards less frequently", () => {
    const mastered = calculateNextReview(
      {
        cadenceDays: 2,
        difficulty: "easy",
        mastery: "mastered",
        rating: "mastered",
      },
      now
    );

    const learning = calculateNextReview(
      {
        cadenceDays: 2,
        difficulty: "medium",
        mastery: "learning",
        rating: "remembered",
      },
      now
    );

    expect(mastered.intervalDays).toBeGreaterThan(learning.intervalDays);
  });

  it("does not schedule reviews less than one day away", () => {
    const result = calculateNextReview(
      {
        cadenceDays: 1,
        difficulty: "hard",
        mastery: "learning",
        rating: "hard",
      },
      now
    );

    expect(result.intervalDays).toBeGreaterThanOrEqual(1);
  });
});

describe("calculateReviewStreak", () => {
  const today = new Date("2026-10-08T12:00:00.000Z");

  it("returns zero when no sessions exist", () => {
    expect(calculateReviewStreak([], today)).toBe(0);
  });

  it("counts consecutive days", () => {
    expect(
      calculateReviewStreak(["2026-10-08", "2026-10-07", "2026-10-06"], today)
    ).toBe(3);
  });

  it("allows a streak from yesterday", () => {
    expect(calculateReviewStreak(["2026-10-07", "2026-10-06"], today)).toBe(2);
  });

  it("does not count a broken streak", () => {
    expect(calculateReviewStreak(["2026-10-05", "2026-10-04"], today)).toBe(0);
  });

  it("does not count duplicate days twice", () => {
    expect(
      calculateReviewStreak(["2026-10-08", "2026-10-08", "2026-10-07"], today)
    ).toBe(2);
  });
});
