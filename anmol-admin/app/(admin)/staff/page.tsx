'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button, Card, Input, Label, Select } from '@/components/ui';
import { formatDate } from '@/lib/format';
import { trpc } from '@/lib/trpc';

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
      <Card>
        <p className="text-sm text-zinc-600">Only admins can manage staff accounts.</p>
      </Card>
    );
  }

  return (
    <div>
      <PageHeader
        title="Staff"
        description="Admin and staff logins for your team"
        action={
          <Button type="button" onClick={() => setShowForm((v) => !v)}>
            {showForm ? 'Cancel' : 'Add staff'}
          </Button>
        }
      />

      {showForm ? (
        <Card className="mb-8">
          <form
            className="grid gap-4 md:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault();
              create.mutate({ name, email, password, role });
              setName('');
              setEmail('');
              setPassword('');
            }}
          >
            <div>
              <Label>Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <Label>Password</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <div>
              <Label>Role</Label>
              <Select value={role} onChange={(e) => setRole(e.target.value as 'ADMIN' | 'STAFF')}>
                <option value="STAFF">Staff</option>
                <option value="ADMIN">Admin</option>
              </Select>
            </div>
            <div className="md:col-span-2">
              <Button type="submit" disabled={create.isPending}>
                Create account
              </Button>
            </div>
          </form>
        </Card>
      ) : null}

      <Card className="overflow-hidden p-0">
        {isLoading ? (
          <p className="p-6 text-sm text-zinc-500">Loading…</p>
        ) : error ? (
          <p className="p-6 text-sm text-red-600">{error.message}</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-zinc-50 text-zinc-600">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Joined</th>
              </tr>
            </thead>
            <tbody>
              {staff?.map((u) => (
                <tr key={u.id} className="border-b last:border-0">
                  <td className="px-4 py-3 font-medium">{u.name}</td>
                  <td className="px-4 py-3">{u.email}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        u.role === 'ADMIN' ? 'bg-violet-100 text-violet-800' : 'bg-zinc-100'
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-zinc-500">{formatDate(u.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
