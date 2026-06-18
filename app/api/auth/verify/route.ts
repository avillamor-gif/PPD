// @ts-nocheck
import { supabaseAdmin } from '@/lib/supabase-admin';
import { sendVerificationEmail } from '@/lib/email';
import { randomBytes } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Generate token
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Get user by email
    const { data: { users }, error: userError } = await supabaseAdmin.auth.admin.listUsers();
    const user = users?.find((u: any) => u.email === email);

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Store verification token
    const { error: tokenError } = await supabaseAdmin
      .from('email_verification_tokens')
      .insert({
        user_id: user.id,
        token,
        email,
        expires_at: expiresAt.toISOString(),
      } as any);

    if (tokenError) throw tokenError;

    // Send email
    const result = await sendVerificationEmail(email, token);
    
    if (!result.success) {
      return NextResponse.json(
        { error: 'Failed to send verification email' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Verification email sent',
    });
  } catch (error) {
    console.error('Send verification email error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      );
    }

    // Find token
    const { data: tokenData, error: tokenError } = await supabaseAdmin
      .from('email_verification_tokens')
      .select('*')
      .eq('token', token)
      .single();

    if (tokenError || !tokenData) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 400 }
      );
    }

    const data = tokenData as any;

    // Check expiration
    if (new Date(data.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'Token expired' },
        { status: 400 }
      );
    }

    // Update user profile
    // @ts-ignore
    const { error: updateError } = await supabaseAdmin
      .from('user_profiles')
      .update({ email_verified: true })
      .eq('id', data.user_id);

    if (updateError) throw updateError;

    // Delete token
    await supabaseAdmin
      .from('email_verification_tokens')
      .delete()
      .eq('id', data.id);

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully',
    });
  } catch (error) {
    console.error('Verify email error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
