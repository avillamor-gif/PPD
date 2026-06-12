import { NextRequest, NextResponse } from 'next/server';
import { validatePolicy } from '@/lib/utils/validation';

/**
 * PUT /api/policies/[id]
 * 
 * Updates a policy entry.
 * Ready for Supabase integration.
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

    // TODO: When Supabase is connected
    // const { data, error } = await supabase
    //   .from('policies')
    //   .update(policyData)
    //   .eq('id', id);
    //
    // if (error) throw error;
    //
    // return NextResponse.json(
    //   { success: true, message: 'Policy updated successfully', data },
    //   { status: 200 }
    // );

    console.log('Policy update:', id, policyData);

    return NextResponse.json(
      {
        success: true,
        message: 'Policy updated successfully (Supabase integration pending)',
        data: policyData,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/policies/[id]
 * 
 * Deletes a policy entry.
 * Ready for Supabase integration.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // TODO: When Supabase is connected
    // const { error } = await supabase
    //   .from('policies')
    //   .delete()
    //   .eq('id', id);
    //
    // if (error) throw error;
    //
    // return NextResponse.json(
    //   { success: true, message: 'Policy deleted successfully' },
    //   { status: 200 }
    // );

    console.log('Policy delete:', id);

    return NextResponse.json(
      {
        success: true,
        message: 'Policy deleted successfully (Supabase integration pending)',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
