'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  ProductImageUpload,
  type ProductImageSlot,
} from '@/components/product-image-upload';
import { Button, Input, Label, Select, Textarea } from '@/components/ui';
import { formatCurrency } from '@/lib/format';
import { trpc } from '@/lib/trpc';

type VariantRow = {
  color: string;
  size?: 'M' | 'L' | 'XL' | 'XXL';
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
    { color: '', size: 'M', stockQty: 0 },
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
      { color: '', size: kind === 'STANDARD' ? 'M' : undefined, stockQty: 0 },
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
    <form className="space-y-8" onSubmit={handleSubmit}>
      <section className="grid gap-4 rounded-xl border border-zinc-200 bg-white p-6 md:grid-cols-2">
        <h2 className="md:col-span-2 text-lg font-semibold">Basic info</h2>
        <div>
          <Label>Product name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div>
          <Label>Category</Label>
          <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required>
            <option value="">Select category</option>
            {categories?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label>Product type</Label>
          <Select
            value={kind}
            onChange={(e) => {
              const k = e.target.value as 'SAREE' | 'STANDARD';
              setKind(k);
              if (k === 'SAREE') {
                setVariants([{ color: '', stockQty: 0 }]);
              } else {
                setVariants([{ color: '', size: 'M', stockQty: 0 }]);
              }
            }}
          >
            <option value="STANDARD">Standard (sizes M–XXL)</option>
            <option value="SAREE">Saree (colors only + extra saya)</option>
          </Select>
        </div>
        <div className="md:col-span-2">
          <Label>Description</Label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
        </div>
      </section>

      <ProductImageUpload
        value={images}
        onChange={setImages}
        error={imageError}
      />

      <section className="grid gap-4 rounded-xl border border-zinc-200 bg-white p-6 md:grid-cols-3">
        <h2 className="md:col-span-3 text-lg font-semibold">Pricing</h2>
        <div>
          <Label>Net price (₹)</Label>
          <Input
            type="number"
            min={1}
            step="0.01"
            value={netPrice}
            onChange={(e) => setNetPrice(e.target.value)}
            required
          />
        </div>
        <div>
          <Label>Discount %</Label>
          <Input
            type="number"
            min={0}
            max={100}
            value={discountPercent}
            onChange={(e) => setDiscountPercent(e.target.value)}
          />
        </div>
        <div>
          <Label>Selling price</Label>
          <p className="mt-2 text-2xl font-bold text-violet-800">{formatCurrency(selling)}</p>
        </div>
      </section>

      {kind === 'SAREE' ? (
        <section className="rounded-xl border border-zinc-200 bg-white p-6">
          <label className="flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              checked={allowsExtraSaya}
              onChange={(e) => setAllowsExtraSaya(e.target.checked)}
            />
            Customer can add extra saya piece
          </label>
          {allowsExtraSaya ? (
            <div className="mt-4 max-w-xs">
              <Label>Extra saya price (₹)</Label>
              <Input
                type="number"
                min={1}
                value={extraSayaPrice}
                onChange={(e) => setExtraSayaPrice(e.target.value)}
                required
              />
            </div>
          ) : null}
        </section>
      ) : null}

      <section className="rounded-xl border border-zinc-200 bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Variants (stock)</h2>
          <Button type="button" variant="secondary" onClick={addVariantRow}>
            Add row
          </Button>
        </div>
        <div className="space-y-3">
          {variants.map((row, i) => (
            <div key={i} className="grid gap-3 md:grid-cols-4">
              <div>
                <Label>Color</Label>
                <Input
                  value={row.color}
                  onChange={(e) => {
                    const next = [...variants];
                    next[i] = { ...next[i], color: e.target.value };
                    setVariants(next);
                  }}
                  required
                />
              </div>
              {kind === 'STANDARD' ? (
                <div>
                  <Label>Size</Label>
                  <Select
                    value={row.size ?? 'M'}
                    onChange={(e) => {
                      const next = [...variants];
                      next[i] = {
                        ...next[i],
                        size: e.target.value as VariantRow['size'],
                      };
                      setVariants(next);
                    }}
                  >
                    <option value="M">M</option>
                    <option value="L">L</option>
                    <option value="XL">XL</option>
                    <option value="XXL">XXL</option>
                  </Select>
                </div>
              ) : null}
              <div>
                <Label>Quantity</Label>
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
              <div className="flex items-end">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setVariants(variants.filter((_, j) => j !== i))}
                  disabled={variants.length <= 1}
                >
                  Remove
                </Button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="flex gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? 'Saving…' : isEdit ? 'Update product' : 'Create product'}
        </Button>
        <Button type="button" variant="secondary" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
