#!/usr/bin/env node

/**
 * Sync Countries to Supabase Database
 * Purpose: Ensures the countries table in Supabase matches the COUNTRIES array
 * This script should be run during initial setup and after any changes to the countries list
 */

import { createClient } from '@supabase/supabase-js';

// Countries data (matches lib/constants/policies.ts)
const COUNTRIES = [
  // Southeast Asia
  { code: 'ID', name: 'Indonesia', region: 'Southeast Asia' },
  { code: 'PH', name: 'Philippines', region: 'Southeast Asia' },
  { code: 'VN', name: 'Vietnam', region: 'Southeast Asia' },
  { code: 'TH', name: 'Thailand', region: 'Southeast Asia' },
  { code: 'MY', name: 'Malaysia', region: 'Southeast Asia' },
  { code: 'SG', name: 'Singapore', region: 'Southeast Asia' },
  { code: 'KH', name: 'Cambodia', region: 'Southeast Asia' },
  { code: 'LA', name: 'Laos', region: 'Southeast Asia' },
  { code: 'MM', name: 'Myanmar', region: 'Southeast Asia' },
  { code: 'BN', name: 'Brunei', region: 'Southeast Asia' },
  // South Asia
  { code: 'IN', name: 'India', region: 'South Asia' },
  { code: 'PK', name: 'Pakistan', region: 'South Asia' },
  { code: 'BD', name: 'Bangladesh', region: 'South Asia' },
  { code: 'LK', name: 'Sri Lanka', region: 'South Asia' },
  { code: 'NP', name: 'Nepal', region: 'South Asia' },
  { code: 'BT', name: 'Bhutan', region: 'South Asia' },
  // East Asia
  { code: 'JP', name: 'Japan', region: 'East Asia' },
  { code: 'KR', name: 'South Korea', region: 'East Asia' },
  { code: 'CN', name: 'Mainland China', region: 'East Asia' },
  { code: 'TW', name: 'Taiwan', region: 'East Asia' },
  { code: 'MN', name: 'Mongolia', region: 'East Asia' },
  // Oceania
  { code: 'AU', name: 'Australia', region: 'Oceania' },
  { code: 'NZ', name: 'New Zealand', region: 'Oceania' },
  { code: 'FJ', name: 'Fiji', region: 'Oceania' },
  { code: 'PG', name: 'Papua New Guinea', region: 'Oceania' },
  { code: 'SB', name: 'Solomon Islands', region: 'Oceania' },
];

async function syncCountries() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables are required');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log('🌍 Syncing countries to database...');

  try {
    // Delete old data (optional - comment out if you want to preserve custom entries)
    // const { error: deleteError } = await supabase.from('countries').delete().neq('code', 'XX');

    // Upsert all countries
    for (const country of COUNTRIES) {
      const { error } = await supabase
        .from('countries')
        .upsert([country], { onConflict: 'code' });

      if (error) {
        console.error(`❌ Error upserting ${country.code} (${country.name}):`, error.message);
        process.exit(1);
      }

      console.log(`✅ Synced: ${country.code} - ${country.name}`);
    }

    // Verify sync
    const { data: countries, error: fetchError } = await supabase
      .from('countries')
      .select('*')
      .order('code');

    if (fetchError) {
      console.error('❌ Error verifying sync:', fetchError.message);
      process.exit(1);
    }

    console.log(`\n✅ Successfully synced ${countries.length} countries to database`);
    console.log('Sample entries:');
    countries.slice(0, 3).forEach((c) => {
      console.log(`  - ${c.code}: ${c.name} (${c.region})`);
    });
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

syncCountries();
