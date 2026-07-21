#!/usr/bin/env node

/**
 * HELPER SCRIPT: Generate unique slugs for manual SQL update
 * This script mirrors the logic in lib/utils/validation.ts
 * 
 * Usage: 
 *   NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/generate-slugs.js
 * 
 * Output: SQL UPDATE statements to paste into Supabase SQL editor
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

// MATCHES: lib/utils/validation.ts generateSlugFromTitle()
function generateSlug(title) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 150); // Increased from 80 to allow longer policy titles
}

async function main() {
  try {
    console.log('Generating unique slugs...\n');

    const { data: policies, error } = await supabase
      .from('policies')
      .select('id, title')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error:', error.message);
      process.exit(1);
    }

    if (!policies?.length) {
      console.log('No policies found.');
      return;
    }

    console.log(`Analyzing ${policies.length} policies:\n`);

    const slugMap = {};
    const slugCounts = {};

    // Group by base slug to find duplicates
    for (const policy of policies) {
      const baseSlug = generateSlug(policy.title);
      slugMap[policy.id] = baseSlug;
      slugCounts[baseSlug] = (slugCounts[baseSlug] || 0) + 1;
    }

    // Add counters to duplicates
    const slugCounters = {};
    const finalSlugs = {};

    for (const policy of policies) {
      const baseSlug = slugMap[policy.id];
      
      if (slugCounts[baseSlug] > 1) {
        slugCounters[baseSlug] = (slugCounters[baseSlug] || 0) + 1;
        finalSlugs[policy.id] = `${baseSlug}-${slugCounters[baseSlug]}`;
      } else {
        finalSlugs[policy.id] = baseSlug;
      }
    }

    // Output SQL
    console.log('Run this SQL in Supabase SQL editor:');
    console.log('https://supabase.com/dashboard/project/ygzomuopsdiacdafymoq/sql/new\n');
    console.log('```sql');
    for (const [id, slug] of Object.entries(finalSlugs)) {
      console.log(`UPDATE policies SET slug = '${slug}' WHERE id = '${id}';`);
    }
    console.log('```');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
