import { z } from "zod";

const IdentifiersSchema = z.object({
  cardId: z.string().uuid(),
  studySetId: z.string().uuid(),
  intent: z.enum(["save", "accept", "reject"]),
});

const ContentSchema = z.object({
  front: z
    .string()
    .trim()
    .min(2, "Enter a question with at least 2 characters.")
    .max(500, "The question is too long."),

  back: z
    .string()
    .trim()
    .min(2, "Enter an answer with at least 2 characters.")
    .max(3000, "The answer is too long."),
});

export type FlashcardActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  errors?: {
    front?: string[];
    back?: string[];
  };
};

export type FlashcardSubmission = {
  cardId: string;
  studySetId: string;
  intent: "save" | "accept" | "reject";
  front: string;
  back: string;
};

type ValidationResult =
  | {
      success: true;
      data: FlashcardSubmission;
    }
  | {
      success: false;
      message: string;
      errors?: FlashcardActionState["errors"];
    };

export function validateFlashcardForm(formData: FormData): ValidationResult {
  const identifiers = IdentifiersSchema.safeParse({
    cardId: formData.get("cardId"),
    studySetId: formData.get("studySetId"),
    intent: formData.get("intent"),
  });

  if (!identifiers.success) {
    return {
      success: false,
      message: "Invalid flashcard request.",
    };
  }

  const { cardId, studySetId, intent } = identifiers.data;

  if (intent === "reject") {
    return {
      success: true,
      data: {
        cardId,
        studySetId,
        intent,
        front: "",
        back: "",
      },
    };
  }

  const content = ContentSchema.safeParse({
    front: formData.get("front"),
    back: formData.get("back"),
  });

  if (!content.success) {
    return {
      success: false,
      message: "Please correct the flashcard fields.",
      errors: content.error.flatten().fieldErrors,
    };
  }

  return {
    success: true,
    data: {
      cardId,
      studySetId,
      intent,
      front: content.data.front,
      back: content.data.back,
    },
  };
}
