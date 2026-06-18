const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const supabaseAnon = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

(async () => {
  console.log('Testing with SERVICE KEY:');
  const { data: admin, error: adminErr } = await supabaseAdmin
    .from('discussion_threads')
    .select('*')
    .eq('policy_id', 'thai-2022-01');
  console.log('Admin:', { count: admin?.length, error: adminErr?.message });

  console.log('\nTesting with ANON KEY:');
  const { data: anon, error: anonErr } = await supabaseAnon
    .from('discussion_threads')
    .select('*')
    .eq('policy_id', 'thai-2022-01');
  console.log('Anon:', { count: anon?.length, error: anonErr?.message });
})();
