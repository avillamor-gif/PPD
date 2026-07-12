import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ policyId: string }> }
) {
  try {
    const { policyId } = await params;

    const { data, error } = await supabaseAdmin
      .from('policy_engagement')
      .select('engagement_type')
      .eq('policy_id', policyId);

    if (error) throw error;

    const stats = {
      views: data?.filter((e: any) => e.engagement_type === 'view').length || 0,
      helpful: data?.filter((e: any) => e.engagement_type === 'helpful').length || 0,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching engagement stats:', error);
    return NextResponse.json(
      { views: 0, helpful: 0 },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ policyId: string }> }
) {
  try {
    const { policyId } = await params;
    const body = await request.json();
    const { engagementType, userId } = body;

    if (!engagementType || !['view', 'helpful'].includes(engagementType)) {
      return NextResponse.json(
        { error: 'Invalid engagement type' },
        { status: 400 }
      );
    }

    // Record engagement
    const { data, error } = await supabaseAdmin
      .from('policy_engagement')
      .insert({
        policy_id: policyId,
        engagement_type: engagementType,
        user_id: userId || null,
        session_id: body.sessionId || null,
      })
      .select();

    if (error) {
      // If unique constraint fails (duplicate vote), return success anyway
      if (error.code === '23505') {
        const stats = await supabaseAdmin
          .from('policy_engagement')
          .select('engagement_type')
          .eq('policy_id', policyId);

        const counts = {
          views: stats.data?.filter((e: any) => e.engagement_type === 'view').length || 0,
          helpful: stats.data?.filter((e: any) => e.engagement_type === 'helpful').length || 0,
        };

        return NextResponse.json({ 
          message: 'Already voted',
          isDuplicate: true,
          stats: counts 
        });
      }
      throw error;
    }

    // Get updated stats
    const statsData = await supabaseAdmin
      .from('policy_engagement')
      .select('engagement_type')
      .eq('policy_id', policyId);

    const stats = {
      views: statsData.data?.filter((e: any) => e.engagement_type === 'view').length || 0,
      helpful: statsData.data?.filter((e: any) => e.engagement_type === 'helpful').length || 0,
    };

    return NextResponse.json({ success: true, stats });
  } catch (error) {
    console.error('Error recording engagement:', error);
    return NextResponse.json(
      { error: 'Failed to record engagement' },
      { status: 500 }
    );
  }
}
