'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import config from '@/lib/config';
import PasswordInput from '@/app/components/PasswordInput';
import { Lock, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';

function SetPasswordContent() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [validating, setValidating] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  useEffect(() => {
    // If user is logged in, log them out first before validating token
    const init = async () => {
      try {
        // Check if user is logged in
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          console.log('🔐 [SET-PASSWORD] User already logged in, logging out...');
          await supabase.auth.signOut();
          console.log('🔐 [SET-PASSWORD] User logged out');
        }
        validateToken();
      } catch (err) {
        console.error('🔐 [SET-PASSWORD] Init error:', err);
        validateToken();
      }
    };
    init();
  }, [token]);

  const validateToken = async () => {
    if (!token) {
      setError('Invalid verification link. Please signup again.');
      setValidating(false);
      return;
    }
    
    console.log('🔐 [SET-PASSWORD] Validating token...');
    try {
      const response = await fetch('/api/auth/validate-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (!response.ok || !data.valid) {
        setError(data.error || 'Invalid or expired verification link. Please signup again.');
      }
    } catch (err) {
      setError('Failed to validate link. Please try again.');
      console.error('Token validation error:', err);
    } finally {
      setValidating(false);
    }
  };

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!password) throw new Error('Password is required');
      if (password.length < config.auth.passwordMinLength) {
        throw new Error(`Password must be at least ${config.auth.passwordMinLength} characters`);
      }
      if (password !== confirmPassword) {
        throw new Error('Passwords do not match');
      }

      console.log('🔐 [SET-PASSWORD] Setting password...');

      const response = await fetch('/api/auth/set-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to set password');
      }

      console.log('✅ [SET-PASSWORD] Password set successfully, logging in...');
      setSuccess(true);

      // Auto-login with the session data if available
      if (data.session) {
        // Session was set by the API
        setTimeout(() => {
          router.push('/');
        }, 2000);
      } else {
        // Redirect to login
        setTimeout(() => {
          router.push('/auth/login');
        }, 2000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (validating) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-paper">
        <div className="max-w-md w-full mx-auto px-6 py-12 text-center">
          <p className="text-ink/60">Validating your link...</p>
        </div>
      </div>
    );
  }

  if (error && !success) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-paper">
        <div className="max-w-md w-full mx-auto px-6 py-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-coral/10 flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8 text-coral" />
          </div>
          <h2 className="text-2xl font-bold text-ink">Verification Link Invalid</h2>
          <p className="text-ink/60">{error}</p>
          <button
            onClick={() => router.push('/auth/signup')}
            className="w-full py-3 px-4 rounded-lg bg-ocean text-paper font-medium hover:bg-ocean-deep transition"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-paper">
        <div className="max-w-md w-full mx-auto px-6 py-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-ink">Password Set Successfully</h2>
          <p className="text-ink/60">Your account is now active. You're being logged in...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-paper">
      <div className="max-w-md w-full mx-auto px-6 py-12 space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-ink">Set Your Password</h1>
          <p className="text-ink/60">Create a secure password for your account</p>
        </div>

        <form onSubmit={handleSetPassword} className="space-y-4">
          {error && (
            <div className="p-4 rounded-lg bg-coral/10 border border-coral/20 text-coral text-sm flex gap-3">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-ink mb-2">Password</label>
            <PasswordInput
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              disabled={loading}
            />
            <div className="mt-2 space-y-1">
              <p className="text-xs text-ink/50">Password requirements:</p>
              <ul className="text-xs text-ink/50 space-y-1">
                <li className={password.length >= config.auth.passwordMinLength ? 'text-green-600' : ''}>
                  ✓ At least {config.auth.passwordMinLength} characters
                </li>
              </ul>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-ink mb-2">Confirm Password</label>
            <PasswordInput
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
              disabled={loading}
            />
            {confirmPassword && password !== confirmPassword && (
              <p className="text-xs text-coral mt-1">Passwords do not match</p>
            )}
            {confirmPassword && password === confirmPassword && (
              <p className="text-xs text-green-600 mt-1">Passwords match</p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={
              loading ||
              !password ||
              !confirmPassword ||
              password !== confirmPassword ||
              password.length < config.auth.passwordMinLength
            }
            className="w-full py-3 px-4 rounded-lg bg-ocean text-paper font-medium hover:bg-ocean-deep disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
          >
            {loading ? 'Setting password...' : 'Set Password & Login'}
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function SetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="w-full min-h-screen flex items-center justify-center bg-paper">
        <div className="max-w-md w-full mx-auto px-6 py-12 text-center">
          <p className="text-ink/60">Loading...</p>
        </div>
      </div>
    }>
      <SetPasswordContent />
    </Suspense>
  );
}
