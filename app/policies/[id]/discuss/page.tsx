'use client';

import { useState, useEffect, use } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MessageSquare, Heart, Eye, Plus, ArrowLeft } from 'lucide-react';

interface Thread {
  id: string;
  policy_id: string;
  title: string;
  description: string;
  author_id: string;
  display_name: string;
  status: 'open' | 'closed' | 'pinned';
  comment_count: number;
  created_at: string;
  is_pinned: boolean;
}

export default function PolicyDiscussionsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [user, setUser] = useState<any>(null);
  const [policy, setPolicy] = useState<any>(null);
  const [policyLoading, setPolicyLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Scroll to hash if present
    if (typeof window !== 'undefined' && window.location.hash) {
      const element = document.querySelector(window.location.hash);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      }
    }
  }, [loading]);

  useEffect(() => {
    checkAuth();
    loadPolicy();
  }, [resolvedParams.id]);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
    // Don't redirect - discussions are public, login only needed to post
  };

  const loadPolicy = async () => {
    try {
      const res = await fetch(`/api/policies/${resolvedParams.id}`);
      if (res.ok) {
        const data = await res.json();
        setPolicy(data);
        // Now load threads with the actual policy ID
        loadThreads(data.id);
      }
    } catch (error) {
      console.error('Error loading policy:', error);
      setError('Failed to load policy');
    } finally {
      setPolicyLoading(false);
    }
  };

  const loadThreads = async (policyId?: string) => {
    try {
      // Use the actual policy ID, not the slug
      const actualPolicyId = policyId || policy?.id || resolvedParams.id;
      
      const response = await fetch(`/api/discussions?policyId=${encodeURIComponent(actualPolicyId)}`, {
        cache: 'no-store',
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`API Error: ${response.status} - ${errorData}`);
      }

      const threadsWithAuthor = await response.json();
      setThreads(threadsWithAuthor);
      setError('');
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to load discussions';
      console.error('Load threads error:', errorMsg);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Back button */}
      {policy && (
        <Link
          href={`/policies/${resolvedParams.id}`}
          className="inline-flex items-center gap-2 text-ocean hover:text-ocean-deep transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to policy
        </Link>
      )}

      {/* Policy Context Card */}
      {policy && (
        <div className="p-6 rounded-lg border border-sand/30 bg-sand/10">
          <p className="text-sm text-ink/60 uppercase tracking-wider font-mono mb-2">Discussing Policy</p>
          <h2 className="text-2xl font-bold text-ink">{policy.title}</h2>
          <p className="text-ink/60 mt-2">{policy.summary.substring(0, 200)}...</p>
          <div className="flex items-center gap-3 mt-4 text-sm text-ink/60">
            <span className="px-2 py-1 rounded bg-sand text-ink font-mono text-xs">{policy.category}</span>
            <span>{policy.country}</span>
            <span>{policy.year}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-ink">Community Discussion</h1>
          <p className="mt-2 text-ink/60">
            {threads.length} {threads.length === 1 ? 'discussion' : 'discussions'}
          </p>
        </div>
        {user && (
          <button
            onClick={() => router.push(`/policies/${resolvedParams.id}/discuss/create`)}
            className="inline-flex items-center gap-2 rounded-lg bg-ink px-6 py-3 font-medium text-paper hover:bg-ink/90 transition"
          >
            <Plus className="w-5 h-5" />
            Start Discussion
          </button>
        )}
      </div>

      {/* Threads */}
      {error && (
        <div className="p-4 rounded-lg bg-coral/10 border border-coral/20 text-coral text-sm">
          <p className="font-mono">Error: {error}</p>
        </div>
      )}
      {loading ? (
        <div className="text-center py-12 text-ink/60">Loading discussions...</div>
      ) : threads.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-ink/20 rounded-lg">
          <MessageSquare className="w-12 h-12 text-ink/30 mx-auto mb-4" />
          <p className="text-ink/60">No discussions yet. Start one!</p>
          {user && (
            <button
              onClick={() => router.push(`/policies/${resolvedParams.id}/discuss/create`)}
              className="inline-flex items-center gap-2 rounded-lg bg-ink px-6 py-3 font-medium text-paper hover:bg-ink/90 transition mt-4"
            >
              <Plus className="w-5 h-5" />
              Start Discussion
            </button>
          )}
          {!user && (
            <Link
              href={`/auth/login?redirect=${encodeURIComponent(`/policies/${resolvedParams.id}/discuss#community-discussion`)}`}
              className="inline-block mt-4 text-ocean hover:text-ocean-deep font-medium"
            >
              Log in to join the discussion
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {threads.map((thread) => (
            <Link
              key={thread.id}
              href={`/policies/${resolvedParams.id}/discuss/${thread.id}`}
              className="block p-6 rounded-lg border border-ink/10 hover:border-ocean hover:bg-sand/30 transition"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h2 className="text-xl font-bold text-ink">{thread.title}</h2>
                    {thread.is_pinned && (
                      <span className="px-2 py-1 rounded text-xs font-mono bg-coral/10 text-coral">
                        PINNED
                      </span>
                    )}
                    <span
                      className={`px-2 py-1 rounded text-xs font-mono ${
                        thread.status === 'closed'
                          ? 'bg-ink/10 text-ink/60'
                          : 'bg-ocean/10 text-ocean'
                      }`}
                    >
                      {thread.status}
                    </span>
                  </div>
                  {thread.description && (
                    <p className="text-ink/60 text-sm mb-3 line-clamp-2">
                      {thread.description}
                    </p>
                  )}
                  <p className="text-xs text-ink/50">
                    By <strong>{thread.display_name}</strong> •{' '}
                    {new Date(thread.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-4 text-sm text-ink/60">
                  <div className="flex items-center gap-1">
                    <MessageSquare className="w-4 h-4" />
                    <span>{thread.comment_count}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
