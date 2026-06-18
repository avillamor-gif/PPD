import { supabaseAdmin } from '@/lib/supabase-admin';
import config from '@/lib/config';
import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';

// Generate a password reset token and store it
export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Find user by email
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();

    if (listError || !users) {
      return NextResponse.json(
        { error: 'Failed to find user' },
        { status: 400 }
      );
    }

    const user = users.find((u: any) => u.email === email);

    if (!user) {
      // Don't reveal if user exists or not (security)
      return NextResponse.json({
        success: true,
        message: 'If an account exists with this email, a reset link has been sent',
      });
    }

    // Generate reset token
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + config.auth.passwordResetExpiryHours * 60 * 60 * 1000);

    // Store reset token
    const { error: insertError } = await supabaseAdmin
      .from('password_reset_tokens')
      .insert({
        user_id: user.id,
        token,
        email,
        expires_at: expiresAt.toISOString(),
      } as any);

    if (insertError) {
      throw insertError;
    }

    // Send reset email
    const resetUrl = `${config.app.url}/auth/reset-password?token=${token}`;
    const mailResult = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: config.email.from,
        to: email,
        subject: `Reset your password - ${config.email.appName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #E88860;">Password Reset Request</h2>
            <p>We received a request to reset your password. Click the button below to create a new password:</p>
            <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #1B72A8; color: white; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: bold;">Reset Password</a>
            <p style="color: #666; font-size: 14px;">Or paste this link in your browser: ${resetUrl}</p>
            <p style="color: #999; font-size: 12px;">This link expires in 1 hour. If you didn't request a password reset, you can safely ignore this email.</p>
          </div>
        `,
      }),
    });

    if (!mailResult.ok) {
      console.error('Failed to send reset email:', await mailResult.text());
      // Still return success to not leak email existence
    }

    return NextResponse.json({
      success: true,
      message: 'If an account exists with this email, a reset link has been sent',
    });
  } catch (error) {
    console.error('Password reset request error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
