#!/usr/bin/env node

/**
 * Quick Email Setup Helper
 * 
 * This script guides you through setting up email verification in 2 minutes.
 * Usage: node scripts/setup-email.js
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

function log(msg, color = 'reset') {
  console.log(`${colors[color]}${msg}${colors.reset}`);
}

function prompt(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.question(`${colors.cyan}${question}${colors.reset}`, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

async function main() {
  log('\n🚀 Plastic Policy Database - Email Setup Helper\n', 'bold');

  // Check current setup
  log('Step 1: Checking current configuration...', 'blue');
  const envPath = path.join(__dirname, '..', '.env.local');
  const hasEnvLocal = fs.existsSync(envPath);
  const hasApiKey = !!process.env.RESEND_API_KEY;

  if (hasApiKey) {
    log('✓ RESEND_API_KEY is already set', 'green');
  } else {
    log('✗ RESEND_API_KEY not found', 'red');
  }

  if (hasEnvLocal) {
    log('✓ .env.local file exists', 'green');
  } else {
    log('✗ .env.local file not found - will create it', 'yellow');
  }

  // Get Resend API key
  log('\nStep 2: Do you have a Resend API key?', 'blue');
  log('(You can get one free at https://resend.com)\n', 'cyan');

  const hasKey = await prompt('Do you have a Resend API key? (yes/no): ');

  if (hasKey.toLowerCase() !== 'yes' && hasKey.toLowerCase() !== 'y') {
    log('\n📋 How to get your API key:', 'yellow');
    log('1. Go to https://resend.com', 'yellow');
    log('2. Create a free account', 'yellow');
    log('3. Go to API Keys section', 'yellow');
    log('4. Click "Create API Key"', 'yellow');
    log('5. Copy the key (looks like: re_xxxxxxxxxxxxx)', 'yellow');
    log('\nThen run this script again: node scripts/setup-email.js\n', 'cyan');
    process.exit(0);
  }

  const apiKey = await prompt('Paste your Resend API key: ');

  if (!apiKey.startsWith('re_')) {
    log('\n❌ Invalid API key format. Should start with "re_"\n', 'red');
    process.exit(1);
  }

  // Read or create .env.local
  log('\nStep 3: Updating .env.local...', 'blue');

  let envContent = '';
  if (hasEnvLocal) {
    envContent = fs.readFileSync(envPath, 'utf8');
  } else {
    // Copy from .env.example
    const examplePath = path.join(__dirname, '..', '.env.example');
    if (fs.existsSync(examplePath)) {
      envContent = fs.readFileSync(examplePath, 'utf8');
    }
  }

  // Update API key
  const apiKeyRegex = /RESEND_API_KEY=.*/;
  if (apiKeyRegex.test(envContent)) {
    envContent = envContent.replace(apiKeyRegex, `RESEND_API_KEY=${apiKey}`);
  } else {
    envContent += `\nRESEND_API_KEY=${apiKey}\n`;
  }

  // Ensure EMAIL_FROM is set to test domain
  const emailFromRegex = /NEXT_PUBLIC_EMAIL_FROM=.*/;
  if (emailFromRegex.test(envContent)) {
    envContent = envContent.replace(emailFromRegex, 'NEXT_PUBLIC_EMAIL_FROM=onboarding@resend.dev');
  } else {
    envContent += '\nNEXT_PUBLIC_EMAIL_FROM=onboarding@resend.dev\n';
  }

  // Write .env.local
  fs.writeFileSync(envPath, envContent, 'utf8');
  log('✓ .env.local updated', 'green');

  // Summary
  log('\n✅ Email configuration complete!\n', 'green');
  log('Next steps:', 'blue');
  log('1. Restart dev server: npm run dev', 'cyan');
  log('2. Test email sending: node scripts/verify-resend.js --send test@example.com', 'cyan');
  log('3. Try signup flow at: http://localhost:3000/auth/signup', 'cyan');

  log('\n📧 Email from address: onboarding@resend.dev', 'yellow');
  log('(Using Resend test domain - no verification needed)\n', 'yellow');

  log('Need help?', 'blue');
  log('- Email setup guide: cat EMAIL_SETUP_GUIDE.md', 'cyan');
  log('- Run verify script: node scripts/verify-resend.js', 'cyan');
  log('- Check Resend dashboard: https://resend.com/emails\n', 'cyan');
}

main().catch(err => {
  log(`\n❌ Error: ${err.message}\n`, 'red');
  process.exit(1);
});
