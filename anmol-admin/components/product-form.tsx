'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import {
  ProductImageUpload,
  type ProductImageSlot,
} from '@/components/product-image-upload';
import { Button, Input, Label, Select, Textarea, Card } from '@/components/ui';
import { formatCurrency } from '@/lib/format';
import { trpc } from '@/lib/trpc';
import { Plus, Trash2, Save, X, Info, Package, Image as ImageIcon, LayoutGrid, Tag, Scissors, Check, Loader2, AlertCircle } from 'lucide-react';

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
  const [brand, setBrand] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [subcategoryId, setSubcategoryId] = useState('');
  const [itemTypeId, setItemTypeId] = useState('');
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

  // ── Inline add subcategory state ──
  const [showNewSubcategory, setShowNewSubcategory] = useState(false);
  const [newSubcategoryName, setNewSubcategoryName] = useState('');
  const newSubcategoryRef = useRef<HTMLInputElement>(null);

  // ── Inline add item type state ──
  const [showNewItemType, setShowNewItemType] = useState(false);
  const [newItemTypeName, setNewItemTypeName] = useState('');
  const newItemTypeRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!product) return;
    setName(product.name);
    setBrand(product.brand ?? '');
    setCategoryId(product.categoryId);
    setSubcategoryId(product.subcategoryId ?? '');
    setItemTypeId(product.itemTypeId ?? '');
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

  // ── Subcategory mutations ──
  const createSubcategoryMutation = trpc.category.createSubcategory.useMutation({
    onSuccess: (newSub) => {
      utils.category.list.invalidate();
      setSubcategoryId(newSub.id);
      setNewSubcategoryName('');
      setShowNewSubcategory(false);
    },
  });

  const deleteSubcategoryMutation = trpc.category.deleteSubcategory.useMutation({
    onSuccess: () => {
      utils.category.list.invalidate();
      setSubcategoryId('');
      setItemTypeId('');
    },
  });

  // ── Item Type mutations ──
  const createItemTypeMutation = trpc.category.createItemType.useMutation({
    onSuccess: (newIt) => {
      utils.category.list.invalidate();
      setItemTypeId(newIt.id);
      setNewItemTypeName('');
      setShowNewItemType(false);
    },
  });

  const deleteItemTypeMutation = trpc.category.deleteItemType.useMutation({
    onSuccess: () => {
      utils.category.list.invalidate();
      setItemTypeId('');
    },
  });

  // Focus input when it appears
  useEffect(() => {
    if (showNewSubcategory && newSubcategoryRef.current) {
      newSubcategoryRef.current.focus();
    }
  }, [showNewSubcategory]);

  useEffect(() => {
    if (showNewItemType && newItemTypeRef.current) {
      newItemTypeRef.current.focus();
    }
  }, [showNewItemType]);

  const net = Number(netPrice) || 0;
  const disc = Number(discountPercent) || 0;
  const selling = Math.round(net * (1 - disc / 100) * 100) / 100;

  const activeCategory = categories?.find((c: any) => c.id === categoryId);
  const subcategories: any[] = activeCategory?.subcategories || [];
  const activeSubcategory = subcategories.find((s: any) => s.id === subcategoryId);
  const itemTypes: any[] = activeSubcategory?.itemTypes || [];

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
      brand: brand || undefined,
      categoryId,
      subcategoryId: subcategoryId || undefined,
      itemTypeId: itemTypeId || undefined,
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

  // ── Handlers for inline add ──
  function handleCreateSubcategory() {
    const trimmed = newSubcategoryName.trim();
    if (!trimmed || trimmed.length < 2 || !categoryId) return;
    createSubcategoryMutation.mutate({ name: trimmed, categoryId });
  }

  function handleCreateItemType() {
    const trimmed = newItemTypeName.trim();
    if (!trimmed || trimmed.length < 2 || !subcategoryId) return;
    createItemTypeMutation.mutate({ name: trimmed, subcategoryId });
  }

  function handleDeleteSubcategory(id: string, subName: string) {
    if (window.confirm(`Delete subcategory "${subName}"? Products using it will be unlinked.`)) {
      deleteSubcategoryMutation.mutate({ id });
    }
  }

  function handleDeleteItemType(id: string, itName: string) {
    if (window.confirm(`Delete item type "${itName}"? Products using it will be unlinked.`)) {
      deleteItemTypeMutation.mutate({ id });
    }
  }

  const pending = create.isPending || update.isPending;

  return (
    <form onSubmit={handleSubmit} className="pb-16 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
      {/* Header Actions */}
      <div className="sticky top-0 z-30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white/80 backdrop-blur-xl p-6 rounded-3xl shadow-sm border border-slate-200/60 transition-all">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-lg shadow-indigo-200">
            <Package size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              {isEdit ? 'Edit Product' : 'Create New Product'}
            </h2>
            <p className="text-slate-500 text-sm font-medium mt-0.5">
              {isEdit ? 'Update product details, pricing, and variants.' : 'Add a new product to your storefront catalog.'}
            </p>
          </div>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <Button type="button" variant="outline" onClick={() => router.back()} className="flex-1 sm:flex-none border-slate-200 hover:bg-slate-50 hover:text-slate-900 rounded-xl transition-all font-semibold">
            <X size={16} className="mr-2" />
            Cancel
          </Button>
          <Button type="submit" disabled={pending} className="flex-1 sm:flex-none bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-md hover:shadow-lg hover:-translate-y-0.5 rounded-xl transition-all font-bold">
            <Save size={16} className="mr-2" />
            {pending ? 'Saving…' : 'Save Product'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

        {/* Main Content Column (Left - 2/3) */}
        <div className="xl:col-span-2 space-y-8">

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

          <Card className="p-8 rounded-3xl border-slate-200/60 shadow-sm">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2.5 bg-sky-100 text-sky-700 rounded-xl">
                <ImageIcon size={20} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 tracking-tight">Media Gallery</h3>
            </div>
            <ProductImageUpload
              value={images}
              onChange={setImages}
              error={imageError}
            />
          </Card>

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
                <div key={i} className="group flex flex-col sm:flex-row items-end gap-4 p-5 rounded-2xl border border-slate-200 bg-white hover:border-violet-200 hover:shadow-md transition-all">
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
                      placeholder="e.g., Crimson Red"
                      className="rounded-xl bg-slate-50/50 focus:bg-white"
                    />
                  </div>

                  {kind === 'STANDARD' ? (
                    <div className="w-full sm:w-32 shrink-0">
                      <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Size</Label>
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
                        placeholder="M, 85, 90"
                        className="rounded-xl bg-slate-50/50 focus:bg-white"
                      />
                    </div>
                  ) : null}

                  <div className="w-full sm:w-32 shrink-0">
                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Stock Qty</Label>
                    <Input
                      type="number"
                      min={0}
                      value={row.stockQty}
                      onChange={(e) => {
                        const next = [...variants];
                        next[i] = { ...next[i], stockQty: Number(e.target.value) };
                        setVariants(next);
                      }}
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
        </div>

        {/* Sidebar Column (Right - 1/3) */}
        <div className="space-y-8">

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
              {/* ── Product Kind (was "Product Type") ── */}
              <div className="group">
                <Label className="text-sm font-semibold text-slate-700 mb-2 block">Product Kind</Label>
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
                    setShowNewSubcategory(false);
                    setShowNewItemType(false);
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

              {/* ═══════════════════════════════════════════
                  SUBCATEGORY — with inline add + delete
              ═══════════════════════════════════════════ */}
              {categoryId && (
                <div className="group animate-in fade-in slide-in-from-top-2 duration-300">
                  <Label className="text-sm font-semibold text-slate-700 mb-2 block flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-violet-400"></div>
                    Subcategory
                  </Label>

                  {/* Current Selection Dropdown */}
                  <Select
                    value={subcategoryId}
                    onChange={(e) => {
                      setSubcategoryId(e.target.value);
                      setItemTypeId('');
                      setShowNewItemType(false);
                    }}
                    className="rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white shadow-inner font-medium"
                  >
                    <option value="">Select subcategory...</option>
                    {subcategories.map((s: any) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </Select>

                  {/* Subcategory list with delete buttons */}
                  {subcategories.length > 0 && (
                    <div className="mt-3 rounded-xl border border-slate-100 bg-slate-50/50 overflow-hidden">
                      <div className="px-3 py-2 border-b border-slate-100 bg-slate-50">
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          Available Subcategories ({subcategories.length})
                        </p>
                      </div>
                      <div className="max-h-36 overflow-y-auto">
                        {subcategories.map((s: any) => (
                          <div
                            key={s.id}
                            className={`flex items-center justify-between px-3 py-2 text-sm border-b border-slate-50 last:border-b-0 transition-colors ${subcategoryId === s.id
                                ? 'bg-violet-50 text-violet-700'
                                : 'hover:bg-slate-100 text-slate-600'
                              }`}
                          >
                            <button
                              type="button"
                              onClick={() => { setSubcategoryId(s.id); setItemTypeId(''); }}
                              className="flex-1 text-left font-medium flex items-center gap-2"
                            >
                              {subcategoryId === s.id && <Check size={13} className="text-violet-600 shrink-0" />}
                              {s.name}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteSubcategory(s.id, s.name)}
                              disabled={deleteSubcategoryMutation.isPending}
                              className="p-1 rounded-lg text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-colors shrink-0"
                              title={`Delete "${s.name}"`}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Add new subcategory */}
                  {!showNewSubcategory ? (
                    <button
                      type="button"
                      onClick={() => setShowNewSubcategory(true)}
                      className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-violet-600 hover:text-violet-800 transition-colors w-full px-3 py-2.5 rounded-xl border border-dashed border-violet-200 hover:border-violet-400 hover:bg-violet-50/50"
                    >
                      <Plus size={14} />
                      Add New Subcategory
                    </button>
                  ) : (
                    <div className="mt-2 flex items-center gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
                      <Input
                        ref={newSubcategoryRef}
                        value={newSubcategoryName}
                        onChange={(e) => setNewSubcategoryName(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleCreateSubcategory(); } }}
                        placeholder="New subcategory name…"
                        className="text-sm rounded-xl flex-1 border-violet-200 focus:border-violet-500 focus:ring-violet-500/20"
                      />
                      <Button
                        type="button"
                        variant="primary"
                        disabled={createSubcategoryMutation.isPending || newSubcategoryName.trim().length < 2}
                        onClick={handleCreateSubcategory}
                        className="rounded-xl h-10 w-10 p-0 shrink-0 bg-violet-600 hover:bg-violet-700"
                      >
                        {createSubcategoryMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Check size={16} />}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => { setShowNewSubcategory(false); setNewSubcategoryName(''); }}
                        className="rounded-xl h-10 w-10 p-0 shrink-0 text-slate-400 hover:text-slate-600"
                      >
                        <X size={16} />
                      </Button>
                    </div>
                  )}

                  {/* Error message */}
                  {createSubcategoryMutation.isError && (
                    <p className="mt-1.5 text-xs text-rose-500 font-medium flex items-center gap-1">
                      <AlertCircle size={12} />
                      {createSubcategoryMutation.error.message}
                    </p>
                  )}
                  {deleteSubcategoryMutation.isError && (
                    <p className="mt-1.5 text-xs text-rose-500 font-medium flex items-center gap-1">
                      <AlertCircle size={12} />
                      {deleteSubcategoryMutation.error.message}
                    </p>
                  )}
                </div>
              )}

              {/* ═══════════════════════════════════════════
                  ITEM TYPE — with inline add + delete
              ═══════════════════════════════════════════ */}
              {subcategoryId && (
                <div className="group animate-in fade-in slide-in-from-top-2 duration-300">
                  <Label className="text-sm font-semibold text-slate-700 mb-2 block flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
                    Item Type
                  </Label>

                  <Select
                    value={itemTypeId}
                    onChange={(e) => setItemTypeId(e.target.value)}
                    className="rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white shadow-inner font-medium"
                  >
                    <option value="">Select item type...</option>
                    {itemTypes.map((i: any) => (
                      <option key={i.id} value={i.id}>
                        {i.name}
                      </option>
                    ))}
                  </Select>

                  {/* Item type list with delete buttons */}
                  {itemTypes.length > 0 && (
                    <div className="mt-3 rounded-xl border border-slate-100 bg-slate-50/50 overflow-hidden">
                      <div className="px-3 py-2 border-b border-slate-100 bg-slate-50">
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          Available Item Types ({itemTypes.length})
                        </p>
                      </div>
                      <div className="max-h-36 overflow-y-auto">
                        {itemTypes.map((it: any) => (
                          <div
                            key={it.id}
                            className={`flex items-center justify-between px-3 py-2 text-sm border-b border-slate-50 last:border-b-0 transition-colors ${itemTypeId === it.id
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'hover:bg-slate-100 text-slate-600'
                              }`}
                          >
                            <button
                              type="button"
                              onClick={() => setItemTypeId(it.id)}
                              className="flex-1 text-left font-medium flex items-center gap-2"
                            >
                              {itemTypeId === it.id && <Check size={13} className="text-emerald-600 shrink-0" />}
                              {it.name}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteItemType(it.id, it.name)}
                              disabled={deleteItemTypeMutation.isPending}
                              className="p-1 rounded-lg text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-colors shrink-0"
                              title={`Delete "${it.name}"`}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Add new item type */}
                  {!showNewItemType ? (
                    <button
                      type="button"
                      onClick={() => setShowNewItemType(true)}
                      className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-emerald-600 hover:text-emerald-800 transition-colors w-full px-3 py-2.5 rounded-xl border border-dashed border-emerald-200 hover:border-emerald-400 hover:bg-emerald-50/50"
                    >
                      <Plus size={14} />
                      Add New Item Type
                    </button>
                  ) : (
                    <div className="mt-2 flex items-center gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
                      <Input
                        ref={newItemTypeRef}
                        value={newItemTypeName}
                        onChange={(e) => setNewItemTypeName(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleCreateItemType(); } }}
                        placeholder="New item type name…"
                        className="text-sm rounded-xl flex-1 border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500/20"
                      />
                      <Button
                        type="button"
                        variant="primary"
                        disabled={createItemTypeMutation.isPending || newItemTypeName.trim().length < 2}
                        onClick={handleCreateItemType}
                        className="rounded-xl h-10 w-10 p-0 shrink-0 bg-emerald-600 hover:bg-emerald-700"
                      >
                        {createItemTypeMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Check size={16} />}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => { setShowNewItemType(false); setNewItemTypeName(''); }}
                        className="rounded-xl h-10 w-10 p-0 shrink-0 text-slate-400 hover:text-slate-600"
                      >
                        <X size={16} />
                      </Button>
                    </div>
                  )}

                  {/* Error messages */}
                  {createItemTypeMutation.isError && (
                    <p className="mt-1.5 text-xs text-rose-500 font-medium flex items-center gap-1">
                      <AlertCircle size={12} />
                      {createItemTypeMutation.error.message}
                    </p>
                  )}
                  {deleteItemTypeMutation.isError && (
                    <p className="mt-1.5 text-xs text-rose-500 font-medium flex items-center gap-1">
                      <AlertCircle size={12} />
                      {deleteItemTypeMutation.error.message}
                    </p>
                  )}
                </div>
              )}
            </div>
          </Card>

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

        </div>
      </div>
    </form>
  );
}
