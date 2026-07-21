require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function test() {
  const { data } = await supabase
    .from('policies')
    .select('slug, title')
    .order('slug', { ascending: false })
    .limit(20);

  console.log('Testing URLs by length:\n');
  for (const policy of data) {
    const len = policy.slug.length;
    console.log(`${len.toString().padStart(3)}: ${policy.slug}`);
  }
}

test();
