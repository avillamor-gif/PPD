// @ts-nocheck
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { MessageCircle, User, ThumbsUp } from 'lucide-react';

export function CommentsList({ 
  comments: initialComments, 
  threadId,
  policyId 
}: { 
  comments?: any[];
  threadId?: string;
  policyId?: string;
}) {
  const [comments, setComments] = useState<any[]>(initialComments || []);
  const [loading, setLoading] = useState(!initialComments);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    if (!initialComments) {
      loadComments();
    }
    getCurrentUser();
  }, [policyId, threadId]);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUser(user);
    setIsAuthenticated(!!user);
  };

  const loadComments = async () => {
    try {
      let query = supabase
        .from('comments')
        .select(`
          *,
          author:user_profiles(id, display_name, avatar_url),
          thread:discussion_threads(title)
        `)
        .is('parent_comment_id', null)
        .order('vote_count', { ascending: false })
        .order('created_at', { ascending: false });

      if (threadId) {
        query = query.eq('thread_id', threadId);
      } else if (policyId) {
        query = query.eq('policy_id', policyId);
      } else {
        throw new Error('Either threadId or policyId is required');
      }

      const { data, error } = await query;

      if (error) throw error;
      setComments(data || []);
    } catch (err) {
      console.error('Error loading comments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (commentId: string, currentVotes: number) => {
    if (!currentUser) return;

    try {
      // Check if user already voted
      const { data: existingReaction } = await supabase
        .from('comment_reactions')
        .select('*')
        .eq('comment_id', commentId)
        .eq('user_id', currentUser.id)
        .eq('reaction_type', 'upvote')
        .single();

      if (existingReaction) {
        // Remove vote
        await supabase
          .from('comment_reactions')
          .delete()
          .eq('id', existingReaction.id);

        setComments(comments.map(c =>
          c.id === commentId ? { ...c, vote_count: currentVotes - 1 } : c
        ));
      } else {
        // Add vote
        await supabase
          .from('comment_reactions')
          .insert({
            comment_id: commentId,
            user_id: currentUser.id,
            reaction_type: 'upvote',
          });

        setComments(comments.map(c =>
          c.id === commentId ? { ...c, vote_count: currentVotes + 1 } : c
        ));
      }
    } catch (err) {
      console.error('Error voting:', err);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="rounded-lg border border-ink/10 bg-paper p-8 text-center">
        <MessageCircle className="w-12 h-12 text-ink/30 mx-auto mb-3" />
        <p className="text-ink/60 mb-4">Sign in to view comments and join the discussion</p>
        <Link
          href={`/auth/login?redirect=${encodeURIComponent((typeof window !== 'undefined' ? (window.location.pathname + window.location.search) : '') + '#discussion-comments')}`}
          className="inline-flex px-6 py-2 rounded-lg bg-ocean text-white font-semibold hover:bg-ocean/90 transition"
        >
          Sign In
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-lg border border-ink/10 bg-white p-4 animate-pulse">
            <div className="h-12 bg-ink/10 rounded mb-3" />
            <div className="h-8 bg-ink/10 rounded w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (comments.length === 0) {
    return (
      <div className="rounded-lg border border-ink/10 bg-paper p-8 text-center">
        <MessageCircle className="w-12 h-12 text-ink/30 mx-auto mb-3" />
        <p className="text-ink/60">No comments yet. Be the first to join the discussion!</p>
      </div>
    );
  }

  return (
    <div id="discussion-comments" className="space-y-4">
      {comments.map((comment) => (
        <div key={comment.id} className="rounded-lg border border-ink/10 bg-white p-6">
          <div className="flex items-start gap-4">
            {comment.author?.avatar_url ? (
              <img
                src={comment.author.avatar_url}
                alt={comment.author.display_name}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-ocean/10 flex items-center justify-center">
                <User className="w-5 h-5 text-ocean" />
              </div>
            )}

            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Link
                  href={`/profile/${comment.author?.id}`}
                  className="font-semibold text-ink hover:text-ocean transition"
                >
                  {comment.author?.display_name || 'Anonymous'}
                </Link>
                <span className="text-xs text-ink/50">
                  {new Date(comment.created_at).toLocaleDateString()}
                </span>
              </div>

              <p className="text-ink mb-4">{comment.content}</p>

              <div className="flex items-center gap-4 text-xs">
                <button
                  onClick={() => handleVote(comment.id, comment.vote_count)}
                  className="flex items-center gap-1 text-ink/60 hover:text-ocean transition"
                >
                  <ThumbsUp className="w-4 h-4" />
                  {comment.vote_count > 0 && <span>{comment.vote_count}</span>}
                </button>

                {comment.reply_count > 0 && (
                  <span className="text-ink/60">
                    {comment.reply_count} {comment.reply_count === 1 ? 'reply' : 'replies'}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
