import { supabaseAdmin } from '@/lib/supabase-admin';
import { NextRequest, NextResponse } from 'next/server';

// GET all users (admin only)
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const search = searchParams.get('search');
    const role = searchParams.get('role');
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    // Build query
    let query = supabaseAdmin
      .from('user_stats')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (search) {
      query = query.or(
        `email.ilike.%${search}%,display_name.ilike.%${search}%`
      );
    }

    if (role) {
      query = query.eq('role', role);
    }

    const { data: users, count, error } = await query
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return NextResponse.json({
      users,
      total: count,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Get users error:', error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}

// POST create user (admin only)
export async function POST(req: NextRequest) {
  try {
    const { email, password, displayName, role } = await req.json();

    if (!email || !password || !displayName) {
      return NextResponse.json(
        { error: 'Email, password, and display name required' },
        { status: 400 }
      );
    }

    // Get role ID
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from('roles')
      .select('id')
      .eq('name', role || 'user')
      .single();

    if (roleError || !roleData) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    // Create auth user - trigger creates user_profiles + preferences
    const { data: { user }, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { display_name: displayName },
    });

    if (createError || !user) {
      return NextResponse.json(
        { error: createError?.message || 'Failed to create user' },
        { status: 400 }
      );
    }

    // Update role if not 'user'
    if (role && role !== 'user') {
      await supabaseAdmin
        .from('user_profiles')
        .update({ role_id: (roleData as any).id })
        .eq('id', user.id);
    }

    return NextResponse.json({ 
      user: { id: user.id, email: user.email } 
    }, { status: 201 });
  } catch (error) {
    console.error('Create user error:', error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
