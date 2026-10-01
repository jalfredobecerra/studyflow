import SignupForm from "@/app/ui/signup-form";

export default function SignupPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold text-slate-900">
            Create your Study Flow account
          </h1>

          <p className="mt-2 text-slate-600">
            Start building your personalized study workflow.
          </p>
        </div>

        <SignupForm />
      </div>
    </main>
  );
}
