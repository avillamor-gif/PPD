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
    const { data: responseData, error: queryError } = await supabaseAdmin.auth.admin.listUsers();

    console.log('🔐 [SET-PASSWORD] listUsers response:', { 
      hasError: !!queryError,
      responseDataType: typeof responseData
    });

    if (queryError) {
      console.error('🔐 [SET-PASSWORD] Query error:', queryError.message);
      return NextResponse.json(
        { error: 'Failed to validate token', valid: false },
        { status: 500 }
      );
    }

    // Handle the response structure: responseData has a users property
    const users = responseData?.users || responseData;

    if (!users || !Array.isArray(users)) {
      console.error('🔐 [SET-PASSWORD] Users is not an array:', { 
        hasUsers: !!users,
        isArray: Array.isArray(users),
        type: typeof users
      });
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
    console.log('🔐 [SET-PASSWORD] Calling updateUserById with:', {
      userId: user.id,
      hasPassword: !!password,
      email_confirm: true
    });

    // Update user password
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
      password,
    });

    if (updateError) {
      const errorInfo = {
        name: updateError.name,
        message: updateError.message,
        status: (updateError as any).status,
        constructor: updateError.constructor.name,
        allKeys: Object.keys(updateError),
        allProps: Object.getOwnPropertyNames(updateError),
        stringified: JSON.stringify(updateError, null, 2),
        toString: updateError.toString(),
      };
      
      console.error('🔐 [SET-PASSWORD] Detailed Update Error:', errorInfo);
      
      return NextResponse.json(
        { 
          error: 'Failed to update password: ' + errorInfo.message || errorInfo.name,
          details: errorInfo,
          valid: false 
        },
        { status: 500 }
      );
    }

    // Now confirm the email by calling an RPC function
    console.log('🔐 [SET-PASSWORD] Password updated, now confirming email...');
    
    const { error: rpcError } = await supabaseAdmin.rpc('update_user_email_confirmed', {
      user_id: user.id,
    });

    if (rpcError) {
      console.warn('⚠️ [SET-PASSWORD] RPC error confirming email (non-critical):', rpcError.message);
    } else {
      console.log('✅ [SET-PASSWORD] Email confirmed via RPC for user:', user.id);
    }

    console.log('✅ [SET-PASSWORD] Password updated for user:', user.id);

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

    // Generate a session for auto-login
    console.log('🔐 [SET-PASSWORD] Generating session for auto-login...');
    try {
      const { data: signInData, error: signInError } = await supabaseAdmin.auth.admin.signInAsUser(
        user.id,
        {
          autoConfirmFirstFactor: true,
        }
      );

      if (signInError) {
        console.warn('⚠️ [SET-PASSWORD] Session generation warning (non-blocking):', signInError.message);
        // Return without session - user will need to login manually
        return NextResponse.json({
          success: true,
          message: 'Password set successfully. Please login with your new credentials.',
          email: user.email,
          session: null,
        });
      }

      console.log('✅ [SET-PASSWORD] Session created successfully for user:', user.id);

      return NextResponse.json({
        success: true,
        message: 'Password set successfully. Logging you in...',
        email: user.email,
        session: signInData?.session,
      }, { status: 201 });
    } catch (sessionError) {
      console.error('🔐 [SET-PASSWORD] Session creation error:', sessionError);
      // Return success but without session
      return NextResponse.json({
        success: true,
        message: 'Password set successfully. Please login with your new credentials.',
        email: user.email,
        session: null,
      });
    }
  } catch (error) {
    console.error('🔐 [SET-PASSWORD] Error:', error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
