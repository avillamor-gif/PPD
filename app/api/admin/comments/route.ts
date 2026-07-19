import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function GET(request: NextRequest) {
  try {
    // Create Supabase client
    let response = NextResponse.next();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            const cookieHeader = request.headers.get('cookie') || '';
            const cookies = cookieHeader.split(';').map(c => {
              const [name, ...rest] = c.trim().split('=');
              return {
                name: name.trim(),
                value: decodeURIComponent(rest.join('=').trim()),
              };
            });
            return cookies;
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options as any);
            });
          },
        },
      }
    );

    // Check admin auth
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify admin role
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role:roles(name)')
      .eq('id', session.user.id)
      .single();

    const profileData = profile as any;
    if (profileData?.role?.name !== 'admin' && profileData?.role?.name !== 'moderator') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Query parameters
    const url = new URL(request.url);
    const flaggedOnly = url.searchParams.get('flagged') === 'true';
    const threadId = url.searchParams.get('threadId');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    // Build query
    let query = supabase
      .from('comments')
      .select(`
        id,
        content,
        author_id,
        author:user_profiles(display_name),
        thread_id,
        created_at,
        is_deleted,
        vote_count,
        reply_count
      `, { count: 'exact' })
      .order('created_at', { ascending: false });

    if (threadId) {
      query = query.eq('thread_id', threadId);
    }

    const { data: comments, error, count } = await query
      .range(offset, offset + limit - 1)
      .limit(limit);

    if (error) throw error;

    console.log('[API] Admin comments - Total in DB:', count, '| Returned:', comments?.length || 0, '| First comment:', comments?.[0]);

    return NextResponse.json({
      comments: comments || [],
      total: count || 0,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Comments API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch comments' },
      { status: 500 }
    );
  }
}
