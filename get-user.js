require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  const { data: users, error } = await supabase
    .from('users')
    .select('id')
    .limit(1);

  if (error) {
    console.error('Error:', error);
  } else if (users && users.length > 0) {
    console.log('User ID:', users[0].id);
  } else {
    console.log('No users found');
  }
})();
