import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    // Get auth header with user's token
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ isAdmin: false });
    }

    const token = authHeader.slice(7);

    // Create client with user's token to verify identity
    const supabaseUser = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      }
    );

    // Get user from token
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ isAdmin: false });
    }

    // Create admin client to bypass RLS
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Check user role - get profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('role_id')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError || !profile) {
      console.log('Profile error or not found:', { profileError, profile });
      return NextResponse.json({ isAdmin: false });
    }

    // Get role name
    const { data: role, error: roleError } = await supabaseAdmin
      .from('roles')
      .select('name')
      .eq('id', profile.role_id)
      .maybeSingle();

    if (roleError || !role) {
      console.log('Role error or not found:', { roleError, role });
      return NextResponse.json({ isAdmin: false });
    }

    const isAdmin = role.name === 'admin';
    console.log('Admin check:', { userId: user.id, roleId: profile.role_id, roleName: role.name, isAdmin });
    return NextResponse.json({ isAdmin });
  } catch (error) {
    console.error('Error checking admin status:', error);
    return NextResponse.json({ isAdmin: false });
  }
}
