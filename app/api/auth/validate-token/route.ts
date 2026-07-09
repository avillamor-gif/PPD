import { supabaseAdmin } from '@/lib/supabase-admin';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();

    console.log('🔐 [VALIDATE-TOKEN] Request received with token:', { tokenLength: token?.length, token });

    if (!token) {
      console.error('🔐 [VALIDATE-TOKEN] No token provided');
      return NextResponse.json(
        { error: 'Token is required', valid: false },
        { status: 400 }
      );
    }

    console.log('🔐 [VALIDATE-TOKEN] Validating token...');

    // Query all users to find one with matching token (this is slow but works without a separate tokens table)
    const { data: responseData, error: queryError } = await supabaseAdmin.auth.admin.listUsers();

    console.log('🔐 [VALIDATE-TOKEN] listUsers response:', { 
      hasError: !!queryError,
      responseDataType: typeof responseData,
      responseDataKeys: responseData ? Object.keys(responseData) : 'N/A',
      isUsersProp: responseData?.users ? 'yes' : 'no'
    });

    if (queryError) {
      console.error('🔐 [VALIDATE-TOKEN] Query error:', queryError.message);
      return NextResponse.json(
        { error: 'Token validation failed', valid: false },
        { status: 500 }
      );
    }

    // Handle the response structure: responseData has a users property
    const users = responseData?.users || responseData;

    if (!users || !Array.isArray(users)) {
      console.error('🔐 [VALIDATE-TOKEN] Users is not an array:', { 
        hasUsers: !!users,
        isArray: Array.isArray(users),
        type: typeof users,
        usersKeys: typeof users === 'object' ? Object.keys(users) : 'N/A'
      });
      return NextResponse.json(
        { error: 'Token validation failed', valid: false },
        { status: 500 }
      );
    }

    console.log('🔐 [VALIDATE-TOKEN] Searching through', users.length, 'users for matching token');

    // Find user with matching token
    const user = users.find((u: any) => {
      const userToken = u.user_metadata?.verification_token;
      const matches = userToken === token;
      if (matches) {
        console.log('🔐 [VALIDATE-TOKEN] Found matching user:', u.id);
      }
      return matches;
    });

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
