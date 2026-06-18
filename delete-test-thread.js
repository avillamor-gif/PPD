const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  const threadId = 'b8ec4dc3-a7b6-43e1-9914-25220c67b6b1';
  
  const { error } = await supabase
    .from('discussion_threads')
    .delete()
    .eq('id', threadId);
  
  if (error) {
    console.error('❌ Delete failed:', error.message);
  } else {
    console.log('✅ Test thread deleted successfully');
  }
})();
