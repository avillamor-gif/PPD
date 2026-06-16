// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [loginLoading, setLoginLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  // Check if user is already logged in
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          router.push('/admin');
        }
      } catch (err) {
        console.error('Auth check error:', err);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoginLoading(true);

    try {
      if (!email.trim()) {
        throw new Error('Email is required');
      }
      if (!password.trim()) {
        throw new Error('Password is required');
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new Error('Please enter a valid email address');
      }

      // ADMIN TEST ACCOUNT: Temporary bypass for testing
      // TODO: Replace with proper Supabase auth once email/password recovery is working
      if (email === 'akawar@gmail.com' && password === '2ngbatang2ng!@#') {
        setSubmitted(true);
        setEmail('');
        setPassword('');
        setTimeout(() => {
          router.push('/admin');
        }, 1000);
        return;
      }

      // Sign in with Supabase
      const { data: { user }, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        throw new Error(
          signInError.message === 'Invalid login credentials'
            ? 'Invalid email or password'
            : signInError.message
        );
      }

      if (!user) {
        throw new Error('Login failed - no user returned');
      }

      // TODO: Re-enable email verification check once email service is configured
      // For now, allow login regardless of email verification status
      
      setSubmitted(true);
      setEmail('');
      setPassword('');

      // Redirect to admin after 1 second
      setTimeout(() => {
        router.push('/admin');
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during login');
    } finally {
      setLoginLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-paper flex items-center justify-center px-6 py-12">
      {loading ? (
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-ocean/20 border-t-ocean rounded-full animate-spin"></div>
          <p className="mt-4 text-ink/60">Loading...</p>
        </div>
      ) : (
        <div className="w-full max-w-md space-y-8">
          {/* Header */}
          <div className="text-center space-y-3">
            <Link href="/" className="inline-block mb-4">
              <div className="font-display font-bold text-3xl text-coral">Plastic Policy Database</div>
            </Link>
            <h1 className="font-display text-3xl font-bold text-ink">Welcome Back</h1>
            <p className="text-ink/60">Sign in to your account</p>
          </div>

          {/* Form Container */}
          <div className="rounded-2xl border border-ink/10 bg-card p-8 space-y-6">
            {/* Success Message */}
            {submitted && (
              <div className="rounded-lg border border-ocean/30 bg-ocean/5 p-4">
                <p className="font-medium text-ocean text-sm">✓ Login successful! Redirecting...</p>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="rounded-lg border border-coral/30 bg-coral/5 p-4">
                <p className="font-medium text-coral text-sm">✗ {error}</p>
              </div>
            )}

            {/* Email Login Form */}
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-ink mb-2">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  disabled={loginLoading}
                  className="w-full rounded-lg border border-ink/20 bg-paper px-4 py-2 text-ink placeholder:text-ink/40 focus:border-ocean focus:outline-none focus:ring-2 focus:ring-ocean/20 transition disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-ink mb-2">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  disabled={loginLoading}
                  className="w-full rounded-lg border border-ink/20 bg-paper px-4 py-2 text-ink placeholder:text-ink/40 focus:border-ocean focus:outline-none focus:ring-2 focus:ring-ocean/20 transition disabled:opacity-50"
                />
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 rounded accent-ocean" disabled={loginLoading} />
                  <span className="text-ink/60">Remember me</span>
                </label>
                <Link href="/auth/reset-password" className="text-ocean hover:text-ocean-deep transition">
                  Forgot password?
                </Link>
              </div>

              <button
                type="submit"
                disabled={loginLoading}
                className="w-full rounded-lg bg-ink px-4 py-3 font-mono text-sm uppercase tracking-[0.18em] text-paper transition hover:bg-ocean-deep disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loginLoading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-rule"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-3 bg-card text-ink/50">Don't have an account?</span>
              </div>
            </div>

            {/* Sign Up Link */}
            <Link
              href="/auth/signup"
              className="w-full flex items-center justify-center rounded-lg border-2 border-ocean px-4 py-3 font-medium text-ocean transition hover:bg-ocean/5"
            >
              Create Account
            </Link>
          </div>

          {/* Footer Link */}
          <div className="text-center">
            <Link href="/" className="text-sm text-ink/50 hover:text-ink transition">
              ← Back to Database
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
