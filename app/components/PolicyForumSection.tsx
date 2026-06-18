'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { MessageCircle, Plus, AlertCircle } from 'lucide-react';
import Link from 'next/link';

interface Thread {
  id: string;
  title: string;
  description: string;
  display_name: string;
  status: string;
  comment_count: number;
  created_at: string;
  is_pinned: boolean;
}

export function PolicyForumSection({ policyId }: { policyId: string }) {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({ title: '', description: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    checkAuth();
    loadThreads();
  }, [policyId]);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  };

  const loadThreads = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('discussion_threads')
        .select(`
          *,
          author:user_profiles(display_name)
        `)
        .eq('policy_id', policyId)
        .is('deleted_at', null)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      const threadsWithAuthor = (data || []).map((t: any) => ({
        ...t,
        display_name: t.author?.display_name || 'Unknown User',
      }));

      setThreads(threadsWithAuthor);
    } catch (err) {
      console.error('Load threads error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateThread = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      if (!formData.title.trim()) {
        throw new Error('Title is required');
      }

      if (!user) {
        throw new Error('You must be logged in');
      }

      const { error: insertError } = await supabase
        .from('discussion_threads')
        .insert({
          policy_id: policyId,
          title: formData.title.trim(),
          description: formData.description.trim() || null,
          author_id: user.id,
          status: 'open',
        });

      if (insertError) throw insertError;

      setFormData({ title: '', description: '' });
      setShowCreateForm(false);
      loadThreads();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create discussion');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-xl border border-coral/20 bg-white p-8 space-y-6">
      <h2 className="text-2xl font-bold text-ink flex items-center gap-2">
        <MessageCircle className="w-6 h-6 text-coral" />
        Community Discussion
        <span className="ml-2 text-sm font-normal text-ink/60">
          ({threads.length})
        </span>
      </h2>

      {/* Create Discussion Form */}
      {user ? (
        <>
          {!showCreateForm ? (
            <button
              onClick={() => setShowCreateForm(true)}
              className="w-full py-3 px-4 rounded-lg border-2 border-dashed border-coral text-coral hover:bg-coral/5 transition font-medium flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Start a Discussion
            </button>
          ) : (
            <form onSubmit={handleCreateThread} className="space-y-4 p-4 rounded-lg bg-sand/10 border border-sand">
              {error && (
                <div className="p-3 rounded bg-coral/10 border border-coral/20 text-coral text-sm flex gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-ink mb-2">
                  Discussion Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="What would you like to discuss?"
                  maxLength={200}
                  className="w-full px-4 py-2 rounded-lg border border-ink/20 focus:border-ocean focus:ring-2 focus:ring-ocean/20 outline-none transition"
                  required
                />
                <p className="text-xs text-ink/50 mt-1">
                  {formData.title.length}/200
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-ink mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Add context or details..."
                  maxLength={1000}
                  rows={3}
                  className="w-full px-4 py-2 rounded-lg border border-ink/20 focus:border-ocean focus:ring-2 focus:ring-ocean/20 outline-none transition resize-none"
                />
                <p className="text-xs text-ink/50 mt-1">
                  {formData.description.length}/1000
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={submitting || !formData.title.trim()}
                  className="flex-1 px-4 py-2 rounded-lg bg-coral text-white hover:bg-coral/90 disabled:opacity-50 transition font-medium text-sm"
                >
                  {submitting ? 'Creating...' : 'Create Discussion'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    setFormData({ title: '', description: '' });
                    setError('');
                  }}
                  className="flex-1 px-4 py-2 rounded-lg border border-ink/20 text-ink hover:bg-sand/30 transition font-medium text-sm"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </>
      ) : (
        <div className="p-4 rounded-lg bg-sand/10 border border-sand text-center">
          <p className="text-sm text-ink/60 mb-3">Log in to start a discussion</p>
          <Link
            href="/auth/login"
            className="inline-block px-4 py-2 rounded-lg bg-ocean text-paper hover:bg-ocean/90 transition font-medium text-sm"
          >
            Sign In
          </Link>
        </div>
      )}

      {/* Discussions List */}
      <div className="border-t border-ink/10 pt-6">
        {loading ? (
          <p className="text-center py-8 text-ink/60">Loading discussions...</p>
        ) : threads.length === 0 ? (
          <p className="text-center py-8 text-ink/60">No discussions yet. Start one above!</p>
        ) : (
          <div className="space-y-4">
            {threads.map((thread) => (
              <Link
                key={thread.id}
                href={`/policies/${policyId}/discuss/${thread.id}`}
                className="block p-4 rounded-lg border border-ink/10 hover:border-coral hover:bg-coral/5 transition"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-ink">{thread.title}</h3>
                      {thread.is_pinned && (
                        <span className="px-2 py-0.5 rounded text-xs font-mono bg-coral/10 text-coral">
                          PINNED
                        </span>
                      )}
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-mono ${
                          thread.status === 'closed'
                            ? 'bg-ink/10 text-ink/60'
                            : 'bg-ocean/10 text-ocean'
                        }`}
                      >
                        {thread.status}
                      </span>
                    </div>
                    {thread.description && (
                      <p className="text-sm text-ink/60 mb-2 line-clamp-2">
                        {thread.description}
                      </p>
                    )}
                    <p className="text-xs text-ink/50">
                      By <strong>{thread.display_name}</strong> • {new Date(thread.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-ink/60">
                    <MessageCircle className="w-4 h-4" />
                    <span className="font-mono">{thread.comment_count}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
