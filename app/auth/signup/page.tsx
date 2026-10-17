'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertCircle, Loader2, Check } from 'lucide-react';
import PasswordInput from '@/app/components/PasswordInput';
import { showSuccess, showError } from '@/lib/notifications';

export default function SignupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [email, setEmail] = useState('');
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!formData.displayName.trim()) {
      setError('Display name is required');
      setLoading(false);
      return;
    }

    if (!formData.email.trim()) {
      setError('Email is required');
      setLoading(false);
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Please enter a valid email address');
      setLoading(false);
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: formData.displayName,
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Log full error to console for debugging
        console.error('Signup error response:', {
          status: response.status,
          error: data.error,
          debug: data.debug,
        });
        
        // Show detailed error message
        let errorMsg = data.error || 'Signup failed';
        if (data.debug?.message) {
          errorMsg += ` (${data.debug.code}: ${data.debug.message})`;
        }
        if (data.debug?.hint) {
          errorMsg += ` - ${data.debug.hint}`;
        }
        
        setError(errorMsg);
        showError('Signup Failed', errorMsg);
        setLoading(false);
        return;
      }

      setSuccess(true);
      setEmail(formData.email);
      setFormData({
        displayName: '',
        email: '',
        password: '',
        confirmPassword: '',
      });
      
      showSuccess('✓ Account Created!', 'Your account has been created successfully. Redirecting to login...');

      // Redirect to login after success
      setTimeout(() => {
        router.push('/auth/login');
      }, 2000);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMsg);
      showError('Signup Error', errorMsg);
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-paper">
        <div className="max-w-md w-full mx-auto px-6 py-12 text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-ocean/10 flex items-center justify-center mx-auto">
            <Check className="w-8 h-8 text-ocean" />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-ink">Account Created!</h1>
            <p className="text-ink/60">Welcome! You can now log in with your email and password.</p>
          </div>

          <div className="bg-ocean/10 p-4 rounded-lg border border-ocean/20">
            <p className="text-sm text-ink/70">Redirecting to login page...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-paper">
      <div className="max-w-md w-full mx-auto px-6 py-12">
        <div className="space-y-8">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-ink">Create Account</h1>
            <p className="text-ink/60">Join us to get started</p>
          </div>

          {error && (
            <div className="flex gap-3 p-4 rounded-lg bg-coral/10 border border-coral/20">
              <AlertCircle className="w-5 h-5 text-coral flex-shrink-0 mt-0.5" />
              <p className="text-sm text-coral">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-ink mb-2">
                Display Name
              </label>
              <input
                type="text"
                name="displayName"
                value={formData.displayName}
                onChange={handleChange}
                placeholder="Enter your name"
                disabled={loading}
                className="w-full px-4 py-2 rounded-lg border border-sand text-ink placeholder:text-ink/40 bg-paper focus:outline-none focus:border-ocean disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-ink mb-2">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="your@email.com"
                disabled={loading}
                className="w-full px-4 py-2 rounded-lg border border-sand text-ink placeholder:text-ink/40 bg-paper focus:outline-none focus:border-ocean disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-ink mb-2">
                Password
              </label>
              <PasswordInput
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="At least 8 characters"
                disabled={loading}
                autoComplete="new-password"
                withIcon={false}
                className="py-2 border-sand bg-paper focus:border-ocean focus:ring-0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-ink mb-2">
                Confirm Password
              </label>
              <PasswordInput
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Re-enter password"
                disabled={loading}
                autoComplete="new-password"
                withIcon={false}
                className="py-2 border-sand bg-paper focus:border-ocean focus:ring-0"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-lg bg-ocean text-paper font-mono text-sm uppercase tracking-[0.18em] hover:bg-ocean-deep transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating Account...
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-sand"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-paper text-ink/60">or</span>
            </div>
          </div>

          <div className="text-center space-y-3">
            <p className="text-ink/60 text-sm">
              Already have an account?{' '}
              <Link href="/auth/login" className="text-ocean font-medium hover:text-ocean-deep transition">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
