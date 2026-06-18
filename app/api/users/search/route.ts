import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.toLowerCase() || '';
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (query.length < 2) {
      return NextResponse.json({ users: [] });
    }

    // Search by display_name or email
    const { data: users, error, count } = await supabase
      .from('user_profiles')
      .select(
        `
        id,
        display_name,
        avatar_url,
        bio,
        organization,
        role:roles(name),
        follower_count,
        following_count
      `,
        { count: 'exact' }
      )
      .or(`display_name.ilike.%${query}%,bio.ilike.%${query}%`)
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return NextResponse.json({ users: users || [], total: count || 0 });
  } catch (error) {
    console.error('User search error:', error);
    return NextResponse.json({ error: 'Failed to search users' }, { status: 500 });
  }
}
