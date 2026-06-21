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

// DELETE user (soft delete)
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

    // Soft delete by marking status
    await supabaseAdmin.auth.admin.updateUserById(userId, {
      user_metadata: { account_status: 'deleted' },
    });

    // Log audit event
    await supabaseAdmin
      .from('audit_logs')
      .insert({
        resource_type: 'user',
        resource_id: userId,
        action: 'user_deleted',
      });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
