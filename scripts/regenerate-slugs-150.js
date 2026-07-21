require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load env manually if dotenv fails
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  const envPath = path.join(__dirname, '..', '.env.local');
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      process.env[key.trim()] = value.trim();
    }
  });
}

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function generateSlugFromTitle(title) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .slice(0, 150); // Limit to 150 characters
}

async function regenerateAllSlugs() {
  try {
    console.log('🔄 Fetching all policies...');
    
    // Fetch all policies
    const { data: policies, error: fetchError } = await supabaseAdmin
      .from('policies')
      .select('id, title, slug')
      .limit(1000);

    if (fetchError || !policies) {
      console.error('❌ Error fetching policies:', fetchError);
      process.exit(1);
    }

    console.log(`📋 Found ${policies.length} policies to check`);
    
    let updated = 0;
    let skipped = 0;

    // Process each policy
    for (const policy of policies) {
      const newSlug = generateSlugFromTitle(policy.title);
      
      // Only update if slug is different (was truncated)
      if (newSlug !== policy.slug) {
        console.log(`\n📝 Updating policy: ${policy.title.substring(0, 50)}...`);
        console.log(`   Old slug (${policy.slug.length} chars): ${policy.slug.substring(0, 60)}...`);
        console.log(`   New slug (${newSlug.length} chars): ${newSlug.substring(0, 60)}...`);

        // Check if new slug already exists
        const { data: existing, error: checkError } = await supabaseAdmin
          .from('policies')
          .select('id')
          .eq('slug', newSlug)
          .neq('id', policy.id)
          .single();

        if (checkError?.code === 'PGRST116') {
          // PGRST116 = no rows found, which is good
          const { error: updateError } = await supabaseAdmin
            .from('policies')
            .update({ slug: newSlug })
            .eq('id', policy.id);

          if (updateError) {
            console.error(`   ❌ Error updating: ${updateError.message}`);
          } else {
            console.log(`   ✅ Updated`);
            updated++;
          }
        } else if (existing) {
          console.log(`   ⚠️  Skipped - slug already exists for another policy`);
          skipped++;
        } else if (checkError) {
          console.error(`   ❌ Error checking slug: ${checkError.message}`);
        }
      }
    }

    console.log(`\n✅ Migration complete!`);
    console.log(`   Updated: ${updated} policies`);
    console.log(`   Skipped: ${skipped} policies`);
    console.log(`   No change needed: ${policies.length - updated - skipped} policies`);
  } catch (err) {
    console.error('❌ Caught error:', err);
    process.exit(1);
  }
}

regenerateAllSlugs();
