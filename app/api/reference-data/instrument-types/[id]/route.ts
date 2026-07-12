import { supabaseAdmin } from '@/lib/supabase-admin';
import { NextRequest, NextResponse } from 'next/server';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { name } = await request.json();

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('instrument_types')
      .update({ name: name.trim() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Clear the reference data cache after update
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating instrument type:', error);
    return NextResponse.json(
      { error: 'Failed to update instrument type' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { error } = await supabaseAdmin
      .from('instrument_types')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting instrument type:', error);
    return NextResponse.json(
      { error: 'Failed to delete instrument type' },
      { status: 500 }
    );
  }
}
