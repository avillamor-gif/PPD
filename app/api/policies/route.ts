import { NextRequest, NextResponse } from 'next/server';
import { validatePolicy, generatePolicyId, generateSlugFromTitle } from '@/lib/utils/validation';
import { supabaseAdmin } from '@/lib/supabase-admin';

/**
 * POST /api/policies
 * 
 * Handles policy submission.
 * Saves to Supabase database.
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

    // Generate ID from slug (based on title)
    const slug = generateSlugFromTitle(body.title);
    const id = slug;

    // Prepare data for Supabase
    const policyData = {
      id,
      ...body,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Save to Supabase
    const { data, error } = await supabaseAdmin
      .from('policies')
      .insert([policyData])
      .select();

    if (error) {
      console.error('Supabase error:', error);
      throw new Error(error.message || 'Failed to save policy to database');
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Policy submitted successfully',
        data: data?.[0] || policyData,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Fetch policies from Supabase
    const { data, error } = await supabaseAdmin
      .from('policies')
      .select('*')
      .order('year', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      throw new Error(error.message || 'Failed to fetch policies');
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

