import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const policyId = request.nextUrl.searchParams.get('policyId');

    if (!policyId) {
      return NextResponse.json(
        { error: 'Policy ID is required' },
        { status: 400 }
      );
    }

    // Fetch discussion threads
    const { data: threads, error: threadsError } = await supabaseAdmin
      .from('discussion_threads')
      .select('*')
      .eq('policy_id', policyId)
      .is('deleted_at', null)
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false });

    if (threadsError) {
      console.error('Error fetching threads:', threadsError);
      return NextResponse.json(
        { error: 'Failed to fetch discussions' },
        { status: 500 }
      );
    }

    // Fetch author profiles
    const authorIds = [...new Set((threads || []).map((t: any) => t.author_id))];
    let profileMap: Record<string, any> = {};

    if (authorIds.length > 0) {
      const { data: profiles } = await supabaseAdmin
        .from('user_profiles')
        .select('id, display_name')
        .in('id', authorIds);

      if (profiles) {
        profileMap = Object.fromEntries(
          profiles.map((p: any) => [p.id, { display_name: p.display_name || 'Unknown User' }])
        );
      }
    }

    // Add author data to threads
    const threadsWithAuthors = (threads || []).map((t: any) => ({
      ...t,
      display_name: profileMap[t.author_id]?.display_name || 'Unknown User',
    }));

    return NextResponse.json(threadsWithAuthors);
  } catch (error) {
    console.error('Discussions API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
