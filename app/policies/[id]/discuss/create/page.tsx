'use client';

import { useState, useEffect, use } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { MessageSquare, ArrowLeft, AlertCircle } from 'lucide-react';

export default function CreateThreadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [user, setUser] = useState<any>(null);
  const [policyId, setPolicyId] = useState<string>('');
  const router = useRouter();

  useEffect(() => {
    checkAuth();
    fetchPolicyId();
  }, []);

  const fetchPolicyId = async () => {
    try {
      const response = await fetch(`/api/policies/${resolvedParams.id}`);
      if (response.ok) {
        const policy = await response.json();
        setPolicyId(policy.id);
      }
    } catch (err) {
      console.error('Failed to fetch policy:', err);
    }
  };

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/auth/login');
      return;
    }
    setUser(user);
  };

  const handleCreateThread = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!title.trim()) {
        throw new Error('Title is required');
      }

      if (!user) {
        throw new Error('You must be logged in');
      }

      if (!policyId) {
        throw new Error('Policy not found');
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch('/api/discussions/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          policyId: policyId,
          title: title.trim(),
          description: description.trim() || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create discussion');
      }

      const result = await response.json();
      router.push(`/policies/${resolvedParams.id}/discuss/${result.threadId}`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to create thread'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="mx-auto max-w-2xl">
        {/* Header Navigation */}
        <div className="border-b border-rule bg-paper px-6 py-4 lg:px-0">
          <Link
            href={`/policies/${resolvedParams.id}/discuss`}
            className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-ink/60 hover:text-coral transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to discussions
          </Link>
        </div>

        <div className="px-6 py-12 lg:px-0 space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-4xl font-bold text-ink">Start Discussion</h1>
            <p className="mt-2 text-ink/60">Create a new thread to discuss this policy</p>
          </div>

          {/* Form */}
          <form onSubmit={handleCreateThread} className="space-y-6 pb-12">
            {error && (
              <div className="p-4 rounded-lg bg-coral/10 border border-coral/20 text-coral flex gap-3">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-ink mb-3">
                Discussion Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What would you like to discuss?"
                maxLength={200}
                className="w-full px-4 py-3 rounded-lg border border-ink/20 focus:border-ocean focus:ring-2 focus:ring-ocean/20 outline-none transition"
                required
              />
              <p className="text-xs text-ink/50 mt-1">
                {title.length}/200 characters
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-ink mb-3">
                Description (Optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add more context or details..."
                maxLength={2000}
                rows={6}
                className="w-full px-4 py-3 rounded-lg border border-ink/20 focus:border-ocean focus:ring-2 focus:ring-ocean/20 outline-none transition resize-none"
              />
              <p className="text-xs text-ink/50 mt-1">
                {description.length}/2000 characters
              </p>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading || !title.trim()}
                className="flex-1 px-6 py-3 rounded-lg bg-ink text-paper font-medium hover:bg-ink/90 disabled:opacity-50 transition flex items-center justify-center gap-2"
              >
                {loading ? 'Creating...' : (
                  <>
                    <MessageSquare className="w-4 h-4" />
                    Create Discussion
                  </>
                )}
              </button>
              <Link
                href={`/policies/${resolvedParams.id}/discuss`}
                className="px-6 py-3 rounded-lg border border-ink/20 text-ink hover:bg-sand/30 transition font-medium"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
