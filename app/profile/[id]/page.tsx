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
