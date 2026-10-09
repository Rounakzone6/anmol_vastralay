'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/page-header';
import { useDebounce } from '@/hooks/use-debounce';
import { Button, Card, Input, Label, Textarea, Badge, Spinner } from '@/components/ui';
import { ImageUpload } from '@/components/image-upload';
import { trpc } from '@/lib/trpc';
import { Plus, Search } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { SortableCategoryRow } from '@/app/(admin)/categories/components/sortable-category-row';

export default function CategoriesPage() {
  const utils = trpc.useUtils();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 500);

  const { data: categories, isLoading } = trpc.category.list.useQuery({
    includeInactive: true,
    search: debouncedSearch || undefined,
  });
  
  // Local state for optimistic drag & drop
  const [localCategories, setLocalCategories] = useState<any[]>([]);

  useEffect(() => {
    if (categories) {
      setLocalCategories(categories);
    }
  }, [categories]);

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
  const reorder = trpc.category.reorder.useMutation({
    onSuccess: () => utils.category.list.invalidate(),
  });

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editImageUrl, setEditImageUrl] = useState<string | null>(null);

  function startEdit(c: any) {
    setEditingId(c.id);
    setEditName(c.name);
    setEditDescription(c.description ?? '');
    setEditImageUrl(c.imageUrl);
  }

  function handleEditChange(field: string, value: any) {
    if (field === 'editName') setEditName(value);
    if (field === 'editDescription') setEditDescription(value);
    if (field === 'editImageUrl') setEditImageUrl(value);
  }

  function handleSaveEdit(c: any) {
    update.mutate({
      id: c.id,
      name: editName,
      description: editDescription || null,
      imageUrl: editImageUrl || null,
    });
  }

  function handleDelete(category: any) {
    if (category._count.products > 0) {
      alert(`"${category.name}" has ${category._count.products} product(s). Hide it from the shop instead, or change those products to another category first.`);
      return;
    }
    if (confirm(`Permanently delete "${category.name}"?\n\nThis cannot be undone.`)) {
      remove.mutate({ id: category.id, hard: true });
    }
  }

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = localCategories.findIndex((c) => c.id === active.id);
      const newIndex = localCategories.findIndex((c) => c.id === over.id);
      
      const newCategories = arrayMove(localCategories, oldIndex, newIndex);
      setLocalCategories(newCategories);
      
      reorder.mutate(
        newCategories.map((c: any, idx) => ({ id: c.id, sortOrder: idx }))
      );
    }
  };

  return (
    <div className="pb-12">
      <PageHeader
        title="Categories"
        description="Manage your product categories like Silk, Suti, and Saree."
        action={
          <div className="flex flex-wrap cursor-pointer gap-3">
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

      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={16} className="text-slate-400" />
          </div>
          <Input
            className="pl-10"
            placeholder="Search categories by name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {showForm ? (
        <Card className="mb-8 border-violet-100 ring-violet-50">
          <form
            className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 p-2"
            onSubmit={(e) => {
              e.preventDefault();
              create.mutate({ name, description: description || undefined, imageUrl: imageUrl || undefined, metaTitle: metaTitle || undefined, metaDescription: metaDescription || undefined });
              setName('');
              setDescription('');
              setMetaTitle('');
              setMetaDescription('');
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
              <div>
                <div className="flex items-center justify-between mb-2 mt-4 border-t pt-4">
                  <Label className="text-sm font-semibold text-slate-700 block">SEO Title</Label>
                  <span className={`text-xs ${metaTitle.length > 60 ? 'text-red-500 font-bold' : 'text-slate-400'}`}>
                    {metaTitle.length}/60
                  </span>
                </div>
                <Input 
                  value={metaTitle} 
                  onChange={(e) => setMetaTitle(e.target.value)} 
                  placeholder={name ? `${name} Collection` : "Auto-generated fallback"}
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm font-semibold text-slate-700 block">SEO Description</Label>
                  <span className={`text-xs ${metaDescription.length > 160 ? 'text-red-500 font-bold' : 'text-slate-400'}`}>
                    {metaDescription.length}/160
                  </span>
                </div>
                <Textarea
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                  rows={2}
                  placeholder={name ? `Explore the latest ${name} styles at Anmol Vastralay.` : "Auto-generated fallback"}
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
            <Spinner size={32} className="mb-4" />
            <p className="text-sm font-medium">Loading categories...</p>
          </div>
        ) : !localCategories.length ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <p className="text-lg font-medium text-slate-900 mb-2">No categories found</p>
            <p className="text-sm text-slate-500 max-w-md">
              You haven't created any categories yet. Click "Add Category" to get started or load the defaults.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <table className="w-full text-left text-sm min-w-[700px]">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-3 py-4 w-10"></th>
                    <th className="px-6 py-4 w-20 text-center">Logo</th>
                    <th className="px-6 py-4">Name</th>
                    <th className="px-6 py-4 text-center">Products</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <SortableContext items={localCategories.map(c => c.id)} strategy={verticalListSortingStrategy}>
                    {localCategories.map((c: any) => (
                      <SortableCategoryRow
                        key={c.id}
                        category={c}
                        editingId={editingId}
                        editName={editName}
                        editDescription={editDescription}
                        editImageUrl={editImageUrl}
                        isUpdating={update.isPending}
                        onEditChange={handleEditChange}
                        onStartEdit={startEdit}
                        onCancelEdit={() => setEditingId(null)}
                        onSaveEdit={handleSaveEdit}
                        onDelete={handleDelete}
                      />
                    ))}
                  </SortableContext>
                </tbody>
              </table>
            </DndContext>
          </div>
        )}
      </div>
    </div>
  );
}
