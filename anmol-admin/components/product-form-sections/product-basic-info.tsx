import { Card, Input, Label } from '@/components/ui';
import { Info } from 'lucide-react';

type ProductBasicInfoProps = {
  name: string;
  setName: (v: string) => void;
  brand: string;
  setBrand: (v: string) => void;
  metaTitle: string;
  setMetaTitle: (v: string) => void;
  metaDescription: string;
  setMetaDescription: (v: string) => void;
};

export function ProductBasicInfo({ name, setName, brand, setBrand, metaTitle, setMetaTitle, metaDescription, setMetaDescription }: ProductBasicInfoProps) {
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

        <div className="pt-6 mt-6 border-t border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <Label className="text-sm font-semibold text-slate-700 block">SEO Title</Label>
            <span className={`text-xs ${metaTitle.length > 60 ? 'text-red-500 font-bold' : 'text-slate-400'}`}>
              {metaTitle.length}/60
            </span>
          </div>
          <Input
            value={metaTitle}
            onChange={(e) => setMetaTitle(e.target.value)}
            placeholder={name ? `${name} | Anmol Vastralay` : "Auto-generated fallback"}
            className="text-md py-5 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white transition-colors shadow-inner"
          />
        </div>

        <div className="group">
          <div className="flex items-center justify-between mb-2">
            <Label className="text-sm font-semibold text-slate-700 block">SEO Description</Label>
            <span className={`text-xs ${metaDescription.length > 160 ? 'text-red-500 font-bold' : 'text-slate-400'}`}>
              {metaDescription.length}/160
            </span>
          </div>
          <textarea
            value={metaDescription}
            onChange={(e) => setMetaDescription(e.target.value)}
            placeholder={name ? `Buy ${name} online at Anmol Vastralay. Premium quality ethnic wear.` : "Auto-generated fallback"}
            rows={3}
            className="w-full text-md p-4 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white transition-colors shadow-inner focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
          />
        </div>
      </div>
    </Card>
  );
}
