import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Badge, Button, Input, Label, Textarea } from '@/components/ui';
import { ImageUpload } from '@/components/image-upload';
import { Edit2, Settings2, Trash2, GripVertical, Image as ImageIcon } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  isActive: boolean;
  sortOrder: number;
  _count: { products: number };
}

interface SortableCategoryRowProps {
  category: Category;
  editingId: string | null;
  editName: string;
  editDescription: string;
  editImageUrl: string | null;
  isUpdating: boolean;
  onEditChange: (field: string, value: any) => void;
  onStartEdit: (c: Category) => void;
  onCancelEdit: () => void;
  onSaveEdit: (c: Category) => void;
  onDelete: (c: Category) => void;
}

export function SortableCategoryRow({
  category: c,
  editingId,
  editName,
  editDescription,
  editImageUrl,
  isUpdating,
  onEditChange,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onDelete,
}: SortableCategoryRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: c.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1 : 0,
    opacity: isDragging ? 0.8 : 1,
  };

  if (editingId === c.id) {
    return (
      <tr ref={setNodeRef} style={style} className="bg-violet-50/30">
        <td className="px-6 py-6" colSpan={6}>
          <div className="flex flex-col md:flex-row gap-6">
            <div className="shrink-0">
              <ImageUpload 
                label="Category Logo" 
                value={editImageUrl} 
                onChange={(val) => onEditChange('editImageUrl', val)} 
              />
            </div>
            <div className="flex-1 space-y-4">
              <div>
                <Label>Name</Label>
                <Input
                  value={editName}
                  onChange={(e) => onEditChange('editName', e.target.value)}
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={editDescription}
                  onChange={(e) => onEditChange('editDescription', e.target.value)}
                  rows={2}
                />
              </div>
              <div className="flex items-end justify-end gap-2 shrink-0 pt-2">
                <Button type="button" variant="secondary" onClick={onCancelEdit}>
                  Cancel
                </Button>
                <Button type="button" disabled={isUpdating} onClick={() => onSaveEdit(c)}>
                  Save Changes
                </Button>
              </div>
            </div>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr ref={setNodeRef} style={style} className="hover:bg-slate-50/50 transition-colors group bg-white">
      <td className="px-3 py-4 w-10 text-center">
        <button
          type="button"
          className="text-slate-400 hover:text-slate-600 cursor-grab active:cursor-grabbing p-1"
          {...attributes}
          {...listeners}
        >
          <GripVertical size={18} />
        </button>
      </td>
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
            className="px-2 py-1 text-xs cursor-pointer"
            onClick={() => onStartEdit(c)}
          >
            <Edit2 size={14} className="mr-1" />
            Edit
          </Button>
          <Link href={`/categories/${c.id}`}>
            <Button type="button" variant="outline" className="px-2 py-1 text-xs cursor-pointer">
              <Settings2 size={14} className="mr-1" />
              Manage
            </Button>
          </Link>
          <Button
            type="button"
            variant="danger"
            className="px-2 py-1 text-xs cursor-pointer"
            disabled={c._count.products > 0}
            title={c._count.products > 0 ? 'Remove or reassign products before deleting' : ''}
            onClick={() => onDelete(c)}
          >
            <Trash2 size={14} className="mr-1" />
            Delete
          </Button>
        </div>
      </td>
    </tr>
  );
}
