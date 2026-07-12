import { supabaseAdmin } from '@/lib/supabase-admin';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('instrument_types')
      .select('id, name')
      .order('name');

    if (error) throw error;

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Error fetching instrument types:', error);
    return NextResponse.json(
      { error: 'Failed to fetch instrument types' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name } = await request.json();

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('instrument_types')
      .insert({ name: name.trim() })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Error creating instrument type:', error);
    return NextResponse.json(
      { error: 'Failed to create instrument type' },
      { status: 500 }
    );
  }
}
