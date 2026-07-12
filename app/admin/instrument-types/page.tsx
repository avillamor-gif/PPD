'use client';

import { useState, useEffect } from 'react';
import { Trash2, Plus, Pencil, X, Check } from 'lucide-react';

interface InstrumentType {
  id: string;
  name: string;
}

export default function InstrumentTypesPage() {
  const [types, setTypes] = useState<InstrumentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newTypeName, setNewTypeName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Fetch instrument types
  useEffect(() => {
    const fetchTypes = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/reference-data/instrument-types');
        if (!res.ok) throw new Error('Failed to fetch instrument types');
        const data = await res.json();
        setTypes(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load instrument types');
        console.error('Error fetching instrument types:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTypes();
  }, []);

  // Add new instrument type
  const handleAdd = async () => {
    if (!newTypeName.trim()) {
      setError('Please enter a name');
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch('/api/reference-data/instrument-types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newTypeName.trim() }),
      });
      if (!res.ok) throw new Error('Failed to add instrument type');
      const newType = await res.json();
      setTypes([...types, newType]);
      setNewTypeName('');
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add instrument type');
    } finally {
      setSubmitting(false);
    }
  };

  // Update instrument type
  const handleUpdate = async (id: string) => {
    if (!editingName.trim()) {
      setError('Please enter a name');
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch(`/api/reference-data/instrument-types/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editingName.trim() }),
      });
      if (!res.ok) throw new Error('Failed to update instrument type');
      const updated = await res.json();
      setTypes(types.map(t => t.id === id ? updated : t));
      setEditingId(null);
      setEditingName('');
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update instrument type');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete instrument type
  const handleDelete = async (id: string) => {
    try {
      setSubmitting(true);
      const res = await fetch(`/api/reference-data/instrument-types/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete instrument type');
      setTypes(types.filter(t => t.id !== id));
      setDeleteConfirm(null);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete instrument type');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-4xl font-bold text-ink">Instrument Types</h1>
          <p className="mt-2 text-ink/60">Manage available instrument types for policies</p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-2xl border border-coral/20 bg-coral/5 p-6">
          <p className="text-coral font-medium">{error}</p>
        </div>
      )}

      {/* Add New Form */}
      <div className="rounded-2xl border border-ink/10 bg-card p-6">
        <h3 className="font-mono text-sm uppercase tracking-widest text-ink/70 font-semibold mb-4">Add New Instrument Type</h3>
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Enter instrument type name..."
            value={newTypeName}
            onChange={(e) => setNewTypeName(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
            className="flex-1 px-4 py-2 rounded-lg border border-ink/20 bg-paper focus:outline-none focus:border-ocean text-sm"
            disabled={submitting}
          />
          <button
            onClick={handleAdd}
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-lg bg-ocean px-6 py-2 font-mono text-xs uppercase tracking-[0.18em] text-white transition hover:bg-ocean-deep disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            Add
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <p className="text-ink/60">Loading instrument types...</p>
        </div>
      )}

      {/* Instrument Types List */}
      {!loading && types.length > 0 && (
        <div className="rounded-2xl border border-ink/10 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-ink/10 bg-ink/2">
                <th className="px-6 py-4 text-left font-mono text-xs uppercase tracking-widest text-ink/60">Name</th>
                <th className="px-6 py-4 text-right font-mono text-xs uppercase tracking-widest text-ink/60">Actions</th>
              </tr>
            </thead>
            <tbody>
              {types.map(type => (
                <tr key={type.id} className="border-b border-ink/10 hover:bg-ink/2 transition">
                  <td className="px-6 py-4">
                    {editingId === type.id ? (
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        className="px-3 py-2 rounded-lg border border-ink/20 bg-paper focus:outline-none focus:border-ocean text-sm w-full"
                        disabled={submitting}
                      />
                    ) : (
                      <span className="text-ink font-medium">{type.name}</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end gap-2">
                      {editingId === type.id ? (
                        <>
                          <button
                            onClick={() => handleUpdate(type.id)}
                            disabled={submitting}
                            className="inline-flex items-center gap-1 rounded-lg bg-ocean px-3 py-2 font-mono text-xs uppercase tracking-[0.14em] text-white transition hover:bg-ocean-deep disabled:opacity-50"
                          >
                            <Check className="w-4 h-4" />
                            Save
                          </button>
                          <button
                            onClick={() => {
                              setEditingId(null);
                              setEditingName('');
                            }}
                            disabled={submitting}
                            className="inline-flex items-center gap-1 rounded-lg bg-ink/10 px-3 py-2 font-mono text-xs uppercase tracking-[0.14em] text-ink transition hover:bg-ink/20 disabled:opacity-50"
                          >
                            <X className="w-4 h-4" />
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => {
                              setEditingId(type.id);
                              setEditingName(type.name);
                            }}
                            className="inline-flex items-center gap-1 rounded-lg bg-sand px-3 py-2 font-mono text-xs uppercase tracking-[0.14em] text-ink transition hover:bg-sand-deep"
                          >
                            <Pencil className="w-4 h-4" />
                            Edit
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(type.id)}
                            className="inline-flex items-center gap-1 rounded-lg bg-coral/10 px-3 py-2 font-mono text-xs uppercase tracking-[0.14em] text-coral transition hover:bg-coral/20"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Empty State */}
      {!loading && types.length === 0 && (
        <div className="rounded-2xl border border-ink/10 bg-card p-12 text-center">
          <p className="text-ink/60">No instrument types found. Create one to get started.</p>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="rounded-2xl bg-paper p-8 max-w-sm mx-4">
            <h3 className="text-lg font-semibold text-ink mb-4">Delete Instrument Type?</h3>
            <p className="text-ink/60 mb-6">This action cannot be undone. Policies with this type will keep their data.</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirm(null)}
                disabled={submitting}
                className="px-6 py-2 rounded-lg bg-ink/10 font-mono text-xs uppercase tracking-[0.14em] text-ink transition hover:bg-ink/20 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
                disabled={submitting}
                className="px-6 py-2 rounded-lg bg-coral font-mono text-xs uppercase tracking-[0.14em] text-white transition hover:bg-coral-deep disabled:opacity-50"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
