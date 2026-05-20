'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLogout } from '@/components/providers';
import { trpc } from '@/lib/trpc';

const links = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/categories', label: 'Categories' },
  { href: '/products', label: 'Products' },
  { href: '/staff', label: 'Staff', adminOnly: true },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const logout = useLogout();
  const { data: user } = trpc.auth.me.useQuery();

  return (
    <div className="flex min-h-screen bg-zinc-100">
      <aside className="flex w-60 flex-col border-r border-zinc-200 bg-white">
        <div className="border-b border-zinc-200 px-5 py-5">
          <p className="text-lg font-bold text-violet-800">Anmol Admin</p>
          <p className="mt-1 truncate text-xs text-zinc-500">{user?.email}</p>
          <p className="text-xs text-violet-600">{user?.role}</p>
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-3">
          {links
            .filter((l) => !l.adminOnly || user?.role === 'ADMIN')
            .map((link) => {
              const active =
                pathname === link.href || pathname.startsWith(`${link.href}/`);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                    active
                      ? 'bg-violet-100 text-violet-900'
                      : 'text-zinc-700 hover:bg-zinc-100'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
        </nav>
        <div className="border-t border-zinc-200 p-3">
          <button
            type="button"
            onClick={logout}
            className="w-full rounded-lg px-3 py-2 text-left text-sm text-zinc-600 hover:bg-zinc-100"
          >
            Sign out
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto p-8">{children}</main>
    </div>
  );
}
