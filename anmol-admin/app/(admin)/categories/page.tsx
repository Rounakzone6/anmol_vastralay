'use client';

import { useState } from 'react';
import Image from 'next/image';
import { PageHeader } from '@/components/page-header';
import { Button, Card, Input, Label, Textarea, Badge } from '@/components/ui';
import { ImageUpload } from '@/components/image-upload';
import { trpc } from '@/lib/trpc';
import { Plus, Download, Edit2, Eye, EyeOff, Trash2, Image as ImageIcon, Settings2, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function CategoriesPage() {
  const utils = trpc.useUtils();
  const { data: categories, isLoading } = trpc.category.list.useQuery({
    includeInactive: true,
  });
  const create = trpc.category.create.useMutation({
    onSuccess: () => {
      utils.category.list.invalidate();
      setShowForm(false);
    },
  });
  const update = trpc.category.update.useMutation({
    onSuccess: () => {
      utils.category.list.invalidate();
      setEditingId(null);
    },
  });
  const remove = trpc.category.delete.useMutation({
    onSuccess: () => utils.category.list.invalidate(),
    onError: (err) => alert(err.message),
  });
  const seedDefaults = trpc.category.seedDefaults.useMutation({
    onSuccess: (res) => {
      utils.category.list.invalidate();
      alert(`Loaded ${res.count} categories (Silk, Suti, Sefon, Saree, …)`);
    },
  });

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editImageUrl, setEditImageUrl] = useState<string | null>(null);

  function startEdit(id: string, currentName: string, currentDesc: string | null, currentImage: string | null) {
    setEditingId(id);
    setEditName(currentName);
    setEditDescription(currentDesc ?? '');
    setEditImageUrl(currentImage);
  }

  function handleHide(category: { id: string; name: string; isActive: boolean }) {
    update.mutate({ id: category.id, isActive: !category.isActive });
  }

  function handleDelete(category: {
    id: string;
    name: string;
    _count: { products: number };
  }) {
    if (category._count.products > 0) {
      alert(
        `"${category.name}" has ${category._count.products} product(s). Hide it from the shop instead, or change those products to another category first.`,
      );
      return;
    }

    if (
      confirm(
        `Permanently delete "${category.name}"?\n\nThis cannot be undone.`,
      )
    ) {
      remove.mutate({ id: category.id, hard: true });
    }
  }

  return (
    <div className="pb-12">
      <PageHeader
        title="Categories"
        description="Manage your product categories like Silk, Suti, and Saree."
        action={
          <div className="flex flex-wrap gap-3">

            <Button type="button" onClick={() => setShowForm((v) => !v)}>
              {showForm ? 'Cancel' : (
                <>
                  <Plus size={16} className="mr-2" />
                  Add Category
                </>
              )}
            </Button>
          </div>
        }
      />

      {showForm ? (
        <Card className="mb-8 border-violet-100 ring-violet-50">
          <form
            className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 p-2"
            onSubmit={(e) => {
              e.preventDefault();
              create.mutate({ name, description: description || undefined, imageUrl: imageUrl || undefined });
              setName('');
              setDescription('');
              setImageUrl(null);
            }}
          >
            <div className="col-span-1">
              <ImageUpload 
                label="Category Logo" 
                value={imageUrl} 
                onChange={setImageUrl} 
              />
            </div>
            <div className="md:col-span-1 lg:col-span-2 space-y-4">
              <div>
                <Label>Category Name</Label>
                <Input 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  required 
                  placeholder="e.g., Summer Collection"
                />
              </div>
              <div>
                <Label>Description (optional)</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  placeholder="Brief description of this category"
                />
              </div>
              <div className="flex justify-end pt-2">
                <Button type="submit" disabled={create.isPending}>
                  Save Category
                </Button>
              </div>
            </div>
          </form>
        </Card>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ring-1 ring-slate-900/5">
        {isLoading ? (
          <div className="p-12 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="h-8 w-8 animate-spin mb-4" />
            <p className="text-sm font-medium">Loading categories...</p>
          </div>
        ) : !categories?.length ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <p className="text-lg font-medium text-slate-900 mb-2">No categories found</p>
            <p className="text-sm text-slate-500 max-w-md">
              You haven't created any categories yet. Click "Add Category" to get started or load the defaults.
            </p>
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 w-20 text-center">Logo</th>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4 text-center">Products</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {categories.map((c) =>
                editingId === c.id ? (
                  <tr key={c.id} className="bg-violet-50/30">
                    <td className="px-6 py-6" colSpan={5}>
                      <div className="flex flex-col md:flex-row gap-6">
                        <div className="shrink-0">
                          <ImageUpload 
                            label="Category Logo" 
                            value={editImageUrl} 
                            onChange={setEditImageUrl} 
                          />
                        </div>
                        <div className="flex-1 space-y-4">
                          <div>
                            <Label>Name</Label>
                            <Input
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                            />
                          </div>
                          <div>
                            <Label>Description</Label>
                            <Textarea
                              value={editDescription}
                              onChange={(e) => setEditDescription(e.target.value)}
                              rows={2}
                            />
                          </div>
                          <div className="flex items-end justify-end gap-2 shrink-0 pt-2">
                            <Button
                              type="button"
                              variant="secondary"
                              onClick={() => setEditingId(null)}
                            >
                              Cancel
                            </Button>
                            <Button
                              type="button"
                              disabled={update.isPending}
                              onClick={() =>
                                update.mutate({
                                  id: c.id,
                                  name: editName,
                                  description: editDescription || null,
                                  imageUrl: editImageUrl || null,
                                })
                              }
                            >
                              Save Changes
                            </Button>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <tr key={c.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4 flex justify-center">
                      <div className="h-12 w-12 rounded-lg bg-slate-100 overflow-hidden flex items-center justify-center border border-slate-200">
                        {c.imageUrl ? (
                          <Image src={c.imageUrl} alt={c.name} width={48} height={48} className="object-cover w-full h-full" unoptimized />
                        ) : (
                          <ImageIcon size={20} className="text-slate-400" />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-900">{c.name}</p>
                      <p className="text-xs text-slate-500 mt-1">{c.slug}</p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {c._count.products > 0 ? (
                        <Badge variant="default" className="bg-slate-100 text-slate-700 font-medium">
                          {c._count.products} item{c._count.products !== 1 ? 's' : ''}
                        </Badge>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {c.isActive ? (
                        <Badge variant="success">Active</Badge>
                      ) : (
                        <Badge variant="default">Hidden</Badge>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          className="px-2 py-1 text-xs"
                          onClick={() => startEdit(c.id, c.name, c.description, c.imageUrl)}
                        >
                          <Edit2 size={14} className="mr-1" />
                          Edit
                        </Button>
                        <Link href={`/categories/${c.id}`}>
                          <Button
                            type="button"
                            variant="outline"
                            className="px-2 py-1 text-xs"
                          >
                            <Settings2 size={14} className="mr-1" />
                            Manage
                          </Button>
                        </Link>
                        <Button
                          type="button"
                          variant="danger"
                          className="px-2 py-1 text-xs"
                          disabled={c._count.products > 0}
                          title={c._count.products > 0 ? 'Remove or reassign products before deleting' : ''}
                          onClick={() => handleDelete(c)}
                        >
                          <Trash2 size={14} className="mr-1" />
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
