import type { Metadata } from "next";

import ReviewSession from "@/app/ui/review-session";
import {
  ActionLink,
  BackLink,
  PageContainer,
  PageHeader,
  SurfacePanel,
} from "@/app/ui/layout-primitives";
import { requireStudyUser, studySql } from "@/lib/study-data";

export const metadata: Metadata = {
  title: "Review Flashcards",
  robots: { index: false, follow: false },
};

export default async function ReviewPage() {
  const user = await requireStudyUser();

  const rows = await studySql`
    SELECT f.id, f.front, f.back, s.title AS study_set_title
    FROM flashcards AS f
    JOIN study_sets AS s ON s.id = f.study_set_id
    WHERE s.user_id = ${user.id}
      AND f.status = 'accepted'
      AND (f.due_at IS NULL OR f.due_at <= NOW())
    ORDER BY COALESCE(f.due_at, NOW()) ASC, f.id ASC
    LIMIT 50
  `;

  const cards = rows.map((row) => ({
    id: String(row.id),
    front: String(row.front),
    back: String(row.back),
    studySetTitle: String(row.study_set_title),
  }));

  return (
    <PageContainer width="narrow">
      <PageHeader
        title="Review flashcards"
        description="Review due cards and track your progress."
      >
        <BackLink />
      </PageHeader>
      <ReviewSession cards={cards} sessionMinutes={user.sessionMinutes} />
      <SurfacePanel>
        <p className="mb-3 text-sm text-slate-700">
          Want to organize your study materials?
        </p>
        <ActionLink href="/studysets/library">Study set library</ActionLink>
      </SurfacePanel>
    </PageContainer>
  );
}
