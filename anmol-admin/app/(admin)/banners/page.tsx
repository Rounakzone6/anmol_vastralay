'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { PageHeader } from '@/components/page-header';
import { Button, Card, Input, Label } from '@/components/ui';
import { trpc } from '@/lib/trpc';
import { fileToDataUri } from '@/lib/images';
import { UploadCloud, Edit3, Check, X } from 'lucide-react';
import { Spinner } from '@/components/ui';

// Reusable component for inline text editing
function InlineEdit({ 
  value, 
  onSave, 
  multiline = false,
  className = "" 
}: { 
  value: string; 
  onSave: (val: string) => void;
  multiline?: boolean;
  className?: string;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [currentValue, setCurrentValue] = useState(value);

  const handleSave = () => {
    setIsEditing(false);
    if (currentValue !== value) {
      onSave(currentValue);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setCurrentValue(value);
  };

  if (isEditing) {
    return (
      <div className="flex items-start gap-2 relative z-50 bg-white p-1 rounded border shadow-sm">
        {multiline ? (
          <textarea
            className="w-full text-sm border-gray-300 rounded p-1 min-h-[60px]"
            value={currentValue}
            onChange={(e) => setCurrentValue(e.target.value)}
            autoFocus
          />
        ) : (
          <input
            className="w-full text-sm border-gray-300 rounded p-1"
            value={currentValue}
            onChange={(e) => setCurrentValue(e.target.value)}
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          />
        )}
        <div className="flex flex-col gap-1">
          <button onClick={handleSave} className="p-1 bg-green-100 text-green-700 rounded hover:bg-green-200">
            <Check size={16} />
          </button>
          <button onClick={handleCancel} className="p-1 bg-red-100 text-red-700 rounded hover:bg-red-200">
            <X size={16} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`group relative cursor-text hover:bg-black/5 hover:ring-2 hover:ring-violet-400 rounded transition-all px-1 -mx-1 ${className}`}
      onClick={() => setIsEditing(true)}
    >
      {value || <span className="text-gray-400 italic">Click to add text</span>}
      <div className="absolute right-0 top-0 opacity-0 group-hover:opacity-100 p-1 bg-white rounded shadow-sm text-gray-500 translate-x-full ml-1">
        <Edit3 size={14} />
      </div>
    </div>
  );
}

export default function BannersVisualEditor() {
  const utils = trpc.useUtils();
  const { data: banners, isLoading } = trpc.banner.adminGetBanners.useQuery();

  const seed = trpc.banner.adminSeedBanners.useMutation({
    onSuccess: () => utils.banner.adminGetBanners.invalidate(),
    onError: (err) => alert('Failed to seed banners: ' + err.message),
  });

  const update = trpc.banner.adminUpdateBanner.useMutation({
    onSuccess: () => utils.banner.adminGetBanners.invalidate(),
    onError: (err) => alert(err.message),
  });

  const [uploadingId, setUploadingId] = useState<string | null>(null);

  const handleImageUpload = async (id: string, file: File) => {
    setUploadingId(id);
    try {
      const dataUri = await fileToDataUri(file);
      await update.mutateAsync({ id, imageData: dataUri });
    } catch (e: any) {
      alert(e.message || 'Upload failed');
    } finally {
      setUploadingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="p-20 flex flex-col items-center justify-center text-slate-400">
        <Spinner size={32} className="mb-4" />
        <p className="text-sm font-medium">Loading banners...</p>
      </div>
    );
  }

  if (!banners || banners.length === 0) {
    return (
      <div className="p-8">
        <PageHeader title="Banners" description="Visual editor for storefront banners" />
        <Card className="p-12 text-center flex flex-col items-center justify-center space-y-4">
          <h2 className="text-xl font-semibold">No Banners Found</h2>
          <p className="text-zinc-500 max-w-md">
            Your database doesn't have the default banners. Click the button below to initialize the database with the hardcoded frontend designs.
          </p>
          <Button onClick={() => seed.mutate()} disabled={seed.isPending}>
            {seed.isPending ? 'Initializing...' : 'Initialize Default Banners'}
          </Button>
        </Card>
      </div>
    );
  }

  const heroBanners = banners.filter((b: any) => b.placement === 'HERO');
  const categoryBanners = banners.filter((b: any) => b.placement === 'CATEGORY');

  const renderBannerCard = (banner: any, type: 'hero' | 'category') => {
    const isHero = type === 'hero';
    
    return (
      <div key={banner.id} className="relative rounded-xl border border-zinc-200 bg-white overflow-hidden shadow-sm group">
        {/* Image Container */}
        <div className="relative h-48 sm:h-56 bg-zinc-100 overflow-hidden">
          <Image 
            src={banner.imageUrl} 
            alt={banner.title} 
            fill 
            className="object-cover object-center" 
            unoptimized 
          />
          
          {/* Image Upload Overlay */}
          <label className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
            {uploadingId === banner.id ? (
              <div className="flex flex-col items-center">
                <Spinner size={32} className="mb-2 text-white" />
                <span className="text-white font-medium">Uploading...</span>
              </div>
            ) : (
              <>
                <UploadCloud className="text-white mb-2" size={32} />
                <span className="text-white font-medium">Change Image</span>
              </>
            )}
            <input 
              type="file" 
              className="hidden" 
              accept="image/jpeg,image/png,image/webp"
              disabled={uploadingId !== null}
              onChange={(e) => {
                if (e.target.files?.[0]) handleImageUpload(banner.id, e.target.files[0]);
                e.target.value = '';
              }}
            />
          </label>
        </div>

        {/* Text Container */}
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1">Title</label>
            <InlineEdit 
              value={banner.title} 
              onSave={(val) => update.mutate({ id: banner.id, title: val })}
              className={`font-bold ${isHero ? 'text-xl' : 'text-lg'}`}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1">Subtitle</label>
            <InlineEdit 
              value={banner.subtitle || ''} 
              onSave={(val) => update.mutate({ id: banner.id, subtitle: val })}
              multiline
              className="text-sm text-zinc-600"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1">Button Text</label>
            <InlineEdit 
              value={banner.buttonText || ''} 
              onSave={(val) => update.mutate({ id: banner.id, buttonText: val })}
              className="inline-block px-3 py-1 bg-violet-100 text-violet-800 rounded-full text-xs font-semibold"
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-10 pb-12">
      <PageHeader 
        title="Visual Banner Editor" 
        description="Click any text to edit it, or hover over an image to replace it." 
      />

      <section>
        <div className="mb-4">
          <h2 className="text-xl font-bold text-zinc-900">Hero Slider Banners</h2>
          <p className="text-sm text-zinc-500">These appear in the main rotating carousel on the homepage.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {heroBanners.map((b: any) => renderBannerCard(b, 'hero'))}
        </div>
      </section>

      <section>
        <div className="mb-4">
          <h2 className="text-xl font-bold text-zinc-900">Category Banners</h2>
          <p className="text-sm text-zinc-500">These appear above specific category sections on the homepage.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categoryBanners.map((b: any) => renderBannerCard(b, 'category'))}
        </div>
      </section>
    </div>
  );
}
