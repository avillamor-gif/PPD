import { supabaseAdmin } from '@/lib/supabase-admin';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Get distinct countries
    const { data: countriesData, error: countriesError } = await supabaseAdmin
      .from('policies')
      .select('country')
      .order('country');

    // Get distinct regions/levels
    const { data: levelsData, error: levelsError } = await supabaseAdmin
      .from('policies')
      .select('level')
      .order('level');

    // Get distinct categories
    const { data: categoriesData, error: categoriesError } = await supabaseAdmin
      .from('policies')
      .select('category')
      .order('category');

    // Get distinct lifecycle stages
    const { data: lifecyclesData, error: lifecyclesError } = await supabaseAdmin
      .from('policies')
      .select('lifecycle_stage')
      .order('lifecycle_stage');

    // Get distinct statuses
    const { data: statusesData, error: statusesError } = await supabaseAdmin
      .from('policies')
      .select('status')
      .order('status');

    if (countriesError || levelsError || categoriesError || lifecyclesError || statusesError) {
      console.error('Database errors:', {
        countriesError,
        levelsError,
        categoriesError,
        lifecyclesError,
        statusesError,
      });
      return NextResponse.json(
        { error: 'Failed to fetch export options' },
        { status: 500 }
      );
    }

    // Extract unique values
    const countries = Array.from(
      new Set(countriesData?.map((p: any) => p.country).filter(Boolean) || [])
    ).sort();

    const levels = Array.from(
      new Set(levelsData?.map((p: any) => p.level).filter(Boolean) || [])
    ).sort();

    const categories = Array.from(
      new Set(categoriesData?.map((p: any) => p.category).filter(Boolean) || [])
    ).sort();

    const lifecycles = Array.from(
      new Set(
        lifecyclesData?.map((p: any) => p.lifecycle_stage).filter(Boolean) || []
      )
    ).sort();

    const statuses = Array.from(
      new Set(statusesData?.map((p: any) => p.status).filter(Boolean) || [])
    ).sort();

    // Get year range
    const { data: yearsData, error: yearsError } = await supabaseAdmin
      .from('policies')
      .select('year')
      .order('year', { ascending: false })
      .limit(1);

    const maxYear = yearsData?.[0]?.year || new Date().getFullYear();
    const minYear = Math.max(1990, maxYear - 30);
    const years = Array.from(
      { length: maxYear - minYear + 1 },
      (_, i) => maxYear - i
    );

    return NextResponse.json({
      countries,
      levels,
      categories,
      lifecycles,
      statuses,
      years,
    });
  } catch (error) {
    console.error('Error fetching export options:', error);
    return NextResponse.json(
      { error: 'Failed to fetch export options' },
      { status: 500 }
    );
  }
}
