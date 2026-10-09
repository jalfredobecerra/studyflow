import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { requireStudyUser, studySql } from "@/lib/study-data";

import { deleteStudyFlashcard, deleteStudySet } from "@/lib/study-actions";

import FlashcardSettingsForm from "@/app/ui/flashcard-settings-form";

import type { Difficulty, MasteryState } from "@/lib/review-schedule";

export const metadata: Metadata = {
  title: "Manage Study Set | Study Flow",
};

interface PageProps {
  params: Promise<{ id: string }>;
}

function getDifficulty(value: unknown): Difficulty {
  if (value === "easy" || value === "medium" || value === "hard") {
    return value;
  }

  return "medium";
}

function getMastery(value: unknown): MasteryState {
  if (value === "learning" || value === "reviewing" || value === "mastered") {
    return value;
  }

  return "learning";
}

export default async function ManageStudySetPage({ params }: PageProps) {
  const user = await requireStudyUser();
  const { id } = await params;

  const UUID_PATTERN =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  if (!UUID_PATTERN.test(id)) {
    notFound();
  }

  const [studySet] = await studySql`
    SELECT id, title
    FROM study_sets
    WHERE id = ${id}
      AND user_id = ${user.id}
  `;

  if (!studySet) {
    notFound();
  }

  const cards = await studySql`
    SELECT
      id,
      front,
      back,
      status,
      difficulty,
      mastery_state,
      due_at
    FROM flashcards
    WHERE study_set_id = ${id}
      AND status <> 'rejected'
    ORDER BY id ASC
  `;

  return (
    <main className="mx-auto max-w-4xl space-y-8 p-6">
      <header>
        <Link href="/dashboard" className="text-indigo-600">
          Back to dashboard
        </Link>

        <h1 className="mt-4 text-3xl font-bold">
          Manage {String(studySet.title)}
        </h1>

        <p className="mt-2 text-slate-600">
          Change card scheduling, delete cards, or open the existing flashcard
          editor.
        </p>

        <Link
          href={`/studysets/${id}`}
          className="mt-4 inline-block text-indigo-600 underline"
        >
          Edit flashcard questions and answers
        </Link>
      </header>

      <section className="space-y-5">
        <h2 className="text-2xl font-semibold">Flashcards</h2>

        {cards.length === 0 && <p>No active flashcards are available.</p>}

        {cards.map((card) => (
          <article
            key={String(card.id)}
            className="space-y-4 rounded-xl border p-5"
          >
            <div>
              <p className="mb-2 text-xs uppercase text-slate-500">
                {String(card.status)}
              </p>

              <h3 className="font-semibold">{String(card.front)}</h3>

              <p className="mt-2 whitespace-pre-wrap text-slate-600">
                {String(card.back)}
              </p>
            </div>

            <FlashcardSettingsForm
              cardId={String(card.id)}
              difficulty={getDifficulty(card.difficulty)}
              mastery={getMastery(card.mastery_state)}
            />

            <form
              action={deleteStudyFlashcard}
              className="rounded-lg border border-red-200 p-3"
            >
              <input type="hidden" name="cardId" value={String(card.id)} />

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="confirmation"
                  value="yes"
                  required
                />
                Confirm deletion of this flashcard
              </label>

              <button
                type="submit"
                className="mt-3 rounded-lg bg-red-700 px-4 py-2 text-white"
              >
                Delete flashcard
              </button>
            </form>
          </article>
        ))}
      </section>

      <section className="rounded-xl border border-red-300 p-6">
        <h2 className="text-xl font-semibold text-red-700">Delete study set</h2>

        <p className="mt-2 text-slate-600">
          All flashcards in this study set will be removed. This cannot be
          undone.
        </p>

        <form action={deleteStudySet} className="mt-4">
          <input type="hidden" name="studySetId" value={id} />

          <label className="flex items-center gap-2">
            <input type="checkbox" name="confirmation" value="yes" required />
            Confirm deletion of this study set
          </label>

          <button
            type="submit"
            className="mt-4 rounded-lg bg-red-700 px-5 py-3 text-white"
          >
            Delete study set
          </button>
        </form>
      </section>
    </main>
  );
}
