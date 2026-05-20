'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button, Card, Input, Label, Textarea } from '@/components/ui';
import { trpc } from '@/lib/trpc';

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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');

  function startEdit(id: string, currentName: string, currentDesc: string | null) {
    setEditingId(id);
    setEditName(currentName);
    setEditDescription(currentDesc ?? '');
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
    <div>
      <PageHeader
        title="Categories"
        description="Silk, Suti, Sefon, Saree, Kurti, and more"
        action={
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              disabled={seedDefaults.isPending}
              onClick={() => seedDefaults.mutate()}
            >
              Load shop categories
            </Button>
            <Button type="button" onClick={() => setShowForm((v) => !v)}>
              {showForm ? 'Cancel' : 'Add category'}
            </Button>
          </div>
        }
      />

      <p className="mb-6 text-sm text-zinc-600">
        <strong>Hide</strong> removes a category from the shop but keeps products linked.{' '}
        <strong>Delete</strong> permanently removes an empty category (no products).
      </p>

      {showForm ? (
        <Card className="mb-8">
          <form
            className="grid gap-4 md:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault();
              create.mutate({ name, description: description || undefined });
              setName('');
              setDescription('');
            }}
          >
            <div>
              <Label>Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div>
              <Label>Description (optional)</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
              />
            </div>
            <div className="md:col-span-2">
              <Button type="submit" disabled={create.isPending}>
                Save category
              </Button>
            </div>
          </form>
        </Card>
      ) : null}

      <Card className="overflow-hidden p-0">
        {isLoading ? (
          <p className="p-6 text-sm text-zinc-500">Loading…</p>
        ) : !categories?.length ? (
          <p className="p-6 text-sm text-zinc-500">
            No categories yet. Click &quot;Load shop categories&quot; or add one.
          </p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-zinc-50 text-zinc-600">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Slug</th>
                <th className="px-4 py-3">Products</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((c) =>
                editingId === c.id ? (
                  <tr key={c.id} className="border-b bg-violet-50/50">
                    <td className="px-4 py-3" colSpan={2}>
                      <Label>Name</Label>
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="mt-1"
                      />
                      <div className="mt-2">
                        <Label>Description</Label>
                      </div>
                      <Textarea
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        rows={2}
                        className="mt-1"
                      />
                    </td>
                    <td className="px-4 py-3 align-top">{c._count.products}</td>
                    <td className="px-4 py-3 align-top">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs ${
                          c.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-zinc-200 text-zinc-600'
                        }`}
                      >
                        {c.isActive ? 'Active' : 'Hidden'}
                      </span>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          disabled={update.isPending}
                          onClick={() =>
                            update.mutate({
                              id: c.id,
                              name: editName,
                              description: editDescription || null,
                            })
                          }
                        >
                          Save
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => setEditingId(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <tr key={c.id} className="border-b last:border-0">
                    <td className="px-4 py-3 font-medium">{c.name}</td>
                    <td className="px-4 py-3 text-zinc-500">{c.slug}</td>
                    <td className="px-4 py-3">{c._count.products}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs ${
                          c.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-zinc-200 text-zinc-600'
                        }`}
                      >
                        {c.isActive ? 'Active' : 'Hidden'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => startEdit(c.id, c.name, c.description)}
                        >
                          Edit
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => handleHide(c)}
                        >
                          {c.isActive ? 'Hide' : 'Show'}
                        </Button>
                        <Button
                          type="button"
                          variant="danger"
                          disabled={c._count.products > 0}
                          title={
                            c._count.products > 0
                              ? 'Remove or reassign products before deleting'
                              : 'Permanently delete this category'
                          }
                          onClick={() => handleDelete(c)}
                        >
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
      </Card>
    </div>
  );
}
