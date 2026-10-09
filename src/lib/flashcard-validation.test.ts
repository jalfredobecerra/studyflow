import { describe, expect, it } from "vitest";

import { validateFlashcardForm } from "./flashcard-validation";

const cardId = "550e8400-e29b-41d4-a716-446655440000";
const studySetId = "550e8400-e29b-41d4-a716-446655440001";

function createFormData(intent: string, front: string, back: string): FormData {
  const formData = new FormData();

  formData.set("cardId", cardId);
  formData.set("studySetId", studySetId);
  formData.set("intent", intent);
  formData.set("front", front);
  formData.set("back", back);

  return formData;
}

describe("Flashcard form validation", () => {
  it("accepts valid flashcard content", () => {
    const result = validateFlashcardForm(
      createFormData(
        "accept",
        "What is JavaScript?",
        "JavaScript is a programming language."
      )
    );

    expect(result.success).toBe(true);
  });

  it("rejects an empty question when saving", () => {
    const result = validateFlashcardForm(
      createFormData("save", "", "A valid answer.")
    );

    expect(result.success).toBe(false);
  });

  it("rejects an empty answer when accepting", () => {
    const result = validateFlashcardForm(
      createFormData("accept", "A valid question?", "")
    );

    expect(result.success).toBe(false);
  });

  it("allows rejection when both fields are empty", () => {
    const result = validateFlashcardForm(createFormData("reject", "", ""));

    expect(result.success).toBe(true);
  });

  it("rejects invalid card identifiers", () => {
    const formData = createFormData(
      "save",
      "A valid question?",
      "A valid answer."
    );

    formData.set("cardId", "invalid-id");

    const result = validateFlashcardForm(formData);

    expect(result.success).toBe(false);
  });

  it("rejects unsupported operations", () => {
    const result = validateFlashcardForm(
      createFormData("deleteAll", "Question", "Answer")
    );

    expect(result.success).toBe(false);
  });
});
