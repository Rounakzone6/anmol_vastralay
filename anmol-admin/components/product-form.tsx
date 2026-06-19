'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  ProductImageUpload,
  type ProductImageSlot,
} from '@/components/product-image-upload';
import { Button, Input, Label, Select, Textarea, Card } from '@/components/ui';
import { formatCurrency } from '@/lib/format';
import { trpc } from '@/lib/trpc';
import { Plus, Trash2, Save, X } from 'lucide-react';

type VariantRow = {
  color: string;
  size?: string;
  stockQty: number;
};

type ProductFormProps = {
  productId?: string;
};

export function ProductForm({ productId }: ProductFormProps) {
  const router = useRouter();
  const utils = trpc.useUtils();
  const isEdit = Boolean(productId);

  const { data: categories } = trpc.category.list.useQuery({});
  const { data: product } = trpc.product.getById.useQuery(
    { id: productId! },
    { enabled: isEdit },
  );

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [kind, setKind] = useState<'SAREE' | 'STANDARD'>('STANDARD');
  const [netPrice, setNetPrice] = useState('');
  const [discountPercent, setDiscountPercent] = useState('0');
  const [allowsExtraSaya, setAllowsExtraSaya] = useState(false);
  const [extraSayaPrice, setExtraSayaPrice] = useState('');
  const [variants, setVariants] = useState<VariantRow[]>([
    { color: '', size: '', stockQty: 0 },
  ]);
  const [images, setImages] = useState<(ProductImageSlot | null)[]>([
    null,
    null,
    null,
    null,
  ]);
  const [imageError, setImageError] = useState<string | null>(null);

  useEffect(() => {
    if (!product) return;
    setName(product.name);
    setDescription(product.description ?? '');
    setCategoryId(product.categoryId);
    setKind(product.kind);
    setNetPrice(String(product.netPrice));
    setDiscountPercent(String(product.discountPercent));
    setAllowsExtraSaya(product.allowsExtraSaya);
    setExtraSayaPrice(product.extraSayaPrice != null ? String(product.extraSayaPrice) : '');
    setVariants(
      product.variants.map((v) => ({
        color: v.color,
        size: v.size ?? undefined,
        stockQty: v.stockQty,
      })),
    );
    const slots: (ProductImageSlot | null)[] = [null, null, null, null];
    product.images.forEach((img, i) => {
      if (i < 4) {
        slots[i] = {
          url: img.url,
          publicId: img.publicId ?? undefined,
          preview: img.url,
        };
      }
    });
    setImages(slots);
  }, [product]);

  const create = trpc.product.create.useMutation({
    onSuccess: (p) => {
      utils.product.list.invalidate();
      router.push(`/products/${p.id}`);
    },
  });
  const update = trpc.product.update.useMutation({
    onSuccess: () => {
      utils.product.list.invalidate();
      utils.product.getById.invalidate({ id: productId! });
      router.push('/products');
    },
  });

  const net = Number(netPrice) || 0;
  const disc = Number(discountPercent) || 0;
  const selling = Math.round(net * (1 - disc / 100) * 100) / 100;

  function addVariantRow() {
    setVariants((rows) => [
      ...rows,
      { color: '', size: kind === 'STANDARD' ? '' : undefined, stockQty: 0 },
    ]);
  }

  function buildImageUrls() {
    return images
      .filter((img): img is ProductImageSlot => img != null && Boolean(img.url))
      .map((img, i) => ({
        url: img.url,
        publicId: img.publicId,
        sortOrder: i,
      }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setImageError(null);
    const imageUrls = buildImageUrls();
    if (imageUrls.length === 0) {
      setImageError('Please upload the main product image (image 1)');
      return;
    }

    const payload = {
      name,
      description: description || undefined,
      categoryId,
      kind,
      netPrice: Number(netPrice),
      discountPercent: Number(discountPercent),
      allowsExtraSaya: kind === 'SAREE' ? allowsExtraSaya : false,
      extraSayaPrice:
        kind === 'SAREE' && allowsExtraSaya && extraSayaPrice
          ? Number(extraSayaPrice)
          : undefined,
      variants: variants
        .filter((v) => v.color.trim())
        .map((v) => ({
          color: v.color.trim(),
          size: kind === 'STANDARD' ? v.size : undefined,
          stockQty: v.stockQty,
        })),
      imageUrls,
    };

    if (isEdit) {
      update.mutate({ id: productId!, ...payload });
    } else {
      create.mutate(payload);
    }
  }

  const pending = create.isPending || update.isPending;

  return (
    <form onSubmit={handleSubmit} className="pb-12">
      {/* Header Actions */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-slate-900">{isEdit ? 'Edit Product' : 'New Product'}</h2>
        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            <X size={16} className="mr-2" />
            Cancel
          </Button>
          <Button type="submit" disabled={pending}>
            <Save size={16} className="mr-2" />
            {pending ? 'Saving…' : 'Save Product'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Content Column (Left - 2/3) */}
        <div className="lg:col-span-2 space-y-8">
          
          <Card className="p-8">
            <h3 className="text-lg font-semibold text-slate-900 mb-6">Basic Information</h3>
            <div className="space-y-6">
              <div>
                <Label>Product Name</Label>
                <Input 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  required 
                  placeholder="e.g., Summer Floral Saree"
                  className="text-lg py-3"
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={6}
                  placeholder="Describe the product material, design, and care instructions..."
                />
              </div>
            </div>
          </Card>

          <Card className="p-8">
            <h3 className="text-lg font-semibold text-slate-900 mb-6">Media</h3>
            <ProductImageUpload
              value={images}
              onChange={setImages}
              error={imageError}
            />
          </Card>

          <Card className="p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Inventory & Variants</h3>
                <p className="text-sm text-slate-500 mt-1">Manage stock quantities for different options.</p>
              </div>
              <Button type="button" variant="secondary" onClick={addVariantRow}>
                <Plus size={16} className="mr-2" />
                Add Variant
              </Button>
            </div>
            
            <div className="space-y-4">
              {variants.map((row, i) => (
                <div key={i} className="flex flex-col sm:flex-row items-end gap-4 p-4 rounded-xl border border-slate-100 bg-slate-50/50">
                  <div className="w-full sm:flex-1">
                    <Label>Color</Label>
                    <Input
                      value={row.color}
                      onChange={(e) => {
                        const next = [...variants];
                        next[i] = { ...next[i], color: e.target.value };
                        setVariants(next);
                      }}
                      required
                      placeholder="e.g., Red"
                    />
                  </div>
                  
                  {kind === 'STANDARD' ? (
                    <div className="w-full sm:w-32 shrink-0">
                      <Label>Size</Label>
                      <Input
                        value={row.size ?? ''}
                        onChange={(e) => {
                          const next = [...variants];
                          next[i] = {
                            ...next[i],
                            size: e.target.value,
                          };
                          setVariants(next);
                        }}
                        placeholder="e.g., M, 85, 90"
                      />
                    </div>
                  ) : null}
                  
                  <div className="w-full sm:w-32 shrink-0">
                    <Label>Stock</Label>
                    <Input
                      type="number"
                      min={0}
                      value={row.stockQty}
                      onChange={(e) => {
                        const next = [...variants];
                        next[i] = { ...next[i], stockQty: Number(e.target.value) };
                        setVariants(next);
                      }}
                    />
                  </div>
                  
                  <div className="w-full sm:w-auto flex justify-end shrink-0">
                    <Button
                      type="button"
                      variant="ghost"
                      className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
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
        </div>

        {/* Sidebar Column (Right - 1/3) */}
        <div className="space-y-8">
          
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-6">Organization</h3>
            <div className="space-y-6">
              <div>
                <Label>Product Type</Label>
                <Select
                  value={kind}
                  onChange={(e) => {
                    const k = e.target.value as 'SAREE' | 'STANDARD';
                    setKind(k);
                    if (k === 'SAREE') {
                      setVariants([{ color: '', stockQty: 0 }]);
                    } else {
                      setVariants([{ color: '', size: '', stockQty: 0 }]);
                    }
                  }}
                >
                  <option value="STANDARD">Standard Clothing</option>
                  <option value="SAREE">Saree</option>
                </Select>
              </div>
              <div>
                <Label>Category</Label>
                <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required>
                  <option value="">Select category...</option>
                  {categories?.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-6">Pricing</h3>
            <div className="space-y-6">
              <div>
                <Label>Net Price (₹)</Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-slate-500 font-medium">₹</span>
                  </div>
                  <Input
                    className="pl-8 font-medium"
                    type="number"
                    min={1}
                    step="0.01"
                    value={netPrice}
                    onChange={(e) => setNetPrice(e.target.value)}
                    required
                  />
                </div>
              </div>
              
              <div>
                <div className="flex justify-between">
                  <Label>Discount (%)</Label>
                </div>
                <div className="relative mt-1.5">
                  <Input
                    className="pr-8"
                    type="number"
                    min={0}
                    max={100}
                    value={discountPercent}
                    onChange={(e) => setDiscountPercent(e.target.value)}
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <span className="text-slate-500 font-medium">%</span>
                  </div>
                </div>
              </div>
              
              <div className="pt-4 border-t border-slate-100">
                <Label className="text-slate-500">Final Selling Price</Label>
                <p className="mt-1 text-3xl font-bold text-violet-700">{formatCurrency(selling)}</p>
              </div>
            </div>
          </Card>

          {kind === 'SAREE' ? (
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Extra Options</h3>
              <label className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors">
                <div className="flex items-center h-5 mt-0.5">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-violet-600 rounded border-slate-300 focus:ring-violet-500"
                    checked={allowsExtraSaya}
                    onChange={(e) => setAllowsExtraSaya(e.target.checked)}
                  />
                </div>
                <div>
                  <p className="font-medium text-slate-900">Add Saya Piece</p>
                  <p className="text-sm text-slate-500">Allow customers to purchase an additional saya.</p>
                </div>
              </label>
              
              {allowsExtraSaya ? (
                <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <Label>Saya Price (₹)</Label>
                  <div className="relative mt-1.5">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-slate-500 font-medium">₹</span>
                    </div>
                    <Input
                      className="pl-8"
                      type="number"
                      min={1}
                      value={extraSayaPrice}
                      onChange={(e) => setExtraSayaPrice(e.target.value)}
                      required
                    />
                  </div>
                </div>
              ) : null}
            </Card>
          ) : null}

        </div>
      </div>
    </form>
  );
}
