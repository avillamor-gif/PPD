import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ threadId: string }> }
) {
  try {
    const { threadId } = await params;

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

    // Get the thread
    const { data: thread } = await supabase
      .from('discussion_threads')
      .select('author_id, id')
      .eq('id', threadId)
      .single();

    if (!thread) {
      return NextResponse.json({ error: 'Thread not found' }, { status: 404 });
    }

    // Check ownership: user can only delete their own threads
    if (thread.author_id !== session.user.id) {
      return NextResponse.json(
        { error: 'You can only delete your own discussions' },
        { status: 403 }
      );
    }

    // Soft delete
    const { error: updateError } = await supabase
      .from('discussion_threads')
      .update({
        deleted_at: new Date().toISOString(),
      })
      .eq('id', threadId);

    if (updateError) throw updateError;

    return NextResponse.json({ success: true, message: 'Discussion deleted' });
  } catch (error) {
    console.error('Delete thread error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete discussion' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ threadId: string }> }
) {
  try {
    const { threadId } = await params;
    const body = await request.json();
    const { title, description } = body;

    if (!title || typeof title !== 'string') {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    if (title.trim().length === 0) {
      return NextResponse.json({ error: 'Title cannot be empty' }, { status: 400 });
    }

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

    // Get the thread
    const { data: thread } = await supabase
      .from('discussion_threads')
      .select('author_id, id')
      .eq('id', threadId)
      .single();

    if (!thread) {
      return NextResponse.json({ error: 'Thread not found' }, { status: 404 });
    }

    // Check ownership: user can only edit their own threads
    if (thread.author_id !== session.user.id) {
      return NextResponse.json(
        { error: 'You can only edit your own discussions' },
        { status: 403 }
      );
    }

    // Update thread
    const { data: updatedThread, error: updateError } = await supabase
      .from('discussion_threads')
      .update({
        title: title.trim(),
        description: description ? description.trim() : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', threadId)
      .select()
      .single();

    if (updateError) throw updateError;

    return NextResponse.json({
      success: true,
      message: 'Discussion updated',
      thread: updatedThread,
    });
  } catch (error) {
    console.error('Update thread error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update discussion' },
      { status: 500 }
    );
  }
}
