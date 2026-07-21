import { NextRequest, NextResponse } from 'next/server';
import { validatePolicy, generateSlugFromTitle } from '@/lib/utils/validation';
import { supabaseAdmin } from '@/lib/supabase-admin';

/**
 * Check if the request is from an admin user
 */
async function isAdminUser(request: NextRequest): Promise<boolean> {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      console.log('❌ [ADMIN CHECK] No auth header');
      return false;
    }

    const token = authHeader.slice(7);
    console.log('✓ [ADMIN CHECK] Token present');
    
    // Get user from Supabase using the token
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user?.id) {
      console.log('❌ [ADMIN CHECK] Auth error or no user:', { authError: authError?.message, userId: user?.id });
      return false;
    }

    console.log('✓ [ADMIN CHECK] User found:', user.id);

    // Check user role - get profile with role_id
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('role_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.role_id) {
      console.log('❌ [ADMIN CHECK] Profile error or no role_id:', { profileError: profileError?.message, roleId: profile?.role_id });
      return false;
    }

    console.log('✓ [ADMIN CHECK] Role ID found:', profile.role_id);

    // Get role name from roles table
    const { data: role, error: roleError } = await supabaseAdmin
      .from('roles')
      .select('name')
      .eq('id', profile.role_id)
      .single();
    
    if (roleError || !role) {
      console.log('❌ [ADMIN CHECK] Role error or not found:', { roleError: roleError?.message, role });
      return false;
    }

    console.log('✓ [ADMIN CHECK] Role check:', { roleId: profile.role_id, roleName: role.name, isAdmin: role.name === 'admin' });
    return role.name === 'admin';
  } catch (err) {
    console.error('❌ [ADMIN CHECK] Exception:', err);
    return false;
  }
}

function normalizePolicyDateFields(data: Record<string, any>) {
  const normalized: Record<string, any> = { ...data };

  const rawDate =
    typeof data.commencementDate === 'string'
      ? data.commencementDate
      : typeof data.commencement_date === 'string'
        ? data.commencement_date
        : '';

  if (rawDate) {
    const datePart = rawDate.slice(0, 10);
    if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
      normalized.commencementDate = datePart;
      normalized.year = parseInt(datePart.slice(0, 4), 10);
    }
  }

  if (!normalized.commencementDate && typeof normalized.year === 'number' && Number.isFinite(normalized.year)) {
    normalized.commencementDate = `${String(normalized.year).padStart(4, '0')}-01-01`;
  }

  if (typeof normalized.year === 'string' && normalized.year.trim()) {
    const parsedYear = parseInt(normalized.year, 10);
    if (!Number.isNaN(parsedYear)) {
      normalized.year = parsedYear;
    }
  }

  return normalized;
}

/**
 * Generates a unique slug by checking for duplicates and appending a counter if needed
 */
async function generateUniqueSlugForUpdate(baseSlug: string, excludeSlug: string): Promise<string> {
  // Check if base slug exists (excluding the current slug)
  let query = supabaseAdmin
    .from('policies')
    .select('id', { count: 'exact', head: true })
    .eq('slug', baseSlug)
    .neq('slug', excludeSlug);

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
      .eq('slug', uniqueSlug)
      .neq('slug', excludeSlug);

    const { count: duplicateCount } = await checkQuery;
    
    if (!duplicateCount || duplicateCount === 0) {
      return uniqueSlug;
    }
    
    counter++;
    uniqueSlug = `${baseSlug}-${counter}`;
  }
}

/**
 * Converts camelCase form fields to snake_case for database storage
 */
function convertFormDataToDbFormat(data: Record<string, any>) {
  const converted: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(data)) {
    // Map form field names to database column names
    if (key === 'otherLinks') {
      console.log('🔄 Converting otherLinks:', value);
      converted['other_links'] = value;
    } else if (key === 'commencementDate') {
      converted['commencement_date'] = value;
    } else if (key === 'lifecycleStages') {
      // Convert array to comma-separated string
      converted['lifecycle_stage'] = Array.isArray(value) ? value.join(', ') : value;
    } else {
      converted[key] = value;
    }
  }
  
  console.log('� [CONVERSION] Input keys:', Object.keys(data));
  console.log('🔄 [CONVERSION] Output keys:', Object.keys(converted));
  console.log('🔄 [CONVERSION] Converted values:', {
    other_links: converted['other_links'],
    keywords: converted['keywords'],
    lifecycle_stage: converted['lifecycle_stage'],
    category: converted['category']
  });
  
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

    console.log('📝 [PUT] Request to update policy:', { id, bodyKeys: Object.keys(body) });

    // Check if user is admin
    const isAdmin = await isAdminUser(request);
    console.log('📝 [PUT] Admin check result:', isAdmin);
    
    if (!isAdmin) {
      console.log('❌ [PUT] Not admin - rejecting request');
      return NextResponse.json(
        { success: false, error: 'Only administrators can update policies' },
        { status: 403 }
      );
    }

    console.log('✏️ [PUT] Incoming form data:', { 
      id, 
      otherLinks: body.otherLinks,
      other_links: body.other_links,
      keywords: body.keywords,
      lifecycleStages: body.lifecycleStages,
      lifecycle_stage: body.lifecycle_stage,
      allBodyKeys: Object.keys(body)
    });
    const normalizedBody = normalizePolicyDateFields(body);

    // Check if this is a status-only update (from PolicyImplementationStatus)
    const isStatusOnlyUpdate = Object.keys(body).length === 1 && (body.status || body.status === undefined);
    
    // Validate input only if it's a full policy update, not status-only
    if (!isStatusOnlyUpdate) {
      const errors = validatePolicy(normalizedBody);
      if (errors.length > 0) {
        return NextResponse.json(
          { success: false, errors },
          { status: 400 }
        );
      }
    }

    // Fetch current policy to check if title changed
    let currentPolicyResult = await supabaseAdmin
      .from('policies')
      .select('id, title, slug')
      .eq('slug', id)
      .single();

    // If not found by slug, try by id
    if (currentPolicyResult.error || !currentPolicyResult.data) {
      currentPolicyResult = await supabaseAdmin
        .from('policies')
        .select('id, title, slug')
        .eq('id', id)
        .single();
    }

    if (currentPolicyResult.error || !currentPolicyResult.data) {
      return NextResponse.json(
        { success: false, error: 'Policy not found' },
        { status: 404 }
      );
    }

    const currentPolicy = currentPolicyResult.data;
    const titleChanged = normalizedBody.title && normalizedBody.title !== currentPolicy.title;
    
    if (titleChanged) {
      console.log('✏️ [PUT] Title changed from "' + currentPolicy.title + '" to "' + normalizedBody.title + '", regenerating slug');
    }

    // Convert form data to database format (camelCase → snake_case)
    const convertedData = convertFormDataToDbFormat(normalizedBody);

    // Prepare data for Supabase
    const policyData = {
      ...convertedData,
      updated_at: new Date().toISOString(),
    } as any;

    // If title changed, generate new slug
    if (titleChanged) {
      const baseSlug = generateSlugFromTitle(normalizedBody.title);
      const newSlug = await generateUniqueSlugForUpdate(baseSlug, currentPolicy.slug);
      policyData.slug = newSlug;
      console.log('✏️ [PUT] New slug generated:', newSlug);
    }

    console.log('✏️ [PUT] After conversion:', { 
      id,
      titleChanged,
      newSlug: policyData.slug,
      other_links: (policyData as any).other_links,
      keywords: (policyData as any).keywords,
      lifecycle_stage: (policyData as any).lifecycle_stage,
      allDataKeys: Object.keys(policyData)
    });
    
    console.log('✏️ [PUT] Full policyData object:', JSON.stringify(policyData, null, 2));

    // Update in Supabase - try by slug first, then by id
    let result = await supabaseAdmin
      .from('policies')
      .update(policyData)
      .eq('slug', currentPolicy.slug)
      .select();

    // If not found by slug, try by id instead
    if (!result.data || result.data.length === 0) {
      result = await supabaseAdmin
        .from('policies')
        .update(policyData)
        .eq('id', currentPolicy.id)
        .select();
    }

    if (result.error) {
      console.error('Supabase error:', result.error);
      throw new Error(result.error.message || 'Failed to update policy');
    }

    console.log('✏️ [PUT] Supabase update response:', {
      success: !!result.data,
      returnedData: result.data?.[0] ? {
        other_links: (result.data[0] as any).other_links,
        keywords: (result.data[0] as any).keywords,
        lifecycle_stage: (result.data[0] as any).lifecycle_stage,
        category: (result.data[0] as any).category,
      } : null,
      fullResponse: result.data?.[0]
    });

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
