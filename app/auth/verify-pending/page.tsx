'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Mail, CheckCircle } from 'lucide-react';

export default function VerifyPendingPage() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || 'your email';

  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-paper">
      <div className="max-w-md w-full mx-auto px-6 py-12 text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-ocean/10 flex items-center justify-center mx-auto">
          <Mail className="w-8 h-8 text-ocean" />
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-ink">Check Your Email</h1>
          <p className="text-ink/60">We've sent a verification link to:</p>
          <p className="text-base font-mono text-ocean">{decodeURIComponent(email)}</p>
        </div>

        <div className="rounded-lg bg-ocean/10 border border-ocean/20 p-4 space-y-2">
          <p className="text-sm text-ink font-medium">Click the link in your email to verify your account</p>
          <p className="text-xs text-ink/60">The link will expire in 24 hours</p>
        </div>

        <div className="space-y-3 text-sm text-ink/60">
          <p>Didn't receive the email?</p>
          <ul className="text-xs space-y-1">
            <li>• Check your spam folder</li>
            <li>• Wait a few minutes and refresh</li>
            <li>• Verify you entered the correct email</li>
          </ul>
        </div>

        <Link
          href="/auth/login"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-ocean text-white font-semibold hover:bg-ocean/90 transition"
        >
          <CheckCircle className="w-5 h-5" />
          Already verified? Log in
        </Link>
      </div>
    </div>
  );
}
