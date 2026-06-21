'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLogout } from '@/components/providers';
import { trpc } from '@/lib/trpc';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Users, 
  Tags, 
  Package, 
  Image as ImageIcon, 
  ShieldCheck, 
  LogOut,
  Menu,
  X
} from 'lucide-react';

const links = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/orders', label: 'Orders', icon: ShoppingCart },
  { href: '/customers', label: 'Customers', icon: Users },
  { href: '/categories', label: 'Categories', icon: Tags },
  { href: '/products', label: 'Products', icon: Package },
  { href: '/banners', label: 'Banners', icon: ImageIcon },
  { href: '/staff', label: 'Staff', icon: ShieldCheck, adminOnly: true },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? '/';
  const logout = useLogout();
  const { data: user } = trpc.auth.me.useQuery();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const SidebarContent = () => (
    <>
      <div className="px-6 py-8">
        <Link href="/dashboard" className="flex items-center gap-2" onClick={closeMobileMenu}>
          <div className="h-8 w-8 rounded-lg bg-violet-600 flex items-center justify-center shadow-md shadow-violet-200">
            <span className="text-white font-bold text-lg leading-none">A</span>
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900">Anmol Admin</span>
        </Link>
        <div className="mt-6 flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-700 font-bold">
            {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || user?.phone?.[0]}
          </div>
          <div className="flex flex-col min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900">{user?.name || 'Admin'}</p>
            <p className="truncate text-xs text-slate-500">{user?.role}</p>
          </div>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1.5 px-4 pb-4 overflow-y-auto">
        <p className="px-3 text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Menu</p>
        {links
          .filter((l) => !l.adminOnly || user?.role === 'ADMIN')
          .map((link) => {
            const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={closeMobileMenu}
                className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                  active
                    ? 'bg-violet-600 text-white shadow-md shadow-violet-200'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon size={18} className={active ? 'text-white' : 'text-slate-400 group-hover:text-slate-600 transition-colors'} />
                {link.label}
              </Link>
            );
          })}
      </nav>

      <div className="border-t border-slate-200 p-4">
        <button
          type="button"
          onClick={() => {
            closeMobileMenu();
            logout();
          }}
          className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-600 transition-colors hover:bg-rose-50 hover:text-rose-700"
        >
          <LogOut size={18} className="text-slate-400 group-hover:text-rose-500 transition-colors" />
          Sign out
        </button>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans flex-col lg:flex-row">
      {/* Mobile Top Bar */}
      <div className="lg:hidden flex items-center justify-between p-4 border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-40">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-violet-600 flex items-center justify-center shadow-md shadow-violet-200">
            <span className="text-white font-bold text-lg leading-none">A</span>
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900">Anmol</span>
        </Link>
        <button
          onClick={toggleMobileMenu}
          className="p-2 -mr-2 text-slate-600 hover:text-slate-900 focus:outline-none"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden backdrop-blur-sm transition-opacity" 
          onClick={closeMobileMenu}
        />
      )}

      {/* Mobile Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out lg:hidden flex flex-col ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <SidebarContent />
      </aside>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col border-r border-slate-200 bg-white/60 backdrop-blur-xl sticky top-0 h-screen overflow-hidden">
        <SidebarContent />
      </aside>

      <main className="flex-1 w-full lg:w-auto p-4 sm:p-6 lg:p-12 overflow-x-hidden">
        <div className="mx-auto max-w-6xl">
          {children}
        </div>
      </main>
    </div>
  );
}
