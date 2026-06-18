import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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

    const { targetUserId } = await request.json();
    if (!targetUserId) {
      return NextResponse.json({ error: 'targetUserId is required' }, { status: 400 });
    }

    if (user.id === targetUserId) {
      return NextResponse.json({ error: 'Cannot follow yourself' }, { status: 400 });
    }

    // Add follow
    const { error } = await supabase
      .from('user_followers')
      .insert({
        follower_id: user.id,
        following_id: targetUserId,
      });

    if (error) {
      if (error.code === '23505') { // Unique constraint
        return NextResponse.json({ error: 'Already following' }, { status: 400 });
      }
      throw error;
    }

    return NextResponse.json({ success: true, message: 'Following user' });
  } catch (error) {
    console.error('Follow error:', error);
    return NextResponse.json({ error: 'Failed to follow user' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
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
    const targetUserId = searchParams.get('targetUserId');
    if (!targetUserId) {
      return NextResponse.json({ error: 'targetUserId is required' }, { status: 400 });
    }

    // Remove follow
    const { error } = await supabase
      .from('user_followers')
      .delete()
      .eq('follower_id', user.id)
      .eq('following_id', targetUserId);

    if (error) throw error;

    return NextResponse.json({ success: true, message: 'Unfollowing user' });
  } catch (error) {
    console.error('Unfollow error:', error);
    return NextResponse.json({ error: 'Failed to unfollow user' }, { status: 500 });
  }
}
