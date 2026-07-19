#!/usr/bin/env node

const timestamp = new Date().toLocaleTimeString();
const testEmail = `test-${Date.now()}@example.com`;

console.log(`\n📝 [${timestamp}] Testing signup email...`);
console.log(`   Email: ${testEmail}`);
console.log(`   Display Name: Test User`);
console.log(`   Server: http://localhost:3000\n`);

fetch('http://localhost:3000/api/auth/signup', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: testEmail,
    displayName: 'Test User',
  }),
})
  .then(res => {
    console.log(`✓ Response Status: ${res.status}`);
    return res.json();
  })
  .then(data => {
    console.log(`✓ Response Body:`);
    console.log(JSON.stringify(data, null, 2));
    
    if (data.success) {
      console.log(`\n✅ Signup succeeded!`);
      console.log(`   User ID: ${data.user?.id}`);
      console.log(`   Email: ${data.user?.email}`);
      console.log(`\n📧 Check your inbox for verification email from: onboarding@resend.dev\n`);
    } else {
      console.log(`\n❌ Signup failed: ${data.error}\n`);
    }
  })
  .catch(err => {
    console.error(`❌ Request failed:`);
    console.error(err.message);
    console.log(`\n⚠️  Make sure dev server is running: npm run dev\n`);
  });
