'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useDebounce } from '@/hooks/use-debounce';
import { PageHeader } from '@/components/page-header';
import { Card, Badge, Spinner, Input, Button } from '@/components/ui';
import { trpc } from '@/lib/trpc';
import { Users, Search, MessageCircle, Send, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function CustomersPage() {
  return (
    <Suspense fallback={<div className="p-12 flex justify-center"><Spinner size={32} /></div>}>
      <CustomersContent />
    </Suspense>
  );
}

function CustomersContent() {
  const searchParams = useSearchParams();
  const highlightId = searchParams?.get('highlight');

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 500);
  
  const [isCampaignOpen, setIsCampaignOpen] = useState(false);
  const [segment, setSegment] = useState('ALL');
  const [message, setMessage] = useState('');

  const campaignMutation = trpc.user.sendMarketingCampaign.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      setIsCampaignOpen(false);
      setMessage('');
    },
    onError: (error) => toast.error(error.message),
  });

  const polishMutation = trpc.user.polishMessage.useMutation({
    onSuccess: (data) => {
      setMessage(data);
      toast.success('Message polished successfully!');
    },
    onError: (error) => toast.error(error.message),
  });

  const { data: customers, isLoading } = trpc.user.getCustomers.useQuery(undefined, {
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    retry: false,
  });

  const filteredCustomers = useMemo(() => {
    if (!customers) return [];
    if (!debouncedSearch) return customers;
    const lowerSearch = debouncedSearch.toLowerCase();
    return customers.filter((c: any) => 
      (c.name && c.name.toLowerCase().includes(lowerSearch)) ||
      (c.phone && c.phone.toLowerCase().includes(lowerSearch))
    );
  }, [customers, debouncedSearch]);

  useEffect(() => {
    if (highlightId && customers) {
      setTimeout(() => {
        const el = document.getElementById(`customer-row-${highlightId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.classList.add('bg-violet-100');
          setTimeout(() => el.classList.remove('bg-violet-100'), 3000);
        }
      }, 300);
    }
  }, [highlightId, customers]);

  return (
    <div className="pb-12">
      <PageHeader 
        title="Customers" 
        description="Manage your registered customers and view their order history." 
      />

      <div className="mt-6 mb-2 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={16} className="text-slate-400" />
          </div>
          <Input
            className="pl-10"
            placeholder="Search customers by name or phone…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <Button 
          className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
          onClick={() => setIsCampaignOpen(true)}
        >
          <MessageCircle size={18} />
          New Campaign
        </Button>
        
        {isCampaignOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
              <h3 className="mb-4 text-lg font-bold text-slate-900">Send WhatsApp Campaign</h3>
              <div className="grid gap-4 py-4">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-slate-700">Target Audience</label>
                  <select 
                    value={segment} 
                    onChange={(e) => setSegment(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                  >
                    <option value="ALL">All Customers</option>
                    <option value="VIP">VIP (High LTV)</option>
                    <option value="REGULAR">Regular</option>
                    <option value="DORMANT">Dormant (3+ months)</option>
                    <option value="NEW">New (No orders)</option>
                  </select>
                </div>
                <div className="flex flex-col gap-2 relative">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-medium text-slate-700">Message</label>
                    <button
                      type="button"
                      onClick={() => polishMutation.mutate({ message })}
                      disabled={!message || polishMutation.isPending}
                      className="text-xs flex items-center gap-1 font-semibold text-violet-600 hover:text-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      {polishMutation.isPending ? <Spinner size={12} /> : <Sparkles size={12} />}
                      AI Polish
                    </button>
                  </div>
                  <textarea 
                    className="w-full min-h-[120px] rounded-lg border border-slate-200 bg-white p-3 text-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 resize-none"
                    placeholder="e.g. 🎉 Diwali Special! Flat 20% off on all items..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                  />
                </div>
              </div>
              <div className="mt-4 flex justify-end gap-3">
                <Button variant="outline" onClick={() => setIsCampaignOpen(false)}>Cancel</Button>
                <Button 
                  onClick={() => campaignMutation.mutate({ segment: segment as any, message })}
                  disabled={!message || message.length < 5 || campaignMutation.isPending}
                  className="gap-2 bg-violet-600 text-white hover:bg-violet-700"
                >
                  {campaignMutation.isPending ? <Spinner size={16} /> : <Send size={16} />}
                  Send Broadcast
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ring-1 ring-slate-900/5 mt-4">
        {isLoading ? (
          <div className="p-12 flex flex-col items-center justify-center text-slate-400">
            <Spinner size={32} className="mb-4" />
            <p className="text-sm font-medium">Loading customers...</p>
          </div>
        ) : !customers?.length ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 mb-4">
              <Users size={24} />
            </div>
            <p className="text-lg font-medium text-slate-900 mb-2">No customers found</p>
            <p className="text-sm text-slate-500 max-w-md">
              When users register on your storefront, they will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-150 text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Contact</th>
                  <th className="px-6 py-4 text-center">Segment</th>
                  <th className="px-6 py-4 text-right">LTV / Orders</th>
                  <th className="px-6 py-4 text-right">Date Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCustomers.map((c: any) => (
                  <tr key={c.id} id={`customer-row-${c.id}`} className="hover:bg-slate-50/50 transition-all duration-700 group">
                    <td className="px-6 py-4">
                      <Link href={`/customers/${c.id}`} className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-700 font-bold text-sm">
                          {c.name ? c.name.charAt(0).toUpperCase() : '?'}
                        </div>
                        <span className="font-semibold text-slate-900 whitespace-nowrap group-hover:text-violet-700">{c.name || 'Unnamed'}</span>
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-slate-600 whitespace-nowrap">{c.phone || '-'}</td>
                    <td className="px-6 py-4 text-center whitespace-nowrap">
                      {c.segment === 'VIP' && <Badge variant="default" className="bg-amber-100 text-amber-700 hover:bg-amber-100 font-bold border-0 shadow-sm">🏆 VIP</Badge>}
                      {c.segment === 'NEW' && <Badge variant="info" className="bg-blue-50 text-blue-700 hover:bg-blue-50 border-0">New</Badge>}
                      {c.segment === 'REGULAR' && <Badge variant="success" className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border-0">Regular</Badge>}
                      {c.segment === 'DORMANT' && <Badge variant="default" className="text-slate-500 border-slate-200 bg-slate-50">Dormant</Badge>}
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <div className="flex flex-col items-end">
                        <span className="font-semibold text-slate-800">
                          ₹{c.ltv?.toLocaleString('en-IN') || 0}
                        </span>
                        <span className="text-xs text-slate-500 mt-1">
                          {c._count.orders} order{c._count.orders !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right text-slate-500 whitespace-nowrap">
                      {new Date(c.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
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
