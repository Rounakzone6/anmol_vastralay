'use client';

import { trpc } from '@/lib/trpc';
import { SareeBanner } from '@/components/dashboard/saree-banner';
import dynamic from 'next/dynamic';
import { DashboardStats } from '@/app/(admin)/dashboard/components/DashboardStats';
import { RecentProductsList } from '@/app/(admin)/dashboard/components/RecentProductsList';
import { RecentPaymentsList } from '@/app/(admin)/dashboard/components/RecentPaymentsList';

const DashboardCharts = dynamic(
  () => import('@/components/dashboard/dashboard-charts').then((mod) => mod.DashboardCharts),
  {
    loading: () => (
      <div className="mb-8 h-96 animate-pulse rounded-xl bg-white shadow-sm" />
    ),
  },
);

export default function DashboardPage() {
  const { data: stats } = trpc.dashboard.getStats.useQuery(undefined, { retry: false });
  const { data: categoryInventory } = trpc.dashboard.getCategoryInventory.useQuery(undefined, { retry: false });

  const { data: payments } = trpc.payment.adminGetPayments.useQuery(undefined, {
    retry: false,
  });
  const { data: orders } = trpc.order.adminGetOrders.useQuery(undefined, {
    retry: false,
  });

  const onlinePayments = payments?.filter((p: { paymentMethod: string | null }) => p.paymentMethod !== 'COD') ?? [];
  const totalOnlineAmount = onlinePayments.reduce((sum: number, p: { amount: string | number }) => sum + Number(p.amount), 0);

  return (
    <div className="pb-12 max-w-7xl mx-auto">
      <SareeBanner />

      <DashboardStats
        categoriesCount={stats?.categoriesCount ?? '—'}
        activeProducts={stats?.activeProducts ?? 0}
        lowStock={stats?.lowStock ?? 0}
        customersCount={stats?.customersCount ?? '—'}
        totalOnlineAmount={totalOnlineAmount}
      />

      <DashboardCharts
        orders={orders}
        payments={payments}
        categoryInventory={categoryInventory}
      />

      <RecentPaymentsList payments={payments} onlinePayments={onlinePayments} />
    </div>
  );
}
