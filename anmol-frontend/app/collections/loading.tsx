import SilkLoomLoader from '@/components/loaders/SilkLoomLoader';

export default function CollectionsLoading() {
  return (
    <div className="mx-auto max-w-[1600px] px-4 sm:px-8 py-8">
      <SilkLoomLoader showGrid={true} count={8} />
    </div>
  );
}
