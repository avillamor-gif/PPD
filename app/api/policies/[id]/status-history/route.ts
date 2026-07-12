import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Fetch status history ordered by change_date descending
    const { data, error } = await supabaseAdmin
      .from('policy_status_history')
      .select('*')
      .eq('policy_id', id)
      .order('change_date', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }
    
    return NextResponse.json(data || []);
  } catch (err) {
    console.error('Error fetching status history:', err);
    return NextResponse.json(
      { error: 'Failed to fetch status history', details: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { oldStatus, newStatus, changeDate, notes } = await req.json();

    if (!newStatus || !changeDate) {
      return NextResponse.json(
        { error: 'Status and change date are required' },
        { status: 400 }
      );
    }

    // Get current user
    const authHeader = req.headers.get('authorization');
    let userId = null;
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      const { data: { user } } = await supabaseAdmin.auth.getUser(token);
      userId = user?.id;
    }

    // Add to status history
    const { data, error } = await supabaseAdmin
      .from('policy_status_history')
      .insert({
        policy_id: id,
        old_status: oldStatus || null,
        new_status: newStatus,
        change_date: changeDate,
        notes: notes || null,
        recorded_by: userId,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    console.error('Error creating status history:', err);
    return NextResponse.json(
      { error: 'Failed to create status history' },
      { status: 500 }
    );
  }
}
