import type { Metadata } from "next";

import StudyPreferencesForm from "@/app/ui/study-preferences-form";
import {
  ActionLink,
  BackLink,
  PageContainer,
  PageHeader,
  SurfacePanel,
} from "@/app/ui/layout-primitives";
import { deleteStudyAccount } from "@/lib/study-actions";
import { requireStudyUser } from "@/lib/study-data";

export const metadata: Metadata = {
  title: "Study Preferences",
  robots: { index: false, follow: false },
};

export default async function PreferencesPage() {
  const user = await requireStudyUser();

  return (
    <PageContainer width="narrow">
      <PageHeader
        title="Study preferences"
        description="Customize your study goal, review schedule, and session length."
      >
        <BackLink />
      </PageHeader>

      <SurfacePanel>
        <StudyPreferencesForm user={user} />
      </SurfacePanel>

      <div>
        <ActionLink href="/studysets/library">Browse study sets</ActionLink>
      </div>

      <SurfacePanel className="border-red-300">
        <h2 className="text-xl font-semibold text-red-800">Delete account</h2>
        <p className="mt-2 text-slate-700">
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
            className="w-full rounded-lg border border-slate-400 p-3"
          />
          <button
            type="submit"
            className="rounded-lg bg-red-800 px-5 py-3 font-medium text-white hover:bg-red-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-800"
          >
            Permanently delete my account
          </button>
        </form>
      </SurfacePanel>
    </PageContainer>
  );
}
