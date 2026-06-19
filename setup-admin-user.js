#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const USER_ID = '60356ab0-321e-479f-b8fc-ffff8b645ab0';

(async () => {
  try {
    console.log('🔐 Setting up admin profile for user:', USER_ID);

    // 1. Ensure admin role exists
    console.log('\n1️⃣  Creating admin role if it doesn\'t exist...');
    const { data: roles, error: rolesError } = await supabase
      .from('roles')
      .select('id')
      .eq('name', 'admin');

    let adminRoleId = 1;
    if (!roles || roles.length === 0) {
      const { data: newRole, error: insertError } = await supabase
        .from('roles')
        .insert([{ name: 'admin' }])
        .select();

      if (insertError) {
        console.error('❌ Failed to create admin role:', insertError);
        return;
      }
      adminRoleId = newRole[0].id;
      console.log('✅ Created admin role with ID:', adminRoleId);
    } else {
      adminRoleId = roles[0].id;
      console.log('✅ Admin role exists with ID:', adminRoleId);
    }

    // 2. Create or update user profile
    console.log('\n2️⃣  Creating/updating user profile...');
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .upsert({
        id: USER_ID,
        role_id: adminRoleId,
        display_name: 'Admin User'
      }, { onConflict: 'id' })
      .select();

    if (profileError) {
      console.error('❌ Failed to create/update profile:', profileError);
      return;
    }

    console.log('✅ User profile created/updated:', profile);

    // 3. Verify
    console.log('\n3️⃣  Verifying admin status...');
    const { data: verification } = await supabase
      .from('user_profiles')
      .select('id, role_id, roles(name)')
      .eq('id', USER_ID)
      .maybeSingle();

    console.log('✅ Verification result:', verification);
    console.log('\n🎉 Admin setup complete! You should now have edit access.');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
})();
