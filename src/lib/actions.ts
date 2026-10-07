"use server";

import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { auth, signIn } from "@/auth";
import sql from "@/lib/db";
import { generateFlashcardsFromNotes } from "@/lib/flashcards";

export type SignupState = {
  errors?: {
    email?: string[];
    password?: string[];
    confirmPassword?: string[];
  };
  message?: string;
};

export type LoginState = {
  message?: string;
};

export type OnboardingState = {
  errors?: {
    studyGoal?: string[];
    courseArea?: string[];
  };
  message?: string;
};

export type CreateStudySetState = {
  errors?: {
    title?: string[];
    sourceNotes?: string[];
  };
  message?: string;
};

const SignupSchema = z
  .object({
    email: z.string().email("Enter a valid email address."),

    password: z
      .string()
      .min(8, "Password must contain at least 8 characters.")
      .regex(/[A-Z]/, "Password must contain an uppercase letter.")
      .regex(/[a-z]/, "Password must contain a lowercase letter.")
      .regex(/[0-9]/, "Password must contain a number."),

    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

const OnboardingSchema = z.object({
  studyGoal: z.string().min(1, "Select a study goal."),

  courseArea: z
    .string()
    .trim()
    .min(2, "Enter a course or subject area.")
    .max(150, "Course area must contain 150 characters or fewer."),
});

const CreateStudySetSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, "Enter a study set title.")
    .max(120, "The title must contain 120 characters or fewer."),

  sourceNotes: z
    .string()
    .trim()
    .min(80, "Add more complete notes before generating flashcards."),
});

const FlashcardSchema = z.object({
  cardId: z.string().uuid(),
  studySetId: z.string().uuid(),

  front: z
    .string()
    .trim()
    .min(2, "The front of the card cannot be empty.")
    .max(500, "The front of the card is too long."),

  back: z
    .string()
    .trim()
    .min(2, "The back of the card cannot be empty.")
    .max(3000, "The back of the card is too long."),

  intent: z.enum(["save", "accept", "reject"]),
});

type CurrentUser = {
  id: string;
  email: string;
};

async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await auth();

  if (!session?.user?.email) {
    return null;
  }

  const users = await sql<CurrentUser[]>`
    SELECT
      id,
      email
    FROM users
    WHERE email = ${session.user.email}
    LIMIT 1
  `;

  return users[0] ?? null;
}

export async function signup(
  previousState: SignupState,
  formData: FormData
): Promise<SignupState> {
  void previousState;

  const validatedFields = SignupSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Please correct the highlighted fields.",
    };
  }

  const email = validatedFields.data.email.toLowerCase();
  const password = validatedFields.data.password;

  const existingUsers = await sql`
    SELECT id
    FROM users
    WHERE email = ${email}
    LIMIT 1
  `;

  if (existingUsers.length > 0) {
    return {
      errors: {
        email: ["An account with this email already exists."],
      },
      message: "Account creation failed.",
    };
  }

  const passwordHash = await bcrypt.hash(password, 12);

  try {
    await sql`
      INSERT INTO users (
        email,
        password_hash
      )
      VALUES (
        ${email},
        ${passwordHash}
      )
    `;
  } catch (error) {
    console.error("Signup database error:", error);

    return {
      message: "Unable to create your account.",
    };
  }

  await signIn("credentials", {
    email,
    password,
    redirectTo: "/onboarding",
  });

  return {};
}

export async function login(
  previousState: LoginState,
  formData: FormData
): Promise<LoginState> {
  void previousState;

  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: "/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      if (error.type === "CredentialsSignin") {
        return {
          message: "Invalid email or password.",
        };
      }

      return {
        message: "Unable to sign in.",
      };
    }

    throw error;
  }

  return {};
}

export async function saveOnboarding(
  previousState: OnboardingState,
  formData: FormData
): Promise<OnboardingState> {
  void previousState;

  const session = await auth();

  if (!session?.user?.email) {
    redirect("/login");
  }

  const validatedFields = OnboardingSchema.safeParse({
    studyGoal: formData.get("studyGoal"),
    courseArea: formData.get("courseArea"),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Please correct the form.",
    };
  }

  try {
    await sql`
      UPDATE users
      SET
        study_goal = ${validatedFields.data.studyGoal},
        course_area = ${validatedFields.data.courseArea},
        updated_at = CURRENT_TIMESTAMP
      WHERE email = ${session.user.email}
    `;
  } catch (error) {
    console.error("Onboarding database error:", error);

    return {
      message: "Unable to save your study preferences.",
    };
  }

  redirect("/dashboard");
}

export async function skipOnboarding() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/login");
  }

  try {
    await sql`
      UPDATE users
      SET
        study_goal = 'General Study',
        course_area = 'General',
        updated_at = CURRENT_TIMESTAMP
      WHERE email = ${session.user.email}
    `;
  } catch (error) {
    console.error("Onboarding skip error:", error);

    redirect("/onboarding");
  }

  redirect("/dashboard");
}

export async function createStudySet(
  previousState: CreateStudySetState,
  formData: FormData
): Promise<CreateStudySetState> {
  void previousState;

  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login");
  }

  const validatedFields = CreateStudySetSchema.safeParse({
    title: formData.get("title"),
    sourceNotes: formData.get("sourceNotes"),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Please correct the highlighted fields.",
    };
  }

  const { title, sourceNotes } = validatedFields.data;

  const generatedCards = generateFlashcardsFromNotes(sourceNotes);

  if (generatedCards.length < 2) {
    return {
      errors: {
        sourceNotes: [
          "The notes do not contain enough clear information. Add complete definitions, explanations, or sentences.",
        ],
      },
      message: "More study material is required.",
    };
  }

  let studySetId: string;

  try {
    studySetId = await sql.begin(async (transaction) => {
      const studySets = await transaction<{ id: string }[]>`
        INSERT INTO study_sets (
          user_id,
          title,
          source_notes
        )
        VALUES (
          ${currentUser.id},
          ${title},
          ${sourceNotes}
        )
        RETURNING id
      `;

      const newStudySet = studySets[0];

      if (!newStudySet) {
        throw new Error("Study set was not created.");
      }

      for (const card of generatedCards) {
        await transaction`
          INSERT INTO flashcards (
            study_set_id,
            front,
            back,
            status,
            difficulty,
            mastery_state
          )
          VALUES (
            ${newStudySet.id},
            ${card.front},
            ${card.back},
            'generated',
            'medium',
            'new'
          )
        `;
      }

      return newStudySet.id;
    });
  } catch (error) {
    console.error("Create study set error:", error);

    return {
      message: "Unable to create the study set. Please try again.",
    };
  }

  redirect(`/studysets/${studySetId}`);
}

export async function updateFlashcard(formData: FormData) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login");
  }

  const validatedFields = FlashcardSchema.safeParse({
    cardId: formData.get("cardId"),
    studySetId: formData.get("studySetId"),
    front: formData.get("front"),
    back: formData.get("back"),
    intent: formData.get("intent"),
  });

  if (!validatedFields.success) {
    return;
  }

  const { cardId, studySetId, front, back, intent } = validatedFields.data;

  const ownedCards = await sql<{ id: string }[]>`
    SELECT flashcards.id
    FROM flashcards
    INNER JOIN study_sets
      ON study_sets.id = flashcards.study_set_id
    WHERE flashcards.id = ${cardId}
      AND flashcards.study_set_id = ${studySetId}
      AND study_sets.user_id = ${currentUser.id}
    LIMIT 1
  `;

  if (ownedCards.length === 0) {
    return;
  }

  if (intent === "reject") {
    await sql`
      UPDATE flashcards
      SET
        status = 'rejected',
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${cardId}
    `;
  }

  if (intent === "save") {
    await sql`
      UPDATE flashcards
      SET
        front = ${front},
        back = ${back},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${cardId}
    `;
  }

  if (intent === "accept") {
    await sql`
      UPDATE flashcards
      SET
        front = ${front},
        back = ${back},
        status = 'accepted',
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${cardId}
    `;
  }

  revalidatePath(`/studysets/${studySetId}`);
  revalidatePath("/dashboard");
}
