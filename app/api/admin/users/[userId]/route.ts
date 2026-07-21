import { supabaseAdmin } from '@/lib/supabase-admin';
import { NextRequest, NextResponse } from 'next/server';

// Helper to check admin authorization
async function checkAdminAuth(req: NextRequest) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return { authorized: false, error: 'Missing authorization token' };
  }

  const token = authHeader.substring(7);
  
  try {
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !user) {
      return { authorized: false, error: 'Invalid token' };
    }

    // Check if user has admin role
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('role_id')
      .eq('id', user.id)
      .single();

    if (profileError || profile?.role_id !== 1) {
      return { authorized: false, error: 'Not authorized' };
    }

    return { authorized: true, user };
  } catch (error) {
    return { authorized: false, error: 'Auth check failed' };
  }
}

// PATCH update user role or status
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    // Check admin authorization
    const auth = await checkAdminAuth(req);
    if (!auth.authorized) {
      return NextResponse.json(
        { error: auth.error },
        { status: 401 }
      );
    }

    const { role, status } = await req.json();
    const { userId } = await params;

    if (!role && !status) {
      return NextResponse.json(
        { error: 'Role or status required' },
        { status: 400 }
      );
    }

    // Update role
    if (role) {
      const { data: roleData, error: roleError } = await supabaseAdmin
        .from('roles')
        .select('id')
        .eq('name', role)
        .single();

      if (roleError || !roleData) {
        return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
      }

      const { error: updateError } = await supabaseAdmin
        .from('user_profiles')
        .update({ role_id: (roleData as any).id })
        .eq('id', userId);

      if (updateError) throw updateError;
    }

    // Update status (ban/suspend)
    if (status) {
      const validStatuses = ['active', 'suspended', 'banned'];
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { error: 'Invalid status' },
          { status: 400 }
        );
      }

      // Update in auth metadata
      await supabaseAdmin.auth.admin.updateUserById(userId, {
        user_metadata: { account_status: status },
      });

      // Log audit event
      await supabaseAdmin
        .from('audit_logs')
        .insert({
          resource_type: 'user',
          resource_id: userId,
          action: `user_${status}`,
        });
    }

    // Fetch updated user
    const { data: user } = await supabaseAdmin
      .from('user_stats')
      .select('*')
      .eq('id', userId)
      .single();

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}

// DELETE user (hard delete)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    // Check admin authorization
    const auth = await checkAdminAuth(req);
    if (!auth.authorized) {
      return NextResponse.json(
        { error: auth.error },
        { status: 401 }
      );
    }

    const { userId } = await params;

    console.log('🗑️ [DELETE] Starting user deletion for userId:', userId);

    // Verify admin client is available
    if (!supabaseAdmin.auth?.admin) {
      console.error('🗑️ [DELETE] Supabase admin auth client not available');
      return NextResponse.json(
        { error: 'Admin client not configured' },
        { status: 500 }
      );
    }

    // First, verify user exists
    console.log('🗑️ [DELETE] Verifying user exists...');
    let userExists;
    try {
      userExists = await supabaseAdmin.auth.admin.getUserById(userId);
      console.log('🗑️ [DELETE] User lookup result:', userExists?.data ? 'found' : 'not found');
    } catch (lookupErr) {
      console.error('🗑️ [DELETE] User lookup error:', lookupErr);
      return NextResponse.json(
        { error: 'Failed to lookup user' },
        { status: 400 }
      );
    }
    
    if (!userExists?.data) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    console.log('🗑️ [DELETE] User found, attempting deletion...');

    // Delete from auth using admin API
    let deleteError;
    let deleteSuccess = false;
    
    try {
      const result = await supabaseAdmin.auth.admin.deleteUser(userId);
      deleteError = result.error;
      deleteSuccess = !deleteError;
      console.log('🗑️ [DELETE] deleteUser returned:', { error: deleteError, success: deleteSuccess });
    } catch (e) {
      console.error('🗑️ [DELETE] deleteUser threw exception:', e);
      return NextResponse.json(
        { error: `Exception: ${e instanceof Error ? e.message : String(e)}` },
        { status: 400 }
      );
    }

    if (deleteError || !deleteSuccess) {
      console.error('🗑️ [DELETE] Delete failed. Error:', deleteError);
      console.error('🗑️ [DELETE] Attempting soft-delete as fallback...');
      
      // Fallback: soft delete in database by marking as deleted
      try {
        const { error: softDeleteError } = await supabaseAdmin
          .from('user_profiles')
          .update({ 
            display_name: '[Deleted User]',
            bio: null,
            avatar_url: null 
          })
          .eq('id', userId);

        if (softDeleteError) {
          console.error('🗑️ [DELETE] Soft delete also failed:', softDeleteError);
          return NextResponse.json(
            { error: 'Could not delete user via auth or database' },
            { status: 400 }
          );
        }

        console.log('🗑️ [DELETE] Successfully soft-deleted user profile');
        
        // Log audit event
        await supabaseAdmin
          .from('audit_logs')
          .insert({
            resource_type: 'user',
            resource_id: userId,
            action: 'user_soft_deleted',
          });

        return NextResponse.json({ 
          success: true, 
          message: 'User profile deleted successfully (soft delete)',
          note: 'Auth account still exists but profile data cleared'
        });
      } catch (softErr) {
        console.error('🗑️ [DELETE] Soft delete exception:', softErr);
        return NextResponse.json(
          { error: 'Failed to delete user' },
          { status: 400 }
        );
      }
    }

    console.log('🗑️ [DELETE] User deleted from auth successfully');

    // Log audit event
    console.log('🗑️ [DELETE] Logging audit event...');
    const { error: auditError } = await supabaseAdmin
      .from('audit_logs')
      .insert({
        resource_type: 'user',
        resource_id: userId,
        action: 'user_deleted',
      });

    if (auditError) {
      console.warn('🗑️ [DELETE] Audit log error (non-critical):', auditError);
      // Don't fail the delete if audit logging fails
    }

    console.log('🗑️ [DELETE] User deletion completed successfully');
    return NextResponse.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('🗑️ [DELETE] Exception during deletion:', {
      error,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : 'N/A',
    });
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to delete user' },
      { status: 500 }
    );
  }
}
