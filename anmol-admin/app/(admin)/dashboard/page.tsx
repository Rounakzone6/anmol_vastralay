'use client';

import { trpc } from '@/lib/trpc';
import { SareeBanner } from '@/components/dashboard/saree-banner';
import { DashboardCharts } from '@/components/dashboard/dashboard-charts';
import { DashboardStats } from './components/DashboardStats';
import { RecentProductsList } from './components/RecentProductsList';
import { RecentPaymentsList } from './components/RecentPaymentsList';

export default function DashboardPage() {
  const { data: categories } = trpc.category.list.useQuery({});
  const { data: products } = trpc.product.list.useQuery({
    includeInactive: true,
    pageSize: 100,
  });
  const { data: customers } = trpc.user.getCustomers.useQuery(undefined, {
    retry: false,
  });
  const { data: payments } = trpc.payment.adminGetPayments.useQuery(undefined, {
    retry: false,
  });

  const activeProducts = products?.items.filter((p: { isActive: boolean }) => p.isActive).length ?? 0;
  const lowStock =
    products?.items.reduce(
      (sum: number, p: { variants: { stockQty: number }[] }) => sum + p.variants.filter((v: { stockQty: number }) => v.stockQty < 5).length,
      0,
    ) ?? 0;

  const onlinePayments = payments?.filter((p: { paymentMethod: string | null }) => p.paymentMethod !== 'COD') ?? [];
  const totalOnlineAmount = onlinePayments.reduce((sum: number, p: { amount: string | number }) => sum + Number(p.amount), 0);

  return (
    <div className="pb-12 max-w-7xl mx-auto">
      <SareeBanner />

      <DashboardStats
        categoriesCount={categories?.length ?? '—'}
        activeProducts={activeProducts}
        lowStock={lowStock}
        customersCount={customers?.length ?? '—'}
        totalOnlineAmount={totalOnlineAmount}
      />

      <DashboardCharts />

      <RecentProductsList products={products} />

      <RecentPaymentsList payments={payments} onlinePayments={onlinePayments} />
    </div>
  );
}
