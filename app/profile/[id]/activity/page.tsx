'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Calendar, MessageSquare } from 'lucide-react';

interface Activity {
  id: string;
  activity_type: string;
  activity_data: Record<string, any>;
  created_at: string;
}

export default function ActivityPage() {
  const params = useParams();
  const userId = params.id as string;
  const [activity, setActivity] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const init = async () => {
      try {
        // Fetch user name
        const { data: userProfile } = await supabase
          .from('user_profiles')
          .select('display_name')
          .eq('id', userId)
          .single();

        if (userProfile) {
          setUserName(userProfile.display_name);
        }

        // Fetch activity - allow public view for activity
        const { data: userActivity } = await supabase
          .from('user_activity')
          .select('id, activity_type, activity_data, created_at')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(50);

        if (userActivity) {
          setActivity(userActivity);
        }
      } catch (error) {
        console.error('Activity page error:', error);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [userId]);

  if (loading) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-paper">
        <p className="text-ink/60">Loading activity...</p>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-paper">
      {/* Header */}
      <div className="border-b border-border bg-white">
        <div className="mx-auto max-w-350 px-6 py-8 lg:px-10">
          <div className="flex items-center gap-3 mb-2">
            <Calendar className="w-6 h-6 text-ocean" />
            <h1 className="text-2xl font-bold text-ink">{userName}'s Activity</h1>
          </div>
          <p className="text-ink/60">Recent contributions to the community</p>
        </div>
      </div>

      <div className="mx-auto max-w-350 px-6 py-12 lg:px-10">
        {activity.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 text-ink/20" />
            <p className="text-ink/60">No activity yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activity.map((item) => (
              <div
                key={item.id}
                className="p-6 rounded-lg border border-border hover:border-ocean/50 transition bg-white"
              >
                <div className="flex items-start justify-between mb-2">
                  <p className="font-medium text-ink">
                    {item.activity_type === 'thread_created' && '💬 Started a discussion'}
                    {item.activity_type === 'comment_posted' && '💭 Posted a comment'}
                    {item.activity_type === 'policy_bookmarked' && '📌 Bookmarked a policy'}
                    {item.activity_type === 'user_followed' && '👥 Followed a user'}
                  </p>
                  <time className="text-xs text-ink/40">
                    {new Date(item.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </time>
                </div>

                {item.activity_data?.title && (
                  <p className="text-sm text-ink/70 italic">"{item.activity_data.title}"</p>
                )}

                {item.activity_data?.policy_id && !item.activity_data?.title && (
                  <p className="text-xs text-ink/60">Policy: {item.activity_data.policy_id}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
