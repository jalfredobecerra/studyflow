"use server";

import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { z } from "zod";

import { auth, signIn } from "@/auth";
import sql from "@/lib/db";

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

export async function signup(
  previousState: SignupState,
  formData: FormData
): Promise<SignupState> {
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

const OnboardingSchema = z.object({
  studyGoal: z.string().min(1, "Select a study goal."),

  courseArea: z
    .string()
    .trim()
    .min(2, "Enter a course or subject area.")
    .max(150, "Course area must contain 150 characters or fewer."),
});

export async function saveOnboarding(
  previousState: OnboardingState,
  formData: FormData
): Promise<OnboardingState> {
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
