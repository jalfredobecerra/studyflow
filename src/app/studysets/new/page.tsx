import type { Metadata } from "next";

import StudySetForm from "@/app/ui/study-set-form";
import {
  ActionLink,
  BackLink,
  PageContainer,
  PageHeader,
} from "@/app/ui/layout-primitives";
import { requireStudyUser } from "@/lib/study-data";

export const metadata: Metadata = {
  title: "Create Study Set",
  description:
    "Create study sets from notes and generate flashcards for review.",
  robots: { index: false, follow: false },
};

export default async function NewStudySetPage() {
  await requireStudyUser();

  return (
    <PageContainer width="narrow">
      <PageHeader
        title="Create a study set"
        description="Paste your notes and Study Flow will create flashcards for review."
      >
        <BackLink />
      </PageHeader>
      <StudySetForm />
      <div>
        <ActionLink href="/studysets/library">
          View study set library
        </ActionLink>
      </div>
    </PageContainer>
  );
}
