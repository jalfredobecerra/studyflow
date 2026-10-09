'use server';

import bcrypt from 'bcryptjs';
import { AuthError } from 'next-auth';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

import { auth, signIn } from '@/auth';
import sql from '@/lib/db';
import { generateFlashcardsFromNotes } from '@/lib/flashcards';
import {
  validateFlashcardForm,
  type FlashcardActionState,
} from '@/lib/flashcard-validation';

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

type CurrentUser = {
  id: string;
  email: string;
};

const SignupSchema = z
  .object({
    email: z.string().email('Enter a valid email address.'),
    password: z
      .string()
      .min(8, 'Password must contain at least 8 characters.')
      .regex(/[A-Z]/, 'Password must contain an uppercase letter.')
      .regex(/[a-z]/, 'Password must contain a lowercase letter.')
      .regex(/[0-9]/, 'Password must contain a number.'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  });

const OnboardingSchema = z.object({
  studyGoal: z.string().min(1, 'Select a study goal.'),
  courseArea: z
    .string()
    .trim()
    .min(2, 'Enter a course or subject area.')
    .max(150, 'Course area must contain 150 characters or fewer.'),
});

const CreateStudySetSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, 'Enter a study set title.')
    .max(120, 'The title is too long.'),
  sourceNotes: z
    .string()
    .trim()
    .min(80, 'Add more complete notes before generating flashcards.')
    .max(20000, 'Study notes must contain 20,000 characters or fewer.'),
});

async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await auth();

  if (!session?.user?.email) {
    return null;
  }

  const users = await sql<CurrentUser[]>`
    SELECT id, email
    FROM users
    WHERE email = ${session.user.email}
    LIMIT 1
  `;

  return users[0] ?? null;
}

export async function signup(
  previousState: SignupState,
  formData: FormData,
): Promise<SignupState> {
  void previousState;

  const validated = SignupSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
    confirmPassword: formData.get('confirmPassword'),
  });

  if (!validated.success) {
    return {
      errors: validated.error.flatten().fieldErrors,
      message: 'Please correct the highlighted fields.',
    };
  }

  const email = validated.data.email.toLowerCase();
  const password = validated.data.password;

  try {
    const existingUsers = await sql`
      SELECT id FROM users
      WHERE email = ${email}
      LIMIT 1
    `;

    if (existingUsers.length > 0) {
      return {
        errors: {
          email: ['An account with this email already exists.'],
        },
        message: 'Account creation failed.',
      };
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await sql`
      INSERT INTO users (email, password_hash)
      VALUES (${email}, ${passwordHash})
    `;
  } catch (error) {
    if (
      error instanceof Error &&
      'code' in error &&
      error.code === '23505'
    ) {
      return {
        errors: {
          email: ['An account with this email already exists.'],
        },
      };
    }

    console.error('Signup error:', error);

    return {
      message: 'Unable to create your account.',
    };
  }

  await signIn('credentials', {
    email,
    password,
    redirectTo: '/onboarding',
  });

  return {};
}

export async function login(
  previousState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  void previousState;

  try {
    await signIn('credentials', {
      email: formData.get('email'),
      password: formData.get('password'),
      redirectTo: '/dashboard',
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return {
        message:
          error.type === 'CredentialsSignin'
            ? 'Invalid email or password.'
            : 'Unable to sign in.',
      };
    }

    throw error;
  }

  return {};
}

export async function saveOnboarding(
  previousState: OnboardingState,
  formData: FormData,
): Promise<OnboardingState> {
  void previousState;

  const session = await auth();

  if (!session?.user?.email) {
    redirect('/login');
  }

  const validated = OnboardingSchema.safeParse({
    studyGoal: formData.get('studyGoal'),
    courseArea: formData.get('courseArea'),
  });

  if (!validated.success) {
    return {
      errors: validated.error.flatten().fieldErrors,
      message: 'Please correct the form.',
    };
  }

  try {
    await sql`
      UPDATE users
      SET
        study_goal = ${validated.data.studyGoal},
        course_area = ${validated.data.courseArea},
        updated_at = CURRENT_TIMESTAMP
      WHERE email = ${session.user.email}
    `;
  } catch (error) {
    console.error('Onboarding error:', error);

    return {
      message: 'Unable to save your study preferences.',
    };
  }

  redirect('/dashboard');
}

export async function skipOnboarding() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect('/login');
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
    console.error('Onboarding skip error:', error);
    redirect('/onboarding');
  }

  redirect('/dashboard');
}

export async function createStudySet(
  previousState: CreateStudySetState,
  formData: FormData,
): Promise<CreateStudySetState> {
  void previousState;

  const session = await auth();

  if (!session?.user?.email) {
    redirect('/login');
  }

  const validated = CreateStudySetSchema.safeParse({
    title: formData.get('title'),
    sourceNotes: formData.get('sourceNotes'),
  });

  if (!validated.success) {
    return {
      errors: validated.error.flatten().fieldErrors,
      message: 'Please correct the highlighted fields.',
    };
  }

  const { title, sourceNotes } = validated.data;
  const generatedCards = generateFlashcardsFromNotes(sourceNotes);

  if (generatedCards.length < 2) {
    return {
      errors: {
        sourceNotes: [
          'Add at least two clear definitions or explanatory sentences.',
        ],
      },
      message: 'More structured study material is needed.',
    };
  }

  let studySetId: string;

  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return {
        message: 'Your account could not be found.',
      };
    }

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
        throw new Error('Study set creation failed.');
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
    console.error('Create study set error:', error);

    return {
      message: 'Unable to create the study set. Please try again.',
    };
  }

  redirect(`/studysets/${studySetId}`);
}

export async function updateFlashcard(
  previousState: FlashcardActionState,
  formData: FormData,
): Promise<FlashcardActionState> {
  void previousState;

  const session = await auth();

  if (!session?.user?.email) {
    redirect('/login');
  }

  const validated = validateFlashcardForm(formData);

  if (!validated.success) {
    return {
      status: 'error',
      message: validated.message,
      errors: validated.errors,
    };
  }

  const {
    cardId,
    studySetId,
    intent,
    front,
    back,
  } = validated.data;

  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return {
        status: 'error',
        message: 'Your account could not be found.',
      };
    }

    let updatedCards: { id: string }[];

    if (intent === 'reject') {
      updatedCards = await sql<{ id: string }[]>`
        UPDATE flashcards AS f
        SET
          status = 'rejected',
          updated_at = CURRENT_TIMESTAMP
        FROM study_sets AS s
        WHERE f.id = ${cardId}
          AND f.study_set_id = ${studySetId}
          AND f.study_set_id = s.id
          AND s.user_id = ${currentUser.id}
          AND f.status <> 'rejected'
        RETURNING f.id
      `;
    } else {
      updatedCards = await sql<{ id: string }[]>`
        UPDATE flashcards AS f
        SET
          front = ${front},
          back = ${back},
          status = CASE
            WHEN ${intent} = 'accept' THEN 'accepted'
            ELSE f.status
          END,
          updated_at = CURRENT_TIMESTAMP
        FROM study_sets AS s
        WHERE f.id = ${cardId}
          AND f.study_set_id = ${studySetId}
          AND f.study_set_id = s.id
          AND s.user_id = ${currentUser.id}
          AND f.status <> 'rejected'
        RETURNING f.id
      `;
    }

    if (updatedCards.length === 0) {
      return {
        status: 'error',
        message:
          'Flashcard not found or you do not have permission to change it.',
      };
    }
  } catch (error) {
    console.error('Flashcard update error:', error);

    return {
      status: 'error',
      message: 'Unable to update the flashcard. Please try again.',
    };
  }

  revalidatePath(`/studysets/${studySetId}`);
  revalidatePath('/dashboard');

  return {
    status: 'success',
    message:
      intent === 'accept'
        ? 'Flashcard accepted.'
        : intent === 'reject'
          ? 'Flashcard rejected.'
          : 'Changes saved.',
  };
}