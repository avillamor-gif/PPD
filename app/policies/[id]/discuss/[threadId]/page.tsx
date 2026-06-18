'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { MessageSquare, Heart, Share2, Flag, ArrowLeft, Trash2 } from 'lucide-react';
import { CommentForm } from '@/app/components/CommentForm';
import { CommentsList } from '@/app/components/CommentsList';

interface ThreadDetail {
  id: string;
  policy_id: string;
  title: string;
  description: string;
  author_id: string;
  display_name: string;
  avatar_url: string | null;
  status: string;
  comment_count: number;
  created_at: string;
  updated_at: string;
  is_pinned: boolean;
}

export default function ThreadPage({
  params,
}: {
  params: { id: string; threadId: string };
}) {
  const [thread, setThread] = useState<ThreadDetail | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<number | null>(null);
  const [canReply, setCanReply] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
    loadThread();
    loadComments();
  }, [params.threadId]);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
    setCanReply(!!user);
    
    if (user) {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role_id')
        .eq('id', user.id)
        .single();
      setUserRole(profile?.role_id || null);
    }
  };

  const loadThread = async () => {
    try {
      const { data, error } = await supabase
        .from('discussion_threads')
        .select(`
          *,
          author:user_profiles(display_name, avatar_url)
        `)
        .eq('id', params.threadId)
        .single();

      if (error) throw error;

      setThread({
        ...data,
        display_name: (data as any).author?.display_name || 'Unknown',
        avatar_url: (data as any).author?.avatar_url || null,
      });
    } catch (error) {
      console.error('Load thread error:', error);
    }
  };

  const loadComments = async () => {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          author:user_profiles(display_name, avatar_url),
          reactions:comment_reactions(reaction_type)
        `)
        .eq('thread_id', params.threadId)
        .is('parent_comment_id', null)
        .is('deleted_at', null)
        .order('created_at', { ascending: true });

      if (error) throw error;

      setComments(data || []);
    } catch (error) {
      console.error('Load comments error:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteThread = async () => {
    setDeleting(true);
    try {
      const { error } = await supabase
        .from('discussion_threads')
        .delete()
        .eq('id', params.threadId);

      if (error) throw error;
      router.push(`/policies/${params.id}`);
    } catch (error) {
      console.error('Delete thread error:', error);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-ink/60">Loading thread...</p>
      </div>
    );
  }

  if (!thread) {
    return (
      <div className="space-y-6 py-12">
        <h1 className="text-4xl font-bold text-ink">Thread not found</h1>
        <Link
          href={`/policies/${params.id}/discuss`}
          className="inline-flex items-center gap-2 text-ocean hover:text-ocean-deep"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to discussions
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      {/* Back link */}
      <Link
        href={`/policies/${params.id}/discuss`}
        className="inline-flex items-center gap-2 text-ocean hover:text-ocean-deep transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to discussions
      </Link>

      {/* Thread header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
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
          {(userRole === 1 || user?.id === thread.author_id) && (
            <button
              onClick={() => setDeleteConfirm(true)}
              className="p-2 hover:bg-coral/10 rounded transition text-coral"
              title="Delete thread"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          )}
        </div>
        <h1 className="text-4xl font-bold text-ink">{thread.title}</h1>
        {thread.description && (
          <p className="text-lg text-ink/60">{thread.description}</p>
        )}
        <div className="flex items-center gap-3 pt-4 border-t border-ink/10">
          {thread.avatar_url && (
            <img
              src={thread.avatar_url}
              alt={thread.display_name}
              className="w-10 h-10 rounded-full"
            />
          )}
          <div>
            <p className="font-medium text-ink">{thread.display_name}</p>
            <p className="text-sm text-ink/50">
              {new Date(thread.created_at).toLocaleDateString()} at{' '}
              {new Date(thread.created_at).toLocaleTimeString()}
            </p>
          </div>
        </div>
      </div>

      <hr className="border-ink/10" />

      {/* Delete confirmation */}
      {deleteConfirm && (
        <div className="p-6 rounded-lg bg-coral/5 border border-coral/20 space-y-4">
          <h3 className="font-semibold text-ink">Delete this thread?</h3>
          <p className="text-sm text-ink/60">
            This will permanently delete the thread and all its comments. This action cannot be undone.
          </p>
          <div className="flex gap-2">
            <button
              onClick={deleteThread}
              disabled={deleting}
              className="px-4 py-2 rounded bg-coral text-white hover:bg-coral/90 disabled:opacity-50 font-medium transition"
            >
              {deleting ? 'Deleting...' : 'Delete Thread'}
            </button>
            <button
              onClick={() => setDeleteConfirm(false)}
              disabled={deleting}
              className="px-4 py-2 rounded border border-ink/20 text-ink hover:bg-ink/5 font-medium transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <hr className="border-ink/10" />

      {/* Comments section */}
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-ink">
            {thread.comment_count} {thread.comment_count === 1 ? 'Comment' : 'Comments'}
          </h2>
        </div>

        {/* Reply form */}
        {canReply && thread.status !== 'closed' && (
          <div className="p-6 rounded-lg border border-ink/10 bg-sand/5">
            <CommentForm threadId={params.threadId} onCommentAdded={loadComments} />
          </div>
        )}

        {thread.status === 'closed' && (
          <div className="p-4 rounded-lg bg-ink/5 border border-ink/10 text-ink/60 text-sm">
            This thread is closed. No new comments can be added.
          </div>
        )}

        {/* Comments list */}
        {comments.length > 0 ? (
          <CommentsList comments={comments} threadId={params.threadId} />
        ) : (
          <div className="text-center py-12 text-ink/60">
            No comments yet. Be the first to comment!
          </div>
        )}
      </div>
    </div>
  );
}
