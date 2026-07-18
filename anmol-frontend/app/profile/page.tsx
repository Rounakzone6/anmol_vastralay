'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/lib/useAuth';
import { trpc } from '@/lib/trpc';
import {
  User, MapPin, Shield, Package, LogOut, Camera, Trash2, X, Plus, Star,
  CheckCircle2, AlertCircle, Pencil, Eye, EyeOff, Lock, Mail, Phone, Calendar
} from 'lucide-react';

import { OverviewTab } from '@/app/profile/components/OverviewTab';
import { AddressesTab } from '@/app/profile/components/AddressesTab';
import { SecurityTab } from '@/app/profile/components/SecurityTab';

type TabKey = 'overview' | 'addresses' | 'security';

function ProfileContent() {
  const { isAuthenticated, logout, updateUser, isHydrated } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isClient, setIsClient] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('overview');

  useEffect(() => {
    setIsClient(true);
    if (isHydrated && !isAuthenticated) {
      router.push('/login?redirect=/profile');
    }
  }, [isHydrated, isAuthenticated, router]);

  // Read tab from URL
  useEffect(() => {
    const tab = searchParams?.get('tab');
    if (tab && ['overview', 'addresses', 'security'].includes(tab)) {
      setActiveTab(tab as TabKey);
    }
  }, [searchParams]);

  const profileQuery = trpc.customer.getProfile.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const profile = profileQuery.data;

  if (!isClient || !isHydrated || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin h-8 w-8 border-4 border-[#85142b] border-t-transparent rounded-full" />
      </div>
    );
  }

  const tabs: { key: TabKey; label: string; icon: React.ElementType }[] = [
    { key: 'overview', label: 'Overview', icon: User },
    { key: 'addresses', label: 'Addresses', icon: MapPin },
    { key: 'security', label: 'Security', icon: Shield },
  ];

  const initials = (profile?.name || 'U')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Profile Header */}
      <div className="bg-gradient-to-br from-[#1a0a10] via-[#2d0b18] to-[#85142b]">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="flex flex-col sm:flex-row items-center gap-5">
            {/* Avatar */}
            <div className="relative group">
              {profile?.profileImage ? (
                <Image
                  src={profile.profileImage}
                  alt={profile.name || 'Profile'}
                  width={96}
                  height={96}
                  className="rounded-full object-cover border-4 border-white/20 w-24 h-24"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-white/10 border-4 border-white/20 flex items-center justify-center text-white text-2xl font-bold">
                  {initials}
                </div>
              )}
            </div>
            <div className="text-center sm:text-left">
              <h1 className="text-2xl sm:text-3xl font-bold text-white">{profile?.name || 'User'}</h1>
              <div className="flex flex-wrap items-center gap-3 mt-2 justify-center sm:justify-start">
                {profile?.email && (
                  <span className="inline-flex items-center gap-1.5 text-sm text-white/60">
                    <Mail size={14} />
                    {profile.email}
                    {profile.emailVerified && <CheckCircle2 size={14} className="text-green-400" />}
                  </span>
                )}
                {profile?.phone && (
                  <span className="inline-flex items-center gap-1.5 text-sm text-white/60">
                    <Phone size={14} />
                    {profile.phone}
                    {profile.phoneVerified && <CheckCircle2 size={14} className="text-green-400" />}
                  </span>
                )}
              </div>
              <p className="text-xs text-white/40 mt-1">
                Member since {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) : '—'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="sticky top-[calc(theme(spacing.20)+32px)] z-40 bg-white border-b border-gray-200 shadow-sm">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="flex gap-0 overflow-x-auto no-scrollbar">
            {tabs.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === key
                    ? 'border-[#85142b] text-[#85142b]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon size={16} />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && <OverviewTab profile={profile} refetch={profileQuery.refetch} updateUser={updateUser} />}
        {activeTab === 'addresses' && <AddressesTab />}
        {activeTab === 'security' && <SecurityTab profile={profile} logout={logout} />}
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin h-8 w-8 border-4 border-[#85142b] border-t-transparent rounded-full" />
      </div>
    }>
      <ProfileContent />
    </Suspense>
  );
}


