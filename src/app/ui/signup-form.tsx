"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import { signup, type SignupState } from "@/lib/actions";

const initialState: SignupState = {};

export default function SignupForm() {
  const [state, formAction, isPending] = useActionState(signup, initialState);

  const [email, setEmail] = useState("");

  return (
    <form
      action={formAction}
      className="space-y-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <div>
        <label
          htmlFor="email"
          className="mb-2 block text-sm font-medium text-slate-900"
        >
          Email
        </label>

        <input
          id="email"
          name="email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          aria-invalid={Boolean(state.errors?.email)}
          aria-describedby={state.errors?.email ? "email-error" : undefined}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500"
          placeholder="student@example.com"
        />

        {state.errors?.email && (
          <div id="email-error" className="mt-1 text-sm text-red-600">
            {state.errors.email.map((error) => (
              <p key={error}>{error}</p>
            ))}
          </div>
        )}
      </div>

      <div>
        <label
          htmlFor="password"
          className="mb-2 block text-sm font-medium text-slate-900"
        >
          Password
        </label>

        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          aria-invalid={Boolean(state.errors?.password)}
          aria-describedby={
            state.errors?.password ? "password-error" : undefined
          }
          className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500"
          placeholder="Create a password"
        />

        {state.errors?.password && (
          <div id="password-error" className="mt-1 text-sm text-red-600">
            {state.errors.password.map((error) => (
              <p key={error}>{error}</p>
            ))}
          </div>
        )}
      </div>

      <div>
        <label
          htmlFor="confirmPassword"
          className="mb-2 block text-sm font-medium text-slate-900"
        >
          Confirm password
        </label>

        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          required
          aria-invalid={Boolean(state.errors?.confirmPassword)}
          aria-describedby={
            state.errors?.confirmPassword ? "confirm-password-error" : undefined
          }
          className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500"
          placeholder="Enter your password again"
        />

        {state.errors?.confirmPassword && (
          <div
            id="confirm-password-error"
            className="mt-1 text-sm text-red-600"
          >
            {state.errors.confirmPassword.map((error) => (
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
        className="w-full rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? "Creating account..." : "Create account"}
      </button>

      <p className="text-center text-sm text-slate-600">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-medium text-indigo-600 hover:underline"
        >
          Log in
        </Link>
      </p>
    </form>
  );
}
