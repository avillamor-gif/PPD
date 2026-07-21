import { supabaseAdmin } from '@/lib/supabase-admin';
import { COUNTRIES } from '@/lib/constants/policies';
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
    const countryNames = searchParams.getAll('countries');
    const regionNames = searchParams.getAll('regions');
    const statuses = searchParams.getAll('statuses');
    const years = searchParams.getAll('years').map((y) => parseInt(y)).filter((y) => !isNaN(y));

    // Convert country names to codes
    const countryCodes = countryNames
      .map(name => {
        const country = COUNTRIES.find(c => c.name === name);
        return country?.code;
      })
      .filter(Boolean) as string[];

    // Convert region names to country codes
    const regionCountryCodes = regionNames.length > 0
      ? COUNTRIES
          .filter(c => regionNames.includes(c.region))
          .map(c => c.code)
      : [];

    // Combine country codes and region country codes
    const allCountryCodes = countryNames.length > 0 && regionNames.length > 0
      ? [...countryCodes, ...regionCountryCodes]
      : countryNames.length > 0
      ? countryCodes
      : regionNames.length > 0
      ? regionCountryCodes
      : [];

    console.log('📥 [EXPORT] Policy export requested with filters:', {
      countryNames,
      regionNames,
      allCountryCodes,
      statuses,
      years,
    });

    // Build query
    let query = supabaseAdmin
      .from('policies')
      .select('id, slug, title, year, country, level, category, status, lifecycle_stage, authority, link, summary, keywords, language');

    // Apply filters - use 'in' for multiple values
    if (statuses.length > 0) {
      query = query.in('status', statuses);
    }

    if (allCountryCodes.length > 0) {
      query = query.in('country', allCountryCodes);
    }

    if (years.length > 0) {
      query = query.in('year', years);
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
    
    if (countryNames.length > 0) {
      filenameParts.push(`${countryNames.length}countries`);
    }
    if (regionNames.length > 0) {
      filenameParts.push(`${regionNames.length}regions`);
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
