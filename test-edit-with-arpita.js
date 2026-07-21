require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testEditWithArpita() {
  console.log('Finding Arpita account...\n');

  // 1. Find Arpita user
  const { data: users } = await supabase
    .from('user_profiles')
    .select('id, first_name, email, role_id')
    .ilike('first_name', '%arpita%')
    .limit(1);

  if (!users?.length) {
    console.log('❌ Arpita account not found');
    const { data: allUsers } = await supabase
      .from('user_profiles')
      .select('id, first_name, email, role_id')
      .limit(5);
    console.log('Available users:', allUsers);
    return;
  }

  const arpita = users[0];
  console.log('✅ Found Arpita:', { id: arpita.id, email: arpita.email, role_id: arpita.role_id });

  // 2. Create session for Arpita
  const { data: sessionData, error: sessionError } = await supabase.auth.admin.createSession(arpita.id);
  
  if (sessionError) {
    console.log('❌ Error creating session:', sessionError);
    return;
  }

  const token = sessionData.session.access_token;
  console.log('✅ Got auth token for Arpita\n');

  // 3. Get a policy to test
  const { data: policies } = await supabase
    .from('policies')
    .select('id, slug, title, country, year, summary')
    .limit(1);

  if (!policies?.length) {
    console.log('❌ No policies found');
    return;
  }

  const policy = policies[0];
  const oldSlug = policy.slug;
  console.log('Test policy:', { slug: oldSlug, title: policy.title });

  // 4. Edit the policy - change title
  const newTitle = `${policy.title} - EDITED ${Date.now()}`;
  console.log(`\nCalling API PUT with new title: "${newTitle.substring(0, 60)}..."`);
  console.log('Using token from Arpita account...\n');

  const response = await fetch('http://localhost:3000/api/policies/' + oldSlug, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      title: newTitle,
      summary: policy.summary || 'Test',
      year: policy.year || 2024,
      country: policy.country || 'Test',
    }),
  });

  const result = await response.json();
  
  console.log('API Response status:', response.status);
  console.log('API Response:', JSON.stringify(result, null, 2));

  // 5. Check database
  const { data: updated } = await supabase
    .from('policies')
    .select('id, slug, title, previous_slugs')
    .eq('id', policy.id)
    .single();

  console.log('\n--- Database Check ---');
  console.log('Updated policy:', {
    oldSlug: oldSlug,
    newSlug: updated.slug,
    previousSlugs: updated.previous_slugs,
  });

  if (updated.previous_slugs?.includes(oldSlug)) {
    console.log('\n✅ SUCCESS: Old slug saved to previous_slugs!');
    console.log(`   ${oldSlug} → ${updated.slug}`);
    console.log(`   Can now access: /policies/${oldSlug} (redirects to ${updated.slug})`);
  } else {
    console.log('\n❌ ISSUE: Old slug NOT in previous_slugs');
    console.log('   Expected: ' + JSON.stringify([oldSlug]));
    console.log('   Got: ' + JSON.stringify(updated.previous_slugs));
  }
}

testEditWithArpita().catch(console.error);
