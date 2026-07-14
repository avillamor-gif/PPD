import fs from 'fs';

// Parse .env.local manually
const envContent = fs.readFileSync('.env.local', 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
  if (line && !line.startsWith('#')) {
    const [key, ...rest] = line.split('=');
    if (key) {
      envVars[key.trim()] = rest.join('=').trim();
    }
  }
});

process.env.NEXT_PUBLIC_SUPABASE_URL = envVars.NEXT_PUBLIC_SUPABASE_URL;
process.env.SUPABASE_SERVICE_ROLE_KEY = envVars.SUPABASE_SERVICE_ROLE_KEY;

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verifyAdminRole() {
  try {
    console.log('🔍 Checking admin user role...\n');

    // Get the admin user
    const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();
    if (userError) {
      console.error('❌ Error listing users:', userError);
      return;
    }

    const adminUser = users.find(u => u.email === 'akawar@gmail.com');
    if (!adminUser) {
      console.error('❌ Admin user not found');
      return;
    }

    console.log('✅ Found admin user:', adminUser.email);
    console.log('   User ID:', adminUser.id);

    // Get user profile with role_id
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('role_id')
      .eq('id', adminUser.id)
      .single();

    if (profileError) {
      console.error('❌ Error fetching profile:', profileError);
      return;
    }

    if (!profile) {
      console.error('❌ Profile not found for user');
      return;
    }

    console.log('✅ Profile found');
    console.log('   role_id:', profile.role_id);

    // Get the role name
    const { data: role, error: roleError } = await supabase
      .from('roles')
      .select('id, name')
      .eq('id', profile.role_id)
      .single();

    if (roleError) {
      console.error('❌ Error fetching role:', roleError);
      return;
    }

    console.log('✅ Role found');
    console.log('   Role ID:', role.id);
    console.log('   Role name:', role.name);

    if (role.name === 'admin') {
      console.log('\n✅ ADMIN ROLE IS CORRECTLY ASSIGNED');
    } else {
      console.log('\n❌ User is NOT an admin (role is:', role.name, ')');
    }
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

verifyAdminRole();
