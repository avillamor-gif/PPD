require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  const userId = '60356ab0-321e-479f-b8fc-ffff8b645ab0';
  
  const { data: thread, error } = await supabase
    .from('discussion_threads')
    .insert({
      policy_id: 'viet-2023-01',
      title: 'Test Discussion - Thread Detail Page',
      description: 'Testing thread detail page after fix',
      author_id: userId,
      status: 'open',
      comment_count: 0,
    })
    .select()
    .single();

  if (error) {
    console.error('Error:', error);
  } else {
    console.log('✅ Created thread:');
    console.log('ID:', thread.id);
    console.log('Test URL: https://ppd-pink.vercel.app/policies/viet-2023-01/discuss/' + thread.id);
  }
})();
