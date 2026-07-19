'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Mail, AlertCircle } from 'lucide-react';
import config from '@/lib/config';

interface Preferences {
  email_on_reply: boolean;
  email_on_mention: boolean;
  email_weekly_digest: boolean;
  email_policy_updates: boolean;
  marketing_emails: boolean;
}

export default function SettingsPage() {
  const [preferences, setPreferences] = useState<Preferences>({
    email_on_reply: true,
    email_on_mention: true,
    email_weekly_digest: false,
    email_policy_updates: true,
    marketing_emails: false,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const init = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error || !session?.user) {
          router.push('/auth/login');
          return;
        }

        // Fetch user preferences
        const { data: prefs, error: prefsError } = await supabase
          .from('user_preferences')
          .select('*')
          .eq('user_id', session.user.id)
          .single();

        if (prefs && !prefsError) {
          setPreferences(prefs);
        }
      } catch (err) {
        console.error('Settings init error:', err);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [router]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        throw new Error('Not authenticated');
      }

      // Upsert: insert if not exists, update if exists
      const { error: upsertError } = await supabase
        .from('user_preferences')
        .upsert(
          {
            user_id: session.user.id,
            ...preferences,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        );

      if (upsertError) throw upsertError;

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-paper">
        <p className="text-ink/60">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-paper">
      {/* Header */}
      <div className="border-b border-border bg-white sticky top-0 z-10">
        <div className="mx-auto max-w-350 px-6 py-8 lg:px-10">
          <h1 className="text-3xl font-bold text-ink">Settings</h1>
          <p className="text-ink/60 mt-2">Manage your preferences and account settings</p>
        </div>
      </div>

      <div className="mx-auto max-w-350 px-6 py-12 lg:px-10">
        {success && (
          <div className="mb-8 p-4 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">
            ✓ Settings saved successfully
          </div>
        )}

        {error && (
          <div className="mb-8 p-4 rounded-lg bg-coral/10 border border-coral/20 text-coral text-sm flex gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-8">
          {/* Email Notifications */}
          <section className="bg-white rounded-lg border border-border p-8">
            <div className="flex items-center gap-3 mb-6">
              <Mail className="w-6 h-6 text-ocean" />
              <h2 className="text-xl font-bold text-ink">Email Notifications</h2>
            </div>

            <div className="space-y-4">
              <label className="flex items-center gap-4 cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.email_on_reply}
                  onChange={(e) =>
                    setPreferences({ ...preferences, email_on_reply: e.target.checked })
                  }
                  className="w-4 h-4 rounded border-border"
                />
                <div>
                  <p className="font-medium text-ink">Reply Notifications</p>
                  <p className="text-sm text-ink/60">Get notified when someone replies to your comments</p>
                </div>
              </label>

              <label className="flex items-center gap-4 cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.email_on_mention}
                  onChange={(e) =>
                    setPreferences({ ...preferences, email_on_mention: e.target.checked })
                  }
                  className="w-4 h-4 rounded border-border"
                />
                <div>
                  <p className="font-medium text-ink">Mention Notifications</p>
                  <p className="text-sm text-ink/60">Get notified when someone mentions you</p>
                </div>
              </label>

              <label className="flex items-center gap-4 cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.email_weekly_digest}
                  onChange={(e) =>
                    setPreferences({ ...preferences, email_weekly_digest: e.target.checked })
                  }
                  className="w-4 h-4 rounded border-border"
                />
                <div>
                  <p className="font-medium text-ink">Weekly Digest</p>
                  <p className="text-sm text-ink/60">Receive a weekly summary of community activity</p>
                </div>
              </label>

              <label className="flex items-center gap-4 cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.email_policy_updates}
                  onChange={(e) =>
                    setPreferences({ ...preferences, email_policy_updates: e.target.checked })
                  }
                  className="w-4 h-4 rounded border-border"
                />
                <div>
                  <p className="font-medium text-ink">Policy Updates</p>
                  <p className="text-sm text-ink/60">Get notified about new policies in your interests</p>
                </div>
              </label>

              <label className="flex items-center gap-4 cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.marketing_emails}
                  onChange={(e) =>
                    setPreferences({ ...preferences, marketing_emails: e.target.checked })
                  }
                  className="w-4 h-4 rounded border-border"
                />
                <div>
                  <p className="font-medium text-ink">Marketing Emails</p>
                  <p className="text-sm text-ink/60">Receive news and updates from {config.email.appName}</p>
                </div>
              </label>
            </div>
          </section>

          {/* Save Button */}
          <div className="flex gap-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-3 rounded-lg bg-ocean text-paper font-medium hover:bg-ocean-deep disabled:opacity-50 transition"
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
