import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(req: NextRequest) {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
      .eq('id', user.id)
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
