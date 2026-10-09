"use client";

import { useActionState } from "react";

import {
  saveOnboarding,
  skipOnboarding,
  type OnboardingState,
} from "@/lib/actions";

type OnboardingFormProps = {
  studyGoal?: string;
  courseArea?: string;
};

const initialState: OnboardingState = {};

export default function OnboardingForm({
  studyGoal = "",
  courseArea = "",
}: OnboardingFormProps) {
  const [state, formAction, isPending] = useActionState(
    saveOnboarding,
    initialState
  );

  return (
    <form
      action={formAction}
      className="space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <div>
        <label
          htmlFor="studyGoal"
          className="mb-2 block text-sm font-medium text-slate-900"
        >
          What is your main study goal?
        </label>

        <select
          id="studyGoal"
          name="studyGoal"
          defaultValue={studyGoal}
          required
          aria-invalid={Boolean(state.errors?.studyGoal)}
          aria-describedby={
            state.errors?.studyGoal ? "study-goal-error" : undefined
          }
          className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500"
        >
          <option value="" disabled>
            Select a goal
          </option>

          <option value="Exam Preparation">Exam preparation</option>

          <option value="Weekly Review">Weekly review</option>

          <option value="Class Notes">Review class notes</option>

          <option value="Vocabulary">Learn vocabulary</option>

          <option value="Programming">Study programming</option>

          <option value="General Study">General study</option>
        </select>

        {state.errors?.studyGoal && (
          <div id="study-goal-error" className="mt-1 text-sm text-red-600">
            {state.errors.studyGoal.map((error) => (
              <p key={error}>{error}</p>
            ))}
          </div>
        )}
      </div>

      <div>
        <label
          htmlFor="courseArea"
          className="mb-2 block text-sm font-medium text-slate-900"
        >
          Course or subject
        </label>

        <input
          id="courseArea"
          name="courseArea"
          type="text"
          defaultValue={courseArea}
          required
          maxLength={150}
          aria-invalid={Boolean(state.errors?.courseArea)}
          aria-describedby={
            state.errors?.courseArea ? "course-area-error" : undefined
          }
          className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500"
          placeholder="For example, Software Engineering"
        />

        {state.errors?.courseArea && (
          <div id="course-area-error" className="mt-1 text-sm text-red-600">
            {state.errors.courseArea.map((error) => (
              <p key={error}>{error}</p>
            ))}
          </div>
        )}
      </div>

      {state.message && (
        <p className="text-sm text-red-600" aria-live="polite">
          {state.message}
        </p>
      )}

      <div className="space-y-3">
        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? "Saving..." : "Continue to dashboard"}
        </button>

        <button
          type="submit"
          formAction={skipOnboarding}
          formNoValidate
          disabled={isPending}
          className="w-full rounded-lg border border-slate-300 px-4 py-2 font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          Skip for now
        </button>
      </div>
    </form>
  );
}
