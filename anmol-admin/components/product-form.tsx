'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ProductImageUpload, type ProductImageSlot } from '@/components/product-image-upload';
import { Button, Card } from '@/components/ui';
import { trpc } from '@/lib/trpc';
import { Save, X, Package, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

import { ProductBasicInfo } from '@/components/product-form-sections/product-basic-info';
import { ProductPricing } from '@/components/product-form-sections/product-pricing';
import { ProductVariants, type VariantGroupRow } from '@/components/product-form-sections/product-variants';
import { ProductOrganization } from '@/components/product-form-sections/product-organization';

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
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [netPrice, setNetPrice] = useState('');
  const [discountPercent, setDiscountPercent] = useState('0');
  const [allowsExtraSaya, setAllowsExtraSaya] = useState(false);
  const [extraSayaPrice, setExtraSayaPrice] = useState('');
  const [variants, setVariants] = useState<VariantGroupRow[]>([
    { color: '', sizes: '', stockQtys: '' },
  ]);
  const [images, setImages] = useState<(ProductImageSlot | null)[]>([
    null, null, null, null,
  ]);
  const [imageError, setImageError] = useState<string | null>(null);

  useEffect(() => {
    if (!product) return;
    setName(product.name);
    setBrand(product.brand ?? '');
    setCategoryId(product.categoryId);
    setSubcategoryId(product.subcategoryId ?? '');
    setItemTypeId(product.itemTypeId ?? '');
    setKind(product.kind);
    setMetaTitle(product.metaTitle ?? '');
    setMetaDescription(product.metaDescription ?? '');
    setNetPrice(String(product.netPrice));
    setDiscountPercent(String(product.discountPercent));
    setAllowsExtraSaya(product.allowsExtraSaya);
    setExtraSayaPrice(product.extraSayaPrice != null ? String(product.extraSayaPrice) : '');
    if (product.kind === 'SAREE') {
      const mapped = product.variants.map((v: any) => ({
        color: v.color,
        sizes: '',
        stockQtys: String(v.stockQty),
      }));
      setVariants(mapped.length > 0 ? mapped : [{ color: '', sizes: '', stockQtys: '' }]);
    } else {
      const grouped = new Map<string, { sizes: string[]; stockQtys: number[] }>();
      product.variants.forEach((v: any) => {
        if (!grouped.has(v.color)) {
          grouped.set(v.color, { sizes: [], stockQtys: [] });
        }
        const g = grouped.get(v.color)!;
        if (v.size) g.sizes.push(v.size);
        g.stockQtys.push(v.stockQty);
      });
      const mapped = Array.from(grouped.entries()).map(([color, data]) => ({
        color,
        sizes: data.sizes.join(', '),
        stockQtys: data.stockQtys.join(', '),
      }));
      setVariants(mapped.length > 0 ? mapped : [{ color: '', sizes: '', stockQtys: '' }]);
    }
    const slots: (ProductImageSlot | null)[] = [null, null, null, null];
    product.images.forEach((img: any, i: number) => {
      if (i < 4) {
        slots[i] = {
          url: img.url,
          publicId: img.publicId ?? undefined,
          preview: img.url,
          altText: img.altText ?? '',
        };
      }
    });
    setImages(slots);
  }, [product]);

  const create = trpc.product.create.useMutation({
    onSuccess: () => {
      utils.product.list.invalidate();
      toast.success('Product added successfully!');
      
      // Reset form fields
      setName('');
      setBrand('');
      setCategoryId('');
      setSubcategoryId('');
      setItemTypeId('');
      setKind('STANDARD');
      setMetaTitle('');
      setMetaDescription('');
      setNetPrice('');
      setDiscountPercent('0');
      setAllowsExtraSaya(false);
      setExtraSayaPrice('');
      setVariants([{ color: '', sizes: '', stockQtys: '' }]);
      setImages([null, null, null, null]);
      setImageError(null);
      
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
  });
  const update = trpc.product.update.useMutation({
    onSuccess: () => {
      utils.product.list.invalidate();
      utils.product.getById.invalidate({ id: productId! });
      toast.success('Product updated successfully!');
      router.push('/products');
    },
  });

  function buildImageUrls() {
    return images
      .filter((img): img is ProductImageSlot => img != null && Boolean(img.url))
      .map((img, i) => ({
        url: img.url,
        publicId: img.publicId,
        altText: img.altText || undefined,
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
      metaTitle: metaTitle || undefined,
      metaDescription: metaDescription || undefined,
      netPrice: Number(netPrice),
      discountPercent: Number(discountPercent),
      allowsExtraSaya: kind === 'SAREE' ? allowsExtraSaya : false,
      extraSayaPrice:
        kind === 'SAREE' && allowsExtraSaya && extraSayaPrice
          ? Number(extraSayaPrice)
          : undefined,
      variants: variants
        .filter((v) => v.color.trim())
        .flatMap((v) => {
          const color = v.color.trim();
          if (kind === 'SAREE') {
            return [{ color, stockQty: Number(v.stockQtys.trim()) || 0 }];
          } else {
            const sizesArr = v.sizes.split(',').map((s) => s.trim()).filter(Boolean);
            const stocksArr = v.stockQtys.split(',').map((s) => s.trim()).filter(Boolean);
            
            if (sizesArr.length === 0) {
              return [{ color, stockQty: Number(stocksArr[0]) || 0 }];
            }
            
            return sizesArr.map((size, idx) => ({
              color,
              size,
              stockQty: Number(stocksArr[idx]) || 0
            }));
          }
        }),
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
          <ProductBasicInfo
            name={name}
            setName={setName}
            brand={brand}
            setBrand={setBrand}
            metaTitle={metaTitle}
            setMetaTitle={setMetaTitle}
            metaDescription={metaDescription}
            setMetaDescription={setMetaDescription}
          />

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

          <ProductVariants
            variants={variants}
            setVariants={setVariants}
            kind={kind}
          />
        </div>

        {/* Sidebar Column (Right - 1/3) */}
        <div className="space-y-8">
          <ProductOrganization
            kind={kind}
            setKind={setKind}
            categoryId={categoryId}
            setCategoryId={setCategoryId}
            subcategoryId={subcategoryId}
            setSubcategoryId={setSubcategoryId}
            itemTypeId={itemTypeId}
            setItemTypeId={setItemTypeId}
            categories={categories || []}
            setVariants={setVariants}
          />

          <ProductPricing
            netPrice={netPrice}
            setNetPrice={setNetPrice}
            discountPercent={discountPercent}
            setDiscountPercent={setDiscountPercent}
            kind={kind}
            allowsExtraSaya={allowsExtraSaya}
            setAllowsExtraSaya={setAllowsExtraSaya}
            extraSayaPrice={extraSayaPrice}
            setExtraSayaPrice={setExtraSayaPrice}
          />
        </div>
      </div>
    </form>
  );
}
