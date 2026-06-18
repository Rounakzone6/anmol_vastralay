'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLogout } from '@/components/providers';
import { trpc } from '@/lib/trpc';

const links = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/orders', label: 'Orders' },
  { href: '/customers', label: 'Customers' },
  { href: '/categories', label: 'Categories' },
  { href: '/products', label: 'Products' },
  { href: '/staff', label: 'Staff', adminOnly: true },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const logout = useLogout();
  const { data: user } = trpc.auth.me.useQuery();

  return (
    <div className="flex min-h-screen bg-neutral-50 font-sans">
      <aside className="flex w-64 flex-col border-r border-neutral-200 bg-white shadow-[1px_0_10px_rgba(0,0,0,0.01)]">
        <div className="border-b border-neutral-100 px-6 py-6">
          <p className="text-xl font-bold tracking-tight text-neutral-900">Anmol Admin</p>
          <div className="mt-2 flex flex-col gap-0.5">
            <p className="truncate text-sm text-neutral-500">{user?.email}</p>
            <p className="text-xs font-semibold tracking-wider text-neutral-400 uppercase">{user?.role}</p>
          </div>
        </div>
        <nav className="flex flex-1 flex-col gap-1.5 p-4">
          {links
            .filter((l) => !l.adminOnly || user?.role === 'ADMIN')
            .map((link) => {
              const active =
                pathname === link.href || pathname.startsWith(`${link.href}/`);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-md px-3 py-2 text-sm font-medium transition-all ${
                    active
                      ? 'bg-neutral-100 text-neutral-900 font-semibold'
                      : 'text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
        </nav>
        <div className="border-t border-neutral-100 p-4">
          <button
            type="button"
            onClick={logout}
            className="w-full rounded-md px-3 py-2 text-left text-sm font-medium text-neutral-500 hover:bg-neutral-50 hover:text-red-600 transition-colors"
          >
            Sign out
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto p-10">{children}</main>
    </div>
  );
}
