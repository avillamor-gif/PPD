'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { Bookmark, ArrowLeft } from 'lucide-react';

interface BookmarkedPolicy {
  id: string;
  title: string;
  country: string;
  category: string;
  created_at: string;
}

export default function BookmarksPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;
  const [bookmarks, setBookmarks] = useState<BookmarkedPolicy[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const init = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setCurrentUser(session.user);

          // Only fetch if viewing own bookmarks
          if (session.user.id === userId) {
            const { data: bookmarkData } = await supabase
              .from('policy_bookmarks')
              .select('policy_id, created_at')
              .eq('user_id', userId)
              .order('created_at', { ascending: false });

            if (bookmarkData) {
              // In a real app, you'd fetch policy details from your policies table
              setBookmarks(
                bookmarkData.map((b: any) => ({
                  id: b.policy_id,
                  title: `Policy ${b.policy_id}`,
                  country: 'N/A',
                  category: 'N/A',
                  created_at: b.created_at,
                }))
              );
            }
          }
        }
      } catch (error) {
        console.error('Bookmarks page error:', error);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [userId]);

  const isOwnProfile = currentUser?.id === userId;

  if (loading) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-paper">
        <p className="text-ink/60">Loading bookmarks...</p>
      </div>
    );
  }

  if (!isOwnProfile) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-paper">
        <div className="text-center">
          <p className="text-ink/60 mb-4">You can only view your own bookmarks</p>
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-ocean text-paper hover:bg-ocean-deep transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-paper">
      {/* Header */}
      <div className="border-b border-border bg-white">
        <div className="mx-auto max-w-350 px-6 py-8 lg:px-10">
          <div className="flex items-center gap-3 mb-2">
            <Bookmark className="w-6 h-6 text-ocean" />
            <h1 className="text-2xl font-bold text-ink">My Bookmarked Policies</h1>
          </div>
          <p className="text-ink/60">{bookmarks.length} saved policies</p>
        </div>
      </div>

      <div className="mx-auto max-w-350 px-6 py-12 lg:px-10">
        {bookmarks.length === 0 ? (
          <div className="text-center py-12">
            <Bookmark className="w-12 h-12 mx-auto mb-4 text-ink/20" />
            <p className="text-ink/60 mb-6">No bookmarks yet</p>
            <Link
              href="/search"
              className="inline-block px-6 py-2 rounded-lg bg-ocean text-paper hover:bg-ocean-deep transition"
            >
              Browse Policies
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {bookmarks.map((policy) => (
              <div
                key={policy.id}
                className="p-6 rounded-lg border border-border bg-white hover:border-ocean/50 transition"
              >
                <Link href={`/policies/${policy.id}`} className="block">
                  <h3 className="font-medium text-ocean hover:text-ocean-deep mb-2">
                    {policy.title}
                  </h3>
                </Link>
                <div className="flex gap-4 text-sm text-ink/60">
                  <span>{policy.country}</span>
                  <span>•</span>
                  <span>{policy.category}</span>
                  <span>•</span>
                  <span>{new Date(policy.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
