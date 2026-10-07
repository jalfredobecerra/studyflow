import Link from "next/link";
import { redirect } from "next/navigation";

import StudySetForm from "@/app/ui/study-set-form";
import { auth } from "@/auth";

export default async function NewStudySetPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/dashboard"
          className="text-sm font-medium text-indigo-600 hover:underline"
        >
          Back to dashboard
        </Link>

        <div className="mb-6 mt-6">
          <h1 className="text-3xl font-bold text-slate-900">
            Create a study set
          </h1>

          <p className="mt-2 text-slate-600">
            Paste your notes and Study Flow will create flashcards for review.
          </p>
        </div>

        <StudySetForm />
      </div>
    </main>
  );
}
