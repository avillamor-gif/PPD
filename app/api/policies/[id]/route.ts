import { NextRequest, NextResponse } from 'next/server';
import { validatePolicy } from '@/lib/utils/validation';
import { supabaseAdmin } from '@/lib/supabase-admin';

/**
 * GET /api/policies/[id]
 * 
 * Fetches a single policy entry from Supabase.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Fetch from Supabase
    const { data, error } = await supabaseAdmin
      .from('policies')
      .select()
      .eq('id', id)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { success: false, error: 'Policy not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/policies/[id]
 * 
 * Updates a policy entry in Supabase.
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Validate input
    const errors = validatePolicy(body);
    if (errors.length > 0) {
      return NextResponse.json(
        { success: false, errors },
        { status: 400 }
      );
    }

    // Prepare data for Supabase
    const policyData = {
      ...body,
      updated_at: new Date().toISOString(),
    };

    // Update in Supabase
    const { data, error } = await supabaseAdmin
      .from('policies')
      .update(policyData)
      .eq('id', id)
      .select();

    if (error) {
      console.error('Supabase error:', error);
      throw new Error(error.message || 'Failed to update policy');
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Policy updated successfully',
        data: data?.[0],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/policies/[id]
 * 
 * Deletes a policy entry from Supabase.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Delete from Supabase
    const { error } = await supabaseAdmin
      .from('policies')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Supabase error:', error);
      throw new Error(error.message || 'Failed to delete policy');
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Policy deleted successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
