#!/usr/bin/env node

/**
 * Quick Resend Test
 * Loads .env.local and tests Resend email sending
 */

require('dotenv').config({ path: '.env.local' });

const { Resend } = require('resend');

async function testResend() {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.NEXT_PUBLIC_EMAIL_FROM || 'onboarding@resend.dev';

  console.log('\n📧 Testing Resend Configuration\n');
  console.log('Configuration:');
  console.log(`  API Key: ${apiKey ? '✓ Set' : '✗ Missing'}`);
  console.log(`  API Key: ${apiKey ? apiKey.substring(0, 10) + '...' + apiKey.substring(apiKey.length - 4) : 'N/A'}`);
  console.log(`  From Email: ${fromEmail}`);

  if (!apiKey) {
    console.log('\n❌ RESEND_API_KEY not set in .env.local\n');
    process.exit(1);
  }

  try {
    const resend = new Resend(apiKey);
    
    console.log('\nSending test email...');
    const result = await resend.emails.send({
      from: fromEmail,
      to: 'delivered@resend.dev',
      subject: '🧪 Test Email - PPD Email System',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>✓ Email System Working!</h2>
          <p>This test email confirms Resend is properly configured.</p>
          <p><strong>Test Details:</strong></p>
          <ul>
            <li>From: ${fromEmail}</li>
            <li>Timestamp: ${new Date().toLocaleString()}</li>
            <li>API Key: Valid</li>
          </ul>
        </div>
      `,
    });

    if (result.error) {
      console.log('\n❌ Email send failed:');
      console.log(`   Error: ${result.error.message}`);
      process.exit(1);
    }

    console.log('\n✅ Test email sent successfully!');
    console.log(`   Email ID: ${result.data.id}`);
    console.log('\n📝 Check resend.dev inbox for the test email (delivered@resend.dev)');
    console.log('   This confirms your Resend setup is working correctly.\n');

  } catch (error) {
    console.log('\n❌ Error:');
    console.log(`   ${error.message}\n`);
    process.exit(1);
  }
}

testResend();
