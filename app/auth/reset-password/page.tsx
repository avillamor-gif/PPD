'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

export default function ResetPasswordPage() {
  const [step, setStep] = useState<'email' | 'code' | 'password'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
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

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setStep('code');
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!code.trim()) throw new Error('Verification code is required');
      if (code.length !== 6) throw new Error('Code must be 6 digits');

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

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

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

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
            {step === 'email' && 'Enter your email to receive a verification code'}
            {step === 'code' && 'Enter the 6-digit code sent to your email'}
            {step === 'password' && 'Create a new password'}
          </p>
        </div>

        {/* Form Container */}
        <div className="rounded-2xl border border-ink/10 bg-card p-8 space-y-6">
          {/* Progress Steps */}
          <div className="flex items-center gap-2 mb-6">
            <div
              className={`h-2 flex-1 rounded-full transition ${
                ['email', 'code', 'password'].indexOf(step) >= 0 ? 'bg-ocean' : 'bg-ink/10'
              }`}
            />
            <div
              className={`h-2 flex-1 rounded-full transition ${
                ['code', 'password'].indexOf(step) >= 0 ? 'bg-ocean' : 'bg-ink/10'
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
              <p className="font-medium text-ocean text-sm">✓ Verified! Moving to next step...</p>
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
                  className="w-full rounded-lg border border-ink/20 bg-paper px-4 py-2 text-ink placeholder:text-ink/40 focus:border-ocean focus:outline-none focus:ring-2 focus:ring-ocean/20 transition"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-ink px-4 py-3 font-mono text-sm uppercase tracking-[0.18em] text-paper transition hover:bg-ocean-deep disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Sending...' : 'Send Verification Code'}
              </button>
            </form>
          )}

          {/* Code Step */}
          {step === 'code' && (
            <form onSubmit={handleCodeSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-ink mb-2">Verification Code</label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  maxLength={6}
                  className="w-full rounded-lg border border-ink/20 bg-paper px-4 py-2 text-ink placeholder:text-ink/40 focus:border-ocean focus:outline-none focus:ring-2 focus:ring-ocean/20 transition font-mono text-center text-lg tracking-widest"
                />
                <p className="mt-2 text-xs text-ink/50">Enter the 6-digit code from your email</p>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-ink px-4 py-3 font-mono text-sm uppercase tracking-[0.18em] text-paper transition hover:bg-ocean-deep disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Verifying...' : 'Verify Code'}
              </button>
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
                  placeholder="Confirm new password"
                  className="w-full rounded-lg border border-ink/20 bg-paper px-4 py-2 text-ink placeholder:text-ink/40 focus:border-ocean focus:outline-none focus:ring-2 focus:ring-ocean/20 transition"
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
                if (step === 'code') setStep('email');
                if (step === 'password') setStep('code');
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
