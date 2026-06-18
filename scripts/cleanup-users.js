/**
 * Cleanup script to delete all users and related data
 * Run with: node scripts/cleanup-users.js
 */

const fs = require('fs');
const path = require('path');

// Load .env.local manually
const envFile = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf-8');
const envLines = envFile.split('\n');

for (const line of envLines) {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const [key, ...valueParts] = trimmed.split('=');
    const value = valueParts.join('=');
    if (key && value) {
      process.env[key] = value;
    }
  }
}

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function cleanup() {
  try {
    console.log('🗑️  Starting cleanup...\n');

    // Delete from related tables first (due to FK constraints)
    console.log('Deleting email verification tokens...');
    const { error: tokenError } = await supabase
      .from('email_verification_tokens')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (tokenError) console.log('⚠️  Token delete result:', tokenError?.message || 'No tokens');
    else console.log('✓ Tokens deleted');

    console.log('\nDeleting password reset tokens...');
    const { error: resetError } = await supabase
      .from('password_reset_tokens')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (resetError) console.log('⚠️  Reset tokens delete result:', resetError?.message || 'No tokens');
    else console.log('✓ Reset tokens deleted');

    console.log('\nDeleting user preferences...');
    const { error: prefsError } = await supabase
      .from('user_preferences')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (prefsError) console.log('⚠️  Preferences delete result:', prefsError?.message || 'No preferences');
    else console.log('✓ User preferences deleted');

    console.log('\nDeleting user profiles...');
    const { error: profileError } = await supabase
      .from('user_profiles')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (profileError) console.log('⚠️  Profiles delete result:', profileError?.message || 'No profiles');
    else console.log('✓ User profiles deleted');

    console.log('\nDeleting auth users...');
    const { data: users, error: listError } = await supabase.auth.admin.listUsers();

    if (listError) {
      console.error('❌ Error listing users:', listError);
      return;
    }

    console.log(`Found ${users?.users?.length || 0} auth users`);

    for (const user of users?.users || []) {
      const { error: delError } = await supabase.auth.admin.deleteUser(user.id);
      if (delError) {
        console.error(`❌ Error deleting user ${user.email}:`, delError);
      } else {
        console.log(`✓ Deleted auth user: ${user.email}`);
      }
    }

    console.log('\n✅ Cleanup complete! Ready to signup fresh accounts.');
  } catch (error) {
    console.error('❌ Cleanup error:', error);
  }
}

cleanup();
