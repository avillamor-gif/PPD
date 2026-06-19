const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

(async () => {
  const { data, error } = await supabase
    .from('discussion_threads')
    .select('id, title, policy_id')
    .eq('policy_id', 'viet-2023-01');

  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Threads for viet-2023-01:');
    console.log(JSON.stringify(data, null, 2));
  }
})();
