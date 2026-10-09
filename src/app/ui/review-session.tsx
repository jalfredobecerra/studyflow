"use client";

import { useEffect, useState, useTransition } from "react";

import { useRouter } from "next/navigation";

import {
  beginStudySession,
  finishStudySession,
  rateReviewCard,
} from "@/lib/study-actions";

import type { ReviewRating } from "@/lib/review-schedule";

export interface ReviewCard {
  id: string;
  front: string;
  back: string;
  studySetTitle: string;
}

interface ReviewSessionProps {
  cards: ReviewCard[];
  sessionMinutes: number;
}

export default function ReviewSession({
  cards,
  sessionMinutes,
}: ReviewSessionProps) {
  const router = useRouter();

  const [sessionId, setSessionId] = useState<string | null>(null);

  // Keep the initial review queue stable throughout the session.
  // Cards may no longer be "due" after they are reviewed,
  // but they must not disappear from the current session.
  const [sessionCards, setSessionCards] = useState<ReviewCard[] | null>(null);

  const [index, setIndex] = useState(0);

  const [showAnswer, setShowAnswer] = useState(false);

  const [remainingSeconds, setRemainingSeconds] = useState(sessionMinutes * 60);

  const [error, setError] = useState("");

  const [isPending, startTransition] = useTransition();

  const activeCards = sessionCards ?? cards;

  const reviewedCount = index;

  const finishedAllCards = sessionId !== null && index >= activeCards.length;

  const timeExpired = sessionId !== null && remainingSeconds === 0;

  const sessionFinished = finishedAllCards || timeExpired;

  // Countdown timer.
  useEffect(() => {
    if (!sessionId || sessionFinished || remainingSeconds <= 0) {
      return;
    }

    const timer = window.setInterval(() => {
      setRemainingSeconds((current) => Math.max(0, current - 1));
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [sessionId, sessionFinished, remainingSeconds]);

  const minutes = Math.floor(remainingSeconds / 60);

  const seconds = remainingSeconds % 60;

  const formattedTime = `${String(minutes).padStart(
    2,
    "0"
  )}:${String(seconds).padStart(2, "0")}`;

  function startSession() {
    if (isPending || sessionId) {
      return;
    }

    setError("");

    startTransition(async () => {
      try {
        const id = await beginStudySession();

        // Save a stable queue only after the session is created.
        setSessionCards([...cards]);

        setSessionId(id);
        setIndex(0);
        setShowAnswer(false);
        setRemainingSeconds(sessionMinutes * 60);
      } catch (error) {
        console.error("Unable to start review session:", error);

        setError("Unable to start the study session. Please try again.");
      }
    });
  }

  function rateCard(rating: ReviewRating) {
    if (!sessionId || isPending || index >= activeCards.length) {
      return;
    }

    const currentCard = activeCards[index];

    setError("");

    startTransition(async () => {
      try {
        // Wait for the database operation to finish
        // before moving to another card.
        await rateReviewCard(sessionId, currentCard.id, rating);

        setIndex((current) => current + 1);
        setShowAnswer(false);
      } catch (error) {
        console.error("Unable to save review:", error);

        setError("Unable to save this review. Please try again.");
      }
    });
  }

  function finishSession() {
    if (!sessionId || isPending || reviewedCount === 0) {
      return;
    }

    setError("");

    startTransition(async () => {
      try {
        await finishStudySession(sessionId);

        // Dashboard data is refreshed after the session finishes.
        router.push("/dashboard");
        router.refresh();
      } catch (error) {
        console.error("Unable to finish session:", error);

        setError("Unable to finish the session. Please try again.");
      }
    });
  }

  // Empty state is only shown before starting a session.
  // Do not replace an active review with this state.
  if (!sessionId && cards.length === 0) {
    return (
      <section className="rounded-xl border bg-white p-6">
        <h2 className="text-xl font-semibold">You are all caught up!</h2>

        <p className="mt-2 text-slate-600">
          You have no flashcards due for review right now.
        </p>
      </section>
    );
  }

  // Session introduction.
  if (!sessionId) {
    return (
      <section className="rounded-xl border bg-white p-6">
        <h2 className="text-xl font-semibold">Ready to study?</h2>

        <p className="mt-2 text-slate-600">
          {cards.length} cards are ready for review.
        </p>

        <p className="mt-2 text-slate-600">
          Your session length is {sessionMinutes} minutes.
        </p>

        {error && (
          <p role="alert" className="mt-3 text-red-600">
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={startSession}
          disabled={isPending}
          className="mt-5 rounded-lg bg-indigo-600 px-5 py-3 text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? "Starting..." : "Start study session"}
        </button>
      </section>
    );
  }

  // Session completion screen.
  if (sessionFinished) {
    return (
      <section className="rounded-xl border bg-white p-6">
        <h2 className="text-xl font-semibold">
          {finishedAllCards ? "Review complete" : "Session time complete"}
        </h2>

        <p className="mt-2 text-slate-600">
          You reviewed {reviewedCount} of {activeCards.length} cards.
        </p>

        {isPending && (
          <p role="status" className="mt-3 text-sm text-slate-600">
            Saving your review progress...
          </p>
        )}

        {error && (
          <p role="alert" className="mt-3 text-red-600">
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={finishSession}
          disabled={isPending || reviewedCount === 0}
          className="mt-5 rounded-lg bg-indigo-600 px-5 py-3 text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? "Saving..." : "Finish session"}
        </button>

        {reviewedCount === 0 && (
          <p className="mt-3 text-sm text-slate-500">
            Review at least one card to record a completed session.
          </p>
        )}
      </section>
    );
  }

  const currentCard = activeCards[index];

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-medium">
          Card {index + 1} of {activeCards.length}
        </p>

        <p
          role="timer"
          aria-label="Time remaining"
          className="font-mono text-lg font-semibold"
        >
          {formattedTime}
        </p>
      </div>

      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <p className="mb-3 text-sm text-slate-500">
          {currentCard.studySetTitle}
        </p>

        <h2 className="text-xl font-semibold">{currentCard.front}</h2>

        {showAnswer ? (
          <div className="mt-6 border-t pt-5">
            <p className="mb-2 text-sm font-medium text-slate-500">Answer</p>

            <p className="whitespace-pre-wrap">{currentCard.back}</p>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowAnswer(true)}
            className="mt-6 rounded-lg border px-4 py-2"
          >
            Show answer
          </button>
        )}
      </div>

      {showAnswer && (
        <div className="grid gap-3 sm:grid-cols-3">
          <button
            type="button"
            onClick={() => rateCard("hard")}
            disabled={isPending}
            className="rounded-lg border border-orange-300 p-3 disabled:opacity-50"
          >
            Difficult
          </button>

          <button
            type="button"
            onClick={() => rateCard("remembered")}
            disabled={isPending}
            className="rounded-lg border border-indigo-300 p-3 disabled:opacity-50"
          >
            Remembered
          </button>

          <button
            type="button"
            onClick={() => rateCard("mastered")}
            disabled={isPending}
            className="rounded-lg border border-green-300 p-3 disabled:opacity-50"
          >
            Mastered
          </button>
        </div>
      )}

      {isPending && (
        <p role="status" className="text-sm text-slate-600">
          Saving your review...
        </p>
      )}

      {error && (
        <p role="alert" className="text-red-600">
          {error}
        </p>
      )}

      {reviewedCount > 0 && (
        <button
          type="button"
          onClick={finishSession}
          disabled={isPending}
          className="rounded-lg border px-4 py-2 disabled:opacity-50"
        >
          Finish session early
        </button>
      )}
    </section>
  );
}
