// Test script to verify email sending works
const { Resend } = require('resend');

const resend = new Resend('re_5LhK1wjD_EaRvYA6e16mhjQF89FfHNa4h');

async function testEmail() {
  try {
    console.log('📧 Testing email sending...');
    
    const response = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: 'avillamor0409@gmail.com',
      subject: 'Test: New Signup Flow Email',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1B72A8;">Welcome Test User</h2>
          <p>Hi Test User,</p>
          
          <p>This is a test email for the new signup flow. If you received this, the email system is working!</p>

          <a href="http://localhost:3000/auth/set-password?token=test_token_12345" style="display: inline-block; padding: 12px 24px; background-color: #1B72A8; color: white; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: bold;">Verify Email & Set Password</a>

          <p style="color: #999; font-size: 12px; margin-top: 30px;">
            This is a test email.
          </p>
        </div>
      `,
    });

    console.log('✅ Email sent successfully!');
    console.log('Response:', response);
    return response;
  } catch (error) {
    console.error('❌ Email sending failed:', error);
    throw error;
  }
}

testEmail();
