'use client';

import { use, useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button, Card, Input, Label, Textarea, Spinner } from '@/components/ui';
import { trpc } from '@/lib/trpc';
import { Plus, Trash2, Edit2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function CategoryDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const utils = trpc.useUtils();
  
  const { data: categories } = trpc.category.list.useQuery({ includeInactive: true });
  const category = categories?.find((c: any) => c.id === id);

  const createSubcategory = trpc.category.createSubcategory.useMutation({
    onSuccess: () => {
      utils.category.list.invalidate();
      setShowSubForm(false);
      setSubName('');
      setSubDesc('');
    }
  });

  const deleteSubcategory = trpc.category.deleteSubcategory.useMutation({
    onSuccess: () => utils.category.list.invalidate(),
  });

  const createItemType = trpc.category.createItemType.useMutation({
    onSuccess: () => {
      utils.category.list.invalidate();
      setNewItemTypeSubId(null);
      setItemName('');
      setItemDesc('');
    }
  });

  const deleteItemType = trpc.category.deleteItemType.useMutation({
    onSuccess: () => utils.category.list.invalidate(),
  });

  const [showSubForm, setShowSubForm] = useState(false);
  const [subName, setSubName] = useState('');
  const [subDesc, setSubDesc] = useState('');

  const [newItemTypeSubId, setNewItemTypeSubId] = useState<string | null>(null);
  const [itemName, setItemName] = useState('');
  const [itemDesc, setItemDesc] = useState('');

  if (!category) return (
    <div className="p-12 flex flex-col items-center justify-center text-slate-400">
      <Spinner size={32} className="mb-4" />
      <p className="text-sm font-medium">Loading category details...</p>
    </div>
  );

  return (
    <div className="pb-12">
      <Link href="/categories" className="inline-flex items-center text-sm text-violet-600 hover:text-violet-700 font-medium mb-6">
        <ArrowLeft size={16} className="mr-1" />
        Back to Categories
      </Link>
      
      <PageHeader
        title={`Manage: ${category.name}`}
        description="Add subcategories (e.g., Vest) and item types (e.g., Whitevest)"
        action={
          <Button onClick={() => setShowSubForm(!showSubForm)}>
            <Plus size={16} className="mr-2" />
            Add Subcategory
          </Button>
        }
      />

      {showSubForm && (
        <Card className="mb-8 border-violet-100 ring-violet-50 p-6">
          <form
            className="grid gap-6 md:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault();
              createSubcategory.mutate({ name: subName, description: subDesc, categoryId: category.id });
            }}
          >
            <div>
              <Label>Subcategory Name</Label>
              <Input value={subName} onChange={(e) => setSubName(e.target.value)} required placeholder="e.g., Vest" />
            </div>
            <div>
              <Label>Description</Label>
              <Input value={subDesc} onChange={(e) => setSubDesc(e.target.value)} placeholder="Optional" />
            </div>
            <div className="md:col-span-2 flex justify-end">
              <Button type="submit" disabled={createSubcategory.isPending}>Save Subcategory</Button>
            </div>
          </form>
        </Card>
      )}

      <div className="space-y-6">
        {category.subcategories?.map((sub: any) => (
          <Card key={sub.id} className="overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-100 p-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-lg">{sub.name}</h3>
                {sub.description && <p className="text-sm text-slate-500">{sub.description}</p>}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="text-sm px-3 py-1.5 h-8" onClick={() => setNewItemTypeSubId(sub.id)}>
                  <Plus size={14} className="mr-1" /> Add Item Type
                </Button>
                <Button variant="danger" className="text-sm px-3 py-1.5 h-8" onClick={() => {
                  if (confirm(`Delete subcategory ${sub.name}?`)) {
                    deleteSubcategory.mutate({ id: sub.id });
                  }
                }}>
                  <Trash2 size={14} />
                </Button>
              </div>
            </div>

            {newItemTypeSubId === sub.id && (
              <div className="p-4 bg-violet-50/50 border-b border-violet-100">
                <form className="flex gap-4 items-end" onSubmit={(e) => {
                  e.preventDefault();
                  createItemType.mutate({ name: itemName, description: itemDesc, subcategoryId: sub.id });
                }}>
                  <div className="flex-1">
                    <Label className="text-xs">Item Type Name</Label>
                    <Input className="h-8 text-sm" value={itemName} onChange={(e) => setItemName(e.target.value)} required placeholder="e.g., Whitevest" />
                  </div>
                  <div className="flex-1">
                    <Label className="text-xs">Description</Label>
                    <Input className="h-8 text-sm" value={itemDesc} onChange={(e) => setItemDesc(e.target.value)} placeholder="Optional" />
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" variant="ghost" onClick={() => setNewItemTypeSubId(null)}>Cancel</Button>
                    <Button type="submit" disabled={createItemType.isPending}>Save</Button>
                  </div>
                </form>
              </div>
            )}

            {sub.itemTypes?.length > 0 ? (
              <ul className="divide-y divide-slate-100">
                {sub.itemTypes.map((item: any) => (
                  <li key={item.id} className="p-4 flex items-center justify-between hover:bg-slate-50/50">
                    <div>
                      <p className="font-medium text-slate-900">{item.name}</p>
                      {item.description && <p className="text-xs text-slate-500">{item.description}</p>}
                    </div>
                    <Button variant="ghost" className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2 py-1 h-auto" onClick={() => {
                      if (confirm(`Delete item type ${item.name}?`)) {
                        deleteItemType.mutate({ id: item.id });
                      }
                    }}>
                      <Trash2 size={14} />
                    </Button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-6 text-center text-sm text-slate-500">
                No item types added to this subcategory yet.
              </div>
            )}
          </Card>
        ))}
        
        {(!category.subcategories || category.subcategories.length === 0) && (
          <div className="text-center p-12 border border-dashed border-slate-300 rounded-2xl">
            <p className="text-slate-500">No subcategories yet. Add one to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
}
