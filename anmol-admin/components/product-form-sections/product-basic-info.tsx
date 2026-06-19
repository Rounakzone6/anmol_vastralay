import { Card, Input, Label } from '@/components/ui';
import { Info } from 'lucide-react';

type ProductBasicInfoProps = {
  name: string;
  setName: (v: string) => void;
  brand: string;
  setBrand: (v: string) => void;
};

export function ProductBasicInfo({ name, setName, brand, setBrand }: ProductBasicInfoProps) {
  return (
    <Card className="p-8 rounded-3xl border-slate-200/60 shadow-sm overflow-hidden relative">
      <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
        <Info size={120} />
      </div>
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2.5 bg-violet-100 text-violet-700 rounded-xl">
          <Info size={20} />
        </div>
        <h3 className="text-xl font-bold text-slate-900 tracking-tight">Basic Information</h3>
      </div>
      <div className="space-y-7 relative z-10">
        <div className="group">
          <Label className="text-sm font-semibold text-slate-700 mb-2 block">Product Name</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="e.g., Summer Floral Saree"
            className="text-lg py-6 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white transition-colors shadow-inner"
          />
        </div>
        <div className="group">
          <Label className="text-sm font-semibold text-slate-700 mb-2 block">Brand</Label>
          <Input
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            placeholder="e.g., Amul Comfy"
            className="text-lg py-6 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white transition-colors shadow-inner"
          />
        </div>
      </div>
    </Card>
  );
}
