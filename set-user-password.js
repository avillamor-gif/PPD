#!/usr/bin/env node

/**
 * Set password for a Supabase user
 * Usage: node set-user-password.js <email> <password>
 * Example: node set-user-password.js avillamor0409@gmail.com password123
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration');
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local');
  process.exit(1);
}

const email = process.argv[2];
const newPassword = process.argv[3];

if (!email || !newPassword) {
  console.error('Usage: node set-user-password.js <email> <password>');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setUserPassword() {
  try {
    console.log(`🔐 Setting password for ${email}...`);

    // First, get the user by email to find their ID
    const { data: listData, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      throw listError;
    }

    const user = listData.users.find(u => u.email === email);
    
    if (!user) {
      console.error(`❌ User not found: ${email}`);
      process.exit(1);
    }

    // Update the user's password
    const { data, error } = await supabase.auth.admin.updateUserById(user.id, {
      password: newPassword,
    });

    if (error) {
      throw error;
    }

    console.log(`✅ Password set successfully for ${email}`);
    console.log(`📧 Email: ${data.user.email}`);
    console.log(`🆔 User ID: ${data.user.id}`);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

setUserPassword();
