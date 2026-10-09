import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { auth, signOut } from '@/auth';
import sql from '@/lib/db';

export const metadata: Metadata = {
  title: 'Dashboard',
  description:
    'View your Study Flow study sets, learning goals, and flashcard collections.',
  robots: {
    index: false,
    follow: false,
  },
};

type DashboardUser = {
  id: string;
  email: string;
  study_goal: string | null;
  course_area: string | null;
};

type DashboardStudySet = {
  id: string;
  title: string;
  card_count: number;
};

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect('/login');
  }

  const users = await sql<DashboardUser[]>`
    SELECT id, email, study_goal, course_area
    FROM users
    WHERE email = ${session.user.email}
    LIMIT 1
  `;

  const user = users[0];

  if (!user) {
    redirect('/login');
  }

  if (!user.study_goal || !user.course_area) {
    redirect('/onboarding');
  }

  const studySets = await sql<DashboardStudySet[]>`
    SELECT
      study_sets.id,
      study_sets.title,
      COUNT(flashcards.id)
        FILTER (
          WHERE flashcards.status <> 'rejected'
        )::int AS card_count
    FROM study_sets
    LEFT JOIN flashcards
      ON flashcards.study_set_id = study_sets.id
    WHERE study_sets.user_id = ${user.id}
    GROUP BY
      study_sets.id,
      study_sets.title,
      study_sets.created_at
    ORDER BY study_sets.created_at DESC
  `;

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link
            href="/dashboard"
            className="text-xl font-bold text-indigo-600"
          >
            Study Flow
          </Link>

          <form
            action={async () => {
              'use server';

              await signOut({
                redirectTo: '/login',
              });
            }}
          >
            <button
              type="submit"
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Log out
            </button>
          </form>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Your Study Dashboard
            </h1>

            <p className="mt-2 text-slate-600">
              Welcome, {user.email}
            </p>
          </div>

          <Link
            href="/studysets/new"
            className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-5 py-3 font-medium text-white hover:bg-indigo-700"
          >
            Create study set
          </Link>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Study goal
            </p>

            <p className="mt-2 text-xl font-semibold text-slate-900">
              {user.study_goal}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Course area
            </p>

            <p className="mt-2 text-xl font-semibold text-slate-900">
              {user.course_area}
            </p>
          </div>
        </div>

        <div className="mt-6">
          <Link
            href="/onboarding"
            className="inline-block rounded-lg border border-slate-300 bg-white px-4 py-2 font-medium text-slate-700 hover:bg-slate-100"
          >
            Edit study preferences
          </Link>
        </div>

        <section className="mt-10">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-2xl font-bold text-slate-900">
              Your study sets
            </h2>

            <p className="text-sm text-slate-500">
              {studySets.length} total
            </p>
          </div>

          {studySets.length === 0 ? (
            <div className="mt-4 rounded-xl border border-slate-200 bg-white p-8 text-center">
              <h3 className="text-lg font-semibold text-slate-900">
                No study sets yet
              </h3>

              <p className="mt-2 text-slate-600">
                Create your first study set by adding your
                class notes.
              </p>

              <Link
                href="/studysets/new"
                className="mt-5 inline-block rounded-lg bg-indigo-600 px-5 py-3 font-medium text-white hover:bg-indigo-700"
              >
                Create your first study set
              </Link>
            </div>
          ) : (
            <div className="mt-4 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {studySets.map((studySet) => (
                <Link
                  key={studySet.id}
                  href={`/studysets/${studySet.id}`}
                  className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-indigo-300 hover:shadow-md"
                >
                  <h3 className="text-lg font-semibold text-slate-900">
                    {studySet.title}
                  </h3>

                  <p className="mt-2 text-sm text-slate-500">
                    {studySet.card_count}{' '}
                    {studySet.card_count === 1
                      ? 'flashcard'
                      : 'flashcards'}
                  </p>

                  <p className="mt-4 text-sm font-medium text-indigo-600">
                    Review study set
                  </p>
                </Link>
              ))}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}