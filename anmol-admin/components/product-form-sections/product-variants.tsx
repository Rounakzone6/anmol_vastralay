import { Card, Input, Label, Button } from '@/components/ui';
import { LayoutGrid, Plus, Trash2 } from 'lucide-react';

export type VariantGroupRow = {
  color: string;
  sizes: string;
  stockQtys: string;
};

type ProductVariantsProps = {
  variants: VariantGroupRow[];
  setVariants: React.Dispatch<React.SetStateAction<VariantGroupRow[]>>;
  kind: 'SAREE' | 'STANDARD';
};

export function ProductVariants({ variants, setVariants, kind }: ProductVariantsProps) {
  function addVariantRow() {
    setVariants((rows) => [
      ...rows,
      { color: '', sizes: '', stockQtys: '' },
    ]);
  }

  return (
    <Card className="p-8 rounded-3xl border-slate-200/60 shadow-sm overflow-hidden relative">
      <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
        <LayoutGrid size={120} />
      </div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 relative z-10 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl">
            <LayoutGrid size={20} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900 tracking-tight">Inventory & Variants</h3>
            <p className="text-sm text-slate-500 font-medium mt-0.5">Manage colors, sizes, and stock availability.</p>
          </div>
        </div>
        <Button type="button" variant="secondary" onClick={addVariantRow} className="rounded-xl font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors">
          <Plus size={16} className="mr-2" />
          Add Variant
        </Button>
      </div>

      <div className="space-y-4 relative z-10">
        {variants.map((row, i) => (
          <div key={i} className="group flex flex-col sm:flex-row items-start sm:items-end gap-4 p-5 rounded-2xl border border-slate-200 bg-white hover:border-violet-200 hover:shadow-md transition-all">
            <div className="w-full sm:flex-1">
              <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Color</Label>
              <Input
                value={row.color}
                onChange={(e) => {
                  const next = [...variants];
                  next[i] = { ...next[i], color: e.target.value };
                  setVariants(next);
                }}
                required
                placeholder="e.g., Brown"
                className="rounded-xl bg-slate-50/50 focus:bg-white"
              />
            </div>
            
            {kind === 'STANDARD' ? (
              <div className="w-full sm:flex-1">
                <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Sizes (comma-separated)</Label>
                <Input
                  type="text"
                  value={row.sizes}
                  onChange={(e) => {
                    const next = [...variants];
                    next[i] = { ...next[i], sizes: e.target.value };
                    setVariants(next);
                  }}
                  placeholder="e.g., 80, 85, 90"
                  className="rounded-xl bg-slate-50/50 focus:bg-white"
                />
              </div>
            ) : null}
            
            <div className="w-full sm:flex-1">
              <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Stock Qty {kind === 'STANDARD' && '(comma-separated)'}</Label>
              <Input
                type="text"
                value={row.stockQtys}
                onChange={(e) => {
                  const next = [...variants];
                  next[i] = { ...next[i], stockQtys: e.target.value };
                  setVariants(next);
                }}
                required
                placeholder={kind === 'STANDARD' ? "e.g., 4, 3, 2" : "e.g., 5"}
                className="rounded-xl bg-slate-50/50 focus:bg-white font-mono"
              />
            </div>
            
            <div className="w-full sm:w-auto flex justify-end shrink-0 pb-1">
              <Button
                type="button"
                variant="ghost"
                className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl h-10 w-10 p-0 transition-colors"
                onClick={() => setVariants(variants.filter((_, j) => j !== i))}
                disabled={variants.length <= 1}
              >
                <Trash2 size={18} />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
