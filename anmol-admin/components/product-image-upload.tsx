'use client';

import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import { Label, Spinner } from '@/components/ui';
import { fileToDataUri } from '@/lib/images';
import { trpc } from '@/lib/trpc';
import { UploadCloud, ImagePlus, Link2, Trash2, Sparkles, RefreshCw } from 'lucide-react';

export type ProductImageSlot = {
  url: string;
  publicId?: string;
  preview: string;
  altText?: string;
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
  const [dragOverSlot, setDragOverSlot] = useState<number | null>(null);
  const [isSectionDragOver, setIsSectionDragOver] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  // Ensure value is always array of 4
  const slots = Array.from({ length: 4 }, (_, i) => value[i] ?? null);

  // ─── Single File Upload Handler ───
  async function handleFile(slot: number, file: File) {
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
        altText: next[slot]?.altText || '',
      };
      onChange(next.slice(0, 4));
    } catch (e) {
      setLocalError(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setUploadingSlot(null);
    }
  }

  // ─── URL Upload Handler (from web drag & drop or paste) ───
  async function handleUrlUpload(slot: number, url: string) {
    if (!url.trim()) return;
    const cleanUrl = url.trim();
    setLocalError(null);
    setUploadingSlot(slot);

    try {
      // First try sending URL to backend (Cloudinary/ImageKit can download and store remote URLs permanently)
      const result = await upload.mutateAsync({ dataUri: cleanUrl });
      const next = [...value];
      while (next.length < 4) next.push(null);
      next[slot] = {
        url: result.url,
        publicId: result.publicId,
        preview: result.url,
        altText: next[slot]?.altText || '',
      };
      onChange(next.slice(0, 4));
    } catch (err) {
      console.warn('Backend remote upload failed, storing direct image URL:', err);
      // Fallback: use direct URL so user is never blocked
      const next = [...value];
      while (next.length < 4) next.push(null);
      next[slot] = {
        url: cleanUrl,
        preview: cleanUrl,
        altText: next[slot]?.altText || '',
      };
      onChange(next.slice(0, 4));
    } finally {
      setUploadingSlot(null);
    }
  }

  // ─── Multiple Files Handler ───
  async function handleMultipleFiles(files: File[], startSlot: number) {
    if (!files.length) return;
    setLocalError(null);
    const next = [...value];
    while (next.length < 4) next.push(null);

    let currentSlot = startSlot;
    for (const file of files) {
      // Find next available slot if current is occupied, or stop if >= 4
      while (currentSlot < 4 && next[currentSlot] !== null && files.length > 1) {
        currentSlot++;
      }
      if (currentSlot >= 4) break;

      setUploadingSlot(currentSlot);
      try {
        const dataUri = await fileToDataUri(file);
        const result = await upload.mutateAsync({ dataUri });
        next[currentSlot] = {
          url: result.url,
          publicId: result.publicId,
          preview: result.url,
          altText: '',
        };
        onChange([...next.slice(0, 4)]);
      } catch (e) {
        setLocalError(e instanceof Error ? e.message : 'Upload failed');
      }
      currentSlot++;
    }
    setUploadingSlot(null);
  }

  // ─── Extract Images / URLs from DataTransfer ───
  function extractDropData(dt: DataTransfer): { files: File[]; url?: string } {
    // 1. Check direct files (dragged from desktop/file manager)
    const files = Array.from(dt.files || []).filter((f) => f.type.startsWith('image/'));
    if (files.length > 0) {
      return { files };
    }

    // 2. Check items for files
    if (dt.items && dt.items.length > 0) {
      const itemFiles: File[] = [];
      for (let i = 0; i < dt.items.length; i++) {
        const item = dt.items[i];
        if (item.kind === 'file') {
          const f = item.getAsFile();
          if (f && f.type.startsWith('image/')) {
            itemFiles.push(f);
          }
        }
      }
      if (itemFiles.length > 0) {
        return { files: itemFiles };
      }
    }

    // 3. Check HTML for <img> tag (dragging image from another webpage or Google Search tab)
    const html = dt.getData('text/html');
    if (html) {
      try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const img = doc.querySelector('img');
        if (img?.src && (img.src.startsWith('http://') || img.src.startsWith('https://') || img.src.startsWith('data:image/'))) {
          return { files: [], url: img.src };
        }
      } catch {
        // ignore parse error
      }
    }

    // 4. Check URI list
    const uriList = dt.getData('text/uri-list');
    if (uriList) {
      const first = uriList.split(/[\r\n]+/)[0]?.trim();
      if (first && (first.startsWith('http://') || first.startsWith('https://'))) {
        return { files: [], url: first };
      }
    }

    // 5. Check plain text
    const text = dt.getData('text/plain')?.trim();
    if (text && (text.startsWith('http://') || text.startsWith('https://') || text.startsWith('data:image/'))) {
      return { files: [], url: text };
    }

    return { files: [] };
  }

  // ─── Drag & Drop for Specific Slot ───
  const handleSlotDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
    if (dragOverSlot !== index) {
      setDragOverSlot(index);
    }
  };

  const handleSlotDragLeave = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (dragOverSlot === index) {
      setDragOverSlot(null);
    }
  };

  const handleSlotDrop = async (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverSlot(null);
    setIsSectionDragOver(false);

    const data = extractDropData(e.dataTransfer);
    if (data.files.length > 1) {
      await handleMultipleFiles(data.files, index);
    } else if (data.files.length === 1) {
      await handleFile(index, data.files[0]);
    } else if (data.url) {
      await handleUrlUpload(index, data.url);
    }
  };

  // ─── Section Drag & Drop (Drop anywhere in container) ───
  const handleSectionDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setIsSectionDragOver(true);
  };

  const handleSectionDragLeave = (e: React.DragEvent) => {
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsSectionDragOver(false);
  };

  const handleSectionDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsSectionDragOver(false);
    setDragOverSlot(null);

    // Find first empty slot, or slot 0
    const firstEmpty = slots.findIndex((s) => s === null);
    const targetSlot = firstEmpty !== -1 ? firstEmpty : 0;

    const data = extractDropData(e.dataTransfer);
    if (data.files.length > 0) {
      await handleMultipleFiles(data.files, targetSlot);
    } else if (data.url) {
      await handleUrlUpload(targetSlot, data.url);
    }
  };

  // ─── Prevent Default Window Drag & Drop (prevents browser navigating away) ───
  useEffect(() => {
    const preventDrag = (e: DragEvent) => {
      e.preventDefault();
    };
    window.addEventListener('dragover', preventDrag);
    window.addEventListener('drop', preventDrag);
    return () => {
      window.removeEventListener('dragover', preventDrag);
      window.removeEventListener('drop', preventDrag);
    };
  }, []);

  // ─── Clipboard Paste (Ctrl+V) Support ───
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) {
            e.preventDefault();
            const firstEmpty = slots.findIndex((s) => s === null);
            void handleFile(firstEmpty !== -1 ? firstEmpty : 0, file);
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [slots]);

  function removeSlot(slot: number) {
    const next = [...value];
    while (next.length < 4) next.push(null);
    next[slot] = null;
    onChange(next.slice(0, 4));
  }

  function updateAltText(slot: number, text: string) {
    const next = [...value];
    if (next[slot]) {
      next[slot] = { ...next[slot]!, altText: text };
      onChange(next.slice(0, 4));
    }
  }

  function setSlotUrl(slot: number, url: string) {
    if (!url.trim()) return;
    handleUrlUpload(slot, url.trim());
  }

  return (
    <section
      ref={sectionRef}
      onDragOver={handleSectionDragOver}
      onDragLeave={handleSectionDragLeave}
      onDrop={handleSectionDrop}
      className={`relative rounded-2xl border transition-all duration-200 bg-white p-6 ${
        isSectionDragOver
          ? 'border-violet-400 bg-violet-50/20 shadow-md ring-2 ring-violet-300/40'
          : 'border-zinc-200 shadow-sm'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            Product Images
            <span className="text-xs font-normal text-violet-600 bg-violet-50 border border-violet-100 px-2 py-0.5 rounded-full flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Drag & Drop Ready
            </span>
          </h2>
          <p className="mt-1 text-xs text-zinc-500">
            Drag any image from your computer or browser tab, or paste direct image URLs. First image is shown on store catalog.
          </p>
        </div>

        <div className="text-[11px] text-zinc-400 font-medium hidden md:block">
          Shortcut: Press <kbd className="px-1.5 py-0.5 rounded bg-zinc-100 border text-zinc-600 font-mono">Ctrl+V</kbd> to paste image
        </div>
      </div>

      {(error || localError) && (
        <div className="mt-3 p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-600 flex items-center justify-between">
          <span>{error || localError}</span>
          <button
            onClick={() => setLocalError(null)}
            className="text-red-400 hover:text-red-700 font-bold ml-2"
          >
            ×
          </button>
        </div>
      )}

      {/* Grid of 4 slots */}
      <div className="mt-5 grid gap-4 grid-cols-2 lg:grid-cols-4">
        {slots.map((slot, i) => {
          const isOver = dragOverSlot === i;
          const isUploading = uploadingSlot === i;

          return (
            <div
              key={i}
              onDragOver={(e) => handleSlotDragOver(e, i)}
              onDragLeave={(e) => handleSlotDragLeave(e, i)}
              onDrop={(e) => handleSlotDrop(e, i)}
              className={`group relative flex flex-col rounded-xl border-2 transition-all duration-200 p-3 ${
                isOver
                  ? 'border-violet-500 bg-violet-50/80 ring-4 ring-violet-400/20 scale-[1.02] shadow-lg'
                  : slot
                  ? 'border-solid border-zinc-200 bg-white hover:border-zinc-300 shadow-xs'
                  : 'border-dashed border-zinc-300 bg-zinc-50/60 hover:border-violet-400 hover:bg-violet-50/30'
              }`}
            >
              {/* Header Label */}
              <div className="flex items-center justify-between mb-2">
                <Label className="text-[11px] font-semibold text-zinc-700 truncate mb-0">
                  {SLOT_LABELS[i]}
                </Label>
                {slot && (
                  <span className="text-[10px] font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                    Active
                  </span>
                )}
              </div>

              {/* Slot Body */}
              {slot ? (
                <div className="relative aspect-[3/4] w-full overflow-hidden rounded-lg bg-zinc-100 border border-zinc-100 shadow-inner group/img">
                  <Image
                    src={slot.preview}
                    alt={`Product image ${i + 1}`}
                    fill
                    className="object-cover transition-transform duration-300 group-hover/img:scale-105"
                    unoptimized
                  />

                  {/* Drag overlay on top of existing image */}
                  {isOver && (
                    <div className="absolute inset-0 bg-violet-600/75 backdrop-blur-xs flex flex-col items-center justify-center text-white z-20 animate-fade-in p-2 text-center">
                      <UploadCloud className="w-8 h-8 mb-1 animate-bounce" />
                      <p className="text-xs font-bold">Drop to replace</p>
                    </div>
                  )}

                  {/* Uploading overlay */}
                  {isUploading && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center text-white z-20">
                      <Spinner size={24} className="mb-2 text-violet-400" />
                      <span className="text-xs font-medium">Uploading…</span>
                    </div>
                  )}

                  {/* Actions overlay */}
                  <div className="absolute top-2 right-2 flex items-center gap-1.5 opacity-90 group-hover/img:opacity-100 transition-opacity z-10">
                    <button
                      type="button"
                      title="Remove image"
                      className="rounded-full bg-black/70 hover:bg-rose-600 text-white p-1.5 shadow-md transition-colors"
                      onClick={() => removeSlot(i)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  className={`relative flex aspect-[3/4] w-full flex-col items-center justify-center rounded-lg border border-transparent transition-all p-3 text-center ${
                    isOver ? 'bg-violet-100/60' : 'bg-zinc-100/40'
                  }`}
                >
                  {isUploading ? (
                    <div className="flex flex-col items-center text-violet-600">
                      <Spinner size={28} className="mb-2 text-violet-600" />
                      <span className="text-xs font-semibold">Uploading to Cloud…</span>
                      <span className="text-[10px] text-zinc-400 mt-1">Please wait</span>
                    </div>
                  ) : isOver ? (
                    <div className="flex flex-col items-center text-violet-700 animate-pulse">
                      <UploadCloud className="w-10 h-10 mb-2" />
                      <span className="text-xs font-bold">Release to drop image!</span>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center cursor-pointer w-full h-full">
                      <div className="w-10 h-10 rounded-full bg-violet-50 text-violet-600 flex items-center justify-center mb-2 group-hover:scale-110 group-hover:bg-violet-100 transition-all shadow-xs">
                        <ImagePlus className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-semibold text-zinc-700 group-hover:text-violet-700 transition-colors">
                        Drop image here
                      </span>
                      <span className="text-[11px] text-zinc-400 mt-0.5">
                        or <span className="underline text-violet-600">browse file</span>
                      </span>

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

                  {!isUploading && !isOver && (
                    <button
                      type="button"
                      className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-violet-600 hover:text-violet-800 hover:underline pt-1 border-t border-zinc-200/60 w-full justify-center transition-colors"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const url = window.prompt('Paste direct image URL (https://...):');
                        if (url && url.trim().startsWith('http')) {
                          setSlotUrl(i, url.trim());
                        }
                      }}
                    >
                      <Link2 className="w-3 h-3" /> Or paste URL
                    </button>
                  )}
                </div>
              )}

              {/* Slot Footer: Replace / Alt Text */}
              {slot && (
                <div className="mt-2.5 space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <label className="cursor-pointer text-violet-600 hover:text-violet-800 hover:underline flex items-center gap-1 font-medium">
                      <RefreshCw className="w-3 h-3" /> Replace
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
                    <button
                      type="button"
                      className="text-zinc-400 hover:text-violet-600"
                      onClick={() => {
                        const url = window.prompt('Paste replacement image URL:', slot.url);
                        if (url && url.trim().startsWith('http')) {
                          setSlotUrl(i, url.trim());
                        }
                      }}
                    >
                      Change URL
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="Alt text (e.g. Red silk saree front view)"
                    value={slot.altText || ''}
                    onChange={(e) => updateAltText(i, e.target.value)}
                    className="w-full text-[11px] px-2.5 py-1.5 border border-zinc-200 rounded-md bg-zinc-50/50 focus:bg-white focus:border-violet-500 focus:outline-none transition-colors"
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
