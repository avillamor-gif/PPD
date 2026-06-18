const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  // Check threads in database
  const { data: threads, error } = await supabase
    .from('discussion_threads')
    .select('*')
    .eq('policy_id', 'thai-2022-01')
    .is('deleted_at', null);
  
  console.log('Threads for thai-2022-01:');
  console.log('Error:', error?.message || 'None');
  console.log('Data:', threads);
  console.log('Count:', threads?.length || 0);
})();
