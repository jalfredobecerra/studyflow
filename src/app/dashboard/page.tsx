import { redirect } from "next/navigation";

import { auth, signOut } from "@/auth";
import sql from "@/lib/db";

type DashboardUser = {
  email: string;
  study_goal: string | null;
  course_area: string | null;
};

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/login");
  }

  const users = await sql<DashboardUser[]>`
    SELECT
      email,
      study_goal,
      course_area
    FROM users
    WHERE email = ${session.user.email}
    LIMIT 1
  `;

  const user = users[0];

  if (!user) {
    redirect("/login");
  }

  if (!user.study_goal || !user.course_area) {
    redirect("/onboarding");
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <h1 className="text-xl font-bold text-indigo-600">Study Flow</h1>

          <form
            action={async () => {
              "use server";

              await signOut({
                redirectTo: "/login",
              });
            }}
          >
            <button
              type="submit"
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Log out
            </button>
          </form>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-slate-900">
            Your Study Dashboard
          </h2>

          <p className="mt-2 text-slate-600">Welcome, {user.email}</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Study goal</p>

            <p className="mt-2 text-xl font-semibold text-slate-900">
              {user.study_goal}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Course area</p>

            <p className="mt-2 text-xl font-semibold text-slate-900">
              {user.course_area}
            </p>
          </div>
        </div>

        <div className="mt-8 rounded-xl border border-slate-200 bg-white p-6">
          <h3 className="text-xl font-semibold text-slate-900">Next step</h3>

          <p className="mt-2 text-slate-600">
            Study set creation will be implemented in the next feature.
          </p>
        </div>
      </section>
    </main>
  );
}
