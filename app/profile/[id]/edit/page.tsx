// @ts-nocheck
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import config from '@/lib/config';
import PasswordInput from '@/app/components/PasswordInput';
import { COUNTRIES, REGIONS } from '@/lib/constants/policies';
import { ArrowLeft, Check, AlertCircle } from 'lucide-react';

export default function EditProfilePage() {
  const router = useRouter();
  const params = useParams();
  const profileId = params?.id as string;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form state
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [organization, setOrganization] = useState('');
  const [countryCode, setCountryCode] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [socialLinks, setSocialLinks] = useState<any>({});

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) {
        router.push('/auth/login');
        return;
      }

      // Only allow editing own profile
      if (profileId && profileId !== currentUser.id) {
        router.push(`/profile/${profileId}`);
        return;
      }

      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single();

      if (userProfile) {
        setUser(currentUser);
        setProfile(userProfile);
        setDisplayName(userProfile.display_name || '');
        setBio(userProfile.bio || '');
        setOrganization(userProfile.organization || '');
        setCountryCode(userProfile.country_code || '');
        setAvatarUrl(userProfile.avatar_url || '');
        setSocialLinks(userProfile.social_links || {});
      }
    } catch (err) {
      console.error('Error loading profile:', err);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      if (!displayName.trim()) {
        throw new Error('Display name is required');
      }

      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({
          display_name: displayName,
          bio: bio || null,
          organization: organization || null,
          country_code: countryCode || null,
          social_links: socialLinks,
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      if (!currentPassword) throw new Error('Current password is required');
      if (!newPassword) throw new Error('New password is required');
      if (newPassword.length < config.auth.passwordMinLength) throw new Error(`New password must be at least ${config.auth.passwordMinLength} characters`);
      if (newPassword !== confirmPassword) throw new Error('Passwords do not match');

      // Verify current password by attempting to sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });

      if (signInError) {
        throw new Error('Current password is incorrect');
      }

      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) throw updateError;

      setSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAvatarUploading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Not authenticated');
      }

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/avatar', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Upload failed');
      }

      const data = await response.json();
      setAvatarUrl(data.avatarUrl);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload avatar');
    } finally {
      setAvatarUploading(false);
      // Reset input
      if (e.target) e.target.value = '';
    }
  };

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
    return null;
  }

  return (
    <div className="w-full min-h-screen bg-paper">
      {/* Header */}
      <section className="border-b border-rule bg-white">
        <div className="mx-auto max-w-350 px-6 py-6 lg:px-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href={`/profile/${user.id}`} className="text-ink/60 hover:text-ink transition">
                <ArrowLeft className="w-6 h-6" />
              </Link>
              <h1 className="text-2xl font-bold text-ink">Edit Profile</h1>
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="mx-auto max-w-350 px-6 py-12 lg:px-10">
        <div className="grid gap-8 md:grid-cols-3">
          {/* Main Form */}
          <div className="md:col-span-2 space-y-6">
            {/* Success Alert */}
            {success && (
              <div className="rounded-lg border border-ocean/30 bg-ocean/5 p-4 flex items-center gap-3">
                <Check className="w-5 h-5 text-ocean" />
                <p className="text-sm text-ocean font-medium">Changes saved successfully!</p>
              </div>
            )}

            {/* Error Alert */}
            {error && (
              <div className="rounded-lg border border-coral/30 bg-coral/5 p-4 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-coral" />
                <p className="text-sm text-coral font-medium">{error}</p>
              </div>
            )}

            {/* Profile Information */}
            <div className="rounded-xl border border-ink/10 bg-white p-6 space-y-6">
              <div className="border-b border-ink/10 pb-4">
                <h2 className="text-lg font-bold text-ink">Profile Information</h2>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-4">
                {/* Avatar Upload */}
                <div className="flex items-start gap-4 pb-4 border-b border-ink/10">
                  <div className="shrink-0">
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt="Avatar"
                        className="w-16 h-16 rounded-full object-cover border border-ink/20"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-sand border border-ink/20 flex items-center justify-center">
                        <span className="text-2xl">📷</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-ink mb-2">Profile Photo</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      disabled={avatarUploading}
                      className="block w-full text-sm text-ink/60 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border file:border-ink/20 file:bg-paper file:text-ink file:cursor-pointer hover:file:bg-sand disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <p className="mt-1 text-xs text-ink/50">JPG, PNG or GIF (max 5MB)</p>
                    {avatarUploading && <p className="mt-1 text-xs text-ocean">Uploading...</p>}
                  </div>
                </div>

                {/* Display Name */}
                <div>
                  <label className="block text-sm font-medium text-ink mb-2">Display Name</label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Your public name"
                    className="w-full rounded-lg border border-ink/20 bg-paper px-4 py-2 text-ink placeholder:text-ink/40 focus:border-ocean focus:outline-none focus:ring-2 focus:ring-ocean/20 transition"
                  />
                  <p className="mt-1 text-xs text-ink/50">How others see you on the platform</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink mb-2">Bio</label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell us about yourself..."
                    rows={4}
                    maxLength={250}
                    className="w-full rounded-lg border border-ink/20 bg-paper px-4 py-2 text-ink placeholder:text-ink/40 focus:border-ocean focus:outline-none focus:ring-2 focus:ring-ocean/20 transition resize-none"
                  />
                  <p className="mt-1 text-xs text-ink/50">{bio.length}/250</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink mb-2">Organization</label>
                  <input
                    type="text"
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                    placeholder="e.g., Environmental NGO"
                    className="w-full rounded-lg border border-ink/20 bg-paper px-4 py-2 text-ink placeholder:text-ink/40 focus:border-ocean focus:outline-none focus:ring-2 focus:ring-ocean/20 transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink mb-2">Country</label>
                  <select
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    className="w-full rounded-lg border border-ink/20 bg-paper px-4 py-2 text-ink focus:border-ocean focus:outline-none focus:ring-2 focus:ring-ocean/20 transition"
                  >
                    <option value="">Select a country</option>
                    {COUNTRIES.map((country) => (
                      <option key={country.code} value={country.code}>
                        {country.name} ({country.region})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Social Links */}
                <div className="border-t border-ink/10 pt-4 mt-4">
                  <h3 className="text-sm font-semibold text-ink mb-3">Social Links</h3>
                  <div className="space-y-3">
                    {['twitter', 'linkedin', 'github', 'website'].map((platform) => (
                      <div key={platform}>
                        <label className="block text-sm font-medium text-ink mb-1 capitalize">{platform}</label>
                        <input
                          type="url"
                          placeholder={`https://${platform}.com/yourprofile`}
                          value={socialLinks[platform] || ''}
                          onChange={(e) => setSocialLinks({ ...socialLinks, [platform]: e.target.value })}
                          className="w-full rounded-lg border border-ink/20 bg-paper px-4 py-2 text-ink placeholder:text-ink/40 focus:border-ocean focus:outline-none focus:ring-2 focus:ring-ocean/20 transition"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full rounded-lg bg-ocean px-4 py-3 font-semibold text-white transition hover:bg-ocean/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </form>
            </div>

            {/* Password Change */}
            <div className="rounded-xl border border-ink/10 bg-white p-6 space-y-6">
              <div className="border-b border-ink/10 pb-4">
                <h2 className="text-lg font-bold text-ink">Change Password</h2>
              </div>

              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-ink mb-2">Current Password</label>
                  <PasswordInput
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink mb-2">New Password</label>
                  <PasswordInput
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                  />
                  <p className="mt-1 text-xs text-ink/50">At least {config.auth.passwordMinLength} characters</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink mb-2">Confirm New Password</label>
                  <PasswordInput
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                  />
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full rounded-lg bg-coral px-4 py-3 font-semibold text-white transition hover:bg-coral/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Updating...' : 'Update Password'}
                </button>
              </form>
            </div>
          </div>

          {/* Sidebar - Account Info */}
          <div className="md:col-span-1">
            <div className="rounded-xl border border-ink/10 bg-white p-6 space-y-4 sticky top-20">
              <h3 className="font-bold text-ink">Account Information</h3>

              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-ink/60">Email</p>
                  <p className="font-mono text-ink break-all">{user.email}</p>
                </div>

                <div>
                  <p className="text-ink/60">Member Since</p>
                  <p className="text-ink">
                    {new Date(user.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                </div>

                <div>
                  <p className="text-ink/60">Account Status</p>
                  <p className="inline-flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-ocean" />
                    <span className="text-ink">Active</span>
                  </p>
                </div>
              </div>

              <div className="border-t border-ink/10 pt-4">
                <Link href={`/profile/${user.id}`} className="text-sm text-ocean hover:text-ocean/80 transition">
                  View Public Profile →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
