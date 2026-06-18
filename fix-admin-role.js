const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  // Get all user profiles
  const { data: profiles, error: err1 } = await supabase
    .from('user_profiles')
    .select('id, display_name, role_id');
  
  if (err1) {
    console.log('Error fetching profiles:', err1);
    return;
  }
  
  console.log('All profiles:', profiles);
  
  // Find first profile
  if (profiles && profiles.length > 0) {
    const userId = profiles[0].id;
    console.log('\nUpdating user', userId, 'to admin (role_id=1)...');
    
    const { error: err2 } = await supabase
      .from('user_profiles')
      .update({ role_id: 1 })
      .eq('id', userId);
    
    if (err2) {
      console.log('Error updating role:', err2);
    } else {
      console.log('✅ Updated successfully!');
      
      // Verify
      const { data: updated } = await supabase
        .from('user_profiles')
        .select('id, display_name, role_id')
        .eq('id', userId)
        .single();
      
      console.log('Verified:', updated);
    }
  }
})();
