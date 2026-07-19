import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    console.log('[API] Auth header present:', !!authHeader);
    if (!authHeader?.startsWith('Bearer ')) {
      console.log('[API] Invalid auth header format');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    console.log('[API] Extracted token (first 20 chars):', token.substring(0, 20) + '...');

    // Verify the token
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    console.log('[API] User verification - Error:', authError, 'User:', user?.id);
    if (authError || !user) {
      console.log('[API] Auth failed:', authError?.message);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify admin role - check role_id directly (1 = admin, 2 = moderator)
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('role_id')
      .eq('id', user.id)
      .single();

    console.log('[API] Profile query - Error:', profileError, 'Role ID:', profile?.role_id);
    if (profileError || !profile) {
      console.log('[API] Profile fetch failed:', profileError?.message);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // role_id 1 = admin, 2 = moderator
    if (profile.role_id !== 1 && profile.role_id !== 2) {
      console.log('[API] Insufficient permissions - role_id:', profile.role_id);
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    console.log('[API] Authorization successful for user:', user.id);

    // Query parameters
    const url = new URL(request.url);
    const flaggedOnly = url.searchParams.get('flagged') === 'true';
    const threadId = url.searchParams.get('threadId');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    // Build query - simplified without relationship expansion first
    let query = supabaseAdmin
      .from('comments')
      .select(`
        id,
        content,
        author_id,
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

    console.log('[API] Executing comments query with range:', offset, '-', offset + limit - 1);
    const { data: comments, error, count } = await query
      .range(offset, offset + limit - 1);

    console.log('[API] Query result - Error:', error?.message, 'Count:', count, 'Comments returned:', comments?.length);
    if (error) {
      console.log('[API] Query error details:', error);
      throw error;
    }

    // Fetch author data for each comment
    const commentsWithAuthors = await Promise.all(
      (comments || []).map(async (comment: any) => {
        try {
          const { data: author } = await supabaseAdmin
            .from('user_profiles')
            .select('display_name')
            .eq('id', comment.author_id)
            .single();
          return {
            ...comment,
            author: author ? { display_name: author.display_name } : { display_name: 'Unknown User' },
          };
        } catch (err) {
          console.warn('[API] Error fetching author for comment:', comment.id, err);
          return {
            ...comment,
            author: { display_name: 'Unknown User' },
          };
        }
      })
    );

    console.log('[API] Admin comments - Total in DB:', count, '| Returned:', commentsWithAuthors?.length || 0, '| First comment:', commentsWithAuthors?.[0]);

    return NextResponse.json({
      comments: commentsWithAuthors || [],
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
