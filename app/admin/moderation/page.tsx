'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import {
  Trash2,
  AlertCircle,
  Eye,
  CheckCircle,
  Clock,
  MessageSquare,
  Filter,
} from 'lucide-react';

interface Comment {
  id: string;
  content: string;
  author: { display_name: string };
  created_at: string;
  is_deleted: boolean;
  vote_count: number;
  reply_count: number;
}

interface Thread {
  id: string;
  title: string;
  comment_count: number;
  created_at: string;
  status: string;
}

export default function ForumModerationPage() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'comments' | 'threads'>('comments');
  const [filterStatus, setFilterStatus] = useState<'all' | 'flagged' | 'deleted'>('all');
  const [selectedComment, setSelectedComment] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [actionInProgress, setActionInProgress] = useState(false);
  const router = useRouter();

  useEffect(() => {
    checkAdminAccess();
  }, []);

  useEffect(() => {
    if (!loading) {
      if (activeTab === 'comments') {
        loadComments();
      } else {
        loadThreads();
      }
    }
  }, [activeTab, filterStatus]);

  const checkAdminAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role_id')
        .eq('id', user.id)
        .single();

      // Check if role_id is 1 (admin) or 2 (moderator)
      if (profile?.role_id !== 1 && profile?.role_id !== 2) {
        console.log('User role_id:', profile?.role_id, '(not admin/moderator)');
        router.push('/');
        return;
      }

      setLoading(false);
    } catch (error) {
      console.error('Access check error:', error);
      router.push('/');
    }
  };

  const loadComments = async () => {
    try {
      const params = new URLSearchParams({
        limit: '100',
        offset: '0',
      });

      if (filterStatus === 'flagged') {
        params.append('flagged', 'true');
      }

      const response = await fetch(`/api/admin/comments?${params}`, {
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });

      const data = await response.json();
      let filteredComments = data.comments || [];

      if (filterStatus === 'deleted') {
        filteredComments = filteredComments.filter((c: Comment) => c.is_deleted);
      } else if (filterStatus === 'all') {
        filteredComments = filteredComments.filter((c: Comment) => !c.is_deleted);
      }

      setComments(filteredComments);
    } catch (error) {
      console.error('Load comments error:', error);
    }
  };

  const loadThreads = async () => {
    try {
      const { data, error } = await supabase
        .from('discussion_threads')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setThreads(data || []);
    } catch (error) {
      console.error('Load threads error:', error);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    setActionInProgress(true);
    try {
      const response = await fetch(`/api/admin/comments/${commentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });

      if (response.ok) {
        setDeleteConfirm(null);
        loadComments();
      }
    } catch (error) {
      console.error('Delete comment error:', error);
    } finally {
      setActionInProgress(false);
    }
  };

  const handleFlagComment = async (commentId: string, reason: string) => {
    setActionInProgress(true);
    try {
      const response = await fetch(`/api/admin/comments/${commentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify({ action: 'flag', reason }),
      });

      if (response.ok) {
        loadComments();
      }
    } catch (error) {
      console.error('Flag comment error:', error);
    } finally {
      setActionInProgress(false);
    }
  };

  const handleDeleteThread = async (threadId: string) => {
    setActionInProgress(true);
    try {
      const { error } = await supabase
        .from('discussion_threads')
        .delete()
        .eq('id', threadId);

      if (error) throw error;
      setDeleteConfirm(null);
      loadThreads();
    } catch (error) {
      console.error('Delete thread error:', error);
    } finally {
      setActionInProgress(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-ink/60">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-ink">Forum Moderation</h1>
        <p className="mt-2 text-ink/60">Manage discussions, threads, and comments</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-ink/10">
        <button
          onClick={() => setActiveTab('comments')}
          className={`px-4 py-3 font-medium transition border-b-2 ${
            activeTab === 'comments'
              ? 'border-ocean text-ocean'
              : 'border-transparent text-ink/60 hover:text-ink'
          }`}
        >
          <MessageSquare className="w-4 h-4 inline mr-2" />
          Comments ({comments.length})
        </button>
        <button
          onClick={() => setActiveTab('threads')}
          className={`px-4 py-3 font-medium transition border-b-2 ${
            activeTab === 'threads'
              ? 'border-ocean text-ocean'
              : 'border-transparent text-ink/60 hover:text-ink'
          }`}
        >
          <Eye className="w-4 h-4 inline mr-2" />
          Threads ({threads.length})
        </button>
      </div>

      {/* Filter */}
      {activeTab === 'comments' && (
        <div className="flex gap-4">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-4 py-2 rounded-lg transition ${
              filterStatus === 'all'
                ? 'bg-ocean text-white'
                : 'border border-ink/20 text-ink hover:bg-ink/5'
            }`}
          >
            All Comments
          </button>
          <button
            onClick={() => setFilterStatus('flagged')}
            className={`px-4 py-2 rounded-lg transition flex items-center gap-2 ${
              filterStatus === 'flagged'
                ? 'bg-coral text-white'
                : 'border border-ink/20 text-ink hover:bg-ink/5'
            }`}
          >
            <AlertCircle className="w-4 h-4" />
            Flagged
          </button>
          <button
            onClick={() => setFilterStatus('deleted')}
            className={`px-4 py-2 rounded-lg transition ${
              filterStatus === 'deleted'
                ? 'bg-sand text-ink'
                : 'border border-ink/20 text-ink hover:bg-ink/5'
            }`}
          >
            Deleted
          </button>
        </div>
      )}

      {/* Comments Tab */}
      {activeTab === 'comments' && (
        <div className="space-y-4">
          {comments.length > 0 ? (
            comments.map((comment) => (
              <div
                key={comment.id}
                className={`p-4 rounded-lg border ${
                  comment.is_deleted
                    ? 'border-ink/10 bg-ink/5 opacity-60'
                    : 'border-ink/20 bg-white'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium text-ink">
                        {comment.author.display_name}
                      </span>
                      <span className="text-xs text-ink/50">
                        {new Date(comment.created_at).toLocaleDateString()}
                      </span>
                      {comment.is_deleted && (
                        <span className="px-2 py-1 bg-coral/10 text-coral text-xs rounded">
                          Deleted
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-ink/70 line-clamp-3">
                      {comment.content}
                    </p>
                    <div className="mt-2 flex gap-4 text-xs text-ink/50">
                      <span>👍 {comment.vote_count} votes</span>
                      <span>💬 {comment.reply_count} replies</span>
                    </div>
                  </div>

                  {!comment.is_deleted && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => setDeleteConfirm(comment.id)}
                        className="p-2 hover:bg-coral/10 rounded transition text-coral"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Delete Confirmation */}
                {deleteConfirm === comment.id && (
                  <div className="mt-4 p-4 rounded bg-coral/5 border border-coral/20 space-y-3">
                    <p className="text-sm text-ink">Delete this comment?</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDeleteComment(comment.id)}
                        disabled={actionInProgress}
                        className="px-3 py-2 rounded bg-coral text-white hover:bg-coral/90 disabled:opacity-50 text-sm font-medium transition"
                      >
                        {actionInProgress ? 'Deleting...' : 'Delete'}
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(null)}
                        className="px-3 py-2 rounded border border-ink/20 text-ink hover:bg-ink/5 text-sm font-medium transition"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <CheckCircle className="w-12 h-12 text-ocean/30 mx-auto mb-4" />
              <p className="text-ink/60">
                {filterStatus === 'flagged'
                  ? 'No flagged comments'
                  : filterStatus === 'deleted'
                    ? 'No deleted comments'
                    : 'No comments to moderate'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Threads Tab */}
      {activeTab === 'threads' && (
        <div className="space-y-4">
          {threads.length > 0 ? (
            threads.map((thread) => (
              <div key={thread.id} className="p-4 rounded-lg border border-ink/20 bg-white">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium text-ink mb-1">{thread.title}</h3>
                    <div className="flex gap-4 text-xs text-ink/50">
                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" />
                        {thread.comment_count} comments
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(thread.created_at).toLocaleDateString()}
                      </span>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          thread.status === 'open'
                            ? 'bg-ocean/10 text-ocean'
                            : thread.status === 'pinned'
                              ? 'bg-coral/10 text-coral'
                              : 'bg-ink/10 text-ink/60'
                        }`}
                      >
                        {thread.status}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setDeleteConfirm(thread.id)}
                    className="p-2 hover:bg-coral/10 rounded transition text-coral"
                    title="Delete thread"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Delete Confirmation */}
                {deleteConfirm === thread.id && (
                  <div className="mt-4 p-4 rounded bg-coral/5 border border-coral/20 space-y-3">
                    <p className="text-sm text-ink">Delete this thread? All comments will also be deleted.</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDeleteThread(thread.id)}
                        disabled={actionInProgress}
                        className="px-3 py-2 rounded bg-coral text-white hover:bg-coral/90 disabled:opacity-50 text-sm font-medium transition"
                      >
                        {actionInProgress ? 'Deleting...' : 'Delete'}
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(null)}
                        className="px-3 py-2 rounded border border-ink/20 text-ink hover:bg-ink/5 text-sm font-medium transition"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <CheckCircle className="w-12 h-12 text-ocean/30 mx-auto mb-4" />
              <p className="text-ink/60">No threads to moderate</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
