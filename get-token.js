#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  try {
    const { data: response, error } = await supabaseAdmin.auth.admin.listUsers();
    
    if (error) {
      console.error('Error listing users:', error);
      return;
    }
    
    // The response structure is { users: [...], aud, nextPage, lastPage, total }
    const users = response?.users || response;
    
    if (!Array.isArray(users)) {
      console.error('Users is not an array:', typeof users);
      return;
    }
    
    // Find the test user
    const testUser = users.find(u => u.email === 'curldemo@example.com');
    
    if (!testUser) {
      console.error('User not found');
      console.log('Available users:', users.map(u => u.email));
      return;
    }
    
    console.log('✅ Found user:', testUser.email);
    console.log('User ID:', testUser.id);
    console.log('Token:', testUser.user_metadata?.verification_token);
    console.log('Expires at:', testUser.user_metadata?.token_expires_at);
    
    const token = testUser.user_metadata?.verification_token;
    if (token) {
      const url = `http://localhost:3000/auth/set-password?token=${token}`;
      console.log('\n🔗 Verification URL:');
      console.log(url);
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
})();
