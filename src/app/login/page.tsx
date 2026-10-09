import type { Metadata } from 'next';

import LoginForm from '@/app/ui/login-form';

export const metadata: Metadata = {
  title: 'Log In',
  description:
    'Log in to Study Flow to access your study sets and learning preferences.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold text-slate-900">
            Welcome back
          </h1>

          <p className="mt-2 text-slate-600">
            Log in to continue studying.
          </p>
        </div>

        <LoginForm />
      </div>
    </main>
  );
}