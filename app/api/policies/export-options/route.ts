import { supabaseAdmin } from '@/lib/supabase-admin';
import { COUNTRIES } from '@/lib/constants/policies';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Get distinct countries
    const { data: countriesData, error: countriesError } = await supabaseAdmin
      .from('policies')
      .select('country')
      .order('country');

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

    if (countriesError || categoriesError || lifecyclesError || statusesError) {
      console.error('Database errors:', {
        countriesError,
        categoriesError,
        lifecyclesError,
        statusesError,
      });
      return NextResponse.json(
        { error: 'Failed to fetch export options' },
        { status: 500 }
      );
    }

    // Extract unique country codes and map to names
    const countryCodes = Array.from(
      new Set(countriesData?.map((p: any) => p.country).filter(Boolean) || [])
    );
    
    const countryNames = countryCodes
      .map(code => {
        const country = COUNTRIES.find(c => c.code === code);
        return country?.name || code;
      })
      .sort();

    // Extract unique regions from country data
    const regions = Array.from(
      new Set(
        countryCodes
          .map(code => {
            const country = COUNTRIES.find(c => c.code === code);
            return country?.region;
          })
          .filter(Boolean)
      )
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
      countries: countryNames,
      regions,
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
