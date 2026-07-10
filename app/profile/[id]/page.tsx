'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useParams } from 'next/navigation';
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

export default function ProfilePage() {
  const params = useParams();
  const profileId = params?.id as string;
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!profileId) {
      setLoading(false);
      return;
    }

    // Check if profileId looks like a valid UUID (36 characters with hyphens)
    // If not, it's likely a route like "/profile/edit" which shouldn't be accessed this way
    const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(profileId);
    if (!isValidUUID) {
      setLoading(false);
      return;
    }

    const initProfile = async () => {
      try {
        // First, check auth to get current user
        const { data: { user } } = await supabase.auth.getUser();
        setCurrentUser(user);

        // Check if this is the current user's profile
        if (user && profileId === user.id) {
          setIsOwnProfile(true);
        }

        // Load the profile
        const { data, error } = await supabase
          .from('user_stats')
          .select('*')
          .eq('id', profileId)
          .single();

        if (error) throw error;

        setProfile(data as UserProfile);
      } catch (error) {
        console.error('Load profile error:', error);
      } finally {
        setLoading(false);
      }
    };

    initProfile();
  }, [profileId, router]);

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-paper flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-ocean/20 border-t-ocean rounded-full animate-spin mb-4" />
          <p className="text-ink/60">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="w-full min-h-screen bg-paper">
        <section className="mx-auto max-w-350 px-6 py-12 lg:px-10">
          <div className="flex items-center gap-4 mb-6">
            <Link href="/" className="text-ink/60 hover:text-ink transition">
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <h1 className="text-2xl font-bold text-ink">User not found</h1>
          </div>
          <Link href="/" className="text-ocean hover:text-ocean/80 transition">
            Back to home →
          </Link>
        </section>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-paper">
      {/* Header */}
      <section className="border-b border-rule bg-white">
        <div className="mx-auto max-w-350 px-6 py-6 lg:px-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-ink/60 hover:text-ink transition">
                <ArrowLeft className="w-6 h-6" />
              </Link>
              <h1 className="text-2xl font-bold text-ink">Profile</h1>
            </div>
            {isOwnProfile && (
              <Link
                href={`/profile/${profileId}/edit`}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-ocean text-white hover:bg-ocean/90 transition font-medium text-sm"
              >
                <Edit2 className="w-4 h-4" />
                Edit Profile
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="mx-auto max-w-350 px-6 py-12 lg:px-10">
        <div className="grid gap-8 md:grid-cols-3">
          {/* Main Content */}
          <div className="md:col-span-2 space-y-6">
            {/* Profile Card */}
            <div className="rounded-xl border border-ink/10 bg-white p-6 space-y-6">
              <div className="flex items-start gap-4 pb-6 border-b border-ink/10">
                <div className="shrink-0">
                  {profile.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={profile.display_name}
                      className="w-24 h-24 rounded-full object-cover border border-ink/20"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-sand border border-ink/20 flex items-center justify-center">
                      <span className="text-4xl">👤</span>
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-3xl font-bold text-ink">{profile.display_name}</h2>
                    {profile.role && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-ocean/10 text-ocean">
                        <Shield className="w-3 h-3" />
                        {profile.role}
                      </span>
                    )}
                  </div>
                  {profile.bio && (
                    <p className="text-ink/60 mt-2">{profile.bio}</p>
                  )}
                </div>
              </div>

              {/* Details */}
              <div className="space-y-4">
                {profile.organization && (
                  <div>
                    <p className="text-sm font-medium text-ink/60 mb-1">Organization</p>
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-ink/60" />
                      <p className="text-ink">{profile.organization}</p>
                    </div>
                  </div>
                )}

                {profile.country_code && (
                  <div>
                    <p className="text-sm font-medium text-ink/60 mb-1">Country</p>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-ink/60" />
                      <p className="text-ink">{profile.country_code}</p>
                    </div>
                  </div>
                )}

                <div>
                  <p className="text-sm font-medium text-ink/60 mb-1">Email</p>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-ink/60" />
                    <p className="text-ink break-all">{currentUser?.email}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-ink/60 mb-1">Member Since</p>
                  <p className="text-ink">
                    {new Date(profile.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                </div>

                {profile.last_activity_at && (
                  <div>
                    <p className="text-sm font-medium text-ink/60 mb-1">Last Active</p>
                    <p className="text-ink">
                      {new Date(profile.last_activity_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Statistics */}
            <div className="rounded-xl border border-ink/10 bg-white p-6 space-y-4">
              <h3 className="text-lg font-bold text-ink border-b border-ink/10 pb-4">Activity</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg border border-ink/10 bg-paper">
                  <p className="text-3xl font-bold text-ocean">{profile.thread_count}</p>
                  <p className="text-sm text-ink/60 mt-2">Discussions Started</p>
                </div>
                <div className="p-4 rounded-lg border border-ink/10 bg-paper">
                  <p className="text-3xl font-bold text-coral">{profile.comment_count}</p>
                  <p className="text-sm text-ink/60 mt-2">Comments</p>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="md:col-span-1">
            <div className="rounded-xl border border-ink/10 bg-white p-6 space-y-4 sticky top-20">
              <h3 className="font-bold text-ink">Status</h3>

              <div className="space-y-3">
                <div>
                  <p className="text-sm text-ink/60">Account Status</p>
                  <p className="inline-flex items-center gap-2 mt-1">
                    <span className="w-2 h-2 rounded-full bg-ocean" />
                    <span className="text-ink font-medium">Active</span>
                  </p>
                </div>

                {profile.role && (
                  <div>
                    <p className="text-sm text-ink/60">Role</p>
                    <p className="text-ink font-medium capitalize mt-1">{profile.role}</p>
                  </div>
                )}
              </div>

              {isOwnProfile && (
                <div className="border-t border-ink/10 pt-4">
                  <Link href={`/profile/${profileId}/edit`} className="text-sm text-ocean hover:text-ocean/80 transition">
                    Edit your profile →
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
