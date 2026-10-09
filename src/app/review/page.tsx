import type { Metadata } from "next";
import Link from "next/link";

import { requireStudyUser, studySql } from "@/lib/study-data";

import ReviewSession from "@/app/ui/review-session";

export const metadata: Metadata = {
  title: "Review Flashcards | Study Flow",
};

export default async function ReviewPage() {
  const user = await requireStudyUser();

  const rows = await studySql`
    SELECT
      f.id,
      f.front,
      f.back,
      s.title AS study_set_title
    FROM flashcards AS f
    JOIN study_sets AS s
      ON s.id = f.study_set_id
    WHERE s.user_id = ${user.id}
      AND f.status = 'accepted'
      AND (
        f.due_at IS NULL
        OR f.due_at <= NOW()
      )
    ORDER BY
      COALESCE(f.due_at, NOW()) ASC,
      f.id ASC
    LIMIT 50
  `;

  const cards = rows.map((row) => ({
    id: String(row.id),
    front: String(row.front),
    back: String(row.back),
    studySetTitle: String(row.study_set_title),
  }));

  return (
    <main className="mx-auto max-w-3xl space-y-8 p-6">
      <header>
        <Link href="/dashboard" className="text-sm text-indigo-600">
          Back to dashboard
        </Link>

        <h1 className="mt-4 text-3xl font-bold">Review flashcards</h1>

        <p className="mt-2 text-slate-600">
          Review your due cards and track your progress.
        </p>
      </header>

      <ReviewSession cards={cards} sessionMinutes={user.sessionMinutes} />
    </main>
  );
}
