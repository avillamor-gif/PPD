import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return Response.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Create admin client
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Send password reset email
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password: 'temp_password_to_be_reset',
      email_confirm: true,
    });

    if (error) {
      // User might already exist, try sending reset email instead
      const resetResult = await supabase.auth.admin.generateLink({
        type: 'recovery',
        email: email,
        options: {
          redirectTo: `${new URL(request.url).origin}/auth/reset-password?type=recovery`,
        },
      });

      if (resetResult.error) {
        console.error('Password reset error:', resetResult.error);
        return Response.json(
          { error: resetResult.error.message || 'Failed to send reset link' },
          { status: 400 }
        );
      }

      return Response.json({
        success: true,
        message: 'Password reset link sent to your email',
      });
    }

    return Response.json({
      success: true,
      message: 'Password reset link sent to your email',
    });
  } catch (error) {
    console.error('Error in password reset:', error);
    return Response.json(
      { error: (error as Error).message || 'An error occurred' },
      { status: 500 }
    );
  }
}
