'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function ProfilePage() {
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/auth/login');
          return;
        }
        // Redirect to the user's profile page
        router.push(`/profile/${user.id}`);
      } catch (error) {
        console.error('Auth error:', error);
        router.push('/auth/login');
      }
    };

    checkAuth();
  }, [router]);

  return (
    <div className="w-full min-h-screen bg-paper flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block w-8 h-8 border-4 border-ocean/20 border-t-ocean rounded-full animate-spin mb-4" />
        <p className="text-ink/60">Loading profile...</p>
      </div>
    </div>
  );
}
