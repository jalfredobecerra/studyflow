import { updateFlashcard } from "@/lib/actions";

type FlashcardEditorProps = {
  card: {
    id: string;
    front: string;
    back: string;
    status: string;
  };
  studySetId: string;
};

export default function FlashcardEditor({
  card,
  studySetId,
}: FlashcardEditorProps) {
  return (
    <form
      action={updateFlashcard}
      className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <input type="hidden" name="cardId" value={card.id} />

      <input type="hidden" name="studySetId" value={studySetId} />

      <div className="flex items-center justify-between gap-4">
        <h3 className="font-semibold text-slate-900">Flashcard</h3>

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
          rows={3}
          className="w-full resize-y rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500"
        />
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
          rows={5}
          className="w-full resize-y rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500"
        />
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          name="intent"
          value="accept"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Accept
        </button>

        <button
          type="submit"
          name="intent"
          value="save"
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Save changes
        </button>

        <button
          type="submit"
          name="intent"
          value="reject"
          className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
        >
          Reject
        </button>
      </div>
    </form>
  );
}
