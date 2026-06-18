import { supabaseAdmin } from '@/lib/supabase-admin';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();

    console.log('🔐 [VERIFY] Starting email verification...');
    if (!token) {
      console.error('🔐 [VERIFY] Token is required');
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      );
    }

    console.log('🔐 [VERIFY] Token received:', token.substring(0, 20) + '...');

    // Find the verification token
    const { data: tokenData, error: findError } = await supabaseAdmin
      .from('email_verification_tokens')
      .select('*')
      .eq('token', token)
      .single();

    if (findError) {
      console.error('🔐 [VERIFY] Token lookup error:', findError);
    }

    if (findError || !tokenData) {
      console.error('🔐 [VERIFY] Invalid or expired token - findError:', findError, 'tokenData:', tokenData);
      return NextResponse.json(
        { error: 'Invalid or expired verification token' },
        { status: 400 }
      );
    }

    const data = tokenData as any;
    console.log('🔐 [VERIFY] Token found for user:', data.user_id, 'email:', data.email);

    // Check if token is expired
    if (new Date(data.expires_at) < new Date()) {
      console.log('🔐 [VERIFY] Token is expired');
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

    console.log('🔐 [VERIFY] Token is valid, updating auth user...');

    // Mark email as verified in auth
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(data.user_id, {
      email_confirm: true,
    });

    if (updateError) {
      console.error('🔐 [VERIFY] Auth update error:', updateError);
      throw updateError;
    }

    console.log('🔐 [VERIFY] Auth user updated successfully');

    // Delete the token after use
    const { error: deleteError } = await supabaseAdmin
      .from('email_verification_tokens')
      .delete()
      .eq('id', data.id);

    if (deleteError) {
      console.error('🔐 [VERIFY] Token delete error:', deleteError);
    } else {
      console.log('🔐 [VERIFY] Token deleted successfully');
    }

    console.log('🔐 [VERIFY] Email verification complete');

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully',
    });
  } catch (error) {
    console.error('🔐 [VERIFY] Error:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : 'no stack',
      error,
    });
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
