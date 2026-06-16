#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://jejtykchfsrtzuagnqtt.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImplanR5a2NoZnNydHp1YWducXR0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTYyMDEzNiwiZXhwIjoyMDk3MTk2MTM2fQ.zl3T9yA1XBMPx7JPSmU2Idnca3Dl5OWigTD5hPKVsjA';

const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function addAdmin() {
  try {
    console.log('🔐 Creating admin user...');

    // First, check if user already exists
    const { data: existingUsers, error: checkError } = await admin
      .from('user_profiles')
      .select('id')
      .eq('email', 'akawar@gmail.com');

    if (existingUsers?.length > 0) {
      console.log('✅ User already exists');
      return;
    }

    // Create via Auth API
    const { data: { user }, error: createError } = await admin.auth.admin.createUser({
      email: 'akawar@gmail.com',
      password: '2ngbatang2ng!@#',
      email_confirm: true,  // Auto-confirm
    });

    if (createError) {
      console.error('❌ Auth creation failed:', createError.message);
      console.log('\n📌 Trying fallback: Create via Supabase UI instead:');
      console.log('1. Go to: https://app.supabase.com/project/jejtykchfsrtzuagnqtt/auth/users');
      console.log('2. Click "Add user"');
      console.log('3. Email: akawar@gmail.com');
      console.log('4. Password: 2ngbatang2ng!@#');
      console.log('5. Check "Auto confirm user"');
      console.log('6. Click "Create user"');
      return;
    }

    console.log('✅ User created:', user?.id);

    // Get admin role ID
    const { data: adminRole, error: roleError } = await admin
      .from('roles')
      .select('id')
      .eq('name', 'admin')
      .single();

    if (roleError || !adminRole) {
      console.error('❌ Could not find admin role');
      return;
    }

    // Update profile to admin
    const { error: updateError } = await admin
      .from('user_profiles')
      .update({ role_id: adminRole.id })
      .eq('id', user.id);

    if (updateError) {
      console.error('❌ Could not update profile:', updateError);
      return;
    }

    console.log('✅ Admin role assigned');
    console.log('\n🎉 Setup complete!');
    console.log('Email: akawar@gmail.com');
    console.log('Password: 2ngbatang2ng!@#');
    console.log('Login at: http://localhost:3000/auth/login');

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

addAdmin();
