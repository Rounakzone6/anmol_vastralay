'use client';

import Image from 'next/image';
import { useState } from 'react';
import { fileToDataUri } from '@/lib/images';
import { trpc } from '@/lib/trpc';
import { Image as ImageIcon, UploadCloud, X } from 'lucide-react';
import { Spinner } from '@/components/ui';

type ImageUploadProps = {
  value: string | null;
  onChange: (url: string | null) => void;
  error?: string | null;
  label?: string;
  aspectRatio?: 'square' | 'video' | 'auto';
};

export function ImageUpload({
  value,
  onChange,
  error,
  label = 'Upload Image',
  aspectRatio = 'square',
}: ImageUploadProps) {
  const upload = trpc.product.uploadImage.useMutation();
  const [isUploading, setIsUploading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  async function handleFile(file: File | null) {
    if (!file) return;
    setLocalError(null);
    setIsUploading(true);
    try {
      const dataUri = await fileToDataUri(file);
      const result = await upload.mutateAsync({ dataUri });
      onChange(result.url);
    } catch (e) {
      setLocalError(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  }

  const aspectClass = aspectRatio === 'square' ? 'aspect-square' : aspectRatio === 'video' ? 'aspect-video' : 'h-32';

  return (
    <div>
      <span className="block text-sm font-medium text-slate-700 mb-2">{label}</span>
      {(error || localError) && (
        <p className="mb-2 text-sm text-rose-600 font-medium">{error || localError}</p>
      )}
      
      {value ? (
        <div className={`relative overflow-hidden rounded-xl bg-slate-100 ring-1 ring-slate-200 group w-32 ${aspectClass}`}>
          <Image
            src={value}
            alt="Uploaded"
            fill
            className="object-cover transition-transform group-hover:scale-105"
            unoptimized
          />
          <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <button
              type="button"
              className="bg-rose-500 text-white rounded-full p-1.5 hover:bg-rose-600 shadow-sm"
              onClick={() => onChange(null)}
              title="Remove image"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      ) : (
        <label className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 text-center text-slate-500 hover:bg-slate-100 hover:border-slate-400 cursor-pointer transition-colors w-32 ${aspectClass}`}>
          {isUploading ? (
            <div className="flex flex-col items-center">
              <Spinner size={24} className="mb-2" />
              <span className="text-sm font-medium">Uploading…</span>
            </div>
          ) : (
            <>
              <div className="rounded-full bg-slate-200/50 p-2 mb-2 text-slate-400">
                <UploadCloud size={18} />
              </div>
              <span className="text-xs font-medium">Click to upload</span>
            </>
          )}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/jpg"
            className="hidden"
            disabled={isUploading}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleFile(file);
              e.target.value = '';
            }}
          />
        </label>
      )}
    </div>
  );
}
