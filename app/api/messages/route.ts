import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET messages between two users
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
    const otherUserId = searchParams.get('otherUserId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!otherUserId) {
      return NextResponse.json({ error: 'otherUserId is required' }, { status: 400 });
    }

    const { data: messages, error } = await supabase
      .from('direct_messages')
      .select(`
        id,
        content,
        sender_id,
        recipient_id,
        is_read,
        created_at,
        sender:sender_id(display_name, avatar_url),
        recipient:recipient_id(display_name, avatar_url)
      `)
      .or(
        `and(sender_id.eq.${user.id},recipient_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},recipient_id.eq.${user.id})`
      )
      .is('is_deleted_by_sender', false)
      .is('is_deleted_by_recipient', false)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    // Mark messages as read
    await supabase
      .from('direct_messages')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('recipient_id', user.id)
      .eq('sender_id', otherUserId)
      .eq('is_read', false);

    return NextResponse.json({ messages: messages?.reverse() || [] });
  } catch (error) {
    console.error('Get messages error:', error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

// POST send message
export async function POST(request: NextRequest) {
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

    const { recipientId, content } = await request.json();
    if (!recipientId || !content) {
      return NextResponse.json({ error: 'recipientId and content are required' }, { status: 400 });
    }

    if (user.id === recipientId) {
      return NextResponse.json({ error: 'Cannot message yourself' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('direct_messages')
      .insert({
        sender_id: user.id,
        recipient_id: recipientId,
        content,
      })
      .select();

    if (error) throw error;

    return NextResponse.json({ message: data?.[0] });
  } catch (error) {
    console.error('Send message error:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
