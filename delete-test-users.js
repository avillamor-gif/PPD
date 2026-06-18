const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  try {
    // Get all profiles
    const { data: profiles } = await supabase
      .from('user_profiles')
      .select('id, display_name, role_id');
    
    console.log('Profiles found:', profiles);
    
    // Keep only "akawar" profile
    const testUsers = profiles.filter(p => p.display_name !== 'akawar');
    
    if (testUsers.length === 0) {
      console.log('No test users to delete');
      return;
    }
    
    console.log(`\nDeleting ${testUsers.length} test user(s)...`);
    
    for (const user of testUsers) {
      console.log(`Deleting: ${user.display_name} (${user.id})`);
      
      // Delete profile first
      const { error: err1 } = await supabase
        .from('user_profiles')
        .delete()
        .eq('id', user.id);
      
      if (err1) {
        console.log(`  Error deleting profile: ${err1.message}`);
      } else {
        console.log(`  ✅ Profile deleted`);
      }
      
      // Delete auth user
      const { error: err2 } = await supabase.auth.admin.deleteUser(user.id);
      
      if (err2) {
        console.log(`  Error deleting auth user: ${err2.message}`);
      } else {
        console.log(`  ✅ Auth user deleted`);
      }
    }
    
    console.log('\n✅ Cleanup complete!');
    
    // Show remaining users
    const { data: remaining } = await supabase
      .from('user_profiles')
      .select('id, display_name, role_id');
    
    console.log('Remaining profiles:', remaining);
  } catch (err) {
    console.error('Error:', err);
  }
})();
