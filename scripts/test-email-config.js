#!/usr/bin/env node
/**
 * Email Configuration Diagnostic Script
 * Usage: node scripts/test-email-config.js
 * 
 * This script helps verify that:
 * 1. Resend API key is configured
 * 2. Email settings are correct
 * 3. Email can be sent successfully
 */

require('dotenv').config({ path: '.env.local' });

async function diagnoseEmailSetup() {
  console.log('\n📧 Email Configuration Diagnostic\n');
  console.log('==========================================\n');

  // Check 1: Environment Variables
  console.log('1️⃣  Checking Environment Variables...\n');

  const requiredVars = {
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    NEXT_PUBLIC_EMAIL_FROM: process.env.NEXT_PUBLIC_EMAIL_FROM,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  };

  let allSet = true;
  for (const [key, value] of Object.entries(requiredVars)) {
    if (value) {
      const masked = key === 'RESEND_API_KEY' 
        ? value.substring(0, 5) + '...' + value.substring(value.length - 4)
        : value;
      console.log(`   ✅ ${key}: ${masked}`);
    } else {
      console.log(`   ❌ ${key}: NOT SET`);
      allSet = false;
    }
  }

  if (!allSet) {
    console.log('\n⚠️  Missing environment variables!');
    console.log('\nSetup Instructions:');
    console.log('1. Copy .env.example to .env.local');
    console.log('2. Get API key from https://resend.com');
    console.log('3. Add RESEND_API_KEY=re_YOUR_KEY to .env.local');
    console.log('4. Run: npm run dev\n');
    process.exit(1);
  }

  // Check 2: Resend Client
  console.log('\n2️⃣  Testing Resend Client...\n');

  try {
    const { Resend } = require('resend');
    const apiKey = process.env.RESEND_API_KEY;
    const resend = new Resend(apiKey);
    console.log('   ✅ Resend client initialized successfully');

    // Check 3: Email Configuration
    console.log('\n3️⃣  Email Configuration Details...\n');
    console.log(`   From Address: ${process.env.NEXT_PUBLIC_EMAIL_FROM}`);
    console.log(`   App URL: ${process.env.NEXT_PUBLIC_APP_URL}`);
    console.log(`   App Name: ${process.env.NEXT_PUBLIC_APP_NAME || 'Plastic Policy Database'}`);

    // Check 4: Test Email (Optional)
    console.log('\n4️⃣  Would you like to send a test email?');
    console.log('   (This requires a real email address)\n');

    if (process.argv[2] === '--test') {
      const testEmail = process.argv[3] || 'test@example.com';
      console.log(`   Sending test email to: ${testEmail}\n`);

      try {
        const response = await resend.emails.send({
          from: process.env.NEXT_PUBLIC_EMAIL_FROM,
          to: testEmail,
          subject: 'Email Configuration Test',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>Email Configuration Test</h2>
              <p>If you received this email, your Resend configuration is working correctly!</p>
              <p><strong>Details:</strong></p>
              <ul>
                <li>From: ${process.env.NEXT_PUBLIC_EMAIL_FROM}</li>
                <li>Timestamp: ${new Date().toISOString()}</li>
              </ul>
            </div>
          `,
        });

        console.log('   ✅ Test email sent successfully!');
        console.log(`   Message ID: ${response.id}\n`);
        console.log('   Check your inbox (and spam folder) for the email.\n');
      } catch (error) {
        console.log('   ❌ Test email failed!');
        console.log(`   Error: ${error.message}\n`);
        process.exit(1);
      }
    } else {
      console.log('   To send a test email, run:');
      console.log('   node scripts/test-email-config.js --test your-email@example.com\n');
    }

    // Summary
    console.log('==========================================\n');
    console.log('✅ Email configuration looks good!\n');
    console.log('Next Steps:');
    console.log('1. Test full signup flow at http://localhost:3000/auth/login');
    console.log('2. Check that email is received');
    console.log('3. Verify password setup link works\n');

  } catch (error) {
    console.log(`   ❌ Resend client error: ${error.message}\n`);
    console.log('Troubleshooting:');
    console.log('1. Check that RESEND_API_KEY is valid');
    console.log('2. Key should start with "re_"');
    console.log('3. Visit https://resend.com for support\n');
    process.exit(1);
  }
}

diagnoseEmailSetup().catch(console.error);
