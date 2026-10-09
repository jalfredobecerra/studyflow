import type { Metadata } from "next";
import Link from "next/link";
import { signOut } from "@/auth";

import { requireStudyUser, getDashboardData } from "@/lib/study-data";

export const metadata: Metadata = {
  title: "Dashboard | Study Flow",
};

export default async function DashboardPage() {
  const user = await requireStudyUser();
  const data = await getDashboardData(user.id);

  return (
    <main className="mx-auto max-w-6xl space-y-8 p-6">
      {/* HEADER */}

      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Study Flow Dashboard</h1>

          <p className="mt-2 text-slate-600">
            Your study plan and learning progress.
          </p>
        </div>

        <form
          action={async () => {
            "use server";

            await signOut({
              redirectTo: "/login",
            });
          }}
        >
          <button type="submit" className="rounded-lg border px-4 py-2">
            Log out
          </button>
        </form>
      </header>

      {/* STUDY PREFERENCES */}

      <section className="rounded-xl border p-6">
        <h2 className="text-xl font-semibold">Your study preferences</h2>

        <p className="mt-2">
          <strong>Study goal:</strong> <span>{user.studyGoal}</span>
        </p>

        <p>
          <strong>Course:</strong> <span>{user.courseArea}</span>
        </p>

        <p>
          <strong>Review cadence:</strong> {user.cadenceDays} days
        </p>

        <p>
          <strong>Session length:</strong> {user.sessionMinutes} minutes
        </p>

        <Link
          href="/preferences"
          className="mt-4 inline-block text-indigo-600 underline"
        >
          Study preferences
        </Link>
      </section>

      {/* NEXT RECOMMENDED STUDY ACTION */}

      <section className="rounded-xl border p-6">
        <h2 className="text-2xl font-semibold">Your next study action</h2>

        {data.dueCount > 0 ? (
          <>
            <p className="mt-3 text-slate-600">
              You have {data.dueCount} flashcards due. Start with the most
              urgent cards.
            </p>

            <Link
              href="/review"
              className="mt-4 inline-block rounded-lg bg-indigo-600 px-5 py-3 text-white"
            >
              Review due cards
            </Link>
          </>
        ) : data.sets.length === 0 ? (
          <>
            <p className="mt-3 text-slate-600">
              Create your first study set to begin learning.
            </p>

            <Link
              href="/studysets/new"
              className="mt-4 inline-block text-indigo-600 underline"
            >
              Create study set
            </Link>
          </>
        ) : (
          <>
            <p className="mt-3 text-slate-600">
              Nothing is due right now. Add or accept flashcards, or return when
              your next review is scheduled.
            </p>

            <Link
              href="/studysets/new"
              className="mt-4 inline-block text-indigo-600 underline"
            >
              Create another study set
            </Link>
          </>
        )}
      </section>

      {/* STUDY PROGRESS */}

      <section>
        <h2 className="mb-4 text-2xl font-semibold">Study progress</h2>

        <div className="grid gap-4 sm:grid-cols-3">
          <article className="rounded-xl border p-5">
            <p className="text-sm text-slate-500">Cards reviewed</p>

            <p className="mt-2 text-3xl font-bold">{data.reviewedCards}</p>
          </article>

          <article className="rounded-xl border p-5">
            <p className="text-sm text-slate-500">Completed sessions</p>

            <p className="mt-2 text-3xl font-bold">{data.completedSessions}</p>
          </article>

          <article className="rounded-xl border p-5">
            <p className="text-sm text-slate-500">Review streak (UTC days)</p>

            <p className="mt-2 text-3xl font-bold">{data.streak}</p>
          </article>
        </div>
      </section>

      {/* UPCOMING REVIEWS */}

      <section className="rounded-xl border p-6">
        <h2 className="text-2xl font-semibold">Upcoming reviews</h2>

        {data.upcoming.length === 0 ? (
          <p className="mt-3 text-slate-600">
            No accepted cards have been scheduled yet.
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            {data.upcoming.map((card) => (
              <article key={card.id} className="rounded-lg border p-4">
                <p className="font-medium">{card.front}</p>

                <p className="mt-1 text-sm text-slate-500">
                  {card.studySetTitle}
                </p>

                <p className="mt-1 text-sm">
                  {card.isDue
                    ? "Due now"
                    : `Due ${new Date(card.dueAt).toLocaleDateString("en-US", {
                        timeZone: "UTC",
                      })}`}
                </p>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* RECENT COMPLETED SESSIONS */}

      <section className="rounded-xl border p-6">
        <h2 className="text-2xl font-semibold">Recent completed sessions</h2>

        {data.history.length === 0 ? (
          <p className="mt-3 text-slate-600">
            You have no completed sessions yet. Complete a review session to
            start tracking your progress.
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            {data.history.map((session) => (
              <article key={session.id} className="rounded-lg border p-4">
                <p className="font-medium">
                  {session.cardsReviewed} cards reviewed
                </p>

                <p className="text-sm text-slate-500">
                  {new Date(session.completedAt).toLocaleDateString("en-US", {
                    timeZone: "UTC",
                  })}
                </p>

                <p className="text-sm text-slate-500">
                  Session target: {session.targetMinutes} minutes
                </p>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* STUDY SETS */}

      <section className="rounded-xl border p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-2xl font-semibold">Your study sets</h2>

          <Link
            href="/studysets/new"
            className="rounded-lg bg-indigo-600 px-4 py-2 text-white"
          >
            Create study set
          </Link>
        </div>

        {data.sets.length === 0 ? (
          <p className="mt-4 text-slate-600">You have no study sets yet.</p>
        ) : (
          <div className="mt-5 space-y-4">
            {data.sets.map((set) => (
              <article key={set.id} className="rounded-lg border p-4">
                <h3 className="text-lg font-semibold">{set.title}</h3>

                <p className="mt-1 text-sm text-slate-600">
                  {set.cardCount} active cards, {set.acceptedCount} accepted
                </p>

                {set.acceptedCount === 0 && (
                  <p className="mt-2 text-sm text-amber-700">
                    Accept generated flashcards to make them available for
                    review.
                  </p>
                )}

                <div className="mt-3 flex flex-wrap gap-4">
                  <Link
                    href={`/studysets/${set.id}`}
                    className="text-indigo-600 underline"
                  >
                    Open study set
                  </Link>

                  <Link
                    href={`/studysets/manage/${set.id}`}
                    className="text-indigo-600 underline"
                  >
                    Manage
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
