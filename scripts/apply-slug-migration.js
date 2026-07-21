#!/usr/bin/env node

/**
 * Applies the slug migration to Supabase database
 * Usage: NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/apply-slug-migration.js
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

function generateSlugFromTitle(title) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 150); // Increased from 100 to allow longer policy titles
}

async function applyMigration() {
  try {
    console.log('Applying slug migration...');

    // Fetch existing policies
    console.log('1. Fetching policies without slugs...');
    const { data: policies, error: fetchError } = await supabase
      .from('policies')
      .select('id, title')
      .or('slug.is.null,slug.eq.""');

    if (fetchError) {
      console.error('Error fetching policies:', fetchError);
      process.exit(1);
    }

    if (!policies || policies.length === 0) {
      console.log('✅ All policies already have slugs.');
      return;
    }

    console.log(`Found ${policies.length} policies without slugs.`);

    // Update each policy with a generated slug
    console.log('2. Generating and updating slugs...');
    let successCount = 0;
    let errorCount = 0;

    for (const policy of policies) {
      const slug = generateSlugFromTitle(policy.title);
      const { error: updateError } = await supabase
        .from('policies')
        .update({ slug })
        .eq('id', policy.id);

      if (updateError) {
        console.error(`  ✗ Error updating ${policy.id}: ${updateError.message}`);
        errorCount++;
      } else {
        console.log(`  ✓ ${policy.id} → ${slug}`);
        successCount++;
      }
    }

    console.log(`\n✅ Migration completed!`);
    console.log(`   Updated: ${successCount}`);
    if (errorCount > 0) {
      console.log(`   Errors: ${errorCount}`);
      process.exit(1);
    }
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

applyMigration();
