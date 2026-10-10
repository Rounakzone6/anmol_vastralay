import { Card, Input, Label, Button } from '@/components/ui';
import { Info, Sparkles, Loader2 } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

type ProductBasicInfoProps = {
  name: string;
  setName: (v: string) => void;
  brand: string;
  setBrand: (v: string) => void;
  metaTitle: string;
  setMetaTitle: (v: string) => void;
  metaDescription: string;
  setMetaDescription: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
  imageUrl?: string;
  categoryId?: string;
  categories?: any[];
};

export function ProductBasicInfo({ name, setName, brand, setBrand, metaTitle, setMetaTitle, metaDescription, setMetaDescription, description, setDescription, imageUrl, categoryId, categories }: ProductBasicInfoProps) {
  const generateAiDetails = trpc.product.generateAiDetails.useMutation({
    onSuccess: (data: any) => {
      if (data.name) setName(data.name);
      if (data.brand) setBrand(data.brand);
      if (data.description) setDescription(data.description);
      if (data.metaTitle) setMetaTitle(data.metaTitle);
      if (data.metaDescription) setMetaDescription(data.metaDescription);
      toast.success('AI successfully generated and updated all details!');
    },
    onError: (error) => {
      toast.error('AI generation failed: ' + error.message);
    }
  });

  const handleGenerate = () => {
    if (!imageUrl && !name?.trim() && !description?.trim()) {
      toast.error('Please upload a product image or enter a title/description first before using AI.');
      return;
    }
    const catName = categories?.find(c => c.id === categoryId)?.name || '';
    toast.info('Analyzing details and generating product information...');
    generateAiDetails.mutate({
      imageUrl: imageUrl || undefined,
      categoryName: catName,
      name: name?.trim() || undefined,
      brand: brand?.trim() || undefined,
      description: description?.trim() || undefined,
    });
  };

  return (
    <Card className="p-8 rounded-3xl border-slate-200/60 shadow-sm overflow-hidden relative">
      <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
        <Info size={120} />
      </div>
      <div className="flex items-center justify-between mb-8 relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-violet-100 text-violet-700 rounded-xl">
            <Info size={20} />
          </div>
          <h3 className="text-xl font-bold text-slate-900 tracking-tight">Basic Information</h3>
        </div>
        <Button 
          type="button" 
          onClick={handleGenerate}
          disabled={generateAiDetails.isPending || (!imageUrl && !name?.trim() && !description?.trim())}
          className="bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-700 hover:to-pink-700 text-white rounded-xl shadow-md transition-all font-bold gap-2"
        >
          {generateAiDetails.isPending ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
          {generateAiDetails.isPending ? 'Generating...' : 'Auto-Generate with AI'}
        </Button>
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

        <div className="group">
          <Label className="text-sm font-semibold text-slate-700 mb-2 block">Product Description (Supports HTML)</Label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the material, occasion, and style..."
            rows={5}
            className="w-full text-md p-4 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white transition-colors shadow-inner focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
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
