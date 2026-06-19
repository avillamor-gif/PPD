#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const csv = require('csv-parse/sync');
const path = require('path');

// Country code mapping
const countryMap = {
  'Cambodia': 'KH',
  'Indonesia': 'ID',
  'Philippines': 'PH',
  'Thailand': 'TH',
  'Malaysia': 'MY',
  'Viet Nam': 'VN',
  'Vietnam': 'VN',
};

// Helper to extract country name from potentially numbered format
function extractCountry(countryCell) {
  if (!countryCell) return null;
  const trimmed = countryCell.trim();
  // Remove leading numbers like "2. ", "3. ", etc.
  const cleaned = trimmed.replace(/^\d+\.\s*/, '').trim();
  return cleaned;
}

function determineInstrument(title) {
  const lower = title.toLowerCase();
  if (lower.includes('act')) return 'Act';
  if (lower.includes('decree')) return 'Decree';
  if (lower.includes('regulation') || lower.includes('nomor')) return 'Regulation';
  if (lower.includes('law')) return 'Law';
  if (lower.includes('bill')) return 'Bill';
  if (lower.includes('policy')) return 'Policy';
  if (lower.includes('roadmap')) return 'Roadmap';
  if (lower.includes('framework')) return 'Framework';
  return 'Regulation';
}

function determineCategory(keywords, title) {
  const combined = (keywords + ' ' + title).toLowerCase();
  if (combined.includes('epr') || combined.includes('extended producer')) return 'EPR';
  if (combined.includes('ban') || combined.includes('prohibition')) return 'Plastic Ban';
  if (combined.includes('circular')) return 'Circular Economy';
  return 'Waste Management';
}

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
  let status = 'In Force';
  const statusCell = record['Status']?.toLowerCase() || '';
  if (statusCell.includes('draft')) status = 'Proposed';
  if (statusCell.includes('phase')) status = 'Phased';
  if (statusCell.includes('propose')) status = 'Proposed';

  // Determine category based on keywords and title
  const keywords = record['Key Words'] || '';
  const category = determineCategory(keywords, title);

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
  };
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
    // Handle hierarchical structure where empty Country field means continuation of previous
    const byCountry = {};
    let currentCountry = null;
    
    records.forEach((record) => {
      let countryCell = record['Country']?.trim();
      
      // If Country is empty, try to extract from Keywords
      if (!countryCell) {
        const keywords = record['Key Words'] || '';
        // Check keywords for country names
        for (const [countryName] of Object.entries(countryMap)) {
          if (keywords.includes(countryName)) {
            countryCell = countryName;
            break;
          }
        }
      }
      
      if (countryCell) {
        const country = extractCountry(countryCell);
        if (country && country !== 'South East Asia' && countryMap[country]) {
          currentCountry = country;
        } else if (country && country !== 'South East Asia') {
          console.log(`⚠️  Skipped unknown country: ${country}`);
          currentCountry = null;
        }
      }
      
      // If this row has a policy and we have a country context, add it
      const title = record['Legislation/Regulation']?.trim();
      if (title && currentCountry) {
        if (!byCountry[currentCountry]) byCountry[currentCountry] = [];
        byCountry[currentCountry].push(record);
      }
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

    // Read existing policies file
    const policiesFilePath = '/Users/leopura/Desktop/ppd/app/data/policies.ts';
    let content = fs.readFileSync(policiesFilePath, 'utf-8');

    // Find where to insert (before the closing ]);
    const insertPoint = content.lastIndexOf('];');
    if (insertPoint === -1) {
      throw new Error('Could not find policies array closing bracket');
    }

    // Generate policy code
    const policyCode = policies
      .map((p) => {
        // Escape special characters in strings
        const escapeString = (str) => str.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n').replace(/\r/g, '\\r');
        
        return `  {\n    id: "${p.id}",\n    year: ${p.year},\n    country: "${p.country}",\n    title: "${escapeString(p.title)}",\n    summary: "${escapeString(p.summary)}",\n    category: "${p.category}",\n    instrument: "${p.instrument}",\n    level: "${p.level}",\n    status: "${p.status}" as const,\n    authority: "${escapeString(p.authority)}",\n    link: "${escapeString(p.link)}",\n    language: "${p.language}",\n  },`;
      })
      .join('\n');

    // Insert the new policies
    const newContent = content.slice(0, insertPoint) + ',\n' + policyCode + '\n' + content.slice(insertPoint);

    // Write back
    fs.writeFileSync(policiesFilePath, newContent);

    console.log(`\n🎉 Successfully added ${policies.length} policies to app/data/policies.ts!`);

    // Print summary
    console.log('\n📊 Summary by country:');
    for (const [country, records] of Object.entries(byCountry)) {
      const count = records.length;
      const code = countryMap[country];
      console.log(`  ${country} (${code}): ${count} policies`);
    }

    // Print category summary
    console.log('\n📊 Summary by category:');
    const byCategory = {};
    policies.forEach((p) => {
      byCategory[p.category] = (byCategory[p.category] || 0) + 1;
    });
    for (const [cat, count] of Object.entries(byCategory)) {
      console.log(`  ${cat}: ${count} policies`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
