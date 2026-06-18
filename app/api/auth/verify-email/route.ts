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

    console.log('🔐 [VERIFY] Token is valid, marking email as verified...');

    // Update user_profiles to mark email as verified
    const { error: profileUpdateError } = await supabaseAdmin
      .from('user_profiles')
      .update({ email_verified: true })
      .eq('id', data.user_id);

    if (profileUpdateError) {
      console.error('🔐 [VERIFY] Profile update error:', profileUpdateError);
    } else {
      console.log('🔐 [VERIFY] User profile marked as verified');
    }

    // Update auth.users.email_confirmed directly via SQL (bypasses RLS issues)
    console.log('🔐 [VERIFY] Marking email confirmed in auth.users via SQL...');
    const { error: sqlError } = await supabaseAdmin.rpc('update_user_email_confirmed', {
      user_id: data.user_id,
    });

    if (sqlError) {
      // Fallback: try the admin API
      console.warn('🔐 [VERIFY] RPC failed, trying admin API:', sqlError?.message);
      const { error: authUpdateError } = await supabaseAdmin.auth.admin.updateUserById(data.user_id, {
        email_confirm: true,
      });
      if (authUpdateError) {
        console.warn('🔐 [VERIFY] Admin API also failed:', authUpdateError?.message);
      } else {
        console.log('🔐 [VERIFY] Auth user email confirmed via admin API');
      }
    } else {
      console.log('🔐 [VERIFY] Auth user email confirmed via RPC');
    }

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
