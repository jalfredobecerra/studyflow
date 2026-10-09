import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Study Flow',
  description:
    'Create study sets from class notes, generate flashcards, and organize your learning with Study Flow.',
};

export default function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
      <section className="max-w-2xl text-center">
        <p className="mb-3 font-medium text-indigo-600">
          Study Flow
        </p>

        <h1 className="text-5xl font-bold tracking-tight text-slate-900">
          Turn your notes into a better study workflow.
        </h1>

        <p className="mx-auto mt-6 max-w-xl text-lg text-slate-600">
          Create study sets, generate flashcards, review your
          material, and keep track of your progress.
        </p>

        <div className="mt-8 flex justify-center gap-4">
          <Link
            href="/signup"
            className="rounded-lg bg-indigo-600 px-5 py-3 font-medium text-white hover:bg-indigo-700"
          >
            Get started
          </Link>

          <Link
            href="/login"
            className="rounded-lg border border-slate-300 bg-white px-5 py-3 font-medium text-slate-700 hover:bg-slate-100"
          >
            Log in
          </Link>
        </div>
      </section>
    </main>
  );
}