'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { trpc } from '../../../lib/trpc';
import { Camera, Pencil, CheckCircle2, Package, MapPin, X, AlertCircle } from 'lucide-react';

export function OverviewTab({ profile, refetch, updateUser }: { profile: any; refetch: () => void; updateUser: (u: any) => void }) {
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
