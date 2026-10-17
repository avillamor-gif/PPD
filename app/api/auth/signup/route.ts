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
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: false,
    });

    if (authError || !authData?.user) {
      console.error('Auth creation error:', authError);
      const message = authError?.message || 'Failed to create account';
      // Handle email already registered error
      if (message.includes('already') || message.includes('exist')) {
        return NextResponse.json(
          { error: 'Email already registered' },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: message },
        { status: 500 }
      );
    }

    // Create user profile with display name and Expert role (role_id = 3)
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .insert({
        id: authData.user.id,
        display_name: displayName,
        email_verified: false,
        role_id: 3, // Expert role
      })
      .select();

    if (profileError) {
      console.error('Profile creation error:', {
        message: profileError.message,
        code: profileError.code,
        details: profileError.details,
        hint: profileError.hint,
      });
      // Try to clean up the auth user
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
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
        user_id: authData.user.id,
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
      userId: authData.user.id,
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
