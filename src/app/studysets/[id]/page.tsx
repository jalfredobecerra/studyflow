import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import FlashcardEditor from "@/app/ui/flashcard-editor";
import { auth } from "@/auth";
import sql from "@/lib/db";

type StudySetPageProps = {
  params: Promise<{
    id: string;
  }>;
};

type StudySet = {
  id: string;
  title: string;
  source_notes: string;
  created_at: Date;
};

type Flashcard = {
  id: string;
  front: string;
  back: string;
  status: string;
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default async function StudySetPage({ params }: StudySetPageProps) {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/login");
  }

  const { id } = await params;

  if (!UUID_PATTERN.test(id)) {
    notFound();
  }

  const studySets = await sql<StudySet[]>`
    SELECT
      study_sets.id,
      study_sets.title,
      study_sets.source_notes,
      study_sets.created_at
    FROM study_sets
    INNER JOIN users
      ON users.id = study_sets.user_id
    WHERE study_sets.id = ${id}
      AND users.email = ${session.user.email}
    LIMIT 1
  `;

  const studySet = studySets[0];

  if (!studySet) {
    notFound();
  }

  const cards = await sql<Flashcard[]>`
    SELECT
      id,
      front,
      back,
      status
    FROM flashcards
    WHERE study_set_id = ${studySet.id}
      AND status <> 'rejected'
    ORDER BY created_at ASC
  `;

  const acceptedCount = cards.filter(
    (card) => card.status === "accepted"
  ).length;

  const generatedCount = cards.filter(
    (card) => card.status === "generated"
  ).length;

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-4xl px-6 py-10">
        <Link
          href="/dashboard"
          className="text-sm font-medium text-indigo-600 hover:underline"
        >
          Back to dashboard
        </Link>

        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-3xl font-bold text-slate-900">
            {studySet.title}
          </h1>

          <p className="mt-2 text-slate-600">
            Review each generated card. You can edit, accept, or reject it.
          </p>

          <div className="mt-5 flex flex-wrap gap-3 text-sm">
            <span className="rounded-full bg-indigo-50 px-3 py-1 font-medium text-indigo-700">
              {generatedCount} awaiting review
            </span>

            <span className="rounded-full bg-green-50 px-3 py-1 font-medium text-green-700">
              {acceptedCount} accepted
            </span>
          </div>
        </div>

        <section className="mt-8">
          <h2 className="text-2xl font-bold text-slate-900">Flashcards</h2>

          {cards.length === 0 ? (
            <div className="mt-4 rounded-xl border border-slate-200 bg-white p-6">
              <p className="text-slate-600">
                There are no active flashcards in this study set.
              </p>
            </div>
          ) : (
            <div className="mt-4 space-y-6">
              {cards.map((card) => (
                <FlashcardEditor
                  key={card.id}
                  card={card}
                  studySetId={studySet.id}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
