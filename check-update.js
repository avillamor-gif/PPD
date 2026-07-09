import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkPolicyUpdate() {
  try {
    console.log('🔍 Checking if Cambodia 1996 policy was updated...\n');

    // Get the policy we just updated  
    const { data, error } = await supabase
      .from('policies')
      .select('id, title, other_links, updated_at')
      .eq('id', 'kh-1996-01')
      .single();

    if (error) {
      console.error('❌ Error fetching policy:', error);
      return;
    }

    if (!data) {
      console.log('No policy found with ID kh-1996-01');
      console.log('\nTrying to find by title...\n');
      
      const { data: policyByTitle } = await supabase
        .from('policies')
        .select('id, title, other_links, updated_at')
        .ilike('title', '%environmental protection%')
        .ilike('title', '%cambodia%')
        .limit(1);
        
      if (policyByTitle && policyByTitle.length > 0) {
        const p = policyByTitle[0];
        console.log(`✅ Found policy:`);
        console.log(`  ID: ${p.id}`);
        console.log(`  Title: ${p.title}`);
        console.log(`  Other Links: ${p.other_links || '(null)'}`);
        console.log(`  Last Updated: ${p.updated_at}`);
        console.log(`\n📊 Analysis:`);
        console.log(`  Has other_links data: ${p.other_links ? '✅ YES' : '❌ NO'}`);
        if (p.other_links) {
          console.log(`  Contains "test1.com": ${p.other_links.includes('test1.com') ? '✅ YES' : '❌ NO'}`);
          console.log(`  Contains "test2.com": ${p.other_links.includes('test2.com') ? '✅ YES' : '❌ NO'}`);
        }
      }
      return;
    }

    console.log(`✅ Found policy:`);
    console.log(`  ID: ${data.id}`);
    console.log(`  Title: ${data.title}`);
    console.log(`  Other Links: ${data.other_links || '(null)'}`);
    console.log(`  Last Updated: ${data.updated_at}`);
    console.log(`\n📊 Analysis:`);
    console.log(`  Has other_links data: ${data.other_links ? '✅ YES' : '❌ NO'}`);
    if (data.other_links) {
      console.log(`  Contains "test1.com": ${data.other_links.includes('test1.com') ? '✅ YES' : '❌ NO'}`);
      console.log(`  Contains "test2.com": ${data.other_links.includes('test2.com') ? '✅ YES' : '❌ NO'}`);
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkPolicyUpdate();
