"use client";

import { useActionState } from "react";

import { createStudySet, type CreateStudySetState } from "@/lib/actions";

const initialState: CreateStudySetState = {};

export default function StudySetForm() {
  const [state, formAction, isPending] = useActionState(
    createStudySet,
    initialState
  );

  return (
    <form
      action={formAction}
      className="space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <div>
        <label
          htmlFor="title"
          className="mb-2 block text-sm font-medium text-slate-900"
        >
          Study set title
        </label>

        <input
          id="title"
          name="title"
          type="text"
          required
          maxLength={120}
          aria-invalid={Boolean(state.errors?.title)}
          aria-describedby={state.errors?.title ? "title-error" : undefined}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500"
          placeholder="For example, JavaScript Fundamentals"
        />

        {state.errors?.title && (
          <div id="title-error" className="mt-1 text-sm text-red-600">
            {state.errors.title.map((error) => (
              <p key={error}>{error}</p>
            ))}
          </div>
        )}
      </div>

      <div>
        <label
          htmlFor="sourceNotes"
          className="mb-2 block text-sm font-medium text-slate-900"
        >
          Study notes
        </label>

        <textarea
          id="sourceNotes"
          name="sourceNotes"
          required
          rows={14}
          aria-invalid={Boolean(state.errors?.sourceNotes)}
          aria-describedby={
            state.errors?.sourceNotes
              ? "source-notes-error"
              : "source-notes-help"
          }
          className="w-full resize-y rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500"
          placeholder="Paste your class notes here..."
        />

        <p id="source-notes-help" className="mt-2 text-sm text-slate-500">
          Use complete sentences, definitions, and explanations for better
          flashcards.
        </p>

        {state.errors?.sourceNotes && (
          <div id="source-notes-error" className="mt-1 text-sm text-red-600">
            {state.errors.sourceNotes.map((error) => (
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

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending
          ? "Creating flashcards..."
          : "Create study set and flashcards"}
      </button>
    </form>
  );
}
