'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function SignupPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!fullName.trim()) throw new Error('Full name is required');
      if (!email.trim()) throw new Error('Email is required');
      if (!password.trim()) throw new Error('Password is required');
      if (password.length < 8) throw new Error('Password must be at least 8 characters');
      if (password !== confirmPassword) throw new Error('Passwords do not match');

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new Error('Please enter a valid email address');
      }

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setSubmitted(true);
      setFullName('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');

      // Redirect after 2 seconds
      setTimeout(() => {
        window.location.href = '/auth/login?signup=success';
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = () => {
    console.log('Google signup initiated');
    // TODO: Implement Google OAuth with next-auth or similar
  };

  return (
    <div className="min-h-screen bg-paper flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <Link href="/" className="inline-block mb-4">
            <div className="font-display font-bold text-3xl text-coral">Plastic Policy Database</div>
          </Link>
          <h1 className="font-display text-3xl font-bold text-ink">Create Account</h1>
          <p className="text-ink/60">Join to contribute policies and access the admin panel</p>
        </div>

        {/* Form Container */}
        <div className="rounded-2xl border border-ink/10 bg-card p-8 space-y-6">
          {/* Success Message */}
          {submitted && (
            <div className="rounded-lg border border-ocean/30 bg-ocean/5 p-4">
              <p className="font-medium text-ocean text-sm">✓ Account created! Redirecting to login...</p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="rounded-lg border border-coral/30 bg-coral/5 p-4">
              <p className="font-medium text-coral text-sm">✗ {error}</p>
            </div>
          )}

          {/* Google Signup Button */}
          <button
            onClick={handleGoogleSignup}
            className="w-full flex items-center justify-center gap-3 rounded-lg border-2 border-ink/20 px-4 py-3 font-medium text-ink transition hover:border-ocean hover:bg-ocean/5"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Sign up with Google
          </button>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-rule"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-3 bg-card text-ink/50">Or sign up with email</span>
            </div>
          </div>

          {/* Signup Form */}
          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-ink mb-2">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="John Doe"
                className="w-full rounded-lg border border-ink/20 bg-paper px-4 py-2 text-ink placeholder:text-ink/40 focus:border-ocean focus:outline-none focus:ring-2 focus:ring-ocean/20 transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-ink mb-2">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-lg border border-ink/20 bg-paper px-4 py-2 text-ink placeholder:text-ink/40 focus:border-ocean focus:outline-none focus:ring-2 focus:ring-ocean/20 transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-ink mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a password"
                className="w-full rounded-lg border border-ink/20 bg-paper px-4 py-2 text-ink placeholder:text-ink/40 focus:border-ocean focus:outline-none focus:ring-2 focus:ring-ocean/20 transition"
              />
              <p className="mt-1 text-xs text-ink/50">At least 8 characters</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-ink mb-2">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                className="w-full rounded-lg border border-ink/20 bg-paper px-4 py-2 text-ink placeholder:text-ink/40 focus:border-ocean focus:outline-none focus:ring-2 focus:ring-ocean/20 transition"
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" required className="w-4 h-4 rounded accent-ocean" />
              <span className="text-sm text-ink/60">
                I agree to the{' '}
                <Link href="#" className="text-ocean hover:text-ocean-deep transition">
                  Terms of Service
                </Link>
              </span>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-ink px-4 py-3 font-mono text-sm uppercase tracking-[0.18em] text-paper transition hover:bg-ocean-deep disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          {/* Login Link */}
          <p className="text-center text-sm text-ink/60">
            Already have an account?{' '}
            <Link href="/auth/login" className="font-medium text-ocean hover:text-ocean-deep transition">
              Sign in
            </Link>
          </p>
        </div>

        {/* Footer Link */}
        <div className="text-center">
          <Link href="/" className="text-sm text-ink/50 hover:text-ink transition">
            ← Back to Database
          </Link>
        </div>
      </div>
    </div>
  );
}
