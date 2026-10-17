import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

/**
 * POST /api/admin/policies/approve
 * Approve a pending policy submission (Admin only)
 */
export async function POST(request: NextRequest) {
  try {
    // Get user from Supabase
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Extract token from "Bearer <token>"
    const token = authHeader.replace('Bearer ', '');

    // Verify user is admin
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('role_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      );
    }

    // Admin role_id is 1
    const isAdmin = profile.role_id === 1;
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Only admins can approve policies' },
        { status: 403 }
      );
    }

    // Parse request body
    const { policyId, action, rejectionReason } = await request.json();

    if (!policyId || !action) {
      return NextResponse.json(
        { error: 'Missing policyId or action' },
        { status: 400 }
      );
    }

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be "approve" or "reject"' },
        { status: 400 }
      );
    }

    // Update policy
    const updateData: any = {
      approval_status: action === 'approve' ? 'approved' : 'rejected',
      approved_by: user.id,
      approval_date: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (action === 'reject') {
      updateData.rejection_reason = rejectionReason || 'No reason provided';
    }

    const { data: updatedPolicy, error: updateError } = await supabaseAdmin
      .from('policies')
      .update(updateData)
      .eq('id', policyId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating policy:', updateError);
      return NextResponse.json(
        { error: 'Failed to update policy' },
        { status: 500 }
      );
    }

    // Log the action
    console.log(`✅ Policy ${policyId} ${action}ed by ${user.id}`);

    return NextResponse.json({
      success: true,
      message: `Policy ${action}ed successfully`,
      policy: updatedPolicy,
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
