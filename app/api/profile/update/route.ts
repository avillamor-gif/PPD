import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { createServerClient } from '@supabase/ssr';

export async function POST(req: NextRequest) {
  try {
    // Extract Authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.slice(7); // Remove 'Bearer ' prefix

    // Create server client to verify the token
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      {
        cookies: {
          get(name: string) {
            return req.cookies.get(name)?.value;
          },
        },
      }
    );

    // Set the auth token to verify the session
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user?.id) {
      console.error('Auth error:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = user.id;
    const body = await req.json();
    const { displayName, bio, organization, countryCode, socialLinks } = body;

    if (!displayName?.trim()) {
      return NextResponse.json({ error: 'Display name is required' }, { status: 400 });
    }

    // Use admin client to update profile (bypasses RLS for server-side operations)
    const { data, error } = await supabaseAdmin
      .from('user_profiles')
      .update({
        display_name: displayName.trim(),
        bio: bio || null,
        organization: organization || null,
        country_code: countryCode || null,
        social_links: socialLinks || {},
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Profile update error:', error);
      return NextResponse.json({ error: error.message || 'Failed to update profile' }, { status: 400 });
    }

    return NextResponse.json({ success: true, profile: data });
  } catch (error) {
    console.error('Profile update exception:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
