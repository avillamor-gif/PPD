const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://ygzomuopsdiacdafymoq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlnem9tdW9wc2RpYWNkYWZ5bW9xIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMzI2NjgwMSwiZXhwIjoyMDQ4ODQyODAxfQ.hPqQOzY1TQGxvY-fxfJcEXDY-FTiGE32hjlC7THlKPo'
);

(async () => {
  // Get all profiles to see what we have
  const { data: profiles } = await supabase
    .from('user_profiles')
    .select('id, display_name, role_id, role:roles(name)')
    .limit(5);
  
  console.log('Profiles:', JSON.stringify(profiles, null, 2));
})();
