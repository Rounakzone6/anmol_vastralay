'use client';

import Image from 'next/image';
import { useState } from 'react';
import { Label, Spinner } from '@/components/ui';
import { fileToDataUri } from '@/lib/images';
import { trpc } from '@/lib/trpc';

export type ProductImageSlot = {
  url: string;
  publicId?: string;
  preview: string;
};

const SLOT_LABELS = [
  'Main image (required)',
  'Image 2 (optional)',
  'Image 3 (optional)',
  'Image 4 (optional)',
];

type ProductImageUploadProps = {
  value: (ProductImageSlot | null)[];
  onChange: (slots: (ProductImageSlot | null)[]) => void;
  error?: string | null;
};

export function ProductImageUpload({
  value,
  onChange,
  error,
}: ProductImageUploadProps) {
  const upload = trpc.product.uploadImage.useMutation();
  const [uploadingSlot, setUploadingSlot] = useState<number | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  async function handleFile(slot: number, file: File | null) {
    if (!file) return;
    setLocalError(null);
    setUploadingSlot(slot);
    try {
      const dataUri = await fileToDataUri(file);
      const result = await upload.mutateAsync({ dataUri });
      const next = [...value];
      while (next.length < 4) next.push(null);
      next[slot] = {
        url: result.url,
        publicId: result.publicId,
        preview: result.url,
      };
      onChange(next.slice(0, 4));
    } catch (e) {
      setLocalError(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setUploadingSlot(null);
    }
  }

  function removeSlot(slot: number) {
    const next = [...value];
    while (next.length < 4) next.push(null);
    next[slot] = null;
    onChange(next.slice(0, 4));
  }

  const slots = Array.from({ length: 4 }, (_, i) => value[i] ?? null);

  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-6">
      <h2 className="text-lg font-semibold">Product images</h2>
      <p className="mt-1 text-sm text-zinc-500">
        Upload up to 4 photos. The first image is shown on the shop (required).
      </p>
      {(error || localError) && (
        <p className="mt-2 text-sm text-red-600">{error || localError}</p>
      )}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {slots.map((slot, i) => (
          <div key={i} className="rounded-lg border border-dashed border-zinc-300 p-3">
            <Label>{SLOT_LABELS[i]}</Label>
            {slot ? (
              <div className="relative mt-2 aspect-[3/4] overflow-hidden rounded-md bg-zinc-100">
                <Image
                  src={slot.preview}
                  alt={`Product ${i + 1}`}
                  fill
                  className="object-cover"
                  unoptimized
                />
                <button
                  type="button"
                  className="absolute right-1 top-1 rounded bg-black/60 px-2 py-0.5 text-xs text-white"
                  onClick={() => removeSlot(i)}
                >
                  Remove
                </button>
              </div>
            ) : (
              <label className="mt-2 flex aspect-[3/4] cursor-pointer flex-col items-center justify-center rounded-md bg-zinc-50 text-center text-xs text-zinc-500 hover:bg-zinc-100">
                {uploadingSlot === i ? (
                  <div className="flex flex-col items-center">
                    <Spinner size={20} className="mb-2" />
                    <span>Uploading…</span>
                  </div>
                ) : (
                  <span>Click to upload</span>
                )}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/jpg"
                  className="hidden"
                  disabled={uploadingSlot !== null}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void handleFile(i, file);
                    e.target.value = '';
                  }}
                />
              </label>
            )}
            {slot ? (
              <label className="mt-2 block cursor-pointer text-center text-xs text-violet-700 hover:underline">
                Replace
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/jpg"
                  className="hidden"
                  disabled={uploadingSlot !== null}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void handleFile(i, file);
                    e.target.value = '';
                  }}
                />
              </label>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}
