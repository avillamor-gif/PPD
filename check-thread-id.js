require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  const threadId = 'cfca447d-2cfd-4a74-8875-b21585c9e250';
  const { data, error } = await supabase
    .from('discussion_threads')
    .select('*')
    .eq('id', threadId)
    .single();

  if (error) {
    console.log('Thread not found or error:', error.message);
  } else {
    console.log('✅ Thread exists:');
    console.log('ID:', data.id);
    console.log('Title:', data.title);
    console.log('Policy:', data.policy_id);
  }
})();
