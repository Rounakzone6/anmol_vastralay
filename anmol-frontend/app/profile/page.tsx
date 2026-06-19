'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '../../lib/useAuth';
import { trpc } from '../../lib/trpc';
import {
  User, MapPin, Shield, Package, LogOut, Camera, Trash2, X, Plus, Star,
  CheckCircle2, AlertCircle, Pencil, Eye, EyeOff, Lock, Mail, Phone, Calendar
} from 'lucide-react';

type TabKey = 'overview' | 'addresses' | 'security';

export default function ProfilePage() {
  const { isAuthenticated, logout, updateUser } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isClient, setIsClient] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('overview');

  useEffect(() => {
    setIsClient(true);
    if (!isAuthenticated) {
      router.push('/login?redirect=/profile');
    }
  }, [isAuthenticated, router]);

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

  if (!isClient || !isAuthenticated) {
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

/* ─── Overview Tab ───────────────────────────────────────────── */
function OverviewTab({ profile, refetch, updateUser }: { profile: any; refetch: () => void; updateUser: (u: any) => void }) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(profile?.name || '');
  const [gender, setGender] = useState(profile?.gender || '');
  const [dateOfBirth, setDateOfBirth] = useState(
    profile?.dateOfBirth ? new Date(profile.dateOfBirth).toISOString().split('T')[0] : ''
  );
  const [showOtpModal, setShowOtpModal] = useState<{ type: 'EMAIL' | 'PHONE'; target: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateMutation = trpc.customer.updateProfile.useMutation({
    onSuccess: (data) => {
      refetch();
      updateUser(data);
      setIsEditing(false);
    },
  });

  const uploadMutation = trpc.customer.uploadProfileImage.useMutation({
    onSuccess: () => refetch(),
  });

  const removeMutation = trpc.customer.removeProfileImage.useMutation({
    onSuccess: () => refetch(),
  });

  const handleSave = () => {
    updateMutation.mutate({
      name: name || undefined,
      gender: gender || null,
      dateOfBirth: dateOfBirth || null,
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be less than 5MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      uploadMutation.mutate({ image: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  const initials = (profile?.name || 'U')
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="space-y-6">
      {/* Profile Image Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Profile Photo</h3>
        <div className="flex items-center gap-6">
          <div className="relative group">
            {profile?.profileImage ? (
              <Image
                src={profile.profileImage}
                alt="Profile"
                width={80}
                height={80}
                className="rounded-full object-cover w-20 h-20 border-2 border-gray-200"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#85142b] to-[#b01e3f] flex items-center justify-center text-white text-xl font-bold">
                {initials}
              </div>
            )}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Camera size={20} className="text-white" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleImageUpload}
            />
          </div>
          <div className="space-y-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadMutation.isPending}
              className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              {uploadMutation.isPending ? 'Uploading...' : 'Upload Photo'}
            </button>
            {profile?.profileImage && (
              <button
                onClick={() => removeMutation.mutate()}
                disabled={removeMutation.isPending}
                className="ml-2 px-4 py-2 text-sm font-medium rounded-lg text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                Remove
              </button>
            )}
            <p className="text-xs text-gray-400">JPG, PNG or WebP. Max 5MB.</p>
          </div>
        </div>
      </div>

      {/* Personal Info Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-[#85142b] hover:bg-red-50 rounded-lg transition-colors"
            >
              <Pencil size={14} /> Edit
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => setIsEditing(false)}
                className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={updateMutation.isPending}
                className="px-4 py-1.5 text-sm font-semibold bg-[#85142b] text-white rounded-lg hover:bg-[#6c1023] transition-colors disabled:opacity-50"
              >
                {updateMutation.isPending ? 'Saving...' : 'Save'}
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Name */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Full Name</label>
            {isEditing ? (
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[#85142b] focus:ring-1 focus:ring-[#85142b]/20 focus:outline-none"
                placeholder="Your full name"
              />
            ) : (
              <p className="text-sm text-gray-900 py-2.5">{profile?.name || '—'}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Email</label>
            <div className="flex items-center gap-2">
              <p className="text-sm text-gray-900 py-2.5 flex-1">{profile?.email || '—'}</p>
              {profile?.email && (
                profile?.emailVerified ? (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                    <CheckCircle2 size={12} /> Verified
                  </span>
                ) : (
                  <button
                    onClick={() => setShowOtpModal({ type: 'EMAIL', target: profile.email! })}
                    className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded-full hover:bg-amber-100 transition-colors"
                  >
                    Verify
                  </button>
                )
              )}
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Phone</label>
            <div className="flex items-center gap-2">
              <p className="text-sm text-gray-900 py-2.5 flex-1">{profile?.phone || '—'}</p>
              {profile?.phone && (
                profile?.phoneVerified ? (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                    <CheckCircle2 size={12} /> Verified
                  </span>
                ) : (
                  <button
                    onClick={() => setShowOtpModal({ type: 'PHONE', target: profile.phone! })}
                    className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded-full hover:bg-amber-100 transition-colors"
                  >
                    Verify
                  </button>
                )
              )}
            </div>
          </div>

          {/* Gender */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Gender</label>
            {isEditing ? (
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm bg-white focus:border-[#85142b] focus:ring-1 focus:ring-[#85142b]/20 focus:outline-none"
              >
                <option value="">Select gender</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            ) : (
              <p className="text-sm text-gray-900 py-2.5 capitalize">
                {profile?.gender ? profile.gender.toLowerCase() : '—'}
              </p>
            )}
          </div>

          {/* Date of Birth */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Date of Birth</label>
            {isEditing ? (
              <input
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[#85142b] focus:ring-1 focus:ring-[#85142b]/20 focus:outline-none"
              />
            ) : (
              <p className="text-sm text-gray-900 py-2.5">
                {profile?.dateOfBirth
                  ? new Date(profile.dateOfBirth).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })
                  : '—'}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Link href="/orders" className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 hover:border-[#85142b]/30 transition-colors">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-[#85142b]/10 flex items-center justify-center">
              <Package size={18} className="text-[#85142b]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{profile?._count?.orders || 0}</p>
              <p className="text-xs text-gray-500">Orders</p>
            </div>
          </div>
        </Link>
        <Link href="/profile?tab=addresses" className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 hover:border-[#85142b]/30 transition-colors">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <MapPin size={18} className="text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{profile?._count?.addresses || 0}</p>
              <p className="text-xs text-gray-500">Addresses</p>
            </div>
          </div>
        </Link>
      </div>

      {/* OTP Modal */}
      {showOtpModal && (
        <OtpModal
          type={showOtpModal.type}
          target={showOtpModal.target}
          onClose={() => setShowOtpModal(null)}
          onVerified={() => { setShowOtpModal(null); refetch(); }}
        />
      )}
    </div>
  );
}

/* ─── OTP Verification Modal ────────────────────────────────── */
function OtpModal({
  type,
  target,
  onClose,
  onVerified,
}: {
  type: 'EMAIL' | 'PHONE';
  target: string;
  onClose: () => void;
  onVerified: () => void;
}) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const sendMutation = trpc.customer.sendOtp.useMutation({
    onSuccess: () => {
      setSent(true);
      setCountdown(60);
      setError('');
    },
    onError: (err) => setError(err.message),
  });

  const verifyMutation = trpc.customer.verifyOtp.useMutation({
    onSuccess: () => onVerified(),
    onError: (err) => setError(err.message),
  });

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleSendOtp = () => {
    setError('');
    sendMutation.mutate({ type, target });
  };

  const handleVerify = () => {
    if (code.length !== 6) {
      setError('Please enter the 6-digit OTP');
      return;
    }
    setError('');
    verifyMutation.mutate({ type, code });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">
            Verify {type === 'EMAIL' ? 'Email' : 'Phone'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <p className="text-sm text-gray-600">
            {!sent
              ? `We'll send a 6-digit OTP to ${target}`
              : `Enter the 6-digit OTP sent to ${target}`}
          </p>

          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
              <AlertCircle size={14} /> {error}
            </div>
          )}

          {!sent ? (
            <button
              onClick={handleSendOtp}
              disabled={sendMutation.isPending}
              className="w-full py-3 rounded-lg bg-[#85142b] text-white text-sm font-semibold hover:bg-[#6c1023] transition-colors disabled:opacity-50"
            >
              {sendMutation.isPending ? 'Sending...' : 'Send OTP'}
            </button>
          ) : (
            <>
              <input
                type="text"
                maxLength={6}
                placeholder="Enter 6-digit OTP"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="w-full text-center text-2xl tracking-[0.5em] font-mono py-3 rounded-lg border border-gray-300 focus:border-[#85142b] focus:ring-1 focus:ring-[#85142b]/20 focus:outline-none"
                autoFocus
              />
              <button
                onClick={handleVerify}
                disabled={verifyMutation.isPending || code.length !== 6}
                className="w-full py-3 rounded-lg bg-[#85142b] text-white text-sm font-semibold hover:bg-[#6c1023] transition-colors disabled:opacity-50"
              >
                {verifyMutation.isPending ? 'Verifying...' : 'Verify OTP'}
              </button>
              <button
                onClick={handleSendOtp}
                disabled={countdown > 0 || sendMutation.isPending}
                className="w-full text-center text-sm text-gray-500 hover:text-[#85142b] disabled:text-gray-300 transition-colors"
              >
                {countdown > 0 ? `Resend in ${countdown}s` : 'Resend OTP'}
              </button>
            </>
          )}

          <p className="text-xs text-gray-400 text-center">
            {process.env.NODE_ENV === 'development' && 'Dev mode: OTP is 123456'}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ─── Addresses Tab ──────────────────────────────────────────── */
function AddressesTab() {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const addressesQuery = trpc.customer.getAddresses.useQuery();
  const addresses = addressesQuery.data || [];

  const deleteMutation = trpc.customer.deleteAddress.useMutation({
    onSuccess: () => addressesQuery.refetch(),
  });

  const setDefaultMutation = trpc.customer.setDefaultAddress.useMutation({
    onSuccess: () => addressesQuery.refetch(),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Delivery Addresses</h3>
        <button
          onClick={() => { setShowForm(true); setEditingId(null); }}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-[#85142b] text-white rounded-lg hover:bg-[#6c1023] transition-colors"
        >
          <Plus size={16} /> Add Address
        </button>
      </div>

      {/* Address Form */}
      {(showForm || editingId) && (
        <AddressForm
          editId={editingId}
          onClose={() => { setShowForm(false); setEditingId(null); }}
          onSaved={() => { setShowForm(false); setEditingId(null); addressesQuery.refetch(); }}
        />
      )}

      {/* Address List */}
      {addresses.length === 0 && !showForm ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
          <MapPin size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">No addresses yet</p>
          <p className="text-sm text-gray-400 mt-1">Add your first delivery address</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map((addr: any) => (
            <div
              key={addr.id}
              className={`bg-white rounded-2xl shadow-sm border p-5 relative transition-colors ${
                addr.isDefault ? 'border-[#85142b]/30 ring-1 ring-[#85142b]/10' : 'border-gray-200'
              }`}
            >
              {addr.isDefault && (
                <span className="absolute top-3 right-3 inline-flex items-center gap-1 text-[10px] font-bold bg-[#85142b] text-white px-2 py-0.5 rounded-full uppercase">
                  <Star size={10} /> Default
                </span>
              )}
              <div className="flex items-start gap-3 mb-3">
                <div className="h-8 w-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <MapPin size={14} className="text-gray-500" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-gray-900">{addr.label}</p>
                  {addr.fullName && <p className="text-xs text-gray-500">{addr.fullName}</p>}
                  {addr.phone && <p className="text-xs text-gray-500">{addr.phone}</p>}
                </div>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">
                {addr.street}, {addr.city}, {addr.state} — {addr.zipCode}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">{addr.country}</p>

              <div className="flex items-center gap-3 mt-4 pt-3 border-t border-gray-100">
                <button
                  onClick={() => setEditingId(addr.id)}
                  className="text-xs font-medium text-[#85142b] hover:underline"
                >
                  Edit
                </button>
                {!addr.isDefault && (
                  <button
                    onClick={() => setDefaultMutation.mutate({ id: addr.id })}
                    className="text-xs font-medium text-blue-600 hover:underline"
                  >
                    Set Default
                  </button>
                )}
                <button
                  onClick={() => {
                    if (confirm('Delete this address?')) deleteMutation.mutate({ id: addr.id });
                  }}
                  className="text-xs font-medium text-red-500 hover:underline ml-auto"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Address Form ───────────────────────────────────────────── */
function AddressForm({ editId, onClose, onSaved }: { editId: string | null; onClose: () => void; onSaved: () => void }) {
  const [label, setLabel] = useState('Home');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [country, setCountry] = useState('India');
  const [zipCode, setZipCode] = useState('');
  const [isDefault, setIsDefault] = useState(false);

  const addressesQuery = trpc.customer.getAddresses.useQuery();

  // Load existing data when editing
  useEffect(() => {
    if (editId && addressesQuery.data) {
      const addr = addressesQuery.data.find((a: any) => a.id === editId);
      if (addr) {
        setLabel(addr.label);
        setFullName(addr.fullName || '');
        setPhone(addr.phone || '');
        setStreet(addr.street);
        setCity(addr.city);
        setState(addr.state);
        setCountry(addr.country);
        setZipCode(addr.zipCode);
        setIsDefault(addr.isDefault);
      }
    }
  }, [editId, addressesQuery.data]);

  const addMutation = trpc.customer.addAddress.useMutation({ onSuccess: onSaved });
  const updateMutation = trpc.customer.updateAddress.useMutation({ onSuccess: onSaved });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editId) {
      updateMutation.mutate({ id: editId, label, fullName, phone, street, city, state, country, zipCode, isDefault });
    } else {
      addMutation.mutate({ label, fullName, phone, street, city, state, country, zipCode, isDefault });
    }
  };

  const isPending = addMutation.isPending || updateMutation.isPending;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-5">
        <h4 className="font-semibold text-gray-900">{editId ? 'Edit Address' : 'Add New Address'}</h4>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X size={18} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Label */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Label</label>
            <select
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm bg-white focus:border-[#85142b] focus:outline-none"
            >
              <option>Home</option>
              <option>Work</option>
              <option>Other</option>
            </select>
          </div>
          {/* Full Name */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Recipient Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[#85142b] focus:outline-none"
              placeholder="Full name"
            />
          </div>
          {/* Phone */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Phone</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[#85142b] focus:outline-none"
              placeholder="9876543210"
            />
          </div>
        </div>

        {/* Street */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Street Address *</label>
          <input
            type="text"
            value={street}
            onChange={(e) => setStreet(e.target.value)}
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[#85142b] focus:outline-none"
            placeholder="House no., Street, Locality"
          />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">City *</label>
            <input type="text" value={city} onChange={(e) => setCity(e.target.value)} required
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[#85142b] focus:outline-none" placeholder="City" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">State *</label>
            <input type="text" value={state} onChange={(e) => setState(e.target.value)} required
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[#85142b] focus:outline-none" placeholder="State" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">PIN Code *</label>
            <input type="text" value={zipCode} onChange={(e) => setZipCode(e.target.value)} required
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[#85142b] focus:outline-none" placeholder="110001" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Country *</label>
            <input type="text" value={country} onChange={(e) => setCountry(e.target.value)} required
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[#85142b] focus:outline-none" placeholder="India" />
          </div>
        </div>

        <label className="flex items-center gap-2">
          <input type="checkbox" checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-[#85142b] focus:ring-[#85142b]" />
          <span className="text-sm text-gray-700">Set as default address</span>
        </label>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={isPending}
            className="px-5 py-2.5 text-sm font-semibold bg-[#85142b] text-white rounded-lg hover:bg-[#6c1023] transition-colors disabled:opacity-50">
            {isPending ? 'Saving...' : editId ? 'Update Address' : 'Save Address'}
          </button>
          <button type="button" onClick={onClose}
            className="px-5 py-2.5 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

/* ─── Security Tab ───────────────────────────────────────────── */
function SecurityTab({ profile, logout }: { profile: any; logout: () => void }) {
  return (
    <div className="space-y-6">
      <ChangePasswordSection />
      <DeleteAccountSection logout={logout} />
    </div>
  );
}

function ChangePasswordSection() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const mutation = trpc.customer.changePassword.useMutation({
    onSuccess: () => {
      setSuccess('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setError('');
    },
    onError: (err) => { setError(err.message); setSuccess(''); },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }
    mutation.mutate({ currentPassword, newPassword });
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-1">Change Password</h3>
      <p className="text-sm text-gray-500 mb-5">Update your password to keep your account secure</p>

      {success && (
        <div className="mb-4 flex items-center gap-2 text-sm text-green-600 bg-green-50 px-4 py-3 rounded-lg">
          <CheckCircle2 size={16} /> {success}
        </div>
      )}
      {error && (
        <div className="mb-4 flex items-center gap-2 text-sm text-red-600 bg-red-50 px-4 py-3 rounded-lg">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">Current Password</label>
          <div className="relative">
            <input
              type={showCurrent ? 'text' : 'password'}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[#85142b] focus:outline-none pr-10"
            />
            <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3 top-2.5 text-gray-400" tabIndex={-1}>
              {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">New Password</label>
          <div className="relative">
            <input
              type={showNew ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[#85142b] focus:outline-none pr-10"
            />
            <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-2.5 text-gray-400" tabIndex={-1}>
              {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">Confirm New Password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={6}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[#85142b] focus:outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={mutation.isPending}
          className="px-5 py-2.5 text-sm font-semibold bg-[#85142b] text-white rounded-lg hover:bg-[#6c1023] transition-colors disabled:opacity-50"
        >
          {mutation.isPending ? 'Changing...' : 'Change Password'}
        </button>
      </form>
    </div>
  );
}

function DeleteAccountSection({ logout }: { logout: () => void }) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [error, setError] = useState('');

  const mutation = trpc.customer.deleteAccount.useMutation({
    onSuccess: () => {
      logout();
    },
    onError: (err) => setError(err.message),
  });

  const handleDelete = () => {
    setError('');
    if (confirmText !== 'DELETE') {
      setError('Please type DELETE to confirm');
      return;
    }
    mutation.mutate({ password, confirmText });
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-red-100 p-6">
      <h3 className="text-lg font-semibold text-red-600 mb-1">Delete Account</h3>
      <p className="text-sm text-gray-500 mb-4">
        Permanently delete your account and all associated data. This action cannot be undone.
      </p>

      {!showConfirm ? (
        <button
          onClick={() => setShowConfirm(true)}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
        >
          <Trash2 size={16} /> Delete my account
        </button>
      ) : (
        <div className="space-y-4 max-w-md p-4 bg-red-50/50 rounded-xl border border-red-100">
          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-100 px-3 py-2 rounded-lg">
              <AlertCircle size={14} /> {error}
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Enter your password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-red-500 focus:outline-none"
              placeholder="Your password"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Type <span className="font-bold text-red-600">DELETE</span> to confirm
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-red-500 focus:outline-none"
              placeholder="DELETE"
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleDelete}
              disabled={mutation.isPending || confirmText !== 'DELETE'}
              className="px-5 py-2.5 text-sm font-semibold bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {mutation.isPending ? 'Deleting...' : 'Permanently Delete'}
            </button>
            <button
              onClick={() => { setShowConfirm(false); setPassword(''); setConfirmText(''); setError(''); }}
              className="px-5 py-2.5 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
