const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  const { data: profiles } = await supabase
    .from('user_profiles')
    .select('id, display_name, role_id, role:roles(name)');
  
  console.log('All profiles with roles:');
  console.log(JSON.stringify(profiles, null, 2));
})();
