import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Account Deleted | Study Flow",
};

export default function AccountDeletedPage() {
  return (
    <main className="mx-auto max-w-lg space-y-5 p-8">
      <h1 className="text-3xl font-bold">Your account has been deleted</h1>

      <p className="text-slate-600">
        Your Study Flow account and its stored study data have been permanently
        deleted.
      </p>

      <Link
        href="/signup"
        className="inline-block rounded-lg bg-indigo-600 px-5 py-3 text-white"
      >
        Return to signup
      </Link>
    </main>
  );
}
