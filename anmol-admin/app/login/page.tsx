'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button, Input, Label } from '@/components/ui';
import { setToken } from '@/lib/auth';
import { trpc } from '@/lib/trpc';
import { LogIn, ShoppingBag } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const login = trpc.auth.login.useMutation({
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

    login.mutate({ identifier: email, password });
  }

  const pending = login.isPending;

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-slate-50 relative overflow-hidden">
      {/* Abstract Background Shapes */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-violet-400/20 blur-3xl" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-400/20 blur-3xl" />
      
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-xl shadow-slate-200/50 mb-4 ring-1 ring-slate-900/5">
            <ShoppingBag className="text-violet-600" size={32} />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Anmol Vastralay</h1>
          <p className="mt-2 text-slate-500">
            Sign in to access the administrator dashboard
          </p>
        </div>

        <div className="rounded-2xl border border-white/40 bg-white/60 backdrop-blur-xl p-8 shadow-2xl shadow-slate-200/50 ring-1 ring-slate-900/5">
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <Label className="text-slate-700">Email Address</Label>
              <Input 
                name="email" 
                type="email" 
                required 
                placeholder="admin@anmolvastralay.com" 
                className="mt-1.5 bg-white/80"
              />
            </div>
            <div>
              <div className="flex justify-between items-center">
                <Label className="text-slate-700">Password</Label>
              </div>
              <Input 
                name="password" 
                type="password" 
                required 
                minLength={6} 
                className="mt-1.5 bg-white/80"
                placeholder="••••••••"
              />
            </div>
            
            {error ? (
              <div className="p-3 text-sm text-rose-600 bg-rose-50/50 rounded-lg border border-rose-100 flex items-start gap-2">
                <div className="mt-0.5 font-bold">!</div>
                <p>{error}</p>
              </div>
            ) : null}
            
            <div className="pt-2">
              <Button type="submit" className="w-full h-11 text-base shadow-md shadow-violet-500/20" disabled={pending}>
                {pending ? (
                  'Signing in…'
                ) : (
                  <>
                    <LogIn size={18} className="mr-2" />
                    Sign In to Dashboard
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
        
        <p className="mt-8 text-center text-sm text-slate-500">
          &copy; {new Date().getFullYear()} Anmol Vastralay. All rights reserved.
        </p>
      </div>
    </div>
  );
}
