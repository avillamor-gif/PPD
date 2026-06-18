'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, MapPin, Building2, Edit2, ArrowLeft, Shield } from 'lucide-react';

interface UserProfile {
  id: string;
  display_name: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  country_code: string | null;
  organization: string | null;
  role: string;
  email: string;
  thread_count: number;
  comment_count: number;
  created_at: string;
  last_activity_at: string;
}

export default function ProfilePage({
  params,
}: {
  params: { id: string };
}) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
    loadProfile();
  }, [params.id]);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUser(user);
  };

  const loadProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('user_stats')
        .select('*')
        .eq('id', params.id)
        .single();

      if (error) throw error;

      setProfile(data as UserProfile);
      setIsOwnProfile(data?.id === currentUser?.id);
    } catch (error) {
      console.error('Load profile error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-ink/60">Loading profile...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="space-y-6 py-12">
        <h1 className="text-4xl font-bold text-ink">User not found</h1>
        <Link href="/" className="inline-flex items-center gap-2 text-ocean hover:text-ocean-deep">
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div className="space-y-6 p-8 rounded-lg border border-ink/10 bg-card">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-6">
            {profile.avatar_url && (
              <img
                src={profile.avatar_url}
                alt={profile.display_name}
                className="w-24 h-24 rounded-full object-cover"
              />
            )}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-4xl font-bold text-ink">{profile.display_name}</h1>
                {profile.role && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-ocean/10 text-ocean">
                    <Shield className="w-3 h-3" />
                    {profile.role}
                  </span>
                )}
              </div>
              {profile.full_name && (
                <p className="text-lg text-ink/60 mb-3">{profile.full_name}</p>
              )}
              {profile.bio && <p className="text-ink/60 mb-4">{profile.bio}</p>}
              <div className="flex flex-wrap gap-4 text-sm text-ink/60">
                {profile.organization && (
                  <div className="flex items-center gap-1">
                    <Building2 className="w-4 h-4" />
                    {profile.organization}
                  </div>
                )}
                {profile.country_code && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {profile.country_code}
                  </div>
                )}
              </div>
            </div>
          </div>
          {isOwnProfile && (
            <Link
              href={`/profile/${params.id}/edit`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-ocean text-paper hover:bg-ocean-deep transition font-medium text-sm"
            >
              <Edit2 className="w-4 h-4" />
              Edit Profile
            </Link>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-6 rounded-lg border border-ink/10 bg-card text-center">
          <p className="text-3xl font-bold text-ocean">{profile.thread_count}</p>
          <p className="text-sm text-ink/60 mt-2">Discussions Started</p>
        </div>
        <div className="p-6 rounded-lg border border-ink/10 bg-card text-center">
          <p className="text-3xl font-bold text-coral">{profile.comment_count}</p>
          <p className="text-sm text-ink/60 mt-2">Comments</p>
        </div>
        <div className="p-6 rounded-lg border border-ink/10 bg-card text-center">
          <p className="text-sm text-ink/60">Member Since</p>
          <p className="text-lg font-semibold text-ink mt-2">
            {new Date(profile.created_at).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Details */}
      <div className="space-y-4 p-6 rounded-lg border border-ink/10 bg-card">
        <h2 className="font-bold text-ink text-lg">Profile Information</h2>
        <div className="space-y-3 text-sm">
          <div>
            <p className="text-ink/60">Last Active</p>
            <p className="text-ink font-medium">
              {profile.last_activity_at
                ? new Date(profile.last_activity_at).toLocaleDateString()
                : 'Never'}
            </p>
          </div>
          {profile.bio && (
            <div>
              <p className="text-ink/60">Bio</p>
              <p className="text-ink">{profile.bio}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

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
