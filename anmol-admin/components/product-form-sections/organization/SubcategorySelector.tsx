import { useState, useRef, useEffect } from 'react';
import { Label, Select, Button, Input } from '@/components/ui';
import { Check, Trash2, Plus, Loader2, X, AlertCircle } from 'lucide-react';
import { trpc } from '@/lib/trpc';

type SubcategorySelectorProps = {
  categoryId: string;
  subcategoryId: string;
  setSubcategoryId: (v: string) => void;

  subcategories: any[];
};

export function SubcategorySelector({
  categoryId,
  subcategoryId,
  setSubcategoryId,
  subcategories,
}: SubcategorySelectorProps) {
  const utils = trpc.useUtils();
  const [showNewSubcategory, setShowNewSubcategory] = useState(false);
  const [newSubcategoryName, setNewSubcategoryName] = useState('');
  const newSubcategoryRef = useRef<HTMLInputElement>(null);

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
    },
  });

  useEffect(() => {
    if (showNewSubcategory && newSubcategoryRef.current) {
      newSubcategoryRef.current.focus();
    }
  }, [showNewSubcategory]);

  // Reset local state if category changes
  useEffect(() => {
    setShowNewSubcategory(false);
  }, [categoryId]);

  function handleCreateSubcategory() {
    const trimmed = newSubcategoryName.trim();
    if (!trimmed || trimmed.length < 2 || !categoryId) return;
    createSubcategoryMutation.mutate({ name: trimmed, categoryId });
  }

  function handleDeleteSubcategory(id: string, subName: string) {
    if (window.confirm(`Delete subcategory "${subName}"? Products using it will be unlinked.`)) {
      deleteSubcategoryMutation.mutate({ id });
    }
  }

  if (!categoryId) return null;

  return (
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
                className={`flex items-center justify-between px-3 py-2 text-sm border-b border-slate-50 last:border-b-0 transition-colors ${
                  subcategoryId === s.id
                    ? 'bg-violet-50 text-violet-700'
                    : 'hover:bg-slate-100 text-slate-600'
                }`}
              >
                <button
                  type="button"
                  onClick={() => {
                    setSubcategoryId(s.id);
                  }}
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
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleCreateSubcategory();
              }
            }}
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
            onClick={() => {
              setShowNewSubcategory(false);
              setNewSubcategoryName('');
            }}
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
  );
}
