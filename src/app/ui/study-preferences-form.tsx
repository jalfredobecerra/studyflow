"use client";

import { useActionState } from "react";

import {
  saveStudyPreferences,
  type StudyActionState,
} from "@/lib/study-actions";

import type { StudyUser } from "@/lib/study-data";

const initialState: StudyActionState = {};

export default function StudyPreferencesForm({ user }: { user: StudyUser }) {
  const [state, formAction, pending] = useActionState(
    saveStudyPreferences,
    initialState
  );

  return (
    <form action={formAction} className="space-y-5">
      <div>
        <label htmlFor="studyGoal" className="mb-2 block font-medium">
          Study goal
        </label>

        <input
          id="studyGoal"
          name="studyGoal"
          defaultValue={user.studyGoal}
          minLength={2}
          maxLength={120}
          required
          className="w-full rounded-lg border p-3"
        />
      </div>

      <div>
        <label htmlFor="courseArea" className="mb-2 block font-medium">
          Course or subject
        </label>

        <input
          id="courseArea"
          name="courseArea"
          defaultValue={user.courseArea}
          minLength={2}
          maxLength={120}
          required
          className="w-full rounded-lg border p-3"
        />
      </div>

      <div>
        <label htmlFor="cadenceDays" className="mb-2 block font-medium">
          Review cadence in days
        </label>

        <input
          id="cadenceDays"
          name="cadenceDays"
          type="number"
          min={1}
          max={30}
          defaultValue={user.cadenceDays}
          required
          className="w-full rounded-lg border p-3"
        />
      </div>

      <div>
        <label htmlFor="sessionMinutes" className="mb-2 block font-medium">
          Study session length in minutes
        </label>

        <input
          id="sessionMinutes"
          name="sessionMinutes"
          type="number"
          min={5}
          max={120}
          defaultValue={user.sessionMinutes}
          required
          className="w-full rounded-lg border p-3"
        />
      </div>

      {state.error && (
        <p role="alert" className="text-red-600">
          {state.error}
        </p>
      )}

      {state.success && (
        <p role="status" className="text-green-700">
          {state.success}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-indigo-600 px-5 py-3 text-white disabled:opacity-50"
      >
        {pending ? "Saving..." : "Save preferences"}
      </button>
    </form>
  );
}
