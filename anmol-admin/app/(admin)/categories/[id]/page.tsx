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
  
  const { data: category } = trpc.category.getById.useQuery({ id });

  const createSubcategory = trpc.category.createSubcategory.useMutation({
    onSuccess: () => {
      utils.category.list.invalidate();
      setShowSubForm(false);
      setSubName('');
      setSubDesc('');
      setSubMetaTitle('');
      setSubMetaDesc('');
    }
  });

  const deleteSubcategory = trpc.category.deleteSubcategory.useMutation({
    onSuccess: () => utils.category.list.invalidate(),
  });


  const [showSubForm, setShowSubForm] = useState(false);
  const [subName, setSubName] = useState('');
  const [subDesc, setSubDesc] = useState('');
  const [subMetaTitle, setSubMetaTitle] = useState('');
  const [subMetaDesc, setSubMetaDesc] = useState('');



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
        description="Add subcategories (e.g., Vest)"
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
              createSubcategory.mutate({ 
                name: subName, 
                description: subDesc || undefined, 
                categoryId: category.id,
                metaTitle: subMetaTitle || undefined,
                metaDescription: subMetaDesc || undefined
              });
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
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm">SEO Title</Label>
                <span className={`text-xs ${subMetaTitle.length > 60 ? 'text-red-500 font-bold' : 'text-slate-400'}`}>
                  {subMetaTitle.length}/60
                </span>
              </div>
              <Input value={subMetaTitle} onChange={(e) => setSubMetaTitle(e.target.value)} placeholder={subName ? `${subName} in ${category.name} | Anmol Vastralay` : "Auto-generated fallback"} />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm">SEO Description</Label>
                <span className={`text-xs ${subMetaDesc.length > 160 ? 'text-red-500 font-bold' : 'text-slate-400'}`}>
                  {subMetaDesc.length}/160
                </span>
              </div>
              <Input value={subMetaDesc} onChange={(e) => setSubMetaDesc(e.target.value)} placeholder={subName ? `Shop the latest ${subName} in ${category.name} at Anmol Vastralay.` : "Auto-generated fallback"} />
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
                <Button variant="danger" className="text-sm px-3 py-1.5 h-8" onClick={() => {
                  if (confirm(`Delete subcategory ${sub.name}?`)) {
                    deleteSubcategory.mutate({ id: sub.id });
                  }
                }}>
                  <Trash2 size={14} />
                </Button>
              </div>
            </div>
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
