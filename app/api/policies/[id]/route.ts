import { NextRequest, NextResponse } from 'next/server';
import { validatePolicy } from '@/lib/utils/validation';
import { supabaseAdmin } from '@/lib/supabase-admin';

/**
 * Converts camelCase form fields to snake_case for database storage
 */
function convertFormDataToDbFormat(data: Record<string, any>) {
  const converted: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(data)) {
    // Map form field names to database column names
    if (key === 'otherLinks') {
      converted['other_links'] = value;
    } else {
      converted[key] = value;
    }
  }
  
  return converted;
}

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

    // Try to fetch by slug first, then by id
    let { data, error } = await supabaseAdmin
      .from('policies')
      .select()
      .eq('slug', id)
      .single();

    // If not found by slug, try by id
    if (error || !data) {
      const result = await supabaseAdmin
        .from('policies')
        .select()
        .eq('id', id)
        .single();
      data = result.data;
      error = result.error;
    }

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

    // Convert form data to database format (camelCase → snake_case)
    const convertedData = convertFormDataToDbFormat(body);

    // Prepare data for Supabase
    const policyData = {
      ...convertedData,
      updated_at: new Date().toISOString(),
    };

    // Update in Supabase - try by slug first, then by id
    let result = await supabaseAdmin
      .from('policies')
      .update(policyData)
      .eq('slug', id)
      .select();

    // If not found by slug, try by id
    if ((!result.data || result.data.length === 0) && result.error?.code === 'PGRST116') {
      result = await supabaseAdmin
        .from('policies')
        .update(policyData)
        .eq('id', id)
        .select();
    }

    if (result.error) {
      console.error('Supabase error:', result.error);
      throw new Error(result.error.message || 'Failed to update policy');
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Policy updated successfully',
        data: result.data?.[0],
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
    
    // Delete from Supabase - try by slug first, then by id
    let result = await supabaseAdmin
      .from('policies')
      .delete()
      .eq('slug', id);

    // If not found by slug, try by id
    if (result.error?.code === 'PGRST116') {
      result = await supabaseAdmin
        .from('policies')
        .delete()
        .eq('id', id);
    }

    if (result.error) {
      console.error('Supabase error:', result.error);
      throw new Error(result.error.message || 'Failed to delete policy');
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
