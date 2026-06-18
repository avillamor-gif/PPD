import { supabaseAdmin } from '@/lib/supabase-admin';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      );
    }

    // Find the verification token
    const { data: tokenData, error: findError } = await supabaseAdmin
      .from('email_verification_tokens')
      .select('*')
      .eq('token', token)
      .single();

    if (findError || !tokenData) {
      return NextResponse.json(
        { error: 'Invalid or expired verification token' },
        { status: 400 }
      );
    }

    const data = tokenData as any;

    // Check if token is expired
    if (new Date(data.expires_at) < new Date()) {
      // Delete expired token
      await supabaseAdmin
        .from('email_verification_tokens')
        .delete()
        .eq('id', data.id);

      return NextResponse.json(
        { error: 'Verification token has expired' },
        { status: 400 }
      );
    }

    // Mark email as verified in auth
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(data.user_id, {
      email_confirm: true,
    });

    if (updateError) {
      throw updateError;
    }

    // Delete the token after use
    await supabaseAdmin
      .from('email_verification_tokens')
      .delete()
      .eq('id', data.id);

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully',
    });
  } catch (error) {
    console.error('Email verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
