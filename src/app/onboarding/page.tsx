import { redirect } from "next/navigation";

import OnboardingForm from "@/app/ui/onboarding-form";
import { auth } from "@/auth";

export default async function OnboardingPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-lg">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold text-slate-900">
            Set up your study plan
          </h1>

          <p className="mt-2 text-slate-600">
            Tell Study Flow what you are working on.
          </p>
        </div>

        <OnboardingForm />
      </div>
    </main>
  );
}
