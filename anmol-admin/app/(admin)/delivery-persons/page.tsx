'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button, Card, Input, Label, Select, Badge, Spinner } from '@/components/ui';
import { formatDate } from '@/lib/format';
import { trpc } from '@/lib/trpc';
import { Plus, ShieldAlert, Truck, Trash2, Edit } from 'lucide-react';

export default function DeliveryPersonsPage() {
  const utils = trpc.useUtils();
  const { data: me } = trpc.auth.me.useQuery();
  const { data: deliveryPersons, isLoading, error } = trpc.deliveryPerson.getAll.useQuery(undefined, {
    retry: false,
  });
  
  const create = trpc.deliveryPerson.create.useMutation({
    onSuccess: () => {
      utils.deliveryPerson.getAll.invalidate();
      setShowForm(false);
      resetForm();
    },
  });

  const update = trpc.deliveryPerson.update.useMutation({
    onSuccess: () => {
      utils.deliveryPerson.getAll.invalidate();
      setShowForm(false);
      setEditingId(null);
      resetForm();
    },
  });

  const deletePerson = trpc.deliveryPerson.delete.useMutation({
    onSuccess: () => {
      utils.deliveryPerson.getAll.invalidate();
    },
  });

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState<'AVAILABLE' | 'BUSY' | 'OFF_DUTY'>('AVAILABLE');

  const resetForm = () => {
    setName('');
    setPhone('');
    setStatus('AVAILABLE');
  }

  const handleEdit = (person: any) => {
    setEditingId(person.id);
    setName(person.name);
    setPhone(person.phone);
    setStatus(person.status);
    setShowForm(true);
  }

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this delivery person?')) {
      deletePerson.mutate({ id });
    }
  }

  if (me?.role !== 'ADMIN') {
    return (
      <div className="pb-12 max-w-3xl mx-auto mt-12 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-rose-100 text-rose-600 mx-auto mb-6">
          <ShieldAlert size={32} />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Access Denied</h2>
        <p className="text-slate-500">Only administrators have permission to manage delivery personnel.</p>
      </div>
    );
  }

  return (
    <div className="pb-12">
      <PageHeader
        title="Delivery Personnel"
        description="Add and manage delivery boys for order assignment."
        action={
          <Button type="button" onClick={() => {
            if (showForm) {
              setShowForm(false);
              setEditingId(null);
              resetForm();
            } else {
              setShowForm(true);
            }
          }}>
            {showForm ? 'Cancel' : (
              <>
                <Plus size={16} className="mr-2" />
                Add Delivery Person
              </>
            )}
          </Button>
        }
      />

      {showForm && (
        <Card className="mb-8 border-violet-100 ring-violet-50">
          <form
            className="grid gap-6 md:grid-cols-2 p-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (editingId) {
                update.mutate({ id: editingId, name, phone, status });
              } else {
                create.mutate({ name, phone, status });
              }
            }}
          >
            <div>
              <Label>Full Name</Label>
              <Input 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                required 
                placeholder="e.g., John Doe"
              />
            </div>
            <div>
              <Label>Phone Number</Label>
              <Input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                placeholder="10-digit phone number"
              />
            </div>
            <div>
              <Label>Status</Label>
              <Select value={status} onChange={(e) => setStatus(e.target.value as 'AVAILABLE' | 'BUSY' | 'OFF_DUTY')}>
                <option value="AVAILABLE">Available</option>
                <option value="BUSY">Busy</option>
                <option value="OFF_DUTY">Off Duty</option>
              </Select>
            </div>
            <div className="md:col-span-2 flex justify-end mt-2">
              <Button type="submit" disabled={create.isPending || update.isPending}>
                {editingId ? 'Update Delivery Person' : 'Create Delivery Person'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ring-1 ring-slate-900/5 mt-6">
        {isLoading ? (
          <div className="p-12 flex flex-col items-center justify-center text-slate-400">
            <Spinner size={32} className="mb-4" />
            <p className="text-sm font-medium">Loading delivery personnel...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center flex flex-col items-center justify-center text-rose-600 bg-rose-50/50">
            <ShieldAlert size={24} className="mb-2" />
            <p className="text-sm font-medium">{error.message}</p>
          </div>
        ) : !deliveryPersons?.length ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 mb-4">
              <Truck size={24} />
            </div>
            <p className="text-lg font-medium text-slate-900 mb-2">No delivery personnel found</p>
            <p className="text-sm text-slate-500 max-w-md">
              You haven't added any delivery personnel yet. Click "Add Delivery Person" to get started.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm min-w-[600px]">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Phone</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {deliveryPersons.map((p: any) => (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-700 font-bold text-sm">
                          {p.name ? p.name.charAt(0).toUpperCase() : '?'}
                        </div>
                        <span className="font-semibold text-slate-900 whitespace-nowrap">{p.name || 'Unnamed'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 whitespace-nowrap">{p.phone || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {p.status === 'AVAILABLE' ? (
                        <Badge variant="default" className="bg-emerald-50 text-emerald-700 border-emerald-200 border">Available</Badge>
                      ) : p.status === 'BUSY' ? (
                        <Badge variant="default" className="bg-amber-50 text-amber-700 border-amber-200 border">Busy</Badge>
                      ) : (
                        <Badge variant="default" className="bg-slate-100 text-slate-700 border-slate-300 border">Off Duty</Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(p)}>
                          <Edit size={14} />
                        </Button>
                        <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete(p.id)}>
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
