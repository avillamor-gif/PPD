import { supabase } from '@/lib/supabase';

export async function getDiscussionStats(policyId: string) {
  try {
    const { data, error } = await supabase
      .from('discussion_threads')
      .select('id, comment_count', { count: 'exact' })
      .eq('policy_id', policyId)
      .is('deleted_at', null);

    if (error) throw error;

    const threadCount = data?.length || 0;
    const commentCount = data?.reduce((sum, t) => sum + (t.comment_count || 0), 0) || 0;

    return {
      threadCount,
      commentCount,
      totalActivity: threadCount + commentCount,
    };
  } catch (error) {
    console.error('Error getting discussion stats:', error);
    return { threadCount: 0, commentCount: 0, totalActivity: 0 };
  }
}
