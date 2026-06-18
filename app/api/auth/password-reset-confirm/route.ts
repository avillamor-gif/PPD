import { supabaseAdmin } from '@/lib/supabase-admin';
import config from '@/lib/config';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { token, newPassword } = await req.json();

    if (!token || !newPassword) {
      return NextResponse.json(
        { error: 'Token and new password are required' },
        { status: 400 }
      );
    }

    if (newPassword.length < config.auth.passwordMinLength) {
      return NextResponse.json(
        { error: `Password must be at least ${config.auth.passwordMinLength} characters` },
        { status: 400 }
      );
    }

    // Find the password reset token
    const { data: tokenData, error: findError } = await supabaseAdmin
      .from('password_reset_tokens')
      .select('*')
      .eq('token', token)
      .single();

    if (findError || !tokenData) {
      return NextResponse.json(
        { error: 'Invalid or expired reset token' },
        { status: 400 }
      );
    }

    const data = tokenData as any;

    // Check if token is expired (1 hour)
    if (new Date(data.expires_at) < new Date()) {
      // Delete expired token
      await supabaseAdmin
        .from('password_reset_tokens')
        .delete()
        .eq('id', data.id);

      return NextResponse.json(
        { error: 'Reset token has expired. Please request a new one.' },
        { status: 400 }
      );
    }

    // Update user password
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(data.user_id, {
      password: newPassword,
    });

    if (updateError) {
      throw updateError;
    }

    // Delete the token after use
    await supabaseAdmin
      .from('password_reset_tokens')
      .delete()
      .eq('id', data.id);

    return NextResponse.json({
      success: true,
      message: 'Password reset successfully. You can now log in with your new password.',
    });
  } catch (error) {
    console.error('Password reset confirmation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
