require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testEditFlow() {
  console.log('📝 Testing edit flow to understand the 404 issue...\n');

  // 1. Find a policy with a long title (that generates long slugs)
  const { data: policies } = await supabase
    .from('policies')
    .select('id, slug, title, previous_slugs')
    .order('title', { ascending: false })
    .limit(5);

  if (!policies?.length) {
    console.log('❌ No policies found');
    return;
  }

  console.log('📋 Sample policies:');
  policies.forEach(p => {
    console.log(`   • ${p.slug} (${p.slug.length} chars)`);
    console.log(`     Title: "${p.title.substring(0, 50)}..."`);
    console.log(`     Previous slugs: ${p.previous_slugs?.length || 0}`);
  });

  const testPolicy = policies[0];
  console.log(`\n✅ Testing with: ${testPolicy.slug}`);
  console.log(`   Current title: "${testPolicy.title}"`);
  console.log(`   Current previous_slugs: ${testPolicy.previous_slugs}`);

  // 2. Test the API directly - what happens if we change title slightly
  const newTitle = `${testPolicy.title} [EDITED]`;
  console.log(`\n📝 New title: "${newTitle}"`);

  // 3. Check what slug would be generated
  const generatedSlug = newTitle
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 150);

  console.log(`📊 Generated slug would be: "${generatedSlug}"`);
  console.log(`   Length: ${generatedSlug.length} chars (limit: 150)`);

  // 4. Check database column info
  console.log('\n🔍 Checking database schema...');
  const { data: tableInfo } = await supabase
    .from('information_schema.columns')
    .select('*')
    .eq('table_name', 'policies')
    .eq('column_name', 'slug');

  if (tableInfo?.length) {
    console.log(`   slug column info:`, tableInfo[0]);
  }

  // 5. Now check the actual URL that was problematic
  console.log('\n🔗 Checking the problematic URL:');
  const problematicSlug = 'plastic-scrap-import-control-policydepartment-of-foreign-trade-ministry-of-commerce';
  console.log(`   Slug: ${problematicSlug}`);
  console.log(`   Length: ${problematicSlug.length} chars`);

  const { data: foundByProblematic } = await supabase
    .from('policies')
    .select('id, slug, title, previous_slugs')
    .or(`slug.eq.${problematicSlug},previous_slugs.contains.{"${problematicSlug}"}`)
    .limit(1);

  if (foundByProblematic?.length) {
    const found = foundByProblematic[0];
    console.log(`   ✅ Found policy:`);
    console.log(`      Current slug: ${found.slug}`);
    console.log(`      Title: "${found.title.substring(0, 50)}..."`);
    console.log(`      Previous slugs: ${found.previous_slugs}`);
  } else {
    console.log(`   ❌ Policy not found by that slug`);
  }

  // 6. Try with partial match
  console.log('\n🔍 Searching for "plastic scrap"...');
  const { data: plasticPolicies } = await supabase
    .from('policies')
    .select('id, slug, title')
    .ilike('title', '%plastic%')
    .ilike('title', '%scrap%')
    .limit(5);

  if (plasticPolicies?.length) {
    console.log(`   Found ${plasticPolicies.length} policies:`);
    plasticPolicies.forEach(p => {
      console.log(`     • ${p.slug}`);
      console.log(`       "${p.title}"`);
    });
  } else {
    console.log(`   No policies found matching "plastic scrap"`);
  }
}

testEditFlow().catch(console.error);
