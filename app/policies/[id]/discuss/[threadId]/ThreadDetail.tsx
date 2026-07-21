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

  useEffect(() => {
    // Scroll to comments section if hash matches
    if (typeof window !== 'undefined' && window.location.hash === '#discussion-comments' && !loading) {
      setTimeout(() => {
        const element = document.getElementById('discussion-comments');
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  }, [loading]);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push(`/auth/login?redirect=/policies/${policyId}/discuss/${threadId}%23discussion-comments`);
      return;
    }
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

  const handleCommentPosted = (newComment: any) => {
    // Add the new comment to the state immediately
    setComments((prev) => [...prev, newComment]);
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
    <div className="w-full">
      {/* Main container with max-width */}
      <div className="mx-auto max-w-3xl">
        {/* Header Navigation */}
        <div className="border-b border-rule bg-paper px-6 py-4 lg:px-0">
          <Link 
            href={`/policies/${policyId}/discuss`}
            className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-ink/60 hover:text-coral transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to discussions
          </Link>
        </div>

        {/* Thread Hero Section */}
        <section className="border-b border-rule bg-paper px-6 py-12 lg:px-0">
          <div className="space-y-8">
            {/* Status & Title */}
            <div className="space-y-6">
              <div className="flex flex-wrap items-center gap-3">
                {thread.is_pinned && (
                  <span className="inline-flex px-3 py-1 rounded-full text-xs font-semibold border bg-coral/10 text-coral border-coral/20">
                    PINNED
                  </span>
                )}
                <span
                  className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold border ${
                    thread.status === 'closed'
                      ? 'bg-ink/5 text-ink/60 border-ink/10'
                      : 'bg-ocean/10 text-ocean border-ocean/20'
                  }`}
                >
                  {thread.status.toUpperCase()}
                </span>
              </div>
              
              <div>
                <h1 className="text-4xl font-bold text-ink leading-tight">
                  {thread.title}
                </h1>
              </div>

              {thread.description && (
                <p className="text-lg text-ink/70 max-w-2xl">
                  {thread.description}
                </p>
              )}

              {/* Author Info */}
              <div className="flex items-center gap-4 pt-6 border-t border-ink/10">
                {thread.avatar_url && (
                  <img
                    src={thread.avatar_url}
                    alt={thread.display_name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                )}
                <div>
                  <p className="font-semibold text-ink">{thread.display_name}</p>
                  <p className="text-xs uppercase tracking-wider text-ink/60 font-mono">
                    {new Date(thread.created_at).toLocaleDateString()} at{' '}
                    {new Date(thread.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Comments Section */}
        <section className="border-b border-rule px-6 py-12 lg:px-0">
          <div className="space-y-8">
            {/* Comments Count */}
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                Discussion
              </div>
              <h2 className="mt-2 font-fraunces text-3xl font-semibold text-ink">
                {thread.comment_count} {thread.comment_count === 1 ? 'Comment' : 'Comments'}
              </h2>
            </div>

            {/* Status message for closed threads */}
            {thread.status === 'closed' && (
              <div className="p-6 rounded-xl border border-ink/10 bg-ink/5">
                <p className="text-sm text-ink/60 font-medium">
                  This thread is closed. No new comments can be added.
                </p>
              </div>
            )}

            {/* Reply form */}
            {canReply && thread.status !== 'closed' && (
              <div className="p-6 rounded-xl border border-ink/10 bg-white/50">
                <CommentForm threadId={threadId} onCommentPosted={handleCommentPosted} onCommentAdded={loadComments} />
              </div>
            )}

            {/* Comments list */}
            {comments.length > 0 ? (
              <CommentsList comments={comments} threadId={threadId} />
            ) : (
              <div className="text-center py-12 text-ink/60">
                <p>No comments yet. Be the first to comment!</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
