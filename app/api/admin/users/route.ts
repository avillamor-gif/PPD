import { supabaseAdmin } from '@/lib/supabase-admin';
import { sendNewUserAdminNotification, sendNewUserWelcomeEmail } from '@/lib/email';
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

    // Enhance users with auth status
    const enhancedUsers = await Promise.all(
      (users || []).map(async (user: any) => {
        try {
          // Get auth user to check email confirmation and account status
          const { data: { user: authUser }, error: authError } = 
            await supabaseAdmin.auth.admin.getUserById(user.id);
          
          if (authError || !authUser) {
            return {
              ...user,
              email_verified: false,
              account_status: 'unknown',
            };
          }

          return {
            ...user,
            email_verified: authUser.email_confirmed_at ? true : false,
            account_status: authUser.user_metadata?.account_status || 'active',
          };
        } catch (err) {
          console.warn('Error fetching auth status for user:', user.id, err);
          return {
            ...user,
            email_verified: false,
            account_status: 'unknown',
          };
        }
      })
    );

    return NextResponse.json({
      users: enhancedUsers,
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
      email_confirm: true, // Auto-confirm email for admin-created users
      user_metadata: { display_name: displayName },
    });

    if (createError || !user) {
      return NextResponse.json(
        { error: createError?.message || 'Failed to create user' },
        { status: 400 }
      );
    }

    console.log('👤 [ADMIN] User created successfully:', { userId: user.id, email: user.email, role });

    // Update role if not 'user'
    if (role && role !== 'user') {
      await supabaseAdmin
        .from('user_profiles')
        .update({ role_id: (roleData as any).id })
        .eq('id', user.id);
      console.log('👤 [ADMIN] User role updated to:', role);
    }

    // Send emails in parallel (but don't block user creation if they fail)
    Promise.all([
      // Send welcome email to new user
      (async () => {
        try {
          console.log('📧 [ADMIN] Sending welcome email to:', email);
          const result = await sendNewUserWelcomeEmail(email, displayName, password);
          console.log('📧 [ADMIN] Welcome email sent successfully:', result);
          return result;
        } catch (emailError) {
          console.error('📧 [ADMIN] Welcome email FAILED:', {
            error: emailError,
            message: emailError instanceof Error ? emailError.message : String(emailError),
          });
          return { success: false, error: emailError };
        }
      })(),
      
      // Send admin notification email
      (async () => {
        try {
          console.log('📧 [ADMIN] Sending admin notification...');
          const result = await sendNewUserAdminNotification(email, displayName, role || 'user');
          console.log('📧 [ADMIN] Admin notification sent successfully:', result);
          return result;
        } catch (emailError) {
          console.error('📧 [ADMIN] Admin notification FAILED:', {
            error: emailError,
            message: emailError instanceof Error ? emailError.message : String(emailError),
          });
          return { success: false, error: emailError };
        }
      })(),
    ]).catch(error => {
      console.error('📧 [ADMIN] Email sending error (non-blocking):', error);
    });

    return NextResponse.json({ 
      user: { id: user.id, email: user.email, role: role || 'user' },
      message: 'User created successfully and notification emails sent'
    }, { status: 201 });
  } catch (error) {
    console.error('Create user error:', error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
