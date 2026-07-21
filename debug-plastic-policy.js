require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debug() {
  console.log('🔍 Debugging the plastic scrap policy...\n');

  const targetSlug = 'plastic-scrap-import-control-policydepartment-of-foreign-trade-ministry-of-commerce';

  // 1. Try direct slug query
  console.log('1️⃣  Direct slug query:');
  const { data: direct, error: directError } = await supabase
    .from('policies')
    .select('id, slug, title')
    .eq('slug', targetSlug)
    .single();

  console.log('   Result:', direct);
  console.log('   Error:', directError?.message);

  // 2. Try to search all policies and find it manually
  console.log('\n2️⃣  Fetching all policies with "plastic"...');
  const { data: all } = await supabase
    .from('policies')
    .select('id, slug, title')
    .ilike('slug', '%plastic%');

  console.log(`   Found ${all?.length || 0} policies`);
  all?.forEach(p => {
    console.log(`   • slug: "${p.slug}"`);
    console.log(`     matches target: ${p.slug === targetSlug}`);
  });

  // 3. Try specific title match
  console.log('\n3️⃣  Searching by title...');
  const { data: byTitle } = await supabase
    .from('policies')
    .select('id, slug, title')
    .ilike('title', '%Plastic Scrap Import%');

  console.log(`   Found ${byTitle?.length || 0} policies`);
  byTitle?.forEach(p => {
    console.log(`   ID: ${p.id}`);
    console.log(`   Slug: "${p.slug}"`);
    console.log(`   Slug length: ${p.slug.length}`);
    console.log(`   Title: "${p.title}"`);
    console.log(`   Exact match: ${p.slug === targetSlug}`);
  });

  // 4. Try fetching that specific ID
  if (byTitle?.length) {
    const policyId = byTitle[0].id;
    console.log(`\n4️⃣  Fetching by ID: ${policyId}`);
    const { data: byId } = await supabase
      .from('policies')
      .select('id, slug, title')
      .eq('id', policyId)
      .single();

    console.log('   Result:', byId);
  }

  // 5. Check if there are spaces or special chars
  if (byTitle?.length) {
    const actualSlug = byTitle[0].slug;
    console.log(`\n5️⃣  Checking for hidden characters...`);
    console.log(`   Expected: "${targetSlug}"`);
    console.log(`   Actual:   "${actualSlug}"`);
    console.log(`   Match: ${actualSlug === targetSlug}`);
    
    // Byte-by-byte comparison
    if (actualSlug !== targetSlug) {
      console.log('\n   Character-by-character comparison:');
      const maxLen = Math.max(actualSlug.length, targetSlug.length);
      for (let i = 0; i < maxLen; i++) {
        if (actualSlug[i] !== targetSlug[i]) {
          console.log(`   Position ${i}: expected '${targetSlug[i]}' (${targetSlug.charCodeAt(i)}) got '${actualSlug[i]}' (${actualSlug.charCodeAt(i)})`);
        }
      }
    }
  }
}

debug().catch(console.error);
