'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button, Card, Input, Label, Select, Badge } from '@/components/ui';
import { formatDate } from '@/lib/format';
import { trpc } from '@/lib/trpc';
import { Plus, ShieldAlert, Shield } from 'lucide-react';

export default function StaffPage() {
  const utils = trpc.useUtils();
  const { data: me } = trpc.auth.me.useQuery();
  const { data: staff, isLoading, error } = trpc.user.getUsers.useQuery(undefined, {
    retry: false,
  });
  const create = trpc.user.createUser.useMutation({
    onSuccess: () => {
      utils.user.getUsers.invalidate();
      setShowForm(false);
    },
  });

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'ADMIN' | 'STAFF'>('STAFF');

  if (me?.role !== 'ADMIN') {
    return (
      <div className="pb-12 max-w-3xl mx-auto mt-12 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-rose-100 text-rose-600 mx-auto mb-6">
          <ShieldAlert size={32} />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Access Denied</h2>
        <p className="text-slate-500">Only administrators have permission to view and manage staff accounts.</p>
      </div>
    );
  }

  return (
    <div className="pb-12">
      <PageHeader
        title="Staff Management"
        description="Add and manage administrator and staff accounts for your storefront."
        action={
          <Button type="button" onClick={() => setShowForm((v) => !v)}>
            {showForm ? 'Cancel' : (
              <>
                <Plus size={16} className="mr-2" />
                Add Staff Member
              </>
            )}
          </Button>
        }
      />

      {showForm ? (
        <Card className="mb-8 border-violet-100 ring-violet-50">
          <form
            className="grid gap-6 md:grid-cols-2 p-2"
            onSubmit={(e) => {
              e.preventDefault();
              create.mutate({ name, email, password, role });
              setName('');
              setEmail('');
              setPassword('');
            }}
          >
            <div>
              <Label>Full Name</Label>
              <Input 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                required 
                placeholder="e.g., Jane Doe"
              />
            </div>
            <div>
              <Label>Email Address</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="jane@example.com"
              />
            </div>
            <div>
              <Label>Temporary Password</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                placeholder="At least 6 characters"
              />
            </div>
            <div>
              <Label>Role Access</Label>
              <Select value={role} onChange={(e) => setRole(e.target.value as 'ADMIN' | 'STAFF')}>
                <option value="STAFF">Staff (Limited Access)</option>
                <option value="ADMIN">Administrator (Full Access)</option>
              </Select>
            </div>
            <div className="md:col-span-2 flex justify-end mt-2">
              <Button type="submit" disabled={create.isPending}>
                Create Account
              </Button>
            </div>
          </form>
        </Card>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ring-1 ring-slate-900/5 mt-6">
        {isLoading ? (
          <p className="p-8 text-center text-sm font-medium text-slate-500">Loading staff directory…</p>
        ) : error ? (
          <div className="p-8 text-center flex flex-col items-center justify-center text-rose-600 bg-rose-50/50">
            <ShieldAlert size={24} className="mb-2" />
            <p className="text-sm font-medium">{error.message}</p>
          </div>
        ) : !staff?.length ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 mb-4">
              <Shield size={24} />
            </div>
            <p className="text-lg font-medium text-slate-900 mb-2">No staff accounts found</p>
            <p className="text-sm text-slate-500 max-w-md">
              You haven't added any team members yet. Click "Add Staff Member" to get started.
            </p>
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Contact</th>
                <th className="px-6 py-4">Role Status</th>
                <th className="px-6 py-4 text-right">Date Added</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {staff.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${u.role === 'ADMIN' ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'}`}>
                        {u.name ? u.name.charAt(0).toUpperCase() : '?'}
                      </div>
                      <span className="font-semibold text-slate-900">{u.name || 'Unnamed'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600">{u.email}</td>
                  <td className="px-6 py-4">
                    {u.role === 'ADMIN' ? (
                      <Badge variant="default" className="bg-indigo-50 text-indigo-700 border-indigo-200 border">Administrator</Badge>
                    ) : (
                      <Badge variant="default" className="bg-emerald-50 text-emerald-700 border-emerald-200 border">Staff Member</Badge>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right text-slate-500">{formatDate(u.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
