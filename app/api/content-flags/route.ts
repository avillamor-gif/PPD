import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { commentId, reason, description } = body;

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

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!commentId || !reason) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create flag/report
    const { error: insertError } = await supabase
      .from('comment_flags')
      .insert({
        comment_id: commentId,
        reporter_id: session.user.id,
        reason,
        description: description || null,
        status: 'pending',
      });

    if (insertError) throw insertError;

    // Increment flag count on comment (if column exists)
    try {
      await supabase
        .from('comments')
        .update({ flag_count: supabase.rpc('increment_flag_count', { comment_id: commentId }) })
        .eq('id', commentId);
    } catch (e) {
      // Column might not exist yet, that's ok
    }

    return NextResponse.json({
      success: true,
      message: 'Content reported successfully. Our moderation team will review it.',
    });
  } catch (error) {
    console.error('Flag content error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to report content' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
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

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Admin only
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role:roles(name)')
      .eq('id', session.user.id)
      .single();

    const profileData = profile as any;
    if (profileData?.role?.name !== 'admin' && profileData?.role?.name !== 'moderator') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const url = new URL(request.url);
    const status = url.searchParams.get('status') || 'pending';
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    let query = supabase
      .from('comment_flags')
      .select(`
        id,
        comment_id,
        reason,
        description,
        status,
        created_at,
        reporter:user_profiles(display_name)
      `)
      .eq('status', status)
      .order('created_at', { ascending: false });

    const { data: flags, error, count } = await query
      .range(offset, offset + limit - 1)
      .limit(limit);

    if (error) throw error;

    return NextResponse.json({
      flags: flags || [],
      total: count || 0,
    });
  } catch (error) {
    console.error('Get flags error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch flags' },
      { status: 500 }
    );
  }
}
