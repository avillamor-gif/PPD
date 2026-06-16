// @ts-nocheck
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function ResetPasswordPage() {
  const [step, setStep] = useState<'email' | 'password'>('email');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!email.trim()) throw new Error('Email is required');

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new Error('Please enter a valid email address');
      }

      // Send password reset email via Supabase
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password?type=recovery`,
      });

      if (resetError) throw resetError;

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setStep('password');
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!newPassword.trim()) throw new Error('New password is required');
      if (newPassword.length < 8) throw new Error('Password must be at least 8 characters');
      if (newPassword !== confirmPassword) throw new Error('Passwords do not match');

      // Update password after reset
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) throw updateError;

      setSuccess(true);
      setTimeout(() => {
        window.location.href = '/auth/login?reset=success';
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-paper flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <h1 className="font-display text-3xl font-bold text-ink">Reset Password</h1>
          <p className="text-ink/60">
            {step === 'email' && 'Enter your email to receive a reset link'}
            {step === 'password' && 'Create a new password'}
          </p>
        </div>

        {/* Form Container */}
        <div className="rounded-2xl border border-ink/10 bg-card p-8 space-y-6">
          {/* Progress Steps */}
          <div className="flex items-center gap-2 mb-6">
            <div
              className={`h-2 flex-1 rounded-full transition ${
                ['email', 'password'].indexOf(step) >= 0 ? 'bg-ocean' : 'bg-ink/10'
              }`}
            />
            <div
              className={`h-2 flex-1 rounded-full transition ${
                step === 'password' ? 'bg-ocean' : 'bg-ink/10'
              }`}
            />
          </div>

          {/* Success Message */}
          {success && (
            <div className="rounded-lg border border-ocean/30 bg-ocean/5 p-4">
              <p className="font-medium text-ocean text-sm">
                {step === 'email' ? '✓ Check your email for reset instructions...' : '✓ Password reset! Redirecting to login...'}
              </p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="rounded-lg border border-coral/30 bg-coral/5 p-4">
              <p className="font-medium text-coral text-sm">✗ {error}</p>
            </div>
          )}

          {/* Email Step */}
          {step === 'email' && (
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-ink mb-2">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  disabled={loading}
                  className="w-full rounded-lg border border-ink/20 bg-paper px-4 py-2 text-ink placeholder:text-ink/40 focus:border-ocean focus:outline-none focus:ring-2 focus:ring-ocean/20 transition disabled:opacity-50"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-ink px-4 py-3 font-mono text-sm uppercase tracking-[0.18em] text-paper transition hover:bg-ocean-deep disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
              <p className="text-xs text-ink/50 text-center">
                We'll send a password reset link to your email. Check your spam folder if you don't see it.
              </p>
            </form>
          )}

          {/* Password Step */}
          {step === 'password' && (
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-ink mb-2">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  disabled={loading}
                  className="w-full rounded-lg border border-ink/20 bg-paper px-4 py-2 text-ink placeholder:text-ink/40 focus:border-ocean focus:outline-none focus:ring-2 focus:ring-ocean/20 transition disabled:opacity-50"
                />
                <p className="mt-1 text-xs text-ink/50">At least 8 characters</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-ink mb-2">Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  disabled={loading}
                  className="w-full rounded-lg border border-ink/20 bg-paper px-4 py-2 text-ink placeholder:text-ink/40 focus:border-ocean focus:outline-none focus:ring-2 focus:ring-ocean/20 transition disabled:opacity-50"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-ink px-4 py-3 font-mono text-sm uppercase tracking-[0.18em] text-paper transition hover:bg-ocean-deep disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="text-center space-y-3">
          {step !== 'email' && (
            <button
              onClick={() => {
                setStep('email');
                setError(null);
                setSuccess(false);
              }}
              className="text-sm text-ink/50 hover:text-ink transition flex items-center justify-center gap-1 mx-auto"
            >
              <ChevronLeft className="w-4 h-4" />
              Go Back
            </button>
          )}
          <Link href="/auth/login" className="block text-sm text-ink/50 hover:text-ink transition">
            ← Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
