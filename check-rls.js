const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Try with anon key to simulate what the browser does
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

(async () => {
  console.log('Testing with anon key...\n');
  
  const { data, error } = await supabase
    .from('discussion_threads')
    .select('id, title, policy_id')
    .eq('policy_id', 'thai-2022-01');
  
  console.log('Result:', { data, error });
  
  if (error) {
    console.log('\nRLS Policy appears to be blocking anon access.');
    console.log('Error:', error.message);
  }
})();
