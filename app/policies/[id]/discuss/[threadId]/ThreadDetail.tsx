'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { MessageSquare, Heart, Share2, Flag, ArrowLeft } from 'lucide-react';
import { CommentForm } from '@/app/components/CommentForm';
import { CommentsList } from '@/app/components/CommentsList';

interface ThreadDetailData {
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

export default function ThreadDetail({ 
  policyId, 
  threadId 
}: { 
  policyId: string; 
  threadId: string;
}) {
  const [thread, setThread] = useState<ThreadDetailData | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [canReply, setCanReply] = useState(false);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
    loadThread();
    loadComments();
  }, [threadId]);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
    setCanReply(!!user);
  };

  const loadThread = async () => {
    try {
      const { data, error } = await supabase
        .from('discussion_threads')
        .select('*')
        .eq('id', threadId)
        .single();

      if (error) throw error;

      // Fetch author profile separately
      let displayName = 'Unknown User';
      let avatarUrl = null;
      
      if (data.author_id) {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('display_name, avatar_url')
          .eq('id', data.author_id)
          .single();
        
        if (profile) {
          displayName = profile.display_name || 'Unknown User';
          avatarUrl = profile.avatar_url;
        }
      }

      setThread({
        ...data,
        display_name: displayName,
        avatar_url: avatarUrl,
      });
    } catch (error) {
      console.error('Load thread error:', error);
    }
  };

  const loadComments = async () => {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('thread_id', threadId)
        .is('parent_comment_id', null)
        .is('deleted_at', null)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Batch fetch all author profiles
      const authorIds = [...new Set((data || []).map((c: any) => c.author_id).filter(Boolean))];
      let authorMap: Record<string, any> = {};

      if (authorIds.length > 0) {
        const { data: profiles } = await supabase
          .from('user_profiles')
          .select('id, display_name, avatar_url')
          .in('id', authorIds);

        if (profiles) {
          authorMap = Object.fromEntries(
            profiles.map((p: any) => [p.id, { display_name: p.display_name || 'Unknown User', avatar_url: p.avatar_url }])
          );
        }
      }

      // Map comments with author data
      const commentsWithAuthors = (data || []).map((c: any) => ({
        ...c,
        author: c.author_id ? (authorMap[c.author_id] || { display_name: 'Unknown User', avatar_url: null }) : { display_name: 'Unknown User', avatar_url: null },
        reactions: [],
      }));

      setComments(commentsWithAuthors);
    } catch (error) {
      console.error('Load comments error:', error);
    } finally {
      setLoading(false);
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
          href={`/policies/${policyId}/discuss`}
          className="inline-flex items-center gap-2 text-ocean hover:text-ocean-deep"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to discussions
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-3xl mx-auto px-6 py-8 lg:px-0">
      {/* Back link */}
      <Link
        href={`/policies/${policyId}/discuss`}
        className="inline-flex items-center gap-2 text-ocean hover:text-ocean-deep transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to discussions
      </Link>

      {/* Thread header */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 flex-wrap">
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
            <CommentForm threadId={threadId} onCommentAdded={loadComments} />
          </div>
        )}

        {thread.status === 'closed' && (
          <div className="p-4 rounded-lg bg-ink/5 border border-ink/10 text-ink/60 text-sm">
            This thread is closed. No new comments can be added.
          </div>
        )}

        {/* Comments list */}
        {comments.length > 0 ? (
          <CommentsList comments={comments} threadId={threadId} />
        ) : (
          <div className="text-center py-12 text-ink/60">
            No comments yet. Be the first to comment!
          </div>
        )}
      </div>
    </div>
  );
}
