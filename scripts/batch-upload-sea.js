#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const csv = require('csv-parse/sync');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Country code mapping
const countryMap = {
  'Cambodia': 'KH',
  'Indonesia': 'ID',
  'Philippines': 'PH',
  'Thailand': 'TH',
  'Malaysia': 'MY',
  'Viet Nam': 'VN',
};

// Map CSV fields to policy fields
function mapCsvToPolicy(record, index, country) {
  const countryCode = countryMap[country];
  if (!countryCode) {
    console.warn(`Unknown country: ${country}`);
    return null;
  }

  const title = record['Legislation/Regulation']?.trim() || '';
  if (!title) return null;

  // Extract year from date
  const dateStr = record['Date of Enactment or Commencement'] || '';
  const yearMatch = dateStr.match(/\d{4}/);
  const year = yearMatch ? parseInt(yearMatch[0]) : new Date().getFullYear();

  // Determine status
  let status = record['Status']?.trim() || 'In Force';
  if (status.toLowerCase().includes('draft')) status = 'Proposed';
  if (status.toLowerCase().includes('phase')) status = 'Phased';

  // Determine category/theme based on keywords
  const keywords = record['Key Words']?.toLowerCase() || '';
  let category = 'Waste Management';
  if (keywords.includes('epr') || keywords.includes('extended producer')) category = 'EPR';
  if (keywords.includes('ban')) category = 'Plastic Ban';
  if (keywords.includes('circular')) category = 'Circular Economy';

  // Generate ID: country-year-sequence
  const id = `${countryCode.toLowerCase()}-${year}-${String(index).padStart(2, '0')}`.toLowerCase();

  return {
    id,
    year,
    country: countryCode,
    title,
    summary: record['Description']?.trim() || '',
    category,
    instrument: determineInstrument(title),
    level: record['Level']?.trim() || 'National',
    status,
    authority: record['Competent Authority']?.trim() || 'Government',
    link: record['Official Link']?.trim() || '',
    language: record['Language']?.trim() || 'English',
    keywords: record['Key Words']?.trim() || '',
    otherLinks: record['Other Links']?.trim() || '',
  };
}

function determineInstrument(title) {
  const lower = title.toLowerCase();
  if (lower.includes('act')) return 'Act';
  if (lower.includes('decree')) return 'Decree';
  if (lower.includes('regulation')) return 'Regulation';
  if (lower.includes('law')) return 'Law';
  if (lower.includes('bill')) return 'Bill';
  if (lower.includes('policy')) return 'Policy';
  return 'Regulation';
}

async function main() {
  try {
    console.log('📂 Reading CSV file...');
    const fileContent = fs.readFileSync('/Users/leopura/Desktop/SEA.csv', 'utf-8');

    const records = csv.parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    console.log(`📊 Parsed ${records.length} records from CSV`);

    // Group by country and process
    const byCountry = {};
    records.forEach((record) => {
      const country = record['Country']?.trim();
      if (!country || country === 'South East Asia' || !countryMap[country]) return;

      if (!byCountry[country]) byCountry[country] = [];
      byCountry[country].push(record);
    });

    console.log(`🌍 Found ${Object.keys(byCountry).length} countries`);

    // Convert to policies
    const policies = [];
    let index = 1;
    for (const [country, records] of Object.entries(byCountry)) {
      records.forEach((record, idx) => {
        const policy = mapCsvToPolicy(record, idx + 1, country);
        if (policy) policies.push(policy);
      });
    }

    console.log(`✅ Mapped ${policies.length} policies`);

    // Check for duplicates
    const existingIds = new Set();
    const { data: existing } = await supabase
      .from('policies')
      .select('id')
      .limit(1000);

    if (existing) {
      existing.forEach(p => existingIds.add(p.id));
    }

    const newPolicies = policies.filter(p => !existingIds.has(p.id));
    console.log(`📝 ${newPolicies.length} new policies to insert (${policies.length - newPolicies.length} already exist)`);

    if (newPolicies.length === 0) {
      console.log('ℹ️  No new policies to upload');
      return;
    }

    // Insert in batches of 10
    for (let i = 0; i < newPolicies.length; i += 10) {
      const batch = newPolicies.slice(i, i + 10);
      const { error } = await supabase
        .from('policies')
        .insert(batch);

      if (error) {
        console.error(`❌ Error inserting batch ${i / 10 + 1}:`, error);
      } else {
        console.log(`✅ Uploaded batch ${Math.floor(i / 10) + 1} (${batch.length} policies)`);
      }
    }

    console.log(`\n🎉 Successfully uploaded ${newPolicies.length} policies!`);

    // Print summary
    console.log('\n📊 Summary by country:');
    for (const [country, records] of Object.entries(byCountry)) {
      const count = records.length;
      const code = countryMap[country];
      console.log(`  ${country} (${code}): ${count} policies`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
