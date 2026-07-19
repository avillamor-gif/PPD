#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testEmailFlow() {
  console.log('\n📧 Testing Supabase Email Service\n');
  console.log('Config:');
  console.log('  Supabase URL:', supabaseUrl);
  console.log('  Service Key: ✓ Set\n');

  const testEmail = `test-${Date.now()}@example.com`;
  const testPassword = 'TestPassword123!';

  try {
    // 1. Create a test user
    console.log(`1️⃣  Creating test user: ${testEmail}`);
    const { data: createData, error: createError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: false, // This should trigger Supabase to send email
    });

    if (createError) {
      console.error('❌ Create user error:', createError.message);
      return;
    }

    const userId = createData?.user?.id;
    console.log(`✅ User created: ${userId}`);
    console.log(`\n⏳ Supabase should be sending a confirmation email to: ${testEmail}`);
    console.log('📋 Check Supabase dashboard → Email Templates → Confirm signup');
    console.log('🔗 Check Supabase dashboard → Auth → User Management\n');

    // 2. Try to send a password reset email
    console.log(`2️⃣  Testing password reset email to: ${testEmail}`);
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(testEmail, {
      redirectTo: 'http://localhost:3000/auth/reset-password',
    });

    if (resetError) {
      console.error('❌ Reset password error:', resetError.message);
      console.log('\n⚠️  Possible causes:');
      console.log('  • Supabase SMTP not configured');
      console.log('  • Email service disabled in Supabase');
      console.log('  • Redirect URL not whitelisted\n');
      return;
    }

    console.log('✅ Password reset email sent\n');

  } catch (error) {
    console.error('❌ Exception:', error.message);
  }
}

testEmailFlow();
