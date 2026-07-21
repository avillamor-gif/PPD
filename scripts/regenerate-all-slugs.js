#!/usr/bin/env node

/**
 * Regenerates ALL policy slugs with the new 150-character limit
 * This fixes 404 errors for policies with titles longer than 80 characters
 * 
 * Usage:
 *   NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/regenerate-all-slugs.js
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
    .slice(0, 150);
}

async function regenerateAllSlugs() {
  try {
    console.log('🔄 Regenerating all policy slugs with 150-character limit...\n');

    // Fetch all policies
    const { data: policies, error: fetchError } = await supabase
      .from('policies')
      .select('id, title, slug')
      .order('created_at', { ascending: true });

    if (fetchError) {
      console.error('❌ Error fetching policies:', fetchError);
      process.exit(1);
    }

    if (!policies || policies.length === 0) {
      console.log('ℹ️  No policies found.');
      return;
    }

    console.log(`Found ${policies.length} policies\n`);

    // Generate new slugs for all policies
    const updates = [];
    const slugMap = {};
    const slugCounts = {};

    // First pass: generate base slugs
    for (const policy of policies) {
      const baseSlug = generateSlugFromTitle(policy.title);
      slugMap[policy.id] = baseSlug;
      slugCounts[baseSlug] = (slugCounts[baseSlug] || 0) + 1;
    }

    // Second pass: add counters to duplicates
    const slugCounters = {};
    for (const policy of policies) {
      const baseSlug = slugMap[policy.id];
      
      if (slugCounts[baseSlug] > 1) {
        slugCounters[baseSlug] = (slugCounters[baseSlug] || 0) + 1;
        updates.push({
          id: policy.id,
          oldSlug: policy.slug,
          newSlug: `${baseSlug}-${slugCounters[baseSlug]}`,
        });
      } else {
        updates.push({
          id: policy.id,
          oldSlug: policy.slug,
          newSlug: baseSlug,
        });
      }
    }

    // Apply updates
    console.log('📝 Updating slugs...\n');
    let successCount = 0;
    let changedCount = 0;
    let errorCount = 0;

    for (const update of updates) {
      // Only update if slug changed
      if (update.oldSlug === update.newSlug) {
        successCount++;
        continue;
      }

      const { error: updateError } = await supabase
        .from('policies')
        .update({ slug: update.newSlug })
        .eq('id', update.id);

      if (updateError) {
        console.error(`  ❌ ${update.id}: ${updateError.message}`);
        errorCount++;
      } else {
        console.log(`  ✓ ${update.id}`);
        console.log(`    ${update.oldSlug || '(no slug)'} → ${update.newSlug}`);
        successCount++;
        changedCount++;
      }
    }

    console.log(`\n✅ Regeneration completed!`);
    console.log(`   Total policies: ${policies.length}`);
    console.log(`   Updated: ${changedCount}`);
    console.log(`   Unchanged: ${successCount - changedCount}`);
    if (errorCount > 0) {
      console.log(`   Errors: ${errorCount}`);
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

regenerateAllSlugs();
