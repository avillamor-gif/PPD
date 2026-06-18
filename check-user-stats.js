const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  // Check if user_stats table exists and has data
  const { data: stats, error: statsError } = await supabase
    .from('user_stats')
    .select('*');
  
  console.log('user_stats table:');
  console.log('Error:', statsError?.message || 'None');
  console.log('Data:', stats);
  console.log('Count:', stats?.length || 0);
  
  // Compare with user_profiles
  const { data: profiles } = await supabase
    .from('user_profiles')
    .select('id, display_name, email, role_id');
  
  console.log('\nuser_profiles table:');
  console.log('Data:', profiles);
  console.log('Count:', profiles?.length || 0);
})();
