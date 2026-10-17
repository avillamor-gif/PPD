import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { sendVerificationEmail } from '@/lib/email';
import { randomBytes } from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const { email, password, displayName } = await req.json();

    if (!email || !password || !displayName) {
      return NextResponse.json(
        { error: 'Email, password, and display name are required' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    // Create auth user
    let authUserId: string;
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: false,
    });

    if (authError) {
      console.error('Auth creation error:', authError);
      const message = authError?.message || 'Failed to create account';
      
      // Check if user already exists - if so, try to proceed with profile update
      if (message.includes('already') || message.includes('exist')) {
        // Try to fetch the existing user by email
        try {
          const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
          const existingUser = users?.find((u: any) => u.email === email);
          
          if (existingUser) {
            authUserId = existingUser.id;
            console.log('Found existing auth user, will update profile:', authUserId);
          } else {
            return NextResponse.json(
              { error: 'Email already registered but user not found' },
              { status: 400 }
            );
          }
        } catch (listErr) {
          console.error('Error listing users:', listErr);
          return NextResponse.json(
            { error: 'Email already registered' },
            { status: 400 }
          );
        }
      } else {
        return NextResponse.json(
          { error: message },
          { status: 500 }
        );
      }
    } else if (authData?.user?.id) {
      authUserId = authData.user.id;
    } else {
      return NextResponse.json(
        { error: 'Failed to create or find user account' },
        { status: 500 }
      );
    }

    // Create user profile with display name and Expert role (role_id = 3)
    // Use upsert in case the profile was created in a failed attempt
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .upsert({
        id: authUserId,
        display_name: displayName,
        email_verified: false,
        role_id: 3, // Expert role
      }, { onConflict: 'id' })
      .select();

    if (profileError) {
      console.error('Profile creation error:', {
        message: profileError.message,
        code: profileError.code,
        details: profileError.details,
        hint: profileError.hint,
      });
      // Try to clean up the auth user only if we just created it
      if (!authError && authData?.user?.id) {
        try {
          await supabaseAdmin.auth.admin.deleteUser(authUserId);
        } catch (deleteErr) {
          console.error('Error deleting auth user:', deleteErr);
        }
      }
      return NextResponse.json(
        { error: 'Failed to create user profile', details: profileError.message },
        { status: 500 }
      );
    }

    // Generate verification token
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Store verification token
    const { error: tokenError } = await supabaseAdmin
      .from('email_verification_tokens')
      .insert({
        user_id: authUserId,
        token,
        email,
        expires_at: expiresAt.toISOString(),
      });

    if (tokenError) {
      console.error('Token creation error:', tokenError);
      return NextResponse.json(
        { error: 'Failed to create verification token' },
        { status: 500 }
      );
    }

    // Send verification email
    const emailResult = await sendVerificationEmail(email, token);
    
    if (!emailResult.success) {
      console.error('Email send error:', emailResult);
      return NextResponse.json(
        { error: 'Account created but verification email failed. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Account created. Please verify your email.',
      userId: authUserId,
    });
  } catch (error) {
    console.error('Signup error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: 'Internal server error', details: errorMessage },
      { status: 500 }
    );
  }
}
