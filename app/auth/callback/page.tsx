'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Loader } from 'lucide-react';
import { Suspense } from 'react';

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the code from URL params (Supabase Auth flow)
        const code = searchParams.get('code');
        const error = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');

        if (error) {
          throw new Error(errorDescription || error);
        }

        if (code) {
          // Exchange code for session
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

          if (exchangeError) {
            throw exchangeError;
          }

          // Get the current user
          const { data: { user }, error: userError } = await supabase.auth.getUser();

          if (userError || !user) {
            throw new Error('Failed to get user info');
          }

          // Check if this was a password recovery flow
          if (searchParams.get('type') === 'recovery') {
            router.push('/auth/reset-password?verified=true');
          } else {
            // Default to admin dashboard
            router.push('/admin');
          }
        } else {
          throw new Error('No authorization code received');
        }
      } catch (err) {
        console.error('Auth callback error:', err);
        setError(err instanceof Error ? err.message : 'Authentication failed');
        setLoading(false);
      }
    };

    handleCallback();
  }, [router, searchParams]);

  if (error) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-paper">
        <div className="max-w-md w-full mx-auto px-6 py-12 text-center space-y-4">
          <h2 className="text-2xl font-bold text-ink">Authentication Error</h2>
          <p className="text-coral font-medium">{error}</p>
          <a
            href="/auth/login"
            className="inline-block px-6 py-3 rounded-lg bg-ocean text-white font-semibold hover:bg-ocean/90 transition"
          >
            Back to Login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-paper">
      <div className="text-center space-y-4">
        <Loader className="w-8 h-8 text-ocean animate-spin mx-auto" />
        <p className="text-ink/60">Verifying your authentication...</p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full min-h-screen flex items-center justify-center bg-paper">
          <div className="text-center space-y-4">
            <Loader className="w-8 h-8 text-ocean animate-spin mx-auto" />
            <p className="text-ink/60">Loading...</p>
          </div>
        </div>
      }
    >
      <CallbackContent />
    </Suspense>
  );
}
