'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  Mail,
  MapPin,
  Package,
  Phone,
  ShoppingBag,
  Star,
  UserRound,
} from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { Badge, Card, Spinner } from '@/components/ui';
import { trpc } from '@/lib/trpc';

const statusVariant = (status: string): 'default' | 'success' | 'warning' | 'danger' | 'info' => {
  if (status === 'DELIVERED' || status === 'COMPLETED') return 'success';
  if (status === 'CANCELLED' || status === 'FAILED' || status === 'REFUNDED') return 'danger';
  if (status === 'PENDING' || status === 'PROCESSING') return 'warning';
  return 'info';
};

const formatDate = (date: string | Date) =>
  new Date(date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });

const formatMoney = (amount: string | number) =>
  `₹${Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

export default function CustomerDetailsPage() {
  const params = useParams<{ id: string }>();
  const customerId = params?.id;
  const { data: customer, isLoading, isError } = trpc.user.getCustomerDetails.useQuery(
    { id: customerId ?? '' },
    {
      enabled: Boolean(customerId),
      refetchOnMount: 'always',
      retry: false,
    },
  );

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner size={32} />
      </div>
    );
  }

  if (isError || !customer) {
    return (
      <div className="py-12 text-center">
        <p className="text-lg font-semibold text-slate-900">Customer not found</p>
        <Link href="/customers" className="mt-4 inline-flex text-sm font-semibold text-violet-600 hover:text-violet-700">
          Back to customers
        </Link>
      </div>
    );
  }

  const totalSpent = customer.orders
    .filter((order) => order.status !== 'CANCELLED')
    .reduce((total, order) => total + Number(order.totalAmount), 0);
  const initials = customer.name?.trim()?.charAt(0).toUpperCase() || '?';

  return (
    <div className="pb-12">
      <PageHeader
        title={customer.name || 'Unnamed customer'}
        description={`Customer since ${formatDate(customer.createdAt)}`}
        action={
          <Link href="/customers" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-violet-700">
            <ArrowLeft size={16} /> Back to customers
          </Link>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <Card className="flex flex-col gap-6 sm:flex-row sm:items-center">
            {customer.profileImage ? (
              <img src={customer.profileImage} alt="" className="h-20 w-20 rounded-2xl object-cover" />
            ) : (
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-violet-100 text-2xl font-bold text-violet-700">
                {initials}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900">{customer.name || 'Unnamed customer'}</h2>
                <Badge variant="success">Customer</Badge>
              </div>
              <div className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
                <span className="flex items-center gap-2"><Mail size={15} className="text-slate-400" />{customer.email || 'No email'}</span>
                <span className="flex items-center gap-2"><Phone size={15} className="text-slate-400" />{customer.phone || 'No phone'}</span>
              </div>
            </div>
          </Card>

          <Card>
            <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900"><UserRound size={19} className="text-violet-600" /> Personal details</h2>
            <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <Detail label="Gender" value={customer.gender ? customer.gender.toLowerCase() : 'Not provided'} />
              <Detail label="Date of birth" value={customer.dateOfBirth ? formatDate(customer.dateOfBirth) : 'Not provided'} />
              <Detail label="Email verification" value={customer.emailVerified ? 'Verified' : 'Not verified'} icon={customer.emailVerified ? <CheckCircle2 size={15} className="text-emerald-500" /> : undefined} />
              <Detail label="Phone verification" value={customer.phoneVerified ? 'Verified' : 'Not verified'} icon={customer.phoneVerified ? <CheckCircle2 size={15} className="text-emerald-500" /> : undefined} />
            </div>
          </Card>

          <Card>
            <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900"><MapPin size={19} className="text-violet-600" /> Addresses <span className="text-sm font-medium text-slate-400">({customer.addresses.length})</span></h2>
            {customer.addresses.length ? (
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                {customer.addresses.map((address) => (
                  <div key={address.id} className="rounded-xl border border-slate-200 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold text-slate-900">{address.label}</p>
                      {address.isDefault && <Badge variant="info">Default</Badge>}
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-600">
                      {address.fullName && <>{address.fullName}<br /></>}
                      {address.street}<br />{address.city}, {address.state} {address.zipCode}<br />{address.country}
                    </p>
                    {address.phone && <p className="mt-2 text-xs text-slate-500">{address.phone}</p>}
                  </div>
                ))}
              </div>
            ) : <EmptyState text="No saved addresses" />}
          </Card>

          <Card className="overflow-hidden p-0">
            <div className="flex items-center justify-between border-b border-slate-100 p-6">
              <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900"><ShoppingBag size={19} className="text-violet-600" /> Orders <span className="text-sm font-medium text-slate-400">({customer.orders.length})</span></h2>
            </div>
            {customer.orders.length ? (
              <div className="divide-y divide-slate-100">
                {customer.orders.map((order) => (
                  <div key={order.id} className="flex flex-col gap-3 p-6 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-mono text-xs font-semibold text-slate-500">#{order.id.slice(-8).toUpperCase()}</p>
                      <p className="mt-1 text-sm text-slate-600">{formatDate(order.createdAt)} · {order.items.length} item{order.items.length !== 1 ? 's' : ''}</p>
                    </div>
                    <div className="flex items-center gap-4 sm:text-right">
                      <div><p className="font-bold text-slate-900">{formatMoney(order.totalAmount)}</p><p className="text-xs text-slate-500">{order.payments[0]?.paymentMethod || 'Payment pending'}</p></div>
                      <Badge variant={statusVariant(order.status)}>{order.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : <EmptyState text="No orders placed yet" />}
          </Card>

          <Card>
            <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900"><Star size={19} className="text-violet-600" /> Reviews <span className="text-sm font-medium text-slate-400">({customer.reviews.length})</span></h2>
            {customer.reviews.length ? (
              <div className="mt-5 space-y-4">
                {customer.reviews.map((review) => (
                  <div key={review.id} className="rounded-xl border border-slate-200 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-semibold text-slate-900">{review.product.name}</p>
                      <span className="text-amber-500">{'★'.repeat(review.rating)}<span className="text-slate-200">{'★'.repeat(5 - review.rating)}</span></span>
                    </div>
                    {review.title && <p className="mt-2 text-sm font-semibold text-slate-700">{review.title}</p>}
                    {review.comment && <p className="mt-1 text-sm leading-6 text-slate-600">{review.comment}</p>}
                    <p className="mt-2 text-xs text-slate-400">{formatDate(review.createdAt)}{review.isVerifiedBuyer ? ' · Verified buyer' : ''}</p>
                  </div>
                ))}
              </div>
            ) : <EmptyState text="No reviews submitted" />}
          </Card>
        </div>

        <aside className="space-y-6">
          <Card>
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">Customer summary</h2>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <SummaryStat icon={<ShoppingBag size={17} />} label="Orders" value={customer.orders.length} />
              <SummaryStat icon={<CreditCard size={17} />} label="Total spent" value={formatMoney(totalSpent)} />
              <SummaryStat icon={<Package size={17} />} label="Items bought" value={customer.orders.reduce((sum, order) => sum + order.items.reduce((items, item) => items + item.quantity, 0), 0)} />
              <SummaryStat icon={<CalendarDays size={17} />} label="Last active" value={customer.updatedAt ? formatDate(customer.updatedAt) : '—'} />
            </div>
          </Card>

          <Card>
            <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900"><CreditCard size={19} className="text-violet-600" /> Payments</h2>
            {customer.payments.length ? (
              <div className="mt-4 space-y-3">
                {customer.payments.slice(0, 8).map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                    <div><p className="text-sm font-semibold text-slate-800">{payment.paymentMethod || 'Unknown method'}</p><p className="text-xs text-slate-400">{formatDate(payment.createdAt)}</p></div>
                    <div className="text-right"><p className="text-sm font-bold text-slate-900">{formatMoney(payment.amount)}</p><Badge variant={statusVariant(payment.status)}>{payment.status}</Badge></div>
                  </div>
                ))}
              </div>
            ) : <EmptyState text="No payment records" />}
          </Card>

          <Card>
            <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900"><Package size={19} className="text-violet-600" /> Current cart</h2>
            {customer.cart?.items.length ? (
              <div className="mt-4 space-y-3">
                {customer.cart.items.map((item) => (
                  <div key={item.id} className="flex justify-between gap-3 text-sm">
                    <div><p className="font-semibold text-slate-800">{item.product.name}</p><p className="text-xs text-slate-500">Qty {item.quantity}{item.variant ? ` · ${item.variant.color}${item.variant.size ? ` / ${item.variant.size}` : ''}` : ''}</p></div>
                    <span className="font-semibold text-slate-700">{formatMoney(item.product.netPrice)}</span>
                  </div>
                ))}
              </div>
            ) : <EmptyState text="Cart is empty" />}
          </Card>
        </aside>
      </div>
    </div>
  );
}

function Detail({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return <div><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p><p className="mt-1 flex items-center gap-1.5 text-sm font-semibold capitalize text-slate-700">{icon}{value}</p></div>;
}

function SummaryStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return <div className="rounded-xl bg-slate-50 p-3"><span className="text-violet-600">{icon}</span><p className="mt-2 text-lg font-bold text-slate-900">{value}</p><p className="text-xs font-medium text-slate-500">{label}</p></div>;
}

function EmptyState({ text }: { text: string }) {
  return <p className="py-8 text-center text-sm text-slate-400">{text}</p>;
}
