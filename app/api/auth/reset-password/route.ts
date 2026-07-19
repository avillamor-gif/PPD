import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Use server-side Supabase client with service role key
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Determine the correct redirect URL
    const isLocalhost = request.nextUrl.host.includes('localhost') || request.nextUrl.host.includes('127.0.0.1');
    const redirectTo = isLocalhost
      ? 'http://localhost:3000/auth/set-password'
      : 'https://ppd-pink.vercel.app/auth/set-password';

    console.log('🔄 [RESET-PASSWORD] Sending reset email to:', email);
    console.log('📧 [RESET-PASSWORD] Redirect URL:', redirectTo);
    console.log('🌍 [RESET-PASSWORD] Host:', request.nextUrl.host);

    // Use Supabase's native password reset email (no Resend restrictions!)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectTo,
    });

    if (error) {
      console.error('❌ [RESET-PASSWORD] Error:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    console.log('✅ [RESET-PASSWORD] Email sent successfully via Supabase');
    return NextResponse.json({
      success: true,
      message: 'Password reset email sent. Check your inbox.',
    });
  } catch (error: any) {
    console.error('❌ [RESET-PASSWORD] Exception:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send reset email' },
      { status: 500 }
    );
  }
}
