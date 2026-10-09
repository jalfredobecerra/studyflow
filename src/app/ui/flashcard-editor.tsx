'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';

import { updateFlashcard } from '@/lib/actions';
import type { FlashcardActionState } from '@/lib/flashcard-validation';

type FlashcardEditorProps = {
  card: {
    id: string;
    front: string;
    back: string;
    status: string;
  };
  studySetId: string;
};

const initialState: FlashcardActionState = {
  status: 'idle',
};

function ActionButtons() {
  const { pending, data } = useFormStatus();

  const activeAction = data?.get('intent');

  return (
    <div className="flex flex-wrap gap-3">
      <button
        type="submit"
        name="intent"
        value="accept"
        disabled={pending}
        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending && activeAction === 'accept'
          ? 'Accepting...'
          : 'Accept'}
      </button>

      <button
        type="submit"
        name="intent"
        value="save"
        disabled={pending}
        className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
      >
        {pending && activeAction === 'save'
          ? 'Saving...'
          : 'Save changes'}
      </button>

      <button
        type="submit"
        name="intent"
        value="reject"
        formNoValidate
        disabled={pending}
        className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
      >
        {pending && activeAction === 'reject'
          ? 'Rejecting...'
          : 'Reject'}
      </button>
    </div>
  );
}

export default function FlashcardEditor({
  card,
  studySetId,
}: FlashcardEditorProps) {
  const [state, formAction] = useActionState(
    updateFlashcard,
    initialState,
  );

  return (
    <form
      action={formAction}
      className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <input type="hidden" name="cardId" value={card.id} />

      <input
        type="hidden"
        name="studySetId"
        value={studySetId}
      />

      <div className="flex items-center justify-between gap-4">
        <h3 className="font-semibold text-slate-900">
          Flashcard
        </h3>

        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium capitalize text-slate-600">
          {card.status}
        </span>
      </div>

      <div>
        <label
          htmlFor={`front-${card.id}`}
          className="mb-2 block text-sm font-medium text-slate-900"
        >
          Front
        </label>

        <textarea
          id={`front-${card.id}`}
          name="front"
          defaultValue={card.front}
          required
          minLength={2}
          maxLength={500}
          rows={3}
          aria-invalid={Boolean(state.errors?.front)}
          aria-describedby={
            state.errors?.front
              ? `front-error-${card.id}`
              : undefined
          }
          className="w-full resize-y rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500"
        />

        {state.errors?.front && (
          <div
            id={`front-error-${card.id}`}
            className="mt-1 text-sm text-red-600"
          >
            {state.errors.front.map((error) => (
              <p key={error}>{error}</p>
            ))}
          </div>
        )}
      </div>

      <div>
        <label
          htmlFor={`back-${card.id}`}
          className="mb-2 block text-sm font-medium text-slate-900"
        >
          Back
        </label>

        <textarea
          id={`back-${card.id}`}
          name="back"
          defaultValue={card.back}
          required
          minLength={2}
          maxLength={3000}
          rows={5}
          aria-invalid={Boolean(state.errors?.back)}
          aria-describedby={
            state.errors?.back
              ? `back-error-${card.id}`
              : undefined
          }
          className="w-full resize-y rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500"
        />

        {state.errors?.back && (
          <div
            id={`back-error-${card.id}`}
            className="mt-1 text-sm text-red-600"
          >
            {state.errors.back.map((error) => (
              <p key={error}>{error}</p>
            ))}
          </div>
        )}
      </div>

      {state.message && (
        <p
          role={state.status === 'error' ? 'alert' : 'status'}
          className={
            state.status === 'error'
              ? 'text-sm text-red-600'
              : 'text-sm text-green-700'
          }
        >
          {state.message}
        </p>
      )}

      <ActionButtons />
    </form>
  );
}