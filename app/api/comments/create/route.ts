import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);

    // Verify the token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    let { threadId, policyId, content } = body;

    // Validate required fields
    if (!threadId) {
      return NextResponse.json({ error: 'Thread ID is required' }, { status: 400 });
    }

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: 'Comment cannot be empty' }, { status: 400 });
    }

    if (content.trim().length < 3) {
      return NextResponse.json({ error: 'Comment must be at least 3 characters' }, { status: 400 });
    }

    // Get policy_id from thread if not provided
    if (!policyId) {
      const { data: thread, error: threadError } = await supabase
        .from('discussion_threads')
        .select('policy_id')
        .eq('id', threadId)
        .single();

      if (threadError || !thread) {
        return NextResponse.json({ error: 'Thread not found' }, { status: 404 });
      }

      policyId = thread.policy_id;
    }

    // Insert comment
    const { data, error: insertError } = await supabase
      .from('comments')
      .insert({
        thread_id: threadId,
        policy_id: policyId,
        author_id: user.id,
        content: content.trim(),
      })
      .select('id')
      .single();

    if (insertError) {
      console.error('Comment creation error:', insertError);
      return NextResponse.json({ error: insertError.message }, { status: 400 });
    }

    return NextResponse.json({ commentId: data.id });
  } catch (error) {
    console.error('Create comment error:', error);
    return NextResponse.json(
      { error: 'Failed to create comment' },
      { status: 500 }
    );
  }
}
