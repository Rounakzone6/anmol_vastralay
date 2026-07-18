import { Card, Label, Select } from '@/components/ui';
import { Tag } from 'lucide-react';
import { SubcategorySelector } from '@/components/product-form-sections/organization/SubcategorySelector';
import { ItemTypeSelector } from '@/components/product-form-sections/organization/ItemTypeSelector';

type ProductOrganizationProps = {
  kind: 'SAREE' | 'STANDARD';
  setKind: (v: 'SAREE' | 'STANDARD') => void;
  categoryId: string;
  setCategoryId: (v: string) => void;
  subcategoryId: string;
  setSubcategoryId: (v: string) => void;
  itemTypeId: string;
  setItemTypeId: (v: string) => void;
  categories: any[];
  setVariants: React.Dispatch<React.SetStateAction<any[]>>;
};

export function ProductOrganization({
  kind,
  setKind,
  categoryId,
  setCategoryId,
  subcategoryId,
  setSubcategoryId,
  itemTypeId,
  setItemTypeId,
  categories,
  setVariants,
}: ProductOrganizationProps) {
  const activeCategory = categories?.find((c: any) => c.id === categoryId);
  const subcategories: any[] = activeCategory?.subcategories || [];
  const activeSubcategory = subcategories.find((s: any) => s.id === subcategoryId);
  const itemTypes: any[] = activeSubcategory?.itemTypes || [];

  return (
    <Card className="p-8 rounded-3xl border-slate-200/60 shadow-sm overflow-hidden relative">
      <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
        <Tag size={120} />
      </div>
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2.5 bg-amber-100 text-amber-700 rounded-xl">
          <Tag size={20} />
        </div>
        <h3 className="text-xl font-bold text-slate-900 tracking-tight">Organization</h3>
      </div>
      <div className="space-y-6 relative z-10">
        {/* ── Product Kind ── */}
        <div className="group">
          <Label className="text-sm font-semibold text-slate-700 mb-2 block">Product Kind</Label>
          <Select
            value={kind}
            onChange={(e) => {
              const k = e.target.value as 'SAREE' | 'STANDARD';
              setKind(k);
              setVariants([{ color: '', sizes: '', stockQtys: '' }]);
            }}
            className="rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white shadow-inner font-medium"
          >
            <option value="STANDARD">Standard Clothing</option>
            <option value="SAREE">Saree</option>
          </Select>
          <p className="mt-1.5 text-xs text-slate-400">Saree products don't require size, and can have extra saya option.</p>
        </div>

        {/* ── Category ── */}
        <div className="group">
          <Label className="text-sm font-semibold text-slate-700 mb-2 block">Category</Label>
          <Select
            value={categoryId}
            onChange={(e) => {
              setCategoryId(e.target.value);
              setSubcategoryId('');
              setItemTypeId('');
            }}
            required
            className="rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white shadow-inner font-medium"
          >
            <option value="">Select category...</option>
            {categories?.map((c: any) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>

        <SubcategorySelector
          categoryId={categoryId}
          subcategoryId={subcategoryId}
          setSubcategoryId={setSubcategoryId}
          setItemTypeId={setItemTypeId}
          subcategories={subcategories}
        />

        <ItemTypeSelector
          subcategoryId={subcategoryId}
          itemTypeId={itemTypeId}
          setItemTypeId={setItemTypeId}
          itemTypes={itemTypes}
        />
      </div>
    </Card>
  );
}
