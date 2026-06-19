import { Card, Input, Label } from '@/components/ui';
import { Tag, Scissors } from 'lucide-react';
import { formatCurrency } from '@/lib/format';

type ProductPricingProps = {
  netPrice: string;
  setNetPrice: (v: string) => void;
  discountPercent: string;
  setDiscountPercent: (v: string) => void;
  kind: 'SAREE' | 'STANDARD';
  allowsExtraSaya: boolean;
  setAllowsExtraSaya: (v: boolean) => void;
  extraSayaPrice: string;
  setExtraSayaPrice: (v: string) => void;
};

export function ProductPricing({
  netPrice,
  setNetPrice,
  discountPercent,
  setDiscountPercent,
  kind,
  allowsExtraSaya,
  setAllowsExtraSaya,
  extraSayaPrice,
  setExtraSayaPrice,
}: ProductPricingProps) {
  const net = Number(netPrice) || 0;
  const disc = Number(discountPercent) || 0;
  const selling = Math.round(net * (1 - disc / 100) * 100) / 100;

  return (
    <>
      <Card className="p-8 rounded-3xl border-slate-200/60 shadow-sm bg-gradient-to-br from-white to-slate-50 overflow-hidden relative">
        <div className="flex items-center gap-3 mb-8 relative z-10">
          <div className="p-2.5 bg-rose-100 text-rose-700 rounded-xl">
            <Tag size={20} />
          </div>
          <h3 className="text-xl font-bold text-slate-900 tracking-tight">Pricing</h3>
        </div>

        <div className="space-y-6 relative z-10">
          <div>
            <Label className="text-sm font-semibold text-slate-700 mb-2 block">Net Price (₹)</Label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <span className="text-slate-500 font-bold">₹</span>
              </div>
              <Input
                className="pl-9 font-bold text-lg rounded-xl border-slate-200 shadow-inner"
                type="number"
                min={1}
                step="0.01"
                value={netPrice}
                onChange={(e) => setNetPrice(e.target.value)}
                required
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <Label className="text-sm font-semibold text-slate-700 mb-2 block">Discount (%)</Label>
            <div className="relative">
              <Input
                className="pr-9 font-bold text-lg rounded-xl border-slate-200 shadow-inner text-rose-600"
                type="number"
                min={0}
                max={100}
                value={discountPercent}
                onChange={(e) => setDiscountPercent(e.target.value)}
                placeholder="0"
              />
              <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                <span className="text-slate-400 font-bold">%</span>
              </div>
            </div>
          </div>

          <div className="pt-6 mt-6 border-t border-slate-200/80">
            <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Final Selling Price</Label>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-semibold text-slate-400">₹</span>
              <p className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-violet-600 to-indigo-600 tracking-tight">
                {formatCurrency(selling).replace('₹', '').trim()}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {kind === 'SAREE' ? (
        <Card className="p-8 rounded-3xl border-slate-200/60 shadow-sm relative overflow-hidden bg-gradient-to-br from-indigo-50/30 to-white">
          <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none text-indigo-600">
            <Scissors size={120} />
          </div>
          <div className="flex items-center gap-3 mb-6 relative z-10">
            <div className="p-2.5 bg-indigo-100 text-indigo-700 rounded-xl">
              <Scissors size={20} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 tracking-tight">Extra Options</h3>
          </div>

          <div className="relative z-10">
            <label className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl border-2 transition-all cursor-pointer ${allowsExtraSaya ? 'border-indigo-500 bg-indigo-50/50 shadow-sm' : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'}`}>
              <div className="flex items-start gap-4">
                <div className="mt-0.5">
                  <input
                    type="checkbox"
                    className="w-5 h-5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 focus:ring-offset-0 transition-colors"
                    checked={allowsExtraSaya}
                    onChange={(e) => setAllowsExtraSaya(e.target.checked)}
                  />
                </div>
                <div>
                  <p className={`font-bold ${allowsExtraSaya ? 'text-indigo-900' : 'text-slate-900'}`}>Add Saya Piece</p>
                  <p className={`text-sm mt-0.5 ${allowsExtraSaya ? 'text-indigo-700/80' : 'text-slate-500'}`}>Allow customers to add matching saya.</p>
                </div>
              </div>
            </label>

            {allowsExtraSaya ? (
              <div className="mt-4 p-5 bg-white rounded-2xl border border-indigo-100 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
                <Label className="text-sm font-semibold text-slate-700 mb-2 block">Saya Price (₹)</Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span className="text-slate-500 font-bold">₹</span>
                  </div>
                  <Input
                    className="pl-9 font-bold text-lg rounded-xl border-slate-200 shadow-inner focus:border-indigo-500 focus:ring-indigo-500"
                    type="number"
                    min={1}
                    value={extraSayaPrice}
                    onChange={(e) => setExtraSayaPrice(e.target.value)}
                    required
                    placeholder="0.00"
                  />
                </div>
              </div>
            ) : null}
          </div>
        </Card>
      ) : null}
    </>
  );
}
