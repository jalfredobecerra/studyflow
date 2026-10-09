"use client";

import { useActionState } from "react";

import {
  saveFlashcardSettings,
  type StudyActionState,
} from "@/lib/study-actions";

import type { Difficulty, MasteryState } from "@/lib/review-schedule";

const initialState: StudyActionState = {};

interface FlashcardSettingsFormProps {
  cardId: string;
  difficulty: Difficulty;
  mastery: MasteryState;
}

export default function FlashcardSettingsForm({
  cardId,
  difficulty,
  mastery,
}: FlashcardSettingsFormProps) {
  const [state, formAction, pending] = useActionState(
    saveFlashcardSettings,
    initialState
  );

  return (
    <form action={formAction} className="space-y-4 rounded-lg bg-slate-50 p-4">
      <input type="hidden" name="cardId" value={cardId} />

      <div>
        <label
          htmlFor={`difficulty-${cardId}`}
          className="mb-1 block text-sm font-medium"
        >
          Difficulty
        </label>

        <select
          id={`difficulty-${cardId}`}
          name="difficulty"
          defaultValue={difficulty}
          className="w-full rounded-lg border p-2"
        >
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Difficult</option>
        </select>
      </div>

      <div>
        <label
          htmlFor={`mastery-${cardId}`}
          className="mb-1 block text-sm font-medium"
        >
          Mastery
        </label>

        <select
          id={`mastery-${cardId}`}
          name="mastery"
          defaultValue={mastery}
          className="w-full rounded-lg border p-2"
        >
          <option value="learning">Learning</option>
          <option value="reviewing">Reviewing</option>
          <option value="mastered">Mastered</option>
        </select>
      </div>

      {state.error && (
        <p role="alert" className="text-sm text-red-600">
          {state.error}
        </p>
      )}

      {state.success && (
        <p role="status" className="text-sm text-green-700">
          {state.success}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-indigo-600 px-4 py-2 text-white disabled:opacity-50"
      >
        {pending ? "Saving..." : "Save card settings"}
      </button>
    </form>
  );
}
