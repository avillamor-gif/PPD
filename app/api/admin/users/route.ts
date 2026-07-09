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
  console.log('📨 [API] POST /api/admin/users called');
  try {
    const body = await req.json();
    console.log('📦 [API] Request body:', body);
    const { email, password, displayName, role } = body;

    console.log('📋 [ADMIN-CREATE] Request received:', { email, displayName, role, hasPassword: !!password });

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

    console.log('🔍 [ADMIN-CREATE] Role lookup:', { role: role || 'user', roleData, roleError });

    if (roleError || !roleData) {
      console.error('❌ [ADMIN-CREATE] Role lookup failed:', roleError);
      return NextResponse.json({ error: `Invalid role: ${roleError?.message || 'not found'}` }, { status: 400 });
    }

    // Create auth user - trigger creates user_profiles + preferences
    console.log('👤 [ADMIN-CREATE] Creating auth user:', email);
    let { data: { user }, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email for admin-created users
      user_metadata: { display_name: displayName },
    });
    
    console.log('👤 [ADMIN-CREATE] Auth user created:', { userId: user?.id, createError });

    // WORKAROUND: If creation failed, check if user exists despite the error
    if ((createError || !user) && email) {
      console.log('⚠️  [ADMIN-CREATE] Creation error detected, checking if user exists...');
      try {
        const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
        if (!listError && users) {
          const existingUser = users.find((u: any) => u.email === email);
          if (existingUser) {
            console.log('✅ [ADMIN-CREATE] User already exists despite error:', existingUser.id);
            user = existingUser;
            createError = null;
          }
        }
      } catch (e) {
        console.warn('⚠️  [ADMIN-CREATE] Error checking for existing user:', e);
      }
    }

    if (createError || !user) {
      console.error('❌ [ADMIN-CREATE] Create user failed:', {
        createErrorMessage: createError?.message,
        createErrorStatus: createError?.status,
        createErrorCode: createError?.code,
        fullError: JSON.stringify(createError, null, 2),
      });
      return NextResponse.json(
        { error: createError?.message || 'Failed to create user' },
        { status: 400 }
      );
    }

    // WORKAROUND: Manually create user_profiles if trigger failed
    // (Supabase trigger has permission issues - missing SECURITY DEFINER)
    console.log('📋 [ADMIN-CREATE] Creating user_profiles manually...');
    const { error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .insert([{
        id: user.id,
        display_name: displayName,
        full_name: displayName,
        role_id: (roleData as any).id,
        email_verified: true, // Auto-confirm
      }]);

    if (profileError) {
      console.warn('⚠️  [ADMIN-CREATE] user_profiles insert warning (may already exist):', profileError);
    } else {
      console.log('✅ [ADMIN-CREATE] user_profiles created successfully');
    }

    // WORKAROUND: Manually create user_preferences if trigger failed
    console.log('📋 [ADMIN-CREATE] Creating user_preferences manually...');
    const { error: prefsError } = await supabaseAdmin
      .from('user_preferences')
      .insert([{ user_id: user.id }]);

    if (prefsError) {
      console.warn('⚠️  [ADMIN-CREATE] user_preferences insert warning (may already exist):', prefsError);
    } else {
      console.log('✅ [ADMIN-CREATE] user_preferences created successfully');
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
    console.error('❌ Create user error:', {
      error,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error occurred' },
      { status: 500 }
    );
  }
}
