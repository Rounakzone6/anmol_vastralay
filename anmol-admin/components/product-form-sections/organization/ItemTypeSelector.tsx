import { useState, useRef, useEffect } from 'react';
import { Label, Select, Button, Input } from '@/components/ui';
import { Check, Trash2, Plus, Loader2, X } from 'lucide-react';
import { trpc } from '@/lib/trpc';

type ItemTypeSelectorProps = {
  subcategoryId: string;
  itemTypeId: string;
  setItemTypeId: (v: string) => void;
  itemTypes: any[];
};

export function ItemTypeSelector({
  subcategoryId,
  itemTypeId,
  setItemTypeId,
  itemTypes,
}: ItemTypeSelectorProps) {
  const utils = trpc.useUtils();
  const [showNewItemType, setShowNewItemType] = useState(false);
  const [newItemTypeName, setNewItemTypeName] = useState('');
  const newItemTypeRef = useRef<HTMLInputElement>(null);

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

  useEffect(() => {
    if (showNewItemType && newItemTypeRef.current) {
      newItemTypeRef.current.focus();
    }
  }, [showNewItemType]);

  useEffect(() => {
    setShowNewItemType(false);
  }, [subcategoryId]);

  function handleCreateItemType() {
    const trimmed = newItemTypeName.trim();
    if (!trimmed || trimmed.length < 2 || !subcategoryId) return;
    createItemTypeMutation.mutate({ name: trimmed, subcategoryId });
  }

  function handleDeleteItemType(id: string, itName: string) {
    if (window.confirm(`Delete item type "${itName}"? Products using it will be unlinked.`)) {
      deleteItemTypeMutation.mutate({ id });
    }
  }

  if (!subcategoryId) return null;

  return (
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
                className={`flex items-center justify-between px-3 py-2 text-sm border-b border-slate-50 last:border-b-0 transition-colors ${
                  itemTypeId === it.id
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
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleCreateItemType();
              }
            }}
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
            onClick={() => {
              setShowNewItemType(false);
              setNewItemTypeName('');
            }}
            className="rounded-xl h-10 w-10 p-0 shrink-0 text-slate-400 hover:text-slate-600"
          >
            <X size={16} />
          </Button>
        </div>
      )}
    </div>
  );
}
