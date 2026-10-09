import type { Metadata } from "next";
import Link from "next/link";

import { requireStudyUser } from "@/lib/study-data";
import { deleteStudyAccount } from "@/lib/study-actions";
import StudyPreferencesForm from "@/app/ui/study-preferences-form";

export const metadata: Metadata = {
  title: "Study Preferences | Study Flow",
};

export default async function PreferencesPage() {
  const user = await requireStudyUser();

  return (
    <main className="mx-auto max-w-2xl space-y-8 p-6">
      <Link href="/dashboard" className="text-indigo-600">
        Back to dashboard
      </Link>

      <section className="rounded-xl border p-6">
        <h1 className="text-3xl font-bold">Study preferences</h1>

        <p className="my-4 text-slate-600">
          Customize your study goal, review schedule, and session length.
        </p>

        <StudyPreferencesForm user={user} />
      </section>

      <section className="rounded-xl border border-red-300 p-6">
        <h2 className="text-xl font-semibold text-red-700">Delete account</h2>

        <p className="mt-2 text-slate-600">
          This permanently deletes your account, study sets, flashcards, and
          review history. This action cannot be undone.
        </p>

        <form action={deleteStudyAccount} className="mt-5 space-y-4">
          <label htmlFor="confirmation" className="block font-medium">
            Type DELETE to confirm
          </label>

          <input
            id="confirmation"
            name="confirmation"
            type="text"
            pattern="DELETE"
            title="Type DELETE exactly"
            autoComplete="off"
            required
            className="w-full rounded-lg border p-3"
          />

          <button
            type="submit"
            className="rounded-lg bg-red-700 px-5 py-3 text-white"
          >
            Permanently delete my account
          </button>
        </form>
      </section>
    </main>
  );
}
