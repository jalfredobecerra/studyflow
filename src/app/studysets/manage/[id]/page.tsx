import type { Metadata } from "next";
import { notFound } from "next/navigation";

import FlashcardSettingsForm from "@/app/ui/flashcard-settings-form";
import {
  ActionLink,
  BackLink,
  PageContainer,
  PageHeader,
  SurfacePanel,
} from "@/app/ui/layout-primitives";
import { deleteStudyFlashcard, deleteStudySet } from "@/lib/study-actions";
import { requireStudyUser, studySql } from "@/lib/study-data";
import type { Difficulty, MasteryState } from "@/lib/review-schedule";

export const metadata: Metadata = {
  title: "Manage Study Set",
  robots: { index: false, follow: false },
};

interface PageProps {
  params: Promise<{ id: string }>;
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function getDifficulty(value: unknown): Difficulty {
  return value === "easy" || value === "medium" || value === "hard"
    ? value
    : "medium";
}

function getMastery(value: unknown): MasteryState {
  return value === "learning" || value === "reviewing" || value === "mastered"
    ? value
    : "learning";
}

export default async function ManageStudySetPage({ params }: PageProps) {
  const user = await requireStudyUser();
  const { id } = await params;

  if (!UUID_PATTERN.test(id)) notFound();

  const [studySet] = await studySql`
    SELECT id, title FROM study_sets
    WHERE id = ${id} AND user_id = ${user.id}
  `;

  if (!studySet) notFound();

  const cards = await studySql`
    SELECT id, front, back, status, difficulty, mastery_state, due_at
    FROM flashcards
    WHERE study_set_id = ${id} AND status <> 'rejected'
    ORDER BY id ASC
  `;

  return (
    <PageContainer>
      <PageHeader
        title={`Manage ${String(studySet.title)}`}
        description="Change card scheduling, delete cards, or edit the study set's name in the library."
      >
        <BackLink />
      </PageHeader>

      <div className="flex flex-wrap gap-3">
        <ActionLink href={`/studysets/${id}`}>
          Edit flashcard questions and answers
        </ActionLink>
        <ActionLink href="/studysets/library">Rename study set</ActionLink>
      </div>

      <section className="space-y-5">
        <h2 className="text-2xl font-semibold">Flashcards</h2>
        {cards.length === 0 && <p>No active flashcards are available.</p>}
        {cards.map((card) => (
          <SurfacePanel key={String(card.id)} className="space-y-4">
            <div>
              <p className="mb-2 text-xs uppercase text-slate-600">
                {String(card.status)}
              </p>
              <h3 className="font-semibold">{String(card.front)}</h3>
              <p className="mt-2 whitespace-pre-wrap text-slate-700">
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
                className="mt-3 rounded-lg bg-red-800 px-4 py-2 text-white"
              >
                Delete flashcard
              </button>
            </form>
          </SurfacePanel>
        ))}
      </section>

      <SurfacePanel className="border-red-300">
        <h2 className="text-xl font-semibold text-red-800">Delete study set</h2>
        <p className="mt-2 text-slate-700">
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
            className="mt-4 rounded-lg bg-red-800 px-5 py-3 text-white"
          >
            Delete study set
          </button>
        </form>
      </SurfacePanel>
    </PageContainer>
  );
}
