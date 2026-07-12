'use client';

import { useState, useEffect } from 'react';
import { Trash2, Plus, Pencil, X, Check } from 'lucide-react';

interface Status {
  id: string;
  name: string;
}

export default function StatusesPage() {
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newStatusName, setNewStatusName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Fetch statuses
  useEffect(() => {
    const fetchStatuses = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/reference-data/statuses');
        if (!res.ok) throw new Error('Failed to fetch statuses');
        const data = await res.json();
        setStatuses(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load statuses');
        console.error('Error fetching statuses:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStatuses();
  }, []);

  // Add new status
  const handleAdd = async () => {
    if (!newStatusName.trim()) {
      setError('Please enter a name');
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch('/api/reference-data/statuses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newStatusName.trim() }),
      });
      if (!res.ok) throw new Error('Failed to add status');
      const newStatus = await res.json();
      setStatuses([...statuses, newStatus]);
      setNewStatusName('');
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add status');
    } finally {
      setSubmitting(false);
    }
  };

  // Update status
  const handleUpdate = async (id: string) => {
    if (!editingName.trim()) {
      setError('Please enter a name');
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch(`/api/reference-data/statuses/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editingName.trim() }),
      });
      if (!res.ok) throw new Error('Failed to update status');
      const updatedStatus = await res.json();
      setStatuses(statuses.map(s => s.id === id ? updatedStatus : s));
      setEditingId(null);
      setEditingName('');
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete status
  const handleDelete = async (id: string) => {
    try {
      setSubmitting(true);
      const res = await fetch(`/api/reference-data/statuses/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete status');
      setStatuses(statuses.filter(s => s.id !== id));
      setDeleteConfirm(null);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete status');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold text-ink">Statuses</h1>
        <p className="mt-2 text-ink/60">Manage available policy statuses</p>
      </div>

      {error && (
        <div className="rounded-lg border border-coral/20 bg-coral/5 px-4 py-3 text-coral">
          {error}
        </div>
      )}

      {/* Add new status */}
      <div className="rounded-lg border border-rule bg-paper p-6">
        <h3 className="mb-4 font-mono text-sm font-semibold uppercase tracking-wider text-ink">
          Add New Status
        </h3>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Enter status name..."
            value={newStatusName}
            onChange={(e) => setNewStatusName(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
            className="flex-1 rounded-lg border border-ink/20 bg-paper px-4 py-2 text-ink placeholder:text-ink/40 focus:border-ocean focus:outline-none"
            disabled={submitting}
          />
          <button
            onClick={handleAdd}
            disabled={submitting}
            className="flex items-center gap-2 rounded-lg bg-ocean px-4 py-2 font-mono text-xs font-semibold uppercase tracking-wider text-paper transition hover:bg-ocean-deep disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            Add
          </button>
        </div>
      </div>

      {/* Statuses list */}
      <div className="overflow-x-auto rounded-lg border border-rule">
        <table className="w-full">
          <thead>
            <tr className="border-b border-rule bg-sand/50">
              <th className="px-6 py-3 text-left font-mono text-xs font-semibold uppercase tracking-wider text-ink">
                Name
              </th>
              <th className="px-6 py-3 text-right font-mono text-xs font-semibold uppercase tracking-wider text-ink">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={2} className="px-6 py-4 text-center text-ink/60">
                  Loading statuses...
                </td>
              </tr>
            ) : statuses.length === 0 ? (
              <tr>
                <td colSpan={2} className="px-6 py-4 text-center text-ink/60">
                  No statuses yet. Add one to get started.
                </td>
              </tr>
            ) : (
              statuses.map((status) => (
                <tr key={status.id} className="border-b border-rule hover:bg-sand/20">
                  <td className="px-6 py-4">
                    {editingId === status.id ? (
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        className="rounded border border-ocean bg-paper px-2 py-1 text-ink focus:outline-none"
                        autoFocus
                      />
                    ) : (
                      <span className="text-ink">{status.name}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      {editingId === status.id ? (
                        <>
                          <button
                            onClick={() => handleUpdate(status.id)}
                            disabled={submitting}
                            className="rounded-lg border border-ocean bg-ocean/10 p-2 transition hover:bg-ocean/20"
                            title="Save"
                          >
                            <Check className="h-4 w-4 text-ocean" />
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            disabled={submitting}
                            className="rounded-lg border border-ink/20 p-2 transition hover:bg-ink/5"
                            title="Cancel"
                          >
                            <X className="h-4 w-4 text-ink/60" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => {
                              setEditingId(status.id);
                              setEditingName(status.name);
                            }}
                            className="flex items-center gap-1 rounded-lg border border-ink/20 px-3 py-2 font-mono text-xs uppercase tracking-wider text-ink/70 transition hover:bg-ink/5"
                          >
                            <Pencil className="h-3 w-3" />
                            Edit
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(status.id)}
                            className="flex items-center gap-1 rounded-lg border border-coral/20 px-3 py-2 font-mono text-xs uppercase tracking-wider text-coral transition hover:bg-coral/5"
                          >
                            <Trash2 className="h-3 w-3" />
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Delete confirmation modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="rounded-lg bg-paper p-6 shadow-lg">
            <h3 className="mb-4 font-display text-lg font-bold text-ink">Delete Status?</h3>
            <p className="mb-6 text-ink/60">Are you sure you want to delete this status? This action cannot be undone.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 rounded-lg border border-ink/20 px-4 py-2 font-mono text-xs font-semibold uppercase tracking-wider text-ink transition hover:bg-ink/5"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 rounded-lg bg-coral px-4 py-2 font-mono text-xs font-semibold uppercase tracking-wider text-paper transition hover:bg-coral-deep disabled:opacity-50"
                disabled={submitting}
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
