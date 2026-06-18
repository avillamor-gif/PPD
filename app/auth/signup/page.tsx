'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import config from '@/lib/config';
import PasswordInput from '@/app/components/PasswordInput';
import { Mail, Lock, User, ArrowRight } from 'lucide-react';

export default function SignupPage() {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
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
      if (!password.trim()) throw new Error('Password is required');
      if (password.length < config.auth.passwordMinLength) throw new Error(`Password must be at least ${config.auth.passwordMinLength} characters`);
      if (password !== confirmPassword) throw new Error('Passwords do not match');

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new Error('Please enter a valid email address');
      }

      console.log('📝 Submitting signup form...');

      // Sign up with Supabase Auth using server-side API
      const signupRes = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          displayName,
        }),
      });

      let signupData;
      try {
        signupData = await signupRes.json();
      } catch (parseError) {
        console.error('❌ Failed to parse response:', parseError);
        throw new Error('Server error - invalid response. Please try again.');
      }

      console.log('📨 Signup response:', { status: signupRes.status, data: signupData });
      console.log('📨 signupData keys:', Object.keys(signupData));
      console.log('📨 signupData.error:', signupData.error);
      console.log('📨 signupData.error type:', typeof signupData.error);

      if (!signupRes.ok) {
        let errorMessage = 'An error occurred. Please try again.';
        
        console.log('Response not OK, extracting error...');
        
        if (signupData?.error) {
          if (typeof signupData.error === 'object') {
            errorMessage = JSON.stringify(signupData.error);
            console.error('Error is object:', signupData.error);
          } else if (typeof signupData.error === 'string' && signupData.error.length > 0) {
            errorMessage = signupData.error;
            console.error('Error is string:', signupData.error);
          } else {
            errorMessage = `Error: ${signupRes.status}`;
            console.error('Error property exists but is empty or unusual');
          }
        } else if (signupData?.message) {
          errorMessage = signupData.message;
        } else if (signupData?.details) {
          errorMessage = signupData.details;
        }
        
        console.error('❌ Final error message:', errorMessage);
        throw new Error(errorMessage);
      }

      if (!signupData.success) {
        const errorMessage = signupData?.error || 'Signup failed - please check your email is not already registered.';
        console.error('❌ Signup not successful:', errorMessage);
        throw new Error(errorMessage);
      }

      console.log('✅ Signup successful:', signupData);

      setSubmitted(true);
      setDisplayName('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');

      // Redirect to verification page
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
          <p className="text-ink/60">We've sent a verification link to {email}</p>
          <p className="text-sm text-ink/50">Click the link in your inbox to verify your account and get started.</p>
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
            <div className="p-4 rounded-lg bg-coral/10 border border-coral/20 text-coral text-sm">
              {error}
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
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-2">Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-3 w-5 h-5 text-ink/40" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
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
            <label className="block text-sm font-medium text-ink mb-2">Confirm Password</label>
            <PasswordInput
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-lg bg-ocean text-white font-semibold hover:bg-ocean/90 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
          >
            {loading ? 'Creating account...' : (
              <>
                Create Account
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="text-center text-sm">
          <span className="text-ink/60">Already have an account? </span>
          <Link href="/auth/login" className="text-coral hover:underline font-medium">
            Log in
          </Link>
        </div>
      </div>
    </div>
  );
}
