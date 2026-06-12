import { NextRequest, NextResponse } from 'next/server';
import { validatePolicy, generatePolicyId } from '@/lib/utils/validation';

/**
 * POST /api/policies
 * 
 * Handles policy submission.
 * Ready for Supabase integration.
 * 
 * Expected body:
 * {
 *   title: string
 *   summary: string
 *   year: number
 *   country: string
 *   level: string
 *   category: string
 *   status: string
 *   instrument: string
 *   authority: string
 *   link: string
 *   language: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const errors = validatePolicy(body);
    if (errors.length > 0) {
      return NextResponse.json(
        { success: false, errors },
        { status: 400 }
      );
    }

    // Generate ID
    const id = generatePolicyId(body.country, body.year);

    // Prepare data for Supabase
    const policyData = {
      id,
      ...body,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // TODO: When Supabase is connected
    // const { data, error } = await supabase
    //   .from('policies')
    //   .insert([policyData]);
    //
    // if (error) throw error;
    //
    // return NextResponse.json(
    //   { success: true, data },
    //   { status: 201 }
    // );

    // For now, just log
    console.log('Policy submission:', policyData);

    return NextResponse.json(
      {
        success: true,
        message: 'Policy submitted successfully (Supabase integration pending)',
        data: policyData,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // TODO: When Supabase is connected
    // const { data, error } = await supabase
    //   .from('policies')
    //   .select('*')
    //   .order('year', { ascending: false });
    //
    // if (error) throw error;
    //
    // return NextResponse.json({ success: true, data });

    return NextResponse.json(
      { success: true, message: 'Supabase integration pending' },
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

