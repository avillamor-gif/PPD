#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function deleteUserByEmail(email) {
  try {
    console.log(`🔍 Finding user with email: ${email}`);

    // Find user by email
    const { data: users, error: findError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (findError) {
      console.error('❌ Error listing users:', findError);
      return;
    }

    const user = users.users.find((u) => u.email === email);
    
    if (!user) {
      console.error(`❌ User not found with email: ${email}`);
      return;
    }

    console.log(`✅ Found user: ${user.id}`);

    // Delete from user_profiles
    console.log('🗑️ Deleting user profile from database...');
    const { error: profileDeleteError } = await supabaseAdmin
      .from('user_profiles')
      .delete()
      .eq('id', user.id);

    if (profileDeleteError) {
      console.error('❌ Failed to delete profile:', profileDeleteError);
      return;
    }

    console.log('✅ User profile deleted from database');

    // Delete from auth
    console.log('🗑️ Deleting user from auth...');
    const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id);

    if (authDeleteError) {
      console.warn('⚠️ Auth deletion failed (profile still deleted):', authDeleteError);
    } else {
      console.log('✅ User deleted from auth');
    }

    // Log audit event
    console.log('📝 Logging audit event...');
    await supabaseAdmin
      .from('audit_logs')
      .insert({
        resource_type: 'user',
        resource_id: user.id,
        action: 'user_deleted',
      });

    console.log(`\n✅ User ${email} has been deleted successfully`);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

const email = process.argv[2];
if (!email) {
  console.error('❌ Usage: node delete-user-by-email.js <email>');
  process.exit(1);
}

deleteUserByEmail(email);
