import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import OnboardingForm from '@/app/ui/onboarding-form';
import { auth } from '@/auth';
import sql from '@/lib/db';

export const metadata: Metadata = {
  title: 'Study Preferences',
  description:
    'Choose your study goal and course area to personalize your learning workflow.',
  robots: {
    index: false,
    follow: false,
  },
};

type UserPreferences = {
  study_goal: string | null;
  course_area: string | null;
};

export default async function OnboardingPage() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect('/login');
  }

  const users = await sql<UserPreferences[]>`
    SELECT study_goal, course_area
    FROM users
    WHERE email = ${session.user.email}
    LIMIT 1
  `;

  const preferences = users[0];

  if (!preferences) {
    redirect('/login');
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-lg">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold text-slate-900">
            Set up your study plan
          </h1>

          <p className="mt-2 text-slate-600">
            Choose your study goal and course area.
          </p>
        </div>

        <OnboardingForm
          studyGoal={preferences.study_goal ?? ''}
          courseArea={preferences.course_area ?? ''}
        />
      </div>
    </main>
  );
}
