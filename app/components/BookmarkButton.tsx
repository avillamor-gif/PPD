'use client';

import { useState, useEffect } from 'react';
import { BookmarkIcon } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface BookmarkButtonProps {
  policyId: string;
  className?: string;
}

export function BookmarkButton({ policyId, className = '' }: BookmarkButtonProps) {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        // Check if bookmarked
        const { data } = await supabase
          .from('policy_bookmarks')
          .select('id')
          .eq('user_id', session.user.id)
          .eq('policy_id', policyId)
          .single();
        setIsBookmarked(!!data);
      }
    };
    init();
  }, [policyId]);

  const handleBookmark = async () => {
    if (!user) {
      setShowLoginPrompt(true);
      return;
    }

    setLoading(true);
    try {
      if (isBookmarked) {
        // Remove bookmark
        await supabase
          .from('policy_bookmarks')
          .delete()
          .eq('user_id', user.id)
          .eq('policy_id', policyId);
        setIsBookmarked(false);
      } else {
        // Add bookmark
        await supabase
          .from('policy_bookmarks')
          .insert({ user_id: user.id, policy_id: policyId });
        setIsBookmarked(true);
      }
    } catch (error) {
      console.error('Bookmark error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleBookmark}
      disabled={loading}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border transition ${
        isBookmarked
          ? 'bg-ocean/10 border-ocean text-ocean hover:bg-ocean/20'
          : 'border-ink/20 text-ink/60 hover:border-ocean hover:text-ocean hover:bg-ocean/5'
      } disabled:opacity-50 ${className}`}
      title={isBookmarked ? 'Remove bookmark' : 'Bookmark this policy'}
    >
      <BookmarkIcon className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
      <span className="text-sm font-medium">{isBookmarked ? 'Bookmarked' : 'Bookmark'}</span>
    </button>
  );
}
