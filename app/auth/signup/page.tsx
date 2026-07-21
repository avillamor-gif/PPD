'use client';

import Link from 'next/link';
import { AlertCircle } from 'lucide-react';

export default function SignupPage() {
  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-paper">
      <div className="max-w-md w-full mx-auto px-6 py-12 text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-coral/10 flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8 text-coral" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-ink">Signup Temporarily Disabled</h1>
          <p className="text-ink/60">New user registrations are currently disabled. Please try again later.</p>
        </div>

        <div className="bg-sand/20 p-4 rounded-lg border border-sand/40">
          <p className="text-sm text-ink/70">If you already have an account, you can still sign in.</p>
        </div>

        <Link 
          href="/auth/login" 
          className="inline-block w-full py-3 px-4 rounded-lg bg-ocean text-paper font-medium hover:bg-ocean-deep transition"
        >
          Go to Sign In
        </Link>
      </div>
    </div>
  );
}
