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
    const { policyId, title, description } = body;

    // Validate required fields
    if (!policyId) {
      return NextResponse.json({ error: 'Policy ID is required' }, { status: 400 });
    }

    if (!title || title.trim().length === 0) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    // Create discussion thread
    const { data, error: insertError } = await supabase
      .from('discussion_threads')
      .insert({
        policy_id: policyId,
        title: title.trim(),
        description: description ? description.trim() : null,
        author_id: user.id,
        status: 'open',
      })
      .select('id')
      .single();

    if (insertError) {
      console.error('Discussion creation error:', insertError);
      return NextResponse.json({ error: insertError.message }, { status: 400 });
    }

    // Log audit event
    await supabase.from('audit_logs').insert({
      actor_id: user.id,
      action: 'thread_created',
      resource_type: 'thread',
      resource_id: data.id,
    });

    return NextResponse.json({ threadId: data.id });
  } catch (error) {
    console.error('Create discussion error:', error);
    return NextResponse.json(
      { error: 'Failed to create discussion' },
      { status: 500 }
    );
  }
}
