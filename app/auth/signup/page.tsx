'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, User, ArrowRight, AlertCircle } from 'lucide-react';

export default function SignupPage() {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!displayName.trim()) throw new Error('Display name is required');
      if (!email.trim()) throw new Error('Email is required');

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new Error('Please enter a valid email address');
      }

      console.log('📝 [SIGNUP] Submitting signup form with email and display name...');

      const signupRes = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          displayName,
        }),
      });

      const signupData = await signupRes.json();

      console.log('📨 [SIGNUP] Response:', { status: signupRes.status, data: signupData });

      if (!signupRes.ok) {
        const errorMessage = signupData?.error || 'Signup failed. Please try again.';
        throw new Error(errorMessage);
      }

      if (!signupData.success) {
        throw new Error(signupData?.error || 'Signup failed');
      }

      console.log('✅ [SIGNUP] Signup successful, verification email sent');

      setSubmitted(true);
      setDisplayName('');
      setEmail('');

      setTimeout(() => {
        router.push(`/auth/verify-pending?email=${encodeURIComponent(email)}`);
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-paper">
        <div className="max-w-md w-full mx-auto px-6 py-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-ocean/10 flex items-center justify-center mx-auto">
            <Mail className="w-8 h-8 text-ocean" />
          </div>
          <h2 className="text-2xl font-bold text-ink">Check your email</h2>
          <p className="text-ink/60">We've sent a verification link to:</p>
          <p className="font-mono text-sm text-ink/80 bg-sand/20 p-3 rounded-lg">{email}</p>
          <p className="text-sm text-ink/50">Click the link in your email to verify your account and set your password.</p>
          <p className="text-xs text-ink/40">The link will expire in 24 hours</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-paper">
      <div className="max-w-md w-full mx-auto px-6 py-12 space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-ink">Create Account</h1>
          <p className="text-ink/60">Join the community and discuss plastic policies</p>
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
          {error && (
            <div className="p-4 rounded-lg bg-coral/10 border border-coral/20 text-coral text-sm flex gap-3">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-ink mb-2">Display Name</label>
            <div className="relative">
              <User className="absolute left-4 top-3 w-5 h-5 text-ink/40" />
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name"
                className="w-full pl-12 pr-4 py-3 rounded-lg border border-ink/20 bg-white focus:border-ocean focus:outline-none focus:ring-2 focus:ring-ocean/20 transition"
                required
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-2">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-3 w-5 h-5 text-ink/40" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full pl-12 pr-4 py-3 rounded-lg border border-ink/20 bg-white focus:border-ocean focus:outline-none focus:ring-2 focus:ring-ocean/20 transition"
                required
                disabled={loading}
              />
            </div>
            <p className="text-xs text-ink/50 mt-1">We'll send a verification link to this email</p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-lg bg-ocean text-paper font-medium hover:bg-ocean-deep disabled:opacity-50 transition flex items-center justify-center gap-2"
          >
            {loading ? 'Creating account...' : 'Create Account'}
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

        <div className="text-center">
          <p className="text-ink/60">Already have an account? <Link href="/auth/login" className="text-ocean hover:text-ocean-deep font-medium">Sign in</Link></p>
        </div>
      </div>
    </div>
  );
}
