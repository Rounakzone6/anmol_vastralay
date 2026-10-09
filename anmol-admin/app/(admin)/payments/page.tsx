'use client';

import { useState, useEffect, useMemo } from 'react';
import { PageHeader } from '@/components/page-header';
import { useDebounce } from '@/hooks/use-debounce';
import { Badge, Spinner, Input } from '@/components/ui';
import { trpc } from '@/lib/trpc';
import { X, CreditCard, User, FileText, Hash, Calendar, Search } from 'lucide-react';

const STATUS_VARIANTS: Record<string, "success" | "warning" | "danger" | "info" | "default"> = {
  COMPLETED: 'success',
  PENDING: 'warning',
  FAILED: 'danger',
  REFUNDED: 'info',
};

function PaymentDetailsModal({ payment, onClose }: { payment: any; onClose: () => void }) {
  if (!payment) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div 
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" 
        onClick={onClose} 
      />
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden ring-1 ring-slate-900/5 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-violet-600" />
            Transaction Details
          </h3>
          <button 
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Amount</p>
              <p className="text-3xl font-bold text-slate-900">
                ₹{Number(payment.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <Badge variant={STATUS_VARIANTS[payment.status] || 'default'} className="px-3 py-1 text-sm">
              {payment.status}
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-1">
                <Hash className="h-4 w-4 text-slate-400" /> Transaction ID
              </div>
              <p className="font-mono text-sm text-slate-900 break-all">{payment.transactionId || 'N/A'}</p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-1">
                <FileText className="h-4 w-4 text-slate-400" /> Order ID
              </div>
              <p className="font-mono text-sm text-slate-900 break-all">{payment.orderId}</p>
            </div>
            
            <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-1">
                <User className="h-4 w-4 text-slate-400" /> Customer
              </div>
              <p className="text-sm text-slate-900 font-medium">{payment.user.name || 'N/A'}</p>
              <p className="text-xs text-slate-500">{payment.user.phone || payment.user.email}</p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-1">
                <Calendar className="h-4 w-4 text-slate-400" /> Date & Time
              </div>
              <p className="text-sm text-slate-900">
                {new Date(payment.createdAt).toLocaleDateString()}
              </p>
              <p className="text-xs text-slate-500">
                {new Date(payment.createdAt).toLocaleTimeString()}
              </p>
            </div>
          </div>
          
          {payment.paymentMethod && (
            <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
              <p className="text-sm font-semibold text-slate-700 mb-1">Payment Method</p>
              <p className="text-sm text-slate-900">{payment.paymentMethod}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PaymentsPage() {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 500);

  const { data: payments, isLoading } = trpc.payment.adminGetPayments.useQuery();
  const [selectedPayment, setSelectedPayment] = useState<any>(null);

  const filteredOnlinePayments = useMemo(() => {
    const onlinePayments = payments?.filter(p => p.transactionId && p.paymentMethod !== 'COD') || [];
    if (!debouncedSearch) return onlinePayments;
    const lowerSearch = debouncedSearch.toLowerCase();
    return onlinePayments.filter((p: any) => 
      (p.transactionId && p.transactionId.toLowerCase().includes(lowerSearch)) ||
      (p.orderId && p.orderId.toLowerCase().includes(lowerSearch)) ||
      (p.user?.name && p.user.name.toLowerCase().includes(lowerSearch)) ||
      (p.user?.phone && p.user.phone.toLowerCase().includes(lowerSearch))
    );
  }, [payments, debouncedSearch]);

  return (
    <div className="pb-12">
      <PageHeader 
        title="Online Payments" 
        description="Track and manage all online transactions across the platform." 
      />

      <div className="mt-6 mb-2 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={16} className="text-slate-400" />
          </div>
          <Input
            className="pl-10"
            placeholder="Search by transaction ID, order ID, or customer…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ring-1 ring-slate-900/5 mt-4">
        {isLoading ? (
          <div className="p-12 flex flex-col items-center justify-center text-slate-400">
            <Spinner size={32} className="mb-4" />
            <p className="text-sm font-medium">Loading payments...</p>
          </div>
        ) : !filteredOnlinePayments.length ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <CreditCard className="h-10 w-10 text-slate-300 mb-3" />
            <p className="text-lg font-medium text-slate-900 mb-2">No online payments found</p>
            <p className="text-sm text-slate-500 max-w-md">
              Successful online transactions will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Transaction ID</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOnlinePayments.map((payment: any) => (
                  <tr key={payment.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-slate-600">
                      {payment.transactionId?.slice(0, 16) || '—'}...
                    </td>
                    <td className="px-6 py-4 text-slate-500 whitespace-nowrap">
                      {new Date(payment.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">{payment.user.name || '—'}</div>
                      <div className="text-xs text-slate-500">{payment.user.phone || payment.user.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-slate-900">
                        ₹{Number(payment.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={STATUS_VARIANTS[payment.status] || 'default'}>
                        {payment.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setSelectedPayment(payment)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-violet-300 hover:text-violet-700 transition-colors bg-white"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedPayment && (
        <PaymentDetailsModal 
          payment={selectedPayment} 
          onClose={() => setSelectedPayment(null)} 
        />
      )}
    </div>
  );
}
