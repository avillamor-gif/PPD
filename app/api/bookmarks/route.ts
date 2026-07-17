import { supabaseAdmin } from '@/lib/supabase-admin';
import { protectRouteByRole } from '@/lib/api-protection';
import { UserRole } from '@/lib/roles';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's bookmarked policies
    const { data: bookmarks, error } = await supabaseAdmin
      .from('policy_bookmarks')
      .select('policy_id, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Bookmarks fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch bookmarks' }, { status: 500 });
    }

    return NextResponse.json({ bookmarks: bookmarks || [] });
  } catch (error) {
    console.error('Bookmarks API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { policyId } = await req.json();
    if (!policyId) {
      return NextResponse.json({ error: 'Policy ID is required' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('policy_bookmarks')
      .insert({ user_id: userId, policy_id: policyId })
      .select();

    if (error) {
      if (error.code === '23505') { // Unique constraint violation
        return NextResponse.json({ message: 'Already bookmarked' }, { status: 200 });
      }
      console.error('Bookmark creation error:', error);
      return NextResponse.json({ error: 'Failed to bookmark policy' }, { status: 500 });
    }

    return NextResponse.json({ bookmark: data?.[0] }, { status: 201 });
  } catch (error) {
    console.error('Bookmark POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const policyId = searchParams.get('policyId');
    if (!policyId) {
      return NextResponse.json({ error: 'Policy ID is required' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('policy_bookmarks')
      .delete()
      .eq('user_id', userId)
      .eq('policy_id', policyId);

    if (error) {
      console.error('Bookmark deletion error:', error);
      return NextResponse.json({ error: 'Failed to remove bookmark' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Bookmark removed' });
  } catch (error) {
    console.error('Bookmark DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
