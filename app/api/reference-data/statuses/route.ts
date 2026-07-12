import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('policy_statuses')
      .select('id, name')
      .order('name');

    if (error) throw error;
    return NextResponse.json(data || []);
  } catch (err) {
    console.error('Error fetching statuses:', err);
    return NextResponse.json(
      { error: 'Failed to fetch statuses' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const { name } = await req.json();

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Status name is required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('policy_statuses')
      .insert({ name: name.trim() })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    console.error('Error creating status:', err);
    return NextResponse.json(
      { error: 'Failed to create status' },
      { status: 500 }
    );
  }
}
