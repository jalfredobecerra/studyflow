import type { Metadata } from "next";

import {
  ActionLink,
  BackLink,
  PageContainer,
  PageHeader,
  SurfacePanel,
} from "@/app/ui/layout-primitives";
import StudySetApiLibrary from "@/app/ui/study-set-api-library";
import { requireStudyUser } from "@/lib/study-data";

export const metadata: Metadata = {
  title: "Study Set Library",
  description: "Browse and rename study sets saved in your personal library.",
  robots: { index: false, follow: false },
};

export default async function StudySetLibraryPage() {
  await requireStudyUser();

  return (
    <PageContainer>
      <PageHeader
        title="Study set library"
        description="These study sets are loaded securely from PostgreSQL through a Next.js API route. Rename any set and your updates will persist."
      >
        <BackLink />
      </PageHeader>
      <div>
        <ActionLink href="/studysets/new">Create study set</ActionLink>
      </div>
      <SurfacePanel>
        <StudySetApiLibrary />
      </SurfacePanel>
    </PageContainer>
  );
}
