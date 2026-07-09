import { supabaseAdmin } from '@/lib/supabase-admin';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required', valid: false },
        { status: 400 }
      );
    }

    console.log('🔐 [VALIDATE-TOKEN] Validating token...');

    // Query all users to find one with matching token (this is slow but works without a separate tokens table)
    const { data: users, error: queryError } = await supabaseAdmin.auth.admin.listUsers();

    if (queryError || !users) {
      console.error('🔐 [VALIDATE-TOKEN] Failed to list users:', queryError);
      return NextResponse.json(
        { error: 'Token validation failed', valid: false },
        { status: 500 }
      );
    }

    // Find user with matching token
    const user = users.find((u: any) => u.user_metadata?.verification_token === token);

    if (!user) {
      console.log('🔐 [VALIDATE-TOKEN] No user found with this token');
      return NextResponse.json(
        { error: 'Invalid token', valid: false },
        { status: 401 }
      );
    }

    // Check if token is expired
    const expiresAt = user.user_metadata?.token_expires_at;
    if (expiresAt && new Date(expiresAt) < new Date()) {
      console.log('🔐 [VALIDATE-TOKEN] Token expired');
      return NextResponse.json(
        { error: 'Token has expired. Please sign up again.', valid: false },
        { status: 401 }
      );
    }

    console.log('🔐 [VALIDATE-TOKEN] Token is valid for user:', user.id);

    return NextResponse.json({
      valid: true,
      userId: user.id,
      email: user.email,
    });
  } catch (error) {
    console.error('🔐 [VALIDATE-TOKEN] Error:', error);
    return NextResponse.json(
      { error: (error as Error).message, valid: false },
      { status: 500 }
    );
  }
}
