import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const feedType = searchParams.get('type') || 'following'; // 'following' or 'user'
    const userId = searchParams.get('userId') || user.id;
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (feedType === 'following') {
      // Get activity from users being followed
      const { data: activities, error } = await supabase
        .from('user_activity')
        .select(`
          id,
          activity_type,
          activity_text,
          created_at,
          user:user_id(display_name, avatar_url),
          related_comment:related_comment_id(id, content),
          related_thread:related_thread_id(id, title)
        `)
        .in(
          'user_id',
          // Get list of users being followed
          await supabase
            .from('user_followers')
            .select('following_id')
            .eq('follower_id', user.id)
            .then(res => res.data?.map(f => f.following_id) || [])
        )
        .eq('visibility', 'public')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;
      return NextResponse.json({ activities: activities || [] });
    } else {
      // Get activity from specific user
      const { data: activities, error } = await supabase
        .from('user_activity')
        .select(`
          id,
          activity_type,
          activity_text,
          created_at,
          user:user_id(display_name, avatar_url),
          related_comment:related_comment_id(id, content),
          related_thread:related_thread_id(id, title)
        `)
        .eq('user_id', userId)
        .or(`visibility.eq.public,and(visibility.eq.followers,user_id.eq.${userId})`)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;
      return NextResponse.json({ activities: activities || [] });
    }
  } catch (error) {
    console.error('Activity feed error:', error);
    return NextResponse.json({ error: 'Failed to fetch activity feed' }, { status: 500 });
  }
}
