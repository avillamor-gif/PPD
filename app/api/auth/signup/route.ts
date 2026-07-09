import { supabaseAdmin } from '@/lib/supabase-admin';
import { sendSetPasswordEmail } from '@/lib/email';
import config from '@/lib/config';
import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const { email, displayName } = await req.json();

    // Validate required fields
    if (!email || !displayName) {
      return NextResponse.json(
        { error: 'Email and display name are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      );
    }

    console.log('🔐 [SIGNUP] Starting signup for:', email);

    // Generate verification token (valid for 24 hours)
    const verificationToken = randomBytes(32).toString('hex');
    const tokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    console.log('🔐 [SIGNUP] Generated verification token');

    try {
      // Create unverified user (no password yet)
      console.log('🔐 [SIGNUP] Creating unverified user in auth...');
      
      const result = await supabaseAdmin.auth.admin.createUser({
        email,
        password: randomBytes(16).toString('hex'), // Temporary password, won't be used
        email_confirm: false, // Not confirmed yet
        user_metadata: {
          display_name: displayName,
          verification_token: verificationToken,
          token_expires_at: tokenExpiresAt,
          password_set: false, // Flag for incomplete signup
        },
      });

      const user = result.data?.user;
      const authError = result.error;

      if (authError || !user) {
        const errorMsg = authError?.message || 'Failed to create user';
        console.error('🔐 [SIGNUP] Auth error:', errorMsg);
        return NextResponse.json(
          { error: errorMsg },
          { status: 400 }
        );
      }

      console.log('🔐 [SIGNUP] User created successfully:', user.id);

      // Create user profile
      console.log('🔐 [SIGNUP] Creating user profile...');
      const { error: profileError } = await supabaseAdmin
        .from('user_profiles')
        .insert({
          id: user.id,
          display_name: displayName,
          email_verified: false,
        });

      if (profileError) {
        console.warn('🔐 [SIGNUP] Profile creation error (non-critical):', profileError);
      } else {
        console.log('🔐 [SIGNUP] User profile created successfully');
      }

      // Create user preferences
      console.log('🔐 [SIGNUP] Creating user preferences...');
      const { error: prefsError } = await supabaseAdmin
        .from('user_preferences')
        .insert({
          user_id: user.id,
        });

      if (prefsError) {
        console.warn('🔐 [SIGNUP] Preferences creation error (non-critical):', prefsError);
      } else {
        console.log('🔐 [SIGNUP] User preferences created successfully');
      }

      // Send verification email with set-password link
      console.log('🔐 [SIGNUP] Sending set-password email to:', email);
      try {
        const emailResult = await sendSetPasswordEmail(email, displayName, verificationToken);
        console.log('📧 [SIGNUP] Set-password email sent successfully:', emailResult);
      } catch (emailError) {
        console.error('📧 [SIGNUP] Email sending FAILED:', {
          error: emailError,
          message: emailError instanceof Error ? emailError.message : String(emailError),
          stack: emailError instanceof Error ? emailError.stack : 'no stack',
        });
        // Don't fail the signup if email fails - user can request resend later
      }

      return NextResponse.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
        },
        message: 'Signup successful. Check your email to set your password.',
      }, { status: 201 });
    } catch (innerError) {
      console.error('🔐 [SIGNUP] Inner error:', innerError);
      const msg = innerError instanceof Error ? innerError.message : String(innerError);
      return NextResponse.json(
        { error: `Signup error: ${msg}` },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('🔐 [SIGNUP] Outer error:', error);
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Error: ${msg}` },
      { status: 500 }
    );
  }
}
