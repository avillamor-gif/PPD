#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  try {
    console.log('🔍 Checking roles table...\n');

    // Check all roles
    const { data: allRoles, error: rolesError } = await supabase
      .from('roles')
      .select('*');

    console.log('All roles in database:');
    console.log(allRoles);
    console.log('Error:', rolesError);

    // Check all profiles
    console.log('\n🔍 Checking user profiles...\n');
    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('*');

    console.log('All profiles:');
    console.log(profiles);
    console.log('Error:', profilesError);

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
})();
