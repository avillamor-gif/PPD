require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

(async () => {
  const { data, error } = await supabase.auth.admin.listUsers();
  
  if (error) {
    console.error('Error:', error);
  } else if (data?.users?.length) {
    console.log('Found', data.users.length, 'users:');
    data.users.forEach(u => {
      console.log(`  - ${u.id} (${u.email})`);
    });
  } else {
    console.log('No users found');
  }
})();
