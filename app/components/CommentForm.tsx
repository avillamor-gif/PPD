// @ts-nocheck
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Send, AlertCircle, Check } from 'lucide-react';

export function CommentForm({
  policyId,
  onCommentAdded,
}: {
  policyId: string;
  onCommentAdded?: () => void;
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

      // Get or create discussion thread for this policy
      let { data: thread } = await supabase
        .from('discussion_threads')
        .select('id')
        .eq('policy_id', policyId)
        .single();

      if (!thread) {
        const { data: newThread, error: threadError } = await supabase
          .from('discussion_threads')
          .insert({
            policy_id: policyId,
            title: `Discussion on Policy`,
            author_id: currentUser.id,
            status: 'open',
          })
          .select()
          .single();

        if (threadError) throw threadError;
        thread = newThread;
      }

      // Insert comment
      const { error: commentError } = await supabase
        .from('comments')
        .insert({
          thread_id: thread.id,
          policy_id: policyId,
          author_id: currentUser.id,
          content: content.trim(),
        });

      if (commentError) throw commentError;

      setSuccess(true);
      setContent('');
      setTimeout(() => setSuccess(false), 2000);

      if (onCommentAdded) {
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
