'use client';

import { useState, useEffect } from 'react';
import { UserPlus, UserMinus } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface FollowButtonProps {
  userId: string;
  displayName?: string;
  className?: string;
}

export function FollowButton({ userId, displayName = 'User', className = '' }: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isOwnProfile, setIsOwnProfile] = useState(false);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setCurrentUser(session.user);
        if (session.user.id === userId) {
          setIsOwnProfile(true);
          return;
        }
        // Check if following
        const { data } = await supabase
          .from('user_follows')
          .select('id')
          .eq('follower_id', session.user.id)
          .eq('following_id', userId)
          .single();
        setIsFollowing(!!data);
      }
    };
    init();
  }, [userId]);

  const handleFollow = async () => {
    if (!currentUser) {
      // Redirect to login
      window.location.href = '/auth/login';
      return;
    }

    if (isOwnProfile) return;

    setLoading(true);
    try {
      if (isFollowing) {
        // Unfollow
        await supabase
          .from('user_follows')
          .delete()
          .eq('follower_id', currentUser.id)
          .eq('following_id', userId);
        setIsFollowing(false);
      } else {
        // Follow
        await supabase
          .from('user_follows')
          .insert({ follower_id: currentUser.id, following_id: userId });
        setIsFollowing(true);
      }
    } catch (error) {
      console.error('Follow error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (isOwnProfile) {
    return null;
  }

  return (
    <button
      onClick={handleFollow}
      disabled={loading || !currentUser}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border transition ${
        isFollowing
          ? 'bg-ocean/10 border-ocean text-ocean hover:bg-ocean/20'
          : 'border-ink/20 text-ink/60 hover:border-ocean hover:text-ocean hover:bg-ocean/5'
      } disabled:opacity-50 ${className}`}
    >
      {isFollowing ? (
        <>
          <UserMinus className="w-4 h-4" />
          <span className="text-sm font-medium">Following</span>
        </>
      ) : (
        <>
          <UserPlus className="w-4 h-4" />
          <span className="text-sm font-medium">Follow</span>
        </>
      )}
    </button>
  );
}
