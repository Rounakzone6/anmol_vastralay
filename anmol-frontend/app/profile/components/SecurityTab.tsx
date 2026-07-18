'use client';

import { useState } from 'react';
import { trpc } from '../../../lib/trpc';
import { Trash2, AlertCircle, CheckCircle2, EyeOff, Eye } from 'lucide-react';

export function SecurityTab({ profile, logout }: { profile: any; logout: () => void }) {
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
