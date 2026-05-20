'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button, Input, Label } from '@/components/ui';
import { setToken } from '@/lib/auth';
import { trpc } from '@/lib/trpc';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'bootstrap'>('login');
  const [error, setError] = useState<string | null>(null);

  const login = trpc.auth.login.useMutation({
    onSuccess: (data) => {
      setToken(data.token);
      router.push('/dashboard');
      router.refresh();
    },
    onError: (e) => setError(e.message),
  });

  const bootstrap = trpc.auth.bootstrapAdmin.useMutation({
    onSuccess: (data) => {
      setToken(data.token);
      router.push('/dashboard');
      router.refresh();
    },
    onError: (e) => setError(e.message),
  });

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);
    const email = String(form.get('email'));
    const password = String(form.get('password'));
    const name = String(form.get('name') || 'Admin');

    if (mode === 'bootstrap') {
      bootstrap.mutate({ email, password, name });
    } else {
      login.mutate({ email, password });
    }
  }

  const pending = login.isPending || bootstrap.isPending;

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 shadow-lg">
        <h1 className="text-2xl font-bold text-violet-800">Anmol Admin</h1>
        <p className="mt-1 text-sm text-zinc-600">
          {mode === 'login' ? 'Staff sign in' : 'Create first admin account'}
        </p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          {mode === 'bootstrap' ? (
            <div>
              <Label>Name</Label>
              <Input name="name" required minLength={2} placeholder="Your name" />
            </div>
          ) : null}
          <div>
            <Label>Email</Label>
            <Input name="email" type="email" required placeholder="staff@example.com" />
          </div>
          <div>
            <Label>Password</Label>
            <Input name="password" type="password" required minLength={6} />
          </div>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create admin'}
          </Button>
        </form>

        <button
          type="button"
          className="mt-4 w-full text-center text-sm text-violet-700 hover:underline"
          onClick={() => {
            setError(null);
            setMode(mode === 'login' ? 'bootstrap' : 'login');
          }}
        >
          {mode === 'login'
            ? 'First time? Create admin account'
            : 'Already have an account? Sign in'}
        </button>
      </div>
    </div>
  );
}
