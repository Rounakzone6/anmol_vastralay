import { forwardRef, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

export function Button({
  className = '',
  variant = 'primary',
  size = 'default',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
  size?: 'sm' | 'default';
}) {
  const variants = {
    primary: 'bg-violet-600 text-white hover:bg-violet-700 hover:shadow-md hover:-translate-y-0.5 shadow-sm shadow-violet-200',
    secondary: 'bg-violet-50 text-violet-700 hover:bg-violet-100 hover:text-violet-800 shadow-sm',
    danger: 'bg-rose-500 text-white hover:bg-rose-600 hover:shadow-md hover:-translate-y-0.5 shadow-sm shadow-rose-200',
    ghost: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
    outline: 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-sm',
  };
  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    default: 'px-4 py-2 text-sm',
  };

  return (
    <button
      className={`inline-flex items-center justify-center rounded-lg font-semibold transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none ${sizes[size]} ${variants[variant]} ${className}`}
      {...props}
    />
  );
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { className?: string }>(
  ({ className = '', ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={`w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 hover:border-slate-300 shadow-sm ${className}`}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export function Label({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <label className={`mb-1.5 block text-sm font-semibold text-slate-700 ${className}`}>{children}</label>;
}

export function Select({
  className = '',
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={`w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 hover:border-slate-300 shadow-sm ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}

export function Textarea({
  className = '',
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={`w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 hover:border-slate-300 shadow-sm ${className}`}
      {...props}
    />
  );
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-slate-100 bg-white p-6 shadow-sm ring-1 ring-slate-900/5 ${className}`}>
      {children}
    </div>
  );
}

export function Badge({ 
  children, 
  variant = 'default',
  className = ''
}: { 
  children: ReactNode; 
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  className?: string;
}) {
  const variants = {
    default: 'bg-slate-100 text-slate-700 border-slate-200',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    danger: 'bg-rose-50 text-rose-700 border-rose-200',
    info: 'bg-blue-50 text-blue-700 border-blue-200',
  };

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}

export function Spinner({ className = '', size = 24 }: { className?: string; size?: number }) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <Loader2 size={size} className="animate-spin text-violet-600" />
    </div>
  );
}

export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-md bg-slate-200/60 ${className}`} />
  );
}
