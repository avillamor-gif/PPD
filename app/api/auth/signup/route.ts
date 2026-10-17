import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

// Helper function to convert Supabase errors to user-friendly messages
function getHumanReadableError(error: any): string {
  const message = error?.message || '';
  
  // Email-related errors
  if (message.includes('already registered') || message.includes('User already exists')) {
    return 'This email is already registered. Please use a different email or try logging in.';
  }
  if (message.includes('invalid email') || message.includes('Invalid email')) {
    return 'Please enter a valid email address.';
  }
  
  // Password-related errors
  if (message.includes('weak')) {
    return 'Password is too weak. Please use a stronger password.';
  }
  if (message.includes('password')) {
    return 'Password must be at least 8 characters long.';
  }
  
  // Network/connection errors
  if (message.includes('network') || message.includes('timeout')) {
    return 'Connection error. Please check your internet and try again.';
  }
  
  return 'Account creation failed. Please try again.';
}

export async function POST(req: NextRequest) {
  try {
    const { email, password, displayName } = await req.json();

    // Validation
    if (!email || !password || !displayName) {
      return NextResponse.json(
        { error: 'Email, password, and display name are all required' },
        { status: 400 }
      );
    }

    if (!email.includes('@') || !email.includes('.')) {
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    if (displayName.trim().length < 2) {
      return NextResponse.json(
        { error: 'Display name must be at least 2 characters' },
        { status: 400 }
      );
    }

    // 1. Create auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email to skip verification
    });

    if (authError) {
      console.error('❌ Auth creation error:', {
        message: authError.message,
        code: authError.code,
      });
      return NextResponse.json(
        { error: getHumanReadableError(authError) },
        { status: 400 }
      );
    }

    if (!authData?.user?.id) {
      return NextResponse.json(
        { error: 'Account creation failed. Please try again.' },
        { status: 500 }
      );
    }

    const authUserId = authData.user.id;
    console.log('✅ Auth user created:', authUserId);

    // 2. Create or update user profile
    const { error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .upsert({
        id: authUserId,
        display_name: displayName,
        email_verified: false,
      }, { onConflict: 'id' });

    if (profileError) {
      console.error('❌ Profile creation error:', {
        message: profileError.message,
        code: profileError.code,
        details: profileError.details,
        hint: profileError.hint,
      });
      // Clean up auth user on profile creation failure
      try {
        console.log('🧹 Cleaning up auth user:', authUserId);
        await supabaseAdmin.auth.admin.deleteUser(authUserId);
        console.log('✅ Auth user deleted');
      } catch (deleteErr) {
        console.error('❌ Error cleaning up auth user:', deleteErr);
      }
      
      return NextResponse.json(
        { 
          error: 'Failed to set up your profile. Please try again.',
          debug: {
            code: profileError.code,
            message: profileError.message,
            details: profileError.details,
            hint: profileError.hint,
          },
        },
        { status: 500 }
      );
    }

    // Success! Account created and email auto-verified
    return NextResponse.json({
      success: true,
      message: 'Account created successfully! You can now log in.',
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
