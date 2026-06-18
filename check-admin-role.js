const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://ygzomuopsdiacdafymoq.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlnem9tdW9wc2RpYWNkYWZ5bW9xIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMzI2NjgwMSwiZXhwIjoyMDQ4ODQyODAxfQ.hPqQOzY1TQGxvY-fxfJcEXDY-FTiGE32hjlC7THlKPo'
);

(async () => {
  // Get your user ID by email
  const { data: { users } } = await supabase.auth.admin.listUsers();
  const user = users.find(u => u.email === 'akawar@gmail.com');
  
  if (!user) {
    console.log('User not found');
    return;
  }
  
  console.log('Found user:', user.id, user.email);
  
  // Get user profile
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('id, display_name, role_id, role:roles(name)')
    .eq('id', user.id)
    .single();
  
  console.log('Profile:', profile);
})();
