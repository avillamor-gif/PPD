// @ts-nocheck
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Send, AlertCircle, Check } from 'lucide-react';

export function CommentForm({
  threadId,
  policyId,
  onCommentAdded,
  onCommentPosted,
}: {
  threadId?: string;
  policyId?: string;
  onCommentAdded?: () => void;
  onCommentPosted?: (comment: any) => void;
}) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setCurrentUser(session.user);
        setIsAuthenticated(true);
      }
    } catch (err) {
      console.error('Auth check error:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);

    try {
      if (!content.trim()) throw new Error('Comment cannot be empty');
      if (content.length < 3) throw new Error('Comment must be at least 3 characters');

      let commentThreadId = threadId;

      // If threadId not provided, get or create discussion thread for this policy
      if (!commentThreadId && policyId) {
        let { data: thread } = await supabase
          .from('discussion_threads')
          .select('id')
          .eq('policy_id', policyId)
          .single();

        if (!thread) {
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
              policyId,
              title: 'Discussion on Policy',
              description: null,
            }),
          });

          if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Failed to create discussion');
          }

          const result = await response.json();
          thread = { id: result.threadId };
        }
        commentThreadId = thread.id;
      }

      if (!commentThreadId) {
        throw new Error('No thread or policy provided');
      }

      // Post comment via API endpoint
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch('/api/comments/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          threadId: commentThreadId,
          policyId: policyId || null,
          content: content.trim(),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to post comment');
      }

      const result = await response.json();
      setSuccess(true);
      setContent('');
      setTimeout(() => setSuccess(false), 2000);

      // Notify parent with new comment data for immediate UI update
      if (onCommentPosted && result.comment) {
        onCommentPosted(result.comment);
      } else if (onCommentAdded) {
        // Fallback to reload if onCommentPosted not provided
        onCommentAdded();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to post comment');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="rounded-lg border border-ink/10 bg-paper p-6 text-center">
        <p className="text-ink/60 mb-4">Sign in to join the discussion</p>
        <Link
          href="/auth/login"
          className="inline-flex px-6 py-2 rounded-lg bg-ocean text-white font-semibold hover:bg-ocean/90 transition"
        >
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-ink/10 bg-white p-6">
      <h3 className="text-lg font-bold text-ink mb-4">Share Your Thoughts</h3>

      {error && (
        <div className="rounded-lg border border-coral/30 bg-coral/5 p-3 mb-4 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-coral" />
          <p className="text-sm text-coral">{error}</p>
        </div>
      )}

      {success && (
        <div className="rounded-lg border border-ocean/30 bg-ocean/5 p-3 mb-4 flex items-center gap-2">
          <Check className="w-4 h-4 text-ocean" />
          <p className="text-sm text-ocean">Comment posted successfully!</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What are your thoughts on this policy?"
          rows={4}
          maxLength={1000}
          disabled={loading}
          className="w-full rounded-lg border border-ink/20 bg-paper px-4 py-3 text-ink placeholder:text-ink/40 focus:border-ocean focus:outline-none focus:ring-2 focus:ring-ocean/20 transition resize-none disabled:opacity-50"
        />

        <div className="flex items-center justify-between">
          <span className="text-xs text-ink/50">{content.length}/1000</span>

          <button
            type="submit"
            disabled={loading || !content.trim()}
            className="inline-flex items-center gap-2 px-6 py-2 rounded-lg bg-ocean text-white font-semibold hover:bg-ocean/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Posting...' : 'Post Comment'}
            {!loading && <Send className="w-4 h-4" />}
          </button>
        </div>
      </form>
    </div>
  );
}
