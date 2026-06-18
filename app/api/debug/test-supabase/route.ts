import { supabaseAdmin } from '@/lib/supabase-admin';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('🧪 [DEBUG] Testing Supabase connection...');
    
    // Test 1: Check environment variables
    const hasUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
    const hasKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
    console.log('🧪 [DEBUG] Env vars:', { hasUrl, hasKey });

    // Test 2: Try to list users
    console.log('🧪 [DEBUG] Attempting to list users...');
    const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      console.error('🧪 [DEBUG] List users error:', {
        message: listError.message,
        status: listError.status,
        fullError: JSON.stringify(listError),
      });
      return NextResponse.json({
        error: 'Failed to list users',
        details: listError,
      }, { status: 500 });
    }

    console.log('🧪 [DEBUG] Successfully listed users:', users?.length ?? 0);

    // Test 3: Check if test user exists
    const testEmail = 'test@example.com';
    console.log('🧪 [DEBUG] Checking for test user:', testEmail);
    const testUser = users?.find((u: any) => u.email === testEmail);
    
    return NextResponse.json({
      success: true,
      connection: 'OK',
      userCount: users?.length ?? 0,
      testUserExists: !!testUser,
      env: {
        hasUrl,
        hasKey,
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 20) + '...',
      }
    });
  } catch (error) {
    console.error('🧪 [DEBUG] Test error:', error);
    return NextResponse.json({
      error: 'Test failed',
      message: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}
