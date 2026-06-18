const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  const { data: threads, error } = await supabase
    .from('discussion_threads')
    .select('id, title, policy_id')
    .limit(10);
  
  if (error) {
    console.log('Error:', error);
  } else {
    console.log('All threads:');
    console.log(JSON.stringify(threads, null, 2));
  }
})();
