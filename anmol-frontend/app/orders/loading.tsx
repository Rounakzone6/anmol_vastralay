import RoyalParcelLoader from '@/components/loaders/RoyalParcelLoader';

export default function OrdersLoading() {
  return <RoyalParcelLoader message="Retrieving Your Royal Orders..." subtitle="Synchronizing shipment status & invoices" />;
}
