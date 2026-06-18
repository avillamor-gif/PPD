import { supabaseAdmin } from '@/lib/supabase-admin';
import { sendVerificationEmail } from '@/lib/email';
import config from '@/lib/config';
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const { email, password, displayName } = await req.json();

    if (!email || !password || !displayName) {
      return NextResponse.json(
        { error: 'Email, password, and display name are required' },
        { status: 400 }
      );
    }

    if (password.length < config.auth.passwordMinLength) {
      return NextResponse.json(
        { error: `Password must be at least ${config.auth.passwordMinLength} characters` },
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

    try {
      // Create auth user - trigger will auto-create user_profiles + preferences
      console.log('🔐 [SIGNUP] Creating user in auth with email:', email);
      
      let user, authError;
      try {
        console.log('🔐 [SIGNUP] About to call createUser with:', { email, passwordLength: password.length });
        const result = await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: false,
          user_metadata: {
            full_name: displayName,
          },
        });
        user = result.data?.user;
        authError = result.error;
        console.log('🔐 [SIGNUP] Result from createUser:', { 
          userCreated: !!user, 
          userId: user?.id,
          errorExists: !!authError,
          errorMessage: authError?.message,
        });
      } catch (createError) {
        console.error('🔐 [SIGNUP] Exception during createUser:', {
          error: createError,
          message: createError instanceof Error ? createError.message : String(createError),
          stack: createError instanceof Error ? createError.stack : 'N/A',
        });
        const errorMsg = createError instanceof Error ? createError.message : String(createError);
        return NextResponse.json(
          { error: `Failed to create user: ${errorMsg}` },
          { status: 500 }
        );
      }

      if (authError) {
        console.error('🔐 [SIGNUP] Auth error returned:', {
          message: authError.message,
          status: authError.status,
          name: authError.name,
          code: (authError as any).code,
          statusCode: (authError as any).statusCode,
          fullError: JSON.stringify(authError),
          keys: Object.keys(authError),
        });
        const errorMsg = authError.message || (authError as any).code || JSON.stringify(authError) || 'Unknown auth error';
        const statusCode = authError.status || (authError as any).statusCode || 400;
        return NextResponse.json(
          { error: `Auth failed: ${errorMsg}` },
          { status: statusCode }
        );
      }

      if (!user) {
        console.error('🔐 [SIGNUP] No user returned from createUser');
        return NextResponse.json(
          { error: 'Failed to create user - no user returned' },
          { status: 400 }
        );
      }

      console.log('🔐 [SIGNUP] User successfully created:', user.id);

      // Manually create user_profiles and user_preferences since trigger may be blocked
      console.log('🔐 [SIGNUP] Creating user_profiles...');
      const { error: profileError } = await supabaseAdmin
        .from('user_profiles')
        .insert({
          id: user.id,
          display_name: displayName,
          email_verified: false,
        });

      if (profileError) {
        console.error('🔐 [SIGNUP] Profile creation error:', profileError);
      } else {
        console.log('🔐 [SIGNUP] User profile created successfully');
      }

      console.log('🔐 [SIGNUP] Creating user_preferences...');
      const { error: prefsError } = await supabaseAdmin
        .from('user_preferences')
        .insert({
          user_id: user.id,
        });

      if (prefsError) {
        console.error('🔐 [SIGNUP] Preferences creation error:', prefsError);
      } else {
        console.log('🔐 [SIGNUP] User preferences created successfully');
      }

      // Generate and send verification email
      console.log('🔐 [SIGNUP] Generating verification token...');
      const verificationToken = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + config.auth.emailVerificationExpiryHours * 60 * 60 * 1000);

      // Store token in database
      const { error: tokenError } = await supabaseAdmin
        .from('email_verification_tokens')
        .insert({
          user_id: user.id,
          token: verificationToken,
          email: user.email,
          expires_at: expiresAt.toISOString(),
        });

      if (tokenError) {
        console.error('🔐 [SIGNUP] Token storage error:', tokenError);
      } else {
        console.log('🔐 [SIGNUP] Verification token stored');
      }

      // Send verification email
      console.log('🔐 [SIGNUP] Sending verification email...');
      const { error: emailError } = await sendVerificationEmail(user.email, verificationToken);

      if (emailError) {
        console.error('🔐 [SIGNUP] Email send error:', emailError);
      } else {
        console.log('🔐 [SIGNUP] Verification email sent successfully');
      }

      return NextResponse.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
        },
        message: 'Signup successful. Please verify your email.',
      });
    } catch (innerError) {
      console.error('🔐 [SIGNUP] Outer inner catch:', {
        error: innerError,
        message: innerError instanceof Error ? innerError.message : String(innerError),
        stack: innerError instanceof Error ? innerError.stack : 'no stack',
      });
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
