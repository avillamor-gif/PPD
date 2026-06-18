import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

async function checkModerator(supabase: any, userId: string) {
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role:roles(name)')
    .eq('id', userId)
    .single();

  const profileData = profile as any;
  return profileData?.role?.name === 'admin' || profileData?.role?.name === 'moderator';
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ commentId: string }> }
) {
  try {
    const { commentId } = await params;

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
              return { name: name.trim(), value: decodeURIComponent(rest.join('=').trim()) };
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

    const isModerator = await checkModerator(supabase, session.user.id);
    if (!isModerator) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get the comment
    const { data: comment } = await supabase
      .from('comments')
      .select('*')
      .eq('id', commentId)
      .single();

    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    // Soft delete
    const { error: updateError } = await supabase
      .from('comments')
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
      })
      .eq('id', commentId);

    if (updateError) throw updateError;

    // Log audit
    await supabase.from('audit_logs').insert({
      actor_id: session.user.id,
      action: 'delete_comment',
      resource_type: 'comment',
      resource_id: commentId,
      changes: { reason: 'Moderation' },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete comment error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete comment' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ commentId: string }> }
) {
  try {
    const { commentId } = await params;
    const body = await request.json();
    const { action, reason } = body;

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
              return { name: name.trim(), value: decodeURIComponent(rest.join('=').trim()) };
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

    const isModerator = await checkModerator(supabase, session.user.id);
    if (!isModerator) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (action === 'flag') {
      // Flag comment for review
      const { error } = await supabase
        .from('comments')
        .update({ flagged: true })
        .eq('id', commentId);

      if (error) throw error;

      await supabase.from('audit_logs').insert({
        actor_id: session.user.id,
        action: 'flag_comment',
        resource_type: 'comment',
        resource_id: commentId,
        changes: { reason },
      });

      return NextResponse.json({ success: true, action: 'flagged' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Comment action error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to perform action' },
      { status: 500 }
    );
  }
}
