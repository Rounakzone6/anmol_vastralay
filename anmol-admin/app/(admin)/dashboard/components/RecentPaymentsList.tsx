import { Badge, Spinner } from '@/components/ui';
import { formatCurrency } from '@/lib/format';
import { CheckCircle2, Clock, CreditCard } from 'lucide-react';
import { motion } from 'framer-motion';

type RecentPaymentsListProps = {
  payments: any;
  onlinePayments: any;
};

export function RecentPaymentsList({ payments, onlinePayments }: RecentPaymentsListProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6, duration: 0.5 }}
      className="mt-12"
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Recent Online Payments</h2>
      </div>
      
      <div className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white/80 backdrop-blur-xl shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm min-w-[800px]">
            <thead className="bg-slate-50/50 text-slate-600 font-semibold border-b border-slate-200/60">
              <tr>
                <th className="px-6 py-4 uppercase tracking-wider text-xs">Date</th>
                <th className="px-6 py-4 uppercase tracking-wider text-xs">Customer</th>
                <th className="px-6 py-4 uppercase tracking-wider text-xs">Amount</th>
                <th className="px-6 py-4 uppercase tracking-wider text-xs">Ref ID (Txn ID)</th>
                <th className="px-6 py-4 uppercase tracking-wider text-xs">Method</th>
                <th className="px-6 py-4 uppercase tracking-wider text-xs">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/80">
              {!payments && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <Spinner className="mx-auto" />
                    <p className="mt-4 text-sm text-slate-500">Loading payments...</p>
                  </td>
                </tr>
              )}
              {onlinePayments.slice(0, 10).map((payment: any) => (
                <tr key={payment.id} className="hover:bg-blue-50/30 transition-colors group">
                  <td className="px-6 py-4 text-slate-600 whitespace-nowrap">
                    {new Date(payment.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-900">{payment.user?.name || 'Unknown'}</div>
                    <div className="text-xs text-slate-500">{payment.user?.phone || payment.user?.email || 'No contact info'}</div>
                  </td>
                  <td className="px-6 py-4 text-slate-700 font-medium whitespace-nowrap">
                    {formatCurrency(Number(payment.amount))}
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-slate-600 whitespace-nowrap">
                    {payment.transactionId || 'N/A'}
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant="default" className="bg-blue-100/80 text-blue-700 font-medium border-blue-200/60 whitespace-nowrap">
                      {payment.paymentMethod || 'ONLINE'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {payment.status === 'COMPLETED' ? (
                      <span className="flex items-center gap-1.5 text-emerald-700 text-sm font-medium">
                        <CheckCircle2 size={16} className="text-emerald-500" />
                        Completed
                      </span>
                    ) : payment.status === 'PENDING' ? (
                      <span className="flex items-center gap-1.5 text-amber-700 text-sm font-medium">
                        <Clock size={16} className="text-amber-500" />
                        Pending
                      </span>
                    ) : (
                       <Badge variant="default" className="bg-slate-100/80 text-slate-700 border-slate-200/60">{payment.status}</Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {payments && onlinePayments.length === 0 && (
          <div className="p-12 text-center flex flex-col items-center justify-center text-slate-500">
            <CreditCard className="h-12 w-12 text-slate-300 mb-4" />
            <p className="text-lg font-medium text-slate-900">No online payments yet</p>
            <p className="text-sm">Online transactions will appear here.</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
