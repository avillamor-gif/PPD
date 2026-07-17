#!/usr/bin/env node

/**
 * Resend Email Configuration Diagnostic
 * 
 * This script verifies your Resend setup and sends a test email.
 * 
 * Usage:
 *   node scripts/verify-resend.js                    # Check configuration only
 *   node scripts/verify-resend.js --send test@example.com  # Send test email
 */

const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function checkResendSetup() {
  log('\n📋 Resend Email Configuration Diagnostic\n', 'cyan');

  // Check if .env.local exists
  const envPath = path.join(__dirname, '..', '.env.local');
  const hasEnvLocal = fs.existsSync(envPath);
  
  log(`1. Environment File Check:`, 'blue');
  if (hasEnvLocal) {
    log(`   ✓ .env.local exists`, 'green');
  } else {
    log(`   ✗ .env.local not found`, 'yellow');
    log(`     Create it from .env.example: cp .env.example .env.local`, 'yellow');
  }

  // Check RESEND_API_KEY
  log(`\n2. RESEND_API_KEY Check:`, 'blue');
  const apiKey = process.env.RESEND_API_KEY;
  
  if (!apiKey) {
    log(`   ✗ RESEND_API_KEY is not set`, 'red');
    log(`\n   How to fix:`, 'yellow');
    log(`   1. Visit https://resend.com and create a free account`, 'yellow');
    log(`   2. Get your API key from the dashboard (starts with "re_")`, 'yellow');
    log(`   3. Add to .env.local: RESEND_API_KEY=re_YOUR_KEY_HERE`, 'yellow');
    log(`   4. Restart: npm run dev`, 'yellow');
    return false;
  }

  if (!apiKey.startsWith('re_')) {
    log(`   ✗ RESEND_API_KEY format incorrect (should start with "re_")`, 'red');
    log(`     Current: ${apiKey.substring(0, 10)}...`, 'red');
    return false;
  }

  log(`   ✓ RESEND_API_KEY is set`, 'green');
  log(`     Key: ${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 4)}`, 'green');

  // Check from email configuration
  log(`\n3. From Email Configuration:`, 'blue');
  const fromEmail = process.env.NEXT_PUBLIC_EMAIL_FROM || 'onboarding@resend.dev';
  log(`   From: ${fromEmail}`, 'green');
  
  if (fromEmail === 'onboarding@resend.dev') {
    log(`   ℹ Using Resend test domain (no domain verification needed)`, 'cyan');
  } else {
    log(`   ℹ Using custom domain (ensure it's verified in Resend dashboard)`, 'cyan');
  }

  // Check app URL
  log(`\n4. App URL Configuration:`, 'blue');
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  log(`   App URL: ${appUrl}`, 'green');

  return true;
}

async function sendTestEmail(testEmail) {
  try {
    log(`\n5. Sending Test Email:`, 'blue');
    log(`   To: ${testEmail}`, 'blue');

    const { Resend } = require('resend');
    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
      log(`   ✗ Cannot send: RESEND_API_KEY not set`, 'red');
      return false;
    }

    const resend = new Resend(apiKey);
    const fromEmail = process.env.NEXT_PUBLIC_EMAIL_FROM || 'onboarding@resend.dev';
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const response = await resend.emails.send({
      from: fromEmail,
      to: testEmail,
      subject: '🧪 Test Email - Plastic Policy Database',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #001f2e;">✓ Email Configuration Working!</h2>
          <p style="color: #666; line-height: 1.6;">
            This test email confirms that your Resend email service is properly configured.
          </p>
          
          <div style="background-color: #f5f3f0; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #666; font-size: 14px;">
              <strong>Configuration Details:</strong><br>
              From: ${fromEmail}<br>
              App URL: ${appUrl}<br>
              Sent: ${new Date().toLocaleString()}
            </p>
          </div>

          <p style="color: #999; font-size: 12px;">
            You can now proceed with signup flow testing at: ${appUrl}
          </p>
        </div>
      `,
    });

    if (response.error) {
      log(`   ✗ Email send failed: ${response.error.message}`, 'red');
      return false;
    }

    log(`   ✓ Test email sent successfully!`, 'green');
    log(`   Email ID: ${response.data.id}`, 'green');
    log(`\n   Check your inbox (${testEmail}) for the test email.`, 'green');
    log(`   If you don't see it, check your spam folder.`, 'yellow');
    return true;

  } catch (error) {
    log(`   ✗ Error sending test email: ${error.message}`, 'red');
    
    if (error.message.includes('rate limit')) {
      log(`   Hint: Rate limited. Wait a moment and try again.`, 'yellow');
    } else if (error.message.includes('invalid_api_key')) {
      log(`   Hint: API key invalid. Check RESEND_API_KEY in .env.local`, 'yellow');
    } else if (error.message.includes('Invalid email')) {
      log(`   Hint: The recipient email address is invalid.`, 'yellow');
    }
    
    return false;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const shouldSendEmail = args[0] === '--send' && args[1];
  const testEmail = args[1];

  try {
    const isConfigured = await checkResendSetup();

    if (!isConfigured) {
      log(`\n❌ Setup incomplete. Configure RESEND_API_KEY first.\n`, 'red');
      process.exit(1);
    }

    if (shouldSendEmail) {
      log(`\n`, 'reset');
      const success = await sendTestEmail(testEmail);
      
      if (success) {
        log(`\n✅ Everything is working! You can now test the signup flow.\n`, 'green');
        process.exit(0);
      } else {
        log(`\n❌ Failed to send test email. Check errors above.\n`, 'red');
        process.exit(1);
      }
    } else {
      log(`\n✅ Configuration looks good!`, 'green');
      log(`\n📧 To send a test email, run:`, 'blue');
      log(`   node scripts/verify-resend.js --send your-email@example.com\n`, 'cyan');
      process.exit(0);
    }

  } catch (error) {
    log(`\n❌ Diagnostic error: ${error.message}\n`, 'red');
    process.exit(1);
  }
}

main();
