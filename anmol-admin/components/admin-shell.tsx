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
  Bell,
  CreditCard, 
  ShieldCheck, 
  LogOut,
  Menu,
  X,
  Truck,
  MessageCircle,
  LineChart,
  Headset
} from 'lucide-react';
import { StockNotification } from '@/components/stock-notification';

const links = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/forecast', label: 'Demand Forecast', icon: LineChart },
  { href: '/updates', label: 'Updates', icon: Bell },
  { href: '/orders', label: 'Orders', icon: ShoppingCart },
  { href: '/payments', label: 'Payments', icon: CreditCard },
  { href: '/customers', label: 'Customers', icon: Users },
  { href: '/support', label: 'Support (Helpdesk)', icon: Headset },
  { href: '/categories', label: 'Categories', icon: Tags },
  { href: '/products', label: 'Products', icon: Package },
  { href: '/banners', label: 'Banners', icon: ImageIcon },
  { href: '/pos', label: 'POS Billing', icon: CreditCard },
  { href: '/delivery-persons', label: 'Delivery', icon: Truck, adminOnly: true },
  { href: '/staff', label: 'Staff', icon: ShieldCheck, adminOnly: true },
  { href: '/settings/whatsapp', label: 'WhatsApp', icon: MessageCircle, adminOnly: true },
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

  const mobileNavItems = [
    { href: '/dashboard', label: 'Home', icon: LayoutDashboard },
    { href: '/orders', label: 'Orders', icon: ShoppingCart },
    { href: '/products', label: 'Products', icon: Package },
    { href: '/customers', label: 'Users', icon: Users },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans flex-col lg:flex-row print:bg-white print:block">
      {/* Mobile Bottom Navigation Bar */}
      <div className="lg:hidden print:hidden fixed bottom-0 left-0 right-0 z-[60] bg-white/95 backdrop-blur-xl border-t border-slate-200 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] pb-safe">
        <nav className="flex justify-around items-center h-16">
          {mobileNavItems.map((link) => {
            const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={closeMobileMenu}
                className="flex flex-col items-center justify-center w-full h-full space-y-1 relative"
              >
                {active && (
                  <span className="absolute top-0 inset-x-0 mx-auto w-10 h-1 bg-violet-600 rounded-b-md" />
                )}
                <Icon size={22} className={`${active ? 'text-violet-600 scale-110 transition-transform' : 'text-slate-400'}`} />
                <span className={`text-[10px] font-semibold ${active ? 'text-violet-600' : 'text-slate-500'}`}>
                  {link.label}
                </span>
              </Link>
            );
          })}
          
          <button
            onClick={toggleMobileMenu}
            className="flex flex-col items-center justify-center w-full h-full space-y-1 relative"
          >
            {isMobileMenuOpen && (
              <span className="absolute top-0 inset-x-0 mx-auto w-10 h-1 bg-violet-600 rounded-b-md" />
            )}
            <Menu size={22} className={`${isMobileMenuOpen ? 'text-violet-600 scale-110 transition-transform' : 'text-slate-400'}`} />
            <span className={`text-[10px] font-semibold ${isMobileMenuOpen ? 'text-violet-600' : 'text-slate-500'}`}>
              Menu
            </span>
          </button>
        </nav>
      </div>

      {/* Mobile Bottom Sheet Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 z-40 lg:hidden backdrop-blur-sm transition-opacity" 
          onClick={closeMobileMenu}
        />
      )}

      {/* Mobile Bottom Sheet Menu */}
      <aside className={`fixed inset-x-0 bottom-[64px] z-50 max-h-[80vh] rounded-t-3xl bg-white shadow-[0_-20px_40px_rgba(0,0,0,0.2)] transform transition-transform duration-300 ease-out lg:hidden flex flex-col ${isMobileMenuOpen ? 'translate-y-0' : 'translate-y-full'}`}>
        <div className="flex justify-center pt-3 pb-1 cursor-pointer" onClick={closeMobileMenu}>
           <div className="w-12 h-1.5 bg-slate-200 rounded-full" />
        </div>
        <div className="overflow-y-auto pb-6">
          <SidebarContent />
        </div>
      </aside>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex print:hidden w-64 flex-col border-r border-slate-200 bg-white/60 backdrop-blur-xl sticky top-0 h-screen overflow-hidden">
        <SidebarContent />
      </aside>

      <main className={`flex-1 w-full lg:w-auto p-4 sm:p-6 lg:p-12 overflow-x-hidden pb-24 lg:pb-12 print:p-0 print:overflow-visible ${pathname === '/pos' ? 'bg-slate-900' : ''}`}>
        <div className={`mx-auto print:max-w-none ${pathname === '/pos' ? 'max-w-none' : 'max-w-6xl'}`}>
          {pathname !== '/pos' && <div className="print:hidden"><StockNotification /></div>}
          {children}
        </div>
      </main>
    </div>
  );
}
