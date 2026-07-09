#!/usr/bin/env node

// Direct test of the signup flow
async function testSignup() {
  try {
    console.log('Testing signup endpoint...');
    
    const response = await fetch('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test-signup@example.com',
        displayName: 'Test User',
      }),
    });

    const data = await response.json();
    
    console.log('\n✅ Response Status:', response.status);
    console.log('📝 Response Data:', JSON.stringify(data, null, 2));

    if (!response.ok) {
      console.log('\n❌ Signup failed');
      process.exit(1);
    }

    console.log('\n✅ Signup successful');
    
  } catch (error) {
    console.error('❌ Test error:', error);
    process.exit(1);
  }
}

// Wait for server to be ready
setTimeout(testSignup, 1000);
