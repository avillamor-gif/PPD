'use client';

import { useState } from 'react';
import { POLICIES, COUNTRIES } from '@/lib/constants';
import Link from 'next/link';
import { Trash2, ExternalLink, Pencil } from 'lucide-react';

export default function AdminManagePage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const handleDelete = (id: string) => {
    setDeleteConfirm(null);
    // In production, this would delete from Supabase
    console.log('Delete:', id);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-4xl font-bold text-ink">Manage Entries</h1>
          <p className="mt-2 text-ink/60">View and manage all policies in the database</p>
        </div>
        <Link
          href="/admin/submit"
          className="inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 font-mono text-xs uppercase tracking-[0.18em] text-paper transition hover:bg-ocean-deep"
        >
          Add New +
        </Link>
      </div>

      {/* Policies Table */}
      <div className="rounded-2xl border border-ink/10 bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-rule bg-sand/30">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-mono uppercase tracking-[0.1em] text-ink/60">Title</th>
                <th className="px-6 py-4 text-left text-sm font-mono uppercase tracking-[0.1em] text-ink/60">Country</th>
                <th className="px-6 py-4 text-left text-sm font-mono uppercase tracking-[0.1em] text-ink/60">Category</th>
                <th className="px-6 py-4 text-left text-sm font-mono uppercase tracking-[0.1em] text-ink/60">Status</th>
                <th className="px-6 py-4 text-left text-sm font-mono uppercase tracking-[0.1em] text-ink/60">Year</th>
                <th className="px-6 py-4 text-left text-sm font-mono uppercase tracking-[0.1em] text-ink/60">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rule">
              {POLICIES.map((policy) => {
                const country = COUNTRIES.find((c) => c.code === policy.country);
                const statusColors: Record<string, string> = {
                  'In Force': 'bg-ocean/10 text-ocean',
                  'Proposed': 'bg-coral/10 text-coral',
                  'Phased': 'bg-sand text-ink',
                  'Repealed': 'bg-ink/10 text-ink/60',
                };

                return (
                  <tr key={policy.id} className="hover:bg-sand/20 transition">
                    <td className="px-6 py-4">
                      <div className="max-w-xs">
                        <div className="font-medium text-ink text-sm">{policy.title}</div>
                        <div className="text-xs text-ink/50 mt-1">{policy.summary.substring(0, 50)}...</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-ink">{country?.name || policy.country}</td>
                    <td className="px-6 py-4 text-sm text-ink">{policy.category}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-mono font-semibold ${statusColors[policy.status] || statusColors['In Force']}`}>
                        {policy.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-ink/60 font-mono">{policy.year}</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <a
                          href={policy.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 hover:bg-ocean/10 rounded transition text-ocean"
                          title="View policy"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                        <Link
                          href={`/admin/manage/${policy.id}`}
                          className="p-2 hover:bg-ocean/10 rounded transition text-ocean"
                          title="Edit policy"
                        >
                          <Pencil className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => setDeleteConfirm(policy.id)}
                          className="p-2 hover:bg-coral/10 rounded transition text-coral"
                          title="Delete policy"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Delete Confirmation */}
                      {deleteConfirm === policy.id && (
                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                          <div className="bg-paper rounded-2xl max-w-sm w-full p-6 border border-ink/20">
                            <h3 className="font-display text-lg font-bold text-ink">Delete Policy?</h3>
                            <p className="mt-2 text-sm text-ink/60">This action cannot be undone.</p>
                            <div className="mt-6 flex gap-3">
                              <button
                                onClick={() => handleDelete(policy.id)}
                                className="flex-1 rounded-lg bg-coral px-4 py-2 font-mono text-xs uppercase tracking-[0.1em] text-white hover:bg-coral/90 transition"
                              >
                                Delete
                              </button>
                              <button
                                onClick={() => setDeleteConfirm(null)}
                                className="flex-1 rounded-lg border border-ink/20 px-4 py-2 font-mono text-xs uppercase tracking-[0.1em] text-ink hover:bg-ink/5 transition"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary */}
      <div className="rounded-2xl border border-ink/10 bg-card p-6">
        <p className="text-sm text-ink/60">
          Showing <strong>{POLICIES.length}</strong> policies. Edit functionality will be available with Supabase integration.
        </p>
      </div>
    </div>
  );
}
