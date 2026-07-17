'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { BookmarkIcon, MessageSquare, Plus, Zap } from 'lucide-react';
import Link from 'next/link';

interface UserStats {
  thread_count: number;
  comment_count: number;
  bookmark_count: number;
  follower_count: number;
  following_count: number;
}

interface RecentActivity {
  id: string;
  activity_type: string;
  activity_data: Record<string, any>;
  created_at: string;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<UserStats>({
    thread_count: 0,
    comment_count: 0,
    bookmark_count: 0,
    follower_count: 0,
    following_count: 0,
  });
  const [activity, setActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const init = async () => {
      try {
        // Check auth
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error || !session?.user) {
          router.push('/auth/login');
          return;
        }

        setUser(session.user);

        // Fetch user stats and activity
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData?.session?.access_token;

        if (token) {
          // Fetch stats from user_stats view
          const { data: userStats, error: statsError } = await supabase
            .from('user_stats')
            .select('thread_count, comment_count')
            .eq('id', session.user.id)
            .single();

          if (userStats && !statsError) {
            setStats((prev) => ({
              ...prev,
              thread_count: userStats.thread_count || 0,
              comment_count: userStats.comment_count || 0,
            }));
          }

          // Fetch activity
          const activityRes = await fetch('/api/activity', {
            headers: { 'x-user-id': session.user.id },
          });
          if (activityRes.ok) {
            const { activity: data } = await activityRes.json();
            setActivity(data || []);
          }

          // Fetch bookmarks count
          const bookmarksRes = await fetch('/api/bookmarks', {
            headers: { 'x-user-id': session.user.id },
          });
          if (bookmarksRes.ok) {
            const { bookmarks } = await bookmarksRes.json();
            setStats((prev) => ({
              ...prev,
              bookmark_count: (bookmarks || []).length,
            }));
          }

          // Fetch follow stats
          const followRes = await fetch('/api/follow', {
            headers: { 'x-user-id': session.user.id },
          });
          if (followRes.ok) {
            const { follower_count, following_count } = await followRes.json();
            setStats((prev) => ({
              ...prev,
              follower_count: follower_count || 0,
              following_count: following_count || 0,
            }));
          }
        }
      } catch (error) {
        console.error('Dashboard init error:', error);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [router]);

  if (loading) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-paper">
        <p className="text-ink/60">Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-paper">
      {/* Header */}
      <div className="border-b border-border bg-white sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <h1 className="text-3xl font-bold text-ink">Dashboard</h1>
          <p className="text-ink/60 mt-2">Welcome back! Here's your community activity overview.</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12 space-y-12">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white rounded-lg border border-border p-6 text-center">
            <div className="text-3xl font-bold text-ocean">{stats.thread_count}</div>
            <p className="text-sm text-ink/60 mt-2">Discussions Started</p>
          </div>

          <div className="bg-white rounded-lg border border-border p-6 text-center">
            <div className="text-3xl font-bold text-ocean">{stats.comment_count}</div>
            <p className="text-sm text-ink/60 mt-2">Comments Posted</p>
          </div>

          <div className="bg-white rounded-lg border border-border p-6 text-center">
            <div className="text-3xl font-bold text-ocean">{stats.bookmark_count}</div>
            <p className="text-sm text-ink/60 mt-2">Bookmarked Policies</p>
          </div>

          <div className="bg-white rounded-lg border border-border p-6 text-center">
            <div className="text-3xl font-bold text-ocean">{stats.follower_count}</div>
            <p className="text-sm text-ink/60 mt-2">Followers</p>
          </div>

          <div className="bg-white rounded-lg border border-border p-6 text-center">
            <div className="text-3xl font-bold text-ocean">{stats.following_count}</div>
            <p className="text-sm text-ink/60 mt-2">Following</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg border border-border p-8">
          <h2 className="text-xl font-bold text-ink mb-6">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link
              href="/search"
              className="p-4 rounded-lg border border-border hover:border-ocean hover:bg-ocean/5 transition text-center"
            >
              <Zap className="w-6 h-6 mx-auto mb-2 text-ocean" />
              <span className="text-sm font-medium text-ink">Browse Policies</span>
            </Link>

            <Link
              href="/countries"
              className="p-4 rounded-lg border border-border hover:border-ocean hover:bg-ocean/5 transition text-center"
            >
              <Plus className="w-6 h-6 mx-auto mb-2 text-ocean" />
              <span className="text-sm font-medium text-ink">By Country</span>
            </Link>

            <Link
              href="/profile/[id]/bookmarks"
              as={`/profile/${user?.id}/bookmarks`}
              className="p-4 rounded-lg border border-border hover:border-ocean hover:bg-ocean/5 transition text-center"
            >
              <BookmarkIcon className="w-6 h-6 mx-auto mb-2 text-ocean" />
              <span className="text-sm font-medium text-ink">My Bookmarks</span>
            </Link>

            <Link
              href="/profile/[id]"
              as={`/profile/${user?.id}`}
              className="p-4 rounded-lg border border-border hover:border-ocean hover:bg-ocean/5 transition text-center"
            >
              <MessageSquare className="w-6 h-6 mx-auto mb-2 text-ocean" />
              <span className="text-sm font-medium text-ink">My Profile</span>
            </Link>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg border border-border p-8">
          <h2 className="text-xl font-bold text-ink mb-6">Recent Activity</h2>
          {activity.length === 0 ? (
            <p className="text-ink/60 text-center py-8">No activity yet. Start by exploring policies or joining discussions!</p>
          ) : (
            <div className="space-y-4">
              {activity.slice(0, 10).map((item) => (
                <div key={item.id} className="p-4 rounded-lg border border-border/50 hover:border-ocean/30 transition">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-ink">
                        {item.activity_type === 'thread_created' && '💬 Started a discussion'}
                        {item.activity_type === 'comment_posted' && '💭 Posted a comment'}
                        {item.activity_type === 'policy_bookmarked' && '📌 Bookmarked a policy'}
                        {item.activity_type === 'user_followed' && '👥 Followed a user'}
                      </p>
                      {item.activity_data?.title && (
                        <p className="text-sm text-ink/60 mt-1">"{item.activity_data.title}"</p>
                      )}
                    </div>
                    <time className="text-xs text-ink/40">
                      {new Date(item.created_at).toLocaleDateString()}
                    </time>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
