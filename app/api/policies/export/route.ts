import { supabaseAdmin } from '@/lib/supabase-admin';
import { formatPoliciesToExcel, PolicyExportData } from '@/lib/export';
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      {
        cookies: {
          get(name: string) {
            return req.cookies.get(name)?.value;
          },
        },
      }
    );

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required. Please log in to download policies.' },
        { status: 401 }
      );
    }

    const searchParams = req.nextUrl.searchParams;
    
    // Get filter parameters - handle multiple values
    const countries = searchParams.getAll('countries');
    const levels = searchParams.getAll('levels');
    const categories = searchParams.getAll('categories');
    const lifecycles = searchParams.getAll('lifecycles');
    const statuses = searchParams.getAll('statuses');
    const years = searchParams.getAll('years').map((y) => parseInt(y)).filter((y) => !isNaN(y));
    const search = searchParams.get('search');

    console.log('📥 [EXPORT] Policy export requested with filters:', {
      countries,
      levels,
      categories,
      lifecycles,
      statuses,
      years,
      search,
    });

    // Build query
    let query = supabaseAdmin
      .from('policies')
      .select('id, slug, title, year, country, level, category, status, lifecycle_stage, authority, link, summary, keywords, language');

    // Apply filters - use 'in' for multiple values
    if (statuses.length > 0) {
      query = query.in('status', statuses);
    }

    if (countries.length > 0) {
      query = query.in('country', countries);
    }

    if (levels.length > 0) {
      query = query.in('level', levels);
    }

    if (years.length > 0) {
      query = query.in('year', years);
    }

    if (categories.length > 0) {
      query = query.in('category', categories);
    }

    if (lifecycles.length > 0) {
      query = query.in('lifecycle_stage', lifecycles);
    }

    if (search) {
      query = query.or(
        `title.ilike.%${search}%,summary.ilike.%${search}%,keywords.ilike.%${search}%`
      );
    }

    // Order by country, year desc
    query = query.order('country', { ascending: true }).order('year', { ascending: false });

    // Execute query
    const { data: policies, error } = await query;

    if (error) {
      console.error('📥 [EXPORT] Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch policies' },
        { status: 500 }
      );
    }

    if (!policies || policies.length === 0) {
      return NextResponse.json(
        { error: 'No policies found matching the filters' },
        { status: 404 }
      );
    }

    console.log(`📥 [EXPORT] Found ${policies.length} policies, generating Excel...`);

    // Format policies for export
    const exportData: PolicyExportData[] = policies.map((p: any) => ({
      id: p.id,
      slug: p.slug,
      title: p.title,
      year: p.year,
      country: p.country,
      level: p.level,
      category: p.category,
      status: p.status,
      lifecycle_stage: p.lifecycle_stage,
      authority: p.authority,
      link: p.link,
      summary: p.summary,
      keywords: p.keywords,
      language: p.language,
    }));

    // Generate Excel file
    const buffer = await formatPoliciesToExcel(exportData);
    
    // Build filename with filter info
    const timestamp = new Date().toISOString().split('T')[0];
    const filenameParts = ['policies', timestamp];
    
    if (countries.length > 0) {
      filenameParts.push(`${countries.length}countries`);
    }
    if (categories.length > 0) {
      filenameParts.push(`${categories.length}categories`);
    }
    if (years.length > 0) {
      filenameParts.push(`${years.length}years`);
    }
    
    const filename = `${filenameParts.join('_')}.xlsx`;

    console.log(`✅ [EXPORT] Excel file generated: ${filename} (${buffer.length} bytes)`);

    // Convert Buffer to Uint8Array for NextResponse
    const uint8Array = new Uint8Array(buffer);

    // Return file as download
    return new NextResponse(uint8Array, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('📥 [EXPORT] Error generating export:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to generate export' },
      { status: 500 }
    );
  }
}
