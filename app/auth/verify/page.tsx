'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Check, AlertCircle, Loader2 } from 'lucide-react';

function VerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying your email...');

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setStatus('error');
        setMessage('No verification token provided');
        return;
      }

      try {
        const response = await fetch('/api/auth/verify-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });

        const data = await response.json();

        if (!response.ok) {
          setStatus('error');
          setMessage(data.error || 'Verification failed');
          return;
        }

        setStatus('success');
        setMessage('Email verified successfully!');

        // Redirect to login immediately
        router.push('/auth/login');
      } catch (error) {
        setStatus('error');
        setMessage(error instanceof Error ? error.message : 'An error occurred');
      }
    };

    verifyEmail();
  }, [token, router]);

  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-paper">
      <div className="max-w-md w-full mx-auto px-6 py-12 text-center space-y-6">
        {status === 'loading' && (
          <>
            <div className="w-16 h-16 rounded-full bg-ocean/10 flex items-center justify-center mx-auto">
              <Loader2 className="w-8 h-8 text-ocean animate-spin" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-ink">Verifying Email</h2>
              <p className="text-ink/60 mt-2">{message}</p>
            </div>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 rounded-full bg-ocean/10 flex items-center justify-center mx-auto">
              <Check className="w-8 h-8 text-ocean" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-ink">Email Verified!</h2>
              <p className="text-ink/60 mt-2">{message}</p>
              <p className="text-sm text-ink/50 mt-2">Redirecting to login...</p>
            </div>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-16 h-16 rounded-full bg-coral/10 flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8 text-coral" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-ink">Verification Failed</h2>
              <p className="text-coral mt-2">{message}</p>
            </div>
            <div className="pt-4 space-y-2">
              <Link
                href="/auth/signup"
                className="block px-4 py-2 rounded-lg bg-ocean text-white font-medium hover:bg-ocean/90 transition"
              >
                Try Signing Up Again
              </Link>
              <Link
                href="/auth/login"
                className="block px-4 py-2 rounded-lg border border-ink/20 text-ink hover:bg-ink/5 transition"
              >
                Go to Login
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full min-h-screen flex items-center justify-center bg-paper">
          <div className="max-w-md w-full mx-auto px-6 py-12 text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-ocean/10 flex items-center justify-center mx-auto">
              <Loader2 className="w-8 h-8 text-ocean animate-spin" />
            </div>
            <p className="text-ink/60">Loading...</p>
          </div>
        </div>
      }
    >
      <VerifyContent />
    </Suspense>
  );
}
