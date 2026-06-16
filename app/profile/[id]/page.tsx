import { supabase } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { User, Mail, Building2, Calendar, MessageSquare, Edit } from 'lucide-react';

export const metadata = {
  title: "User Profile — Plastic Policy Database",
  description: "View user profile and activity.",
};

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Get user profile
  const { data: profile, error } = await supabase
    .from('user_profiles')
    .select(`
      *,
      role:roles(id, name)
    `)
    .eq('id', id)
    .single();

  if (error || !profile) {
    notFound();
  }

  // Get user activity (threads and comments)
  const { data: threads } = await supabase
    .from('discussion_threads')
    .select('*')
    .eq('author_id', id)
    .order('created_at', { ascending: false })
    .limit(5);

  const { data: comments } = await supabase
    .from('comments')
    .select(`
      *,
      thread:discussion_threads(policy_id, title)
    `)
    .eq('author_id', id)
    .order('created_at', { ascending: false })
    .limit(5);

  const currentUser = await supabase.auth.getUser();
  const isOwnProfile = currentUser.data.user?.id === id;

  return (
    <div className="w-full">
      {/* Header */}
      <section className="border-b border-rule bg-paper">
        <div className="mx-auto max-w-350 px-6 py-12 lg:px-10">
          <div className="flex items-start justify-between gap-8">
            <div className="flex items-start gap-6">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.display_name}
                  className="w-24 h-24 rounded-full object-cover border-4 border-ocean/20"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-ocean/10 flex items-center justify-center border-4 border-ocean/20">
                  <User className="w-12 h-12 text-ocean" />
                </div>
              )}
              <div className="space-y-2">
                <h1 className="text-3xl font-bold text-ink">{profile.display_name}</h1>
                {profile.organization && (
                  <p className="text-ink/60 flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    {profile.organization}
                  </p>
                )}
                <span className="inline-flex px-3 py-1 rounded-full text-xs font-semibold bg-ocean/10 text-ocean">
                  {profile.role?.name || 'User'}
                </span>
              </div>
            </div>
            {isOwnProfile && (
              <Link
                href={`/profile/edit`}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-coral text-white hover:bg-coral/90 transition font-medium"
              >
                <Edit className="w-4 h-4" />
                Edit Profile
              </Link>
            )}
          </div>

          {profile.bio && (
            <p className="mt-6 text-ink/70 max-w-2xl">{profile.bio}</p>
          )}

          {/* Stats */}
          <div className="mt-8 grid grid-cols-3 gap-4">
            <div className="rounded-lg border border-ink/10 bg-white p-4 text-center">
              <p className="text-2xl font-bold text-coral">{threads?.length || 0}</p>
              <p className="text-xs text-ink/60 mt-1 uppercase tracking-wider">Discussions</p>
            </div>
            <div className="rounded-lg border border-ink/10 bg-white p-4 text-center">
              <p className="text-2xl font-bold text-ocean">{comments?.length || 0}</p>
              <p className="text-xs text-ink/60 mt-1 uppercase tracking-wider">Comments</p>
            </div>
            <div className="rounded-lg border border-ink/10 bg-white p-4 text-center">
              <p className="text-2xl font-bold text-sand">
                {profile.country_code || '—'}
              </p>
              <p className="text-xs text-ink/60 mt-1 uppercase tracking-wider">Country</p>
            </div>
          </div>
        </div>
      </section>

      {/* Activity */}
      <section>
        <div className="mx-auto max-w-350 px-6 py-12 lg:px-10">
          <h2 className="text-2xl font-bold text-ink mb-8">Recent Activity</h2>

          <div className="space-y-6">
            {/* Recent Discussions */}
            {threads && threads.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-ink flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-coral" />
                  Recent Discussions
                </h3>
                <ul className="space-y-3">
                  {threads.map((thread) => (
                    <li key={thread.id} className="rounded-lg border border-ink/10 bg-white p-4 hover:border-coral transition">
                      <h4 className="font-semibold text-ink hover:text-coral">
                        {thread.title}
                      </h4>
                      <p className="text-xs text-ink/50 mt-1">
                        {new Date(thread.created_at).toLocaleDateString()} · {thread.comment_count} comments
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recent Comments */}
            {comments && comments.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-ink flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-ocean" />
                  Recent Comments
                </h3>
                <ul className="space-y-3">
                  {comments.map((comment) => (
                    <li key={comment.id} className="rounded-lg border border-ink/10 bg-white p-4 hover:border-ocean transition">
                      <p className="text-sm text-ink/70 line-clamp-2">{comment.content}</p>
                      <p className="text-xs text-ink/50 mt-2">
                        on <span className="font-medium">{comment.thread?.title}</span>
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {!threads?.length && !comments?.length && (
              <div className="text-center py-8">
                <p className="text-ink/60">No activity yet</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
