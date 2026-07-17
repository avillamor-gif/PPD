'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { Users, UserPlus, UserMinus } from 'lucide-react';

interface UserData {
  id: string;
  display_name: string;
  avatar_url: string | null;
}

interface FollowState {
  following: UserData[];
  followers: UserData[];
  isFollowing: boolean;
  followingCount: number;
  followerCount: number;
}

export default function FollowersPage() {
  const params = useParams();
  const userId = params.id as string;
  const [state, setState] = useState<FollowState>({
    following: [],
    followers: [],
    isFollowing: false,
    followingCount: 0,
    followerCount: 0,
  });

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');
  const [tab, setTab] = useState<'followers' | 'following'>('followers');

  useEffect(() => {
    const init = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setCurrentUser(session.user);
        }

        // Fetch user name
        const { data: userProfile } = await supabase
          .from('user_profiles')
          .select('display_name')
          .eq('id', userId)
          .single();

        if (userProfile) {
          setUserName(userProfile.display_name);
        }

        // Fetch followers
        const { data: followersData } = await supabase
          .from('user_follows')
          .select('follower_id, user_profiles!user_follows_follower_id(id, display_name, avatar_url)')
          .eq('following_id', userId);

        // Fetch following
        const { data: followingData } = await supabase
          .from('user_follows')
          .select('following_id, user_profiles!user_follows_following_id(id, display_name, avatar_url)')
          .eq('follower_id', userId);

        const followers = followersData?.map((f: any) => f.user_profiles) || [];
        const following = followingData?.map((f: any) => f.user_profiles) || [];

        setState((prev) => ({
          ...prev,
          followers,
          following,
          followerCount: followers.length,
          followingCount: following.length,
        }));
      } catch (error) {
        console.error('Followers page error:', error);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [userId]);

  if (loading) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-paper">
        <p className="text-ink/60">Loading...</p>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-paper">
      {/* Header */}
      <div className="border-b border-border bg-white">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-6 h-6 text-ocean" />
            <h1 className="text-2xl font-bold text-ink">{userName}'s Network</h1>
          </div>
          <p className="text-ink/60">{state.followerCount} followers · {state.followingCount} following</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Tabs */}
        <div className="flex gap-8 border-b border-border mb-8">
          <button
            onClick={() => setTab('followers')}
            className={`pb-4 font-medium transition ${
              tab === 'followers'
                ? 'text-ocean border-b-2 border-ocean'
                : 'text-ink/60 hover:text-ink'
            }`}
          >
            Followers ({state.followerCount})
          </button>
          <button
            onClick={() => setTab('following')}
            className={`pb-4 font-medium transition ${
              tab === 'following'
                ? 'text-ocean border-b-2 border-ocean'
                : 'text-ink/60 hover:text-ink'
            }`}
          >
            Following ({state.followingCount})
          </button>
        </div>

        {/* User List */}
        <div className="space-y-4">
          {tab === 'followers' &&
            (state.followers.length === 0 ? (
              <p className="text-center py-12 text-ink/60">No followers yet</p>
            ) : (
              state.followers.map((user) => (
                <div
                  key={user.id}
                  className="p-4 rounded-lg border border-border bg-white flex items-center justify-between"
                >
                  <Link href={`/profile/${user.id}`} className="flex items-center gap-4 flex-1">
                    {user.avatar_url && (
                      <img
                        src={user.avatar_url}
                        alt={user.display_name}
                        className="w-10 h-10 rounded-full"
                      />
                    )}
                    <span className="font-medium text-ink hover:text-ocean transition">
                      {user.display_name}
                    </span>
                  </Link>
                </div>
              ))
            ))}

          {tab === 'following' &&
            (state.following.length === 0 ? (
              <p className="text-center py-12 text-ink/60">Not following anyone yet</p>
            ) : (
              state.following.map((user) => (
                <div
                  key={user.id}
                  className="p-4 rounded-lg border border-border bg-white flex items-center justify-between"
                >
                  <Link href={`/profile/${user.id}`} className="flex items-center gap-4 flex-1">
                    {user.avatar_url && (
                      <img
                        src={user.avatar_url}
                        alt={user.display_name}
                        className="w-10 h-10 rounded-full"
                      />
                    )}
                    <span className="font-medium text-ink hover:text-ocean transition">
                      {user.display_name}
                    </span>
                  </Link>
                </div>
              ))
            ))}
        </div>
      </div>
    </div>
  );
}
