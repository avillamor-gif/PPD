import { supabaseAdmin } from '@/lib/supabase-admin';
import { formatPoliciesToExcel, generateFilename, PolicyExportData } from '@/lib/export';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    
    // Get filter parameters
    const country = searchParams.get('country');
    const region = searchParams.get('region');
    const year = searchParams.get('year');
    const category = searchParams.get('category');
    const status = searchParams.get('status');
    const lifecycle = searchParams.get('lifecycle');
    const search = searchParams.get('search');

    console.log('📥 [EXPORT] Policy export requested with filters:', {
      country,
      region,
      year,
      category,
      status,
      lifecycle,
      search,
    });

    // Build query
    let query = supabaseAdmin
      .from('policies')
      .select('id, slug, title, year, country, level, category, status, lifecycle_stage, authority, link, summary, keywords, language')
      .eq('status', 'Enacted'); // Only export enacted policies

    // Apply filters
    if (country) {
      query = query.eq('country', country);
    }

    if (region) {
      query = query.eq('level', region);
    }

    if (year) {
      query = query.eq('year', parseInt(year));
    }

    if (category) {
      query = query.eq('category', category);
    }

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (lifecycle) {
      query = query.eq('lifecycle_stage', lifecycle);
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
    const filename = generateFilename({
      country: country || undefined,
      year: year ? parseInt(year) : undefined,
      category: category || undefined,
    });

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
