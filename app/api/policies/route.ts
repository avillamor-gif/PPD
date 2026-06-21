import { NextRequest, NextResponse } from 'next/server';
import { validatePolicy, generatePolicyId, generateSlugFromTitle } from '@/lib/utils/validation';
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
 * Generates a unique slug by checking for duplicates and appending a counter if needed
 */
async function generateUniqueSlug(baseSlug: string, excludeId?: string): Promise<string> {
  // Check if base slug exists
  let query = supabaseAdmin
    .from('policies')
    .select('id', { count: 'exact', head: true })
    .eq('slug', baseSlug);
  
  if (excludeId) {
    query = query.neq('id', excludeId);
  }

  const { count, error } = await query;

  if (error) {
    console.error('Error checking slug uniqueness:', error);
    return baseSlug;
  }

  // If no duplicates, return base slug
  if (!count || count === 0) {
    return baseSlug;
  }

  // Append counter until unique
  let counter = 1;
  let uniqueSlug = `${baseSlug}-${counter}`;
  
  while (true) {
    let checkQuery = supabaseAdmin
      .from('policies')
      .select('id', { count: 'exact', head: true })
      .eq('slug', uniqueSlug);
    
    if (excludeId) {
      checkQuery = checkQuery.neq('id', excludeId);
    }

    const { count: duplicateCount } = await checkQuery;
    
    if (!duplicateCount || duplicateCount === 0) {
      return uniqueSlug;
    }
    
    counter++;
    uniqueSlug = `${baseSlug}-${counter}`;
  }
}

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

    // Generate ID from slug (based on title) with deduplication
    const baseSlug = generateSlugFromTitle(body.title);
    const uniqueSlug = await generateUniqueSlug(baseSlug);

    // Convert form data to database format (camelCase → snake_case)
    const convertedData = convertFormDataToDbFormat(body);

    // Prepare data for Supabase
    const policyData = {
      id: uniqueSlug,
      slug: uniqueSlug,
      ...convertedData,
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

