import { useState, useRef, useEffect } from 'react';
import { Card, Input, Label, Select, Button } from '@/components/ui';
import { Tag, Plus, Check, Trash2, X, Loader2, AlertCircle } from 'lucide-react';
import { trpc } from '@/lib/trpc';

type ProductOrganizationProps = {
  kind: 'SAREE' | 'STANDARD';
  setKind: (v: 'SAREE' | 'STANDARD') => void;
  categoryId: string;
  setCategoryId: (v: string) => void;
  subcategoryId: string;
  setSubcategoryId: (v: string) => void;
  itemTypeId: string;
  setItemTypeId: (v: string) => void;
  categories: any[];
  setVariants: React.Dispatch<React.SetStateAction<any[]>>;
};

export function ProductOrganization({
  kind,
  setKind,
  categoryId,
  setCategoryId,
  subcategoryId,
  setSubcategoryId,
  itemTypeId,
  setItemTypeId,
  categories,
  setVariants,
}: ProductOrganizationProps) {
  const utils = trpc.useUtils();

  // ── Inline add subcategory state ──
  const [showNewSubcategory, setShowNewSubcategory] = useState(false);
  const [newSubcategoryName, setNewSubcategoryName] = useState('');
  const newSubcategoryRef = useRef<HTMLInputElement>(null);

  // ── Inline add item type state ──
  const [showNewItemType, setShowNewItemType] = useState(false);
  const [newItemTypeName, setNewItemTypeName] = useState('');
  const newItemTypeRef = useRef<HTMLInputElement>(null);

  // ── Subcategory mutations ──
  const createSubcategoryMutation = trpc.category.createSubcategory.useMutation({
    onSuccess: (newSub) => {
      utils.category.list.invalidate();
      setSubcategoryId(newSub.id);
      setNewSubcategoryName('');
      setShowNewSubcategory(false);
    },
  });

  const deleteSubcategoryMutation = trpc.category.deleteSubcategory.useMutation({
    onSuccess: () => {
      utils.category.list.invalidate();
      setSubcategoryId('');
      setItemTypeId('');
    },
  });

  // ── Item Type mutations ──
  const createItemTypeMutation = trpc.category.createItemType.useMutation({
    onSuccess: (newIt) => {
      utils.category.list.invalidate();
      setItemTypeId(newIt.id);
      setNewItemTypeName('');
      setShowNewItemType(false);
    },
  });

  const deleteItemTypeMutation = trpc.category.deleteItemType.useMutation({
    onSuccess: () => {
      utils.category.list.invalidate();
      setItemTypeId('');
    },
  });

  // Focus input when it appears
  useEffect(() => {
    if (showNewSubcategory && newSubcategoryRef.current) {
      newSubcategoryRef.current.focus();
    }
  }, [showNewSubcategory]);

  useEffect(() => {
    if (showNewItemType && newItemTypeRef.current) {
      newItemTypeRef.current.focus();
    }
  }, [showNewItemType]);

  // ── Handlers for inline add ──
  function handleCreateSubcategory() {
    const trimmed = newSubcategoryName.trim();
    if (!trimmed || trimmed.length < 2 || !categoryId) return;
    createSubcategoryMutation.mutate({ name: trimmed, categoryId });
  }

  function handleCreateItemType() {
    const trimmed = newItemTypeName.trim();
    if (!trimmed || trimmed.length < 2 || !subcategoryId) return;
    createItemTypeMutation.mutate({ name: trimmed, subcategoryId });
  }

  function handleDeleteSubcategory(id: string, subName: string) {
    if (window.confirm(`Delete subcategory "${subName}"? Products using it will be unlinked.`)) {
      deleteSubcategoryMutation.mutate({ id });
    }
  }

  function handleDeleteItemType(id: string, itName: string) {
    if (window.confirm(`Delete item type "${itName}"? Products using it will be unlinked.`)) {
      deleteItemTypeMutation.mutate({ id });
    }
  }

  const activeCategory = categories?.find((c: any) => c.id === categoryId);
  const subcategories: any[] = activeCategory?.subcategories || [];
  const activeSubcategory = subcategories.find((s: any) => s.id === subcategoryId);
  const itemTypes: any[] = activeSubcategory?.itemTypes || [];

  return (
    <Card className="p-8 rounded-3xl border-slate-200/60 shadow-sm overflow-hidden relative">
      <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
        <Tag size={120} />
      </div>
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2.5 bg-amber-100 text-amber-700 rounded-xl">
          <Tag size={20} />
        </div>
        <h3 className="text-xl font-bold text-slate-900 tracking-tight">Organization</h3>
      </div>
      <div className="space-y-6 relative z-10">
        {/* ── Product Kind ── */}
        <div className="group">
          <Label className="text-sm font-semibold text-slate-700 mb-2 block">Product Kind</Label>
          <Select
            value={kind}
            onChange={(e) => {
              const k = e.target.value as 'SAREE' | 'STANDARD';
              setKind(k);
              setVariants([{ color: '', sizes: '', stockQtys: '' }]);
            }}
            className="rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white shadow-inner font-medium"
          >
            <option value="STANDARD">Standard Clothing</option>
            <option value="SAREE">Saree</option>
          </Select>
          <p className="mt-1.5 text-xs text-slate-400">Saree products don't require size, and can have extra saya option.</p>
        </div>

        {/* ── Category ── */}
        <div className="group">
          <Label className="text-sm font-semibold text-slate-700 mb-2 block">Category</Label>
          <Select
            value={categoryId}
            onChange={(e) => {
              setCategoryId(e.target.value);
              setSubcategoryId('');
              setItemTypeId('');
              setShowNewSubcategory(false);
              setShowNewItemType(false);
            }}
            required
            className="rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white shadow-inner font-medium"
          >
            <option value="">Select category...</option>
            {categories?.map((c: any) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>

        {/* ═══════════════════════════════════════════
            SUBCATEGORY — with inline add + delete
        ═══════════════════════════════════════════ */}
        {categoryId && (
          <div className="group animate-in fade-in slide-in-from-top-2 duration-300">
            <Label className="text-sm font-semibold text-slate-700 mb-2 block flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-violet-400"></div>
              Subcategory
            </Label>

            {/* Current Selection Dropdown */}
            <Select
              value={subcategoryId}
              onChange={(e) => {
                setSubcategoryId(e.target.value);
                setItemTypeId('');
                setShowNewItemType(false);
              }}
              className="rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white shadow-inner font-medium"
            >
              <option value="">Select subcategory...</option>
              {subcategories.map((s: any) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>

            {/* Subcategory list with delete buttons */}
            {subcategories.length > 0 && (
              <div className="mt-3 rounded-xl border border-slate-100 bg-slate-50/50 overflow-hidden">
                <div className="px-3 py-2 border-b border-slate-100 bg-slate-50">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Available Subcategories ({subcategories.length})
                  </p>
                </div>
                <div className="max-h-36 overflow-y-auto">
                  {subcategories.map((s: any) => (
                    <div
                      key={s.id}
                      className={`flex items-center justify-between px-3 py-2 text-sm border-b border-slate-50 last:border-b-0 transition-colors ${subcategoryId === s.id
                          ? 'bg-violet-50 text-violet-700'
                          : 'hover:bg-slate-100 text-slate-600'
                        }`}
                    >
                      <button
                        type="button"
                        onClick={() => { setSubcategoryId(s.id); setItemTypeId(''); }}
                        className="flex-1 text-left font-medium flex items-center gap-2"
                      >
                        {subcategoryId === s.id && <Check size={13} className="text-violet-600 shrink-0" />}
                        {s.name}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteSubcategory(s.id, s.name)}
                        disabled={deleteSubcategoryMutation.isPending}
                        className="p-1 rounded-lg text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-colors shrink-0"
                        title={`Delete "${s.name}"`}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add new subcategory */}
            {!showNewSubcategory ? (
              <button
                type="button"
                onClick={() => setShowNewSubcategory(true)}
                className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-violet-600 hover:text-violet-800 transition-colors w-full px-3 py-2.5 rounded-xl border border-dashed border-violet-200 hover:border-violet-400 hover:bg-violet-50/50"
              >
                <Plus size={14} />
                Add New Subcategory
              </button>
            ) : (
              <div className="mt-2 flex items-center gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
                <Input
                  ref={newSubcategoryRef}
                  value={newSubcategoryName}
                  onChange={(e) => setNewSubcategoryName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleCreateSubcategory(); } }}
                  placeholder="New subcategory name…"
                  className="text-sm rounded-xl flex-1 border-violet-200 focus:border-violet-500 focus:ring-violet-500/20"
                />
                <Button
                  type="button"
                  variant="primary"
                  disabled={createSubcategoryMutation.isPending || newSubcategoryName.trim().length < 2}
                  onClick={handleCreateSubcategory}
                  className="rounded-xl h-10 w-10 p-0 shrink-0 bg-violet-600 hover:bg-violet-700"
                >
                  {createSubcategoryMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Check size={16} />}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => { setShowNewSubcategory(false); setNewSubcategoryName(''); }}
                  className="rounded-xl h-10 w-10 p-0 shrink-0 text-slate-400 hover:text-slate-600"
                >
                  <X size={16} />
                </Button>
              </div>
            )}

            {/* Error message */}
            {createSubcategoryMutation.isError && (
              <p className="mt-1.5 text-xs text-rose-500 font-medium flex items-center gap-1">
                <AlertCircle size={12} />
                {createSubcategoryMutation.error.message}
              </p>
            )}
            {deleteSubcategoryMutation.isError && (
              <p className="mt-1.5 text-xs text-rose-500 font-medium flex items-center gap-1">
                <AlertCircle size={12} />
                {deleteSubcategoryMutation.error.message}
              </p>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════
            ITEM TYPE — with inline add + delete
        ═══════════════════════════════════════════ */}
        {subcategoryId && (
          <div className="group animate-in fade-in slide-in-from-top-2 duration-300">
            <Label className="text-sm font-semibold text-slate-700 mb-2 block flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
              Item Type
            </Label>

            <Select
              value={itemTypeId}
              onChange={(e) => setItemTypeId(e.target.value)}
              className="rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white shadow-inner font-medium"
            >
              <option value="">Select item type...</option>
              {itemTypes.map((i: any) => (
                <option key={i.id} value={i.id}>
                  {i.name}
                </option>
              ))}
            </Select>

            {/* Item type list with delete buttons */}
            {itemTypes.length > 0 && (
              <div className="mt-3 rounded-xl border border-slate-100 bg-slate-50/50 overflow-hidden">
                <div className="px-3 py-2 border-b border-slate-100 bg-slate-50">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Available Item Types ({itemTypes.length})
                  </p>
                </div>
                <div className="max-h-36 overflow-y-auto">
                  {itemTypes.map((it: any) => (
                    <div
                      key={it.id}
                      className={`flex items-center justify-between px-3 py-2 text-sm border-b border-slate-50 last:border-b-0 transition-colors ${itemTypeId === it.id
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'hover:bg-slate-100 text-slate-600'
                        }`}
                    >
                      <button
                        type="button"
                        onClick={() => setItemTypeId(it.id)}
                        className="flex-1 text-left font-medium flex items-center gap-2"
                      >
                        {itemTypeId === it.id && <Check size={13} className="text-emerald-600 shrink-0" />}
                        {it.name}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteItemType(it.id, it.name)}
                        disabled={deleteItemTypeMutation.isPending}
                        className="p-1 rounded-lg text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-colors shrink-0"
                        title={`Delete "${it.name}"`}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add new item type */}
            {!showNewItemType ? (
              <button
                type="button"
                onClick={() => setShowNewItemType(true)}
                className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-emerald-600 hover:text-emerald-800 transition-colors w-full px-3 py-2.5 rounded-xl border border-dashed border-emerald-200 hover:border-emerald-400 hover:bg-emerald-50/50"
              >
                <Plus size={14} />
                Add New Item Type
              </button>
            ) : (
              <div className="mt-2 flex items-center gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
                <Input
                  ref={newItemTypeRef}
                  value={newItemTypeName}
                  onChange={(e) => setNewItemTypeName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleCreateItemType(); } }}
                  placeholder="New item type name…"
                  className="text-sm rounded-xl flex-1 border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500/20"
                />
                <Button
                  type="button"
                  variant="primary"
                  disabled={createItemTypeMutation.isPending || newItemTypeName.trim().length < 2}
                  onClick={handleCreateItemType}
                  className="rounded-xl h-10 w-10 p-0 shrink-0 bg-emerald-600 hover:bg-emerald-700"
                >
                  {createItemTypeMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Check size={16} />}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => { setShowNewItemType(false); setNewItemTypeName(''); }}
                  className="rounded-xl h-10 w-10 p-0 shrink-0 text-slate-400 hover:text-slate-600"
                >
                  <X size={16} />
                </Button>
              </div>
            )}

            {/* Error messages */}
            {createItemTypeMutation.isError && (
              <p className="mt-1.5 text-xs text-rose-500 font-medium flex items-center gap-1">
                <AlertCircle size={12} />
                {createItemTypeMutation.error.message}
              </p>
            )}
            {deleteItemTypeMutation.isError && (
              <p className="mt-1.5 text-xs text-rose-500 font-medium flex items-center gap-1">
                <AlertCircle size={12} />
                {deleteItemTypeMutation.error.message}
              </p>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
