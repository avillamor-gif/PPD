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
        checkBookmarkStatus(session.user.id);
      }
    };
    init();
  }, [policyId]);

  const checkBookmarkStatus = async (userId: string) => {
    try {
      const response = await fetch('/api/bookmarks', {
        headers: { 'x-user-id': userId },
      });
      if (response.ok) {
        const { bookmarks } = await response.json();
        const isCurrentBookmarked = bookmarks.some((b: any) => b.policy_id === policyId);
        setIsBookmarked(isCurrentBookmarked);
      }
    } catch (error) {
      console.error('Error checking bookmark status:', error);
    }
  };

  const handleBookmark = async () => {
    if (!user) {
      setShowLoginPrompt(true);
      return;
    }

    setLoading(true);
    try {
      if (isBookmarked) {
        // Remove bookmark
        const response = await fetch(`/api/bookmarks?policyId=${policyId}`, {
          method: 'DELETE',
          headers: { 'x-user-id': user.id },
        });
        if (response.ok) {
          setIsBookmarked(false);
        }
      } else {
        // Add bookmark
        const response = await fetch('/api/bookmarks', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': user.id,
          },
          body: JSON.stringify({ policyId }),
        });
        if (response.ok || response.status === 200) {
          setIsBookmarked(true);
        }
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
