import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testOtherLinksWrite() {
  try {
    console.log('🧪 Testing write to other_links column...\n');

    // Get first policy to update
    const { data: policies, error: fetchError } = await supabase
      .from('policies')
      .select('id, title, other_links')
      .limit(1);

    if (fetchError) {
      console.error('❌ Error fetching policy:', fetchError);
      return;
    }

    if (!policies || policies.length === 0) {
      console.log('No policies found to test with');
      return;
    }

    const policy = policies[0];
    console.log(`Testing with policy: "${policy.title}"`);
    console.log(`Current other_links: ${policy.other_links || 'null'}\n`);

    // Try to update with test data
    const testUrl = 'https://test-link-' + Date.now() + '.com';
    console.log(`Attempting to update other_links to: "${testUrl}"`);

    const { data: updated, error: updateError } = await supabase
      .from('policies')
      .update({ other_links: testUrl })
      .eq('id', policy.id)
      .select();

    if (updateError) {
      console.error('\n❌ Update failed:', updateError);
      console.error('Error code:', updateError.code);
      console.error('Error message:', updateError.message);
      return;
    }

    console.log('\n✅ Update succeeded!');
    console.log('Updated record:', updated?.[0]);

    // Now verify it was actually saved
    const { data: verified, error: verifyError } = await supabase
      .from('policies')
      .select('id, other_links')
      .eq('id', policy.id);

    if (verifyError) {
      console.error('❌ Verification failed:', verifyError);
      return;
    }

    console.log('\n🔍 Verification:');
    console.log('Saved value:', verified?.[0]?.other_links);
    console.log('Match:', verified?.[0]?.other_links === testUrl ? '✅ YES' : '❌ NO');

  } catch (error) {
    console.error('Error:', error.message);
  }
}

testOtherLinksWrite();
