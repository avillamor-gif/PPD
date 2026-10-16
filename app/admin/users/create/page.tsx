'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import config from '@/lib/config';
import PasswordInput from '@/app/components/PasswordInput';
import { Mail, Lock, User, Shield, ArrowRight, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function CreateUserPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState('expert');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validate inputs
      if (!email.trim() || !password.trim() || !displayName.trim()) {
        throw new Error('All fields are required');
      }

      if (password.length < config.auth.passwordMinLength) {
        throw new Error(`Password must be at least ${config.auth.passwordMinLength} characters`);
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new Error('Invalid email address');
      }

      // Create user via API
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify({
          email,
          password,
          displayName,
          role,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create user');
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/admin/users');
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-md mx-auto mt-16 text-center space-y-4 p-6 rounded-lg border border-ocean/30 bg-ocean/5">
        <div className="w-16 h-16 rounded-full bg-ocean/10 flex items-center justify-center mx-auto">
          <Shield className="w-8 h-8 text-ocean" />
        </div>
        <h2 className="text-2xl font-bold text-ink">User Created</h2>
        <p className="text-ink/60">Redirecting to user management...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <Link href="/admin/users" className="text-ocean hover:text-ocean-deep mb-4 inline-flex items-center gap-1">
          ← Back to Users
        </Link>
        <h1 className="text-4xl font-bold text-ink">Create User</h1>
        <p className="mt-2 text-ink/60">Add a new user to the system</p>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form - Left Side (2 columns) */}
        <div className="lg:col-span-2">
          <form onSubmit={handleCreateUser} className="space-y-6 p-8 rounded-lg border border-ink/10 bg-card">
            {error && (
              <div className="p-4 rounded-lg bg-coral/10 border border-coral/20 text-coral text-sm flex gap-3">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-ink mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-3 w-5 h-5 text-ink/40" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="w-full pl-12 pr-4 py-3 rounded-lg border border-ink/20 bg-white focus:border-ocean focus:outline-none focus:ring-2 focus:ring-ocean/20 transition"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-ink mb-2">Display Name</label>
              <div className="relative">
                <User className="absolute left-4 top-3 w-5 h-5 text-ink/40" />
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full pl-12 pr-4 py-3 rounded-lg border border-ink/20 bg-white focus:border-ocean focus:outline-none focus:ring-2 focus:ring-ocean/20 transition"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-ink mb-2">Password</label>
              <PasswordInput
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
              <p className="text-xs text-ink/50 mt-1">Minimum {config.auth.passwordMinLength} characters</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-ink mb-2">Role</label>
              <div className="relative">
                <Shield className="absolute left-4 top-3 w-5 h-5 text-ink/40" />
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-lg border border-ink/20 bg-white focus:border-ocean focus:outline-none focus:ring-2 focus:ring-ocean/20 transition appearance-none cursor-pointer"
                >
                  <option value="expert">Expert (Contributor)</option>
                  <option value="moderator">Moderator</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg bg-ink text-paper font-medium hover:bg-ink/90 disabled:opacity-50 transition flex items-center justify-center gap-2"
            >
              {loading ? 'Creating...' : (
                <>
                  Create User <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Roles Reference - Right Side (1 column) */}
        <div className="lg:col-span-1">
          <div className="sticky top-8 p-6 rounded-lg border border-ink/10 bg-card space-y-4">
            <h3 className="text-lg font-bold text-ink">Role Permissions</h3>
            
            {/* Admin */}
            <div className="space-y-2 pb-3 border-b border-ink/10">
              <div className="font-semibold text-ink text-sm flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-coral"></span>
                Admin (Level 5)
              </div>
              <ul className="text-xs text-ink/60 space-y-1 ml-4">
                <li>✓ Manage users & roles</li>
                <li>✓ Create/edit/delete policies</li>
                <li>✓ Moderate all content</li>
                <li>✓ View analytics & logs</li>
              </ul>
            </div>

            {/* Moderator */}
            <div className="space-y-2 pb-3 border-b border-ink/10">
              <div className="font-semibold text-ink text-sm flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-ocean"></span>
                Moderator (Level 4)
              </div>
              <ul className="text-xs text-ink/60 space-y-1 ml-4">
                <li>✓ Manage policies & publish</li>
                <li>✓ Moderate forum threads</li>
                <li>✓ Manage comments & threads</li>
                <li>✓ View & handle reports</li>
              </ul>
            </div>

            {/* Expert */}
            <div className="space-y-2 pb-3 border-b border-ink/10">
              <div className="font-semibold text-ink text-sm flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-sand"></span>
                Expert (Level 3) • Default
              </div>
              <ul className="text-xs text-ink/60 space-y-1 ml-4">
                <li>✓ Create & submit policies</li>
                <li>✓ Edit own policies</li>
                <li>✓ Participate in forums</li>
                <li>✓ View database</li>
              </ul>
            </div>

            {/* Guest */}
            <div className="space-y-2">
              <div className="font-semibold text-ink text-sm flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-ink/30"></span>
                Guest (Level 1)
              </div>
              <ul className="text-xs text-ink/60 space-y-1 ml-4">
                <li>✓ View database</li>
                <li>✓ View policies</li>
                <li>✓ Search policies</li>
                <li>✗ No account required</li>
              </ul>
            </div>

            {/* Legend */}
            <div className="mt-4 pt-4 border-t border-ink/10 space-y-2">
              <p className="text-xs text-ink/50 font-semibold">Quick Info:</p>
              <div className="text-xs text-ink/60 space-y-1">
                <p>• Default: Users sign up as <span className="font-semibold text-ocean">Expert</span></p>
                <p>• Hierarchy: Level 5 includes all permissions from levels below</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
