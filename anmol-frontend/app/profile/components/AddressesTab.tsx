'use client';

import { useState, useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import { MapPin, Plus, Star, X } from 'lucide-react';

export function AddressesTab() {
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
