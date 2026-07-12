import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

/**
 * Check if the request is from an admin user
 */
async function isAdminUser(request: NextRequest): Promise<boolean> {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return false;
    }

    const token = authHeader.slice(7);

    // Get user from Supabase using the token
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user?.id) {
      return false;
    }

    // Check user role
    const { data: profile } = await supabaseAdmin
      .from('user_profiles')
      .select('role_id')
      .eq('id', user.id)
      .single();

    if (!profile?.role_id) {
      return false;
    }

    // Get role name
    const { data: role } = await supabaseAdmin
      .from('roles')
      .select('name')
      .eq('id', profile.role_id)
      .single();

    return role?.name === 'admin';
  } catch (err) {
    console.error('Auth error:', err);
    return false;
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; entryId: string }> }
) {
  try {
    const { id, entryId } = await params;

    // Check authorization
    const isAdmin = await isAdminUser(req);
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 403 }
      );
    }

    // Delete the history entry
    const { error } = await supabaseAdmin
      .from('policy_status_history')
      .delete()
      .eq('id', entryId)
      .eq('policy_id', id);

    if (error) {
      console.error('Delete error:', error);
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Error deleting history entry:', err);
    return NextResponse.json(
      { error: 'Failed to delete history entry' },
      { status: 500 }
    );
  }
}
