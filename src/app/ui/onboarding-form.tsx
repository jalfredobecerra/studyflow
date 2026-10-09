"use client";

import { useActionState } from "react";

import { saveOnboarding, type OnboardingState } from "@/lib/actions";

const initialState: OnboardingState = {};

export default function OnboardingForm() {
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
          defaultValue=""
          required
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
        </select>

        {state.errors?.studyGoal?.map((error) => (
          <p key={error} className="mt-1 text-sm text-red-600">
            {error}
          </p>
        ))}
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
          required
          maxLength={150}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500"
          placeholder="For example, Software Engineering"
        />

        {state.errors?.courseArea?.map((error) => (
          <p key={error} className="mt-1 text-sm text-red-600">
            {error}
          </p>
        ))}
      </div>

      {state.message && (
        <p className="text-sm text-red-600" aria-live="polite">
          {state.message}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? "Saving..." : "Continue to dashboard"}
      </button>
    </form>
  );
}
