import { supabaseAdmin } from '@/lib/supabase-admin';
import config from '@/lib/config';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json();

    // Validate inputs
    if (!token || !password) {
      return NextResponse.json(
        { error: 'Token and password are required' },
        { status: 400 }
      );
    }

    if (password.length < config.auth.passwordMinLength) {
      return NextResponse.json(
        { error: `Password must be at least ${config.auth.passwordMinLength} characters` },
        { status: 400 }
      );
    }

    console.log('🔐 [SET-PASSWORD] Setting password with token...');

    // Find user with matching token
    const { data: users, error: queryError } = await supabaseAdmin.auth.admin.listUsers();

    if (queryError || !users) {
      console.error('🔐 [SET-PASSWORD] Failed to list users:', queryError);
      return NextResponse.json(
        { error: 'Failed to set password', valid: false },
        { status: 500 }
      );
    }

    // Find user by token
    const user = users.find((u: any) => u.user_metadata?.verification_token === token);

    if (!user) {
      console.log('🔐 [SET-PASSWORD] No user found with this token');
      return NextResponse.json(
        { error: 'Invalid token', valid: false },
        { status: 401 }
      );
    }

    // Check if token is expired
    const expiresAt = user.user_metadata?.token_expires_at;
    if (expiresAt && new Date(expiresAt) < new Date()) {
      console.log('🔐 [SET-PASSWORD] Token expired');
      return NextResponse.json(
        { error: 'Token has expired. Please sign up again.', valid: false },
        { status: 401 }
      );
    }

    console.log('🔐 [SET-PASSWORD] Token valid, updating user:', user.id);

    // Update user password and mark email as verified
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
      password,
      email_confirm: true,
      user_metadata: {
        ...user.user_metadata,
        verification_token: null, // Clear the token
        token_expires_at: null,
        password_set: true, // Mark password as set
      },
    });

    if (updateError) {
      console.error('🔐 [SET-PASSWORD] Update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update password', valid: false },
        { status: 500 }
      );
    }

    console.log('✅ [SET-PASSWORD] Password updated and email verified for user:', user.id);

    // Update user_profiles to mark email as verified
    const { error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .update({ email_verified: true })
      .eq('id', user.id);

    if (profileError) {
      console.warn('⚠️ [SET-PASSWORD] Profile update error (non-critical):', profileError);
    } else {
      console.log('✅ [SET-PASSWORD] User profile marked as verified');
    }

    return NextResponse.json({
      success: true,
      message: 'Password set successfully. You can now login.',
      email: user.email,
    });
  } catch (error) {
    console.error('🔐 [SET-PASSWORD] Error:', error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
