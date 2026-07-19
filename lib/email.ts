// @ts-nocheck
import { supabase } from './supabase';
import { supabaseAdmin } from './supabase-admin';
import config from './config';

// Initialize Mailgun
function getMailgunConfig() {
  const apiKey = process.env.MAILGUN_API_KEY;
  const domain = process.env.MAILGUN_DOMAIN;

  if (!apiKey || !domain) {
    console.error('❌ [MAILGUN] Missing Mailgun credentials');
    console.error('   MAILGUN_API_KEY:', apiKey ? '✓ Set' : '✗ Missing');
    console.error('   MAILGUN_DOMAIN:', domain ? '✓ Set' : '✗ Missing');
    throw new Error('Missing Mailgun configuration in .env.local');
  }

  return { apiKey, domain };
}

// Send email via Mailgun
async function sendViaMailgun(to: string, subject: string, html: string) {
  const { apiKey, domain } = getMailgunConfig();

  try {
    console.log('📧 [MAILGUN] Sending email to:', to);
    
    const formData = new URLSearchParams();
    formData.append('from', config.email.from);
    formData.append('to', to);
    formData.append('subject', subject);
    formData.append('html', html);

    const auth = Buffer.from(`api:${apiKey}`).toString('base64');
    
    const response = await fetch(`https://api.mailgun.net/v3/${domain}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
      },
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ [MAILGUN] Error:', data);
      throw new Error(data.message || 'Failed to send email via Mailgun');
    }

    console.log('✅ [MAILGUN] Email sent successfully. ID:', data.id);
    return { success: true, messageId: data.id };
  } catch (error) {
    console.error('❌ [MAILGUN] Exception:', error);
    throw error;
  }
}

export async function sendVerificationEmail(email: string, token: string) {
  const verificationUrl = `${config.app.url}/auth/verify?token=${token}`;

  try {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #E88860;">Welcome to ${config.email.appName}</h2>
        <p>Click the button below to verify your email address:</p>
        <a href="${verificationUrl}" style="display: inline-block; padding: 12px 24px; background-color: #E88860; color: white; text-decoration: none; border-radius: 8px; margin: 20px 0;">Verify Email</a>
        <p style="color: #666; font-size: 14px;">Or paste this link in your browser: ${verificationUrl}</p>
        <p style="color: #999; font-size: 12px;">This link expires in 24 hours.</p>
      </div>
    `;

    return await sendViaMailgun(
      email,
      `Verify your email - ${config.email.appName}`,
      html
    );
  } catch (error) {
    console.error('Email verification error:', error);
    return { success: false, error };
  }
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const resetUrl = `${config.app.url}/auth/reset-password?token=${token}`;

  try {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1B72A8;">Password Reset Request</h2>
        <p>Click the button below to reset your password:</p>
        <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #1B72A8; color: white; text-decoration: none; border-radius: 8px; margin: 20px 0;">Reset Password</a>
        <p style="color: #666; font-size: 14px;">Or paste this link in your browser: ${resetUrl}</p>
        <p style="color: #999; font-size: 12px;">This link expires in 1 hour. If you didn't request a password reset, ignore this email.</p>
      </div>
    `;

    return await sendViaMailgun(
      email,
      `Reset your password - ${config.email.appName}`,
      html
    );
  } catch (error) {
    console.error('Password reset email error:', error);
    return { success: false, error };
  }
}

export async function sendCommentNotificationEmail(
  recipientEmail: string,
  recipientName: string,
  authorName: string,
  policyTitle: string,
  policyId: string,
  commentPreview: string
) {
  const policyUrl = `${config.app.url}/policies/${policyId}`;

  try {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1B72A8;">New Reply to Your Comment</h2>
        <p>Hi ${recipientName},</p>
        <p><strong>${authorName}</strong> replied to your comment on:</p>
        <p style="background-color: #f5f5f5; padding: 12px; border-left: 4px solid #1B72A8; margin: 16px 0;">
          <strong>${policyTitle}</strong>
        </p>
        <p style="color: #666; font-size: 14px; margin: 12px 0;"><em>"${commentPreview.substring(0, 150)}..."</em></p>
        <a href="${policyUrl}" style="display: inline-block; padding: 12px 24px; background-color: #1B72A8; color: white; text-decoration: none; border-radius: 8px; margin: 20px 0;">View Conversation</a>
      </div>
    `;

    return await sendViaMailgun(
      recipientEmail,
      `${authorName} replied to your comment`,
      html
    );
  } catch (error) {
    console.error('Comment notification email error:', error);
    return { success: false, error };
  }
}

export async function queueEmail(
  email: string,
  emailType: string,
  subject: string,
  templateName: string,
  templateData: Record<string, any> = {},
  userId?: string
) {
  const { error } = await supabase.from('email_queue').insert({
    recipient_email: email,
    recipient_user_id: userId,
    email_type: emailType,
    subject,
    template_name: templateName,
    template_data: templateData,
    status: 'pending',
  });

  if (error) {
    console.error('Queue email error:', error);
    return { success: false, error };
  }
  return { success: true };
}

export async function getPendingEmails(limit = 50) {
  const { data, error } = await supabase
    .from('email_queue')
    .select('*')
    .eq('status', 'pending')
    .limit(limit)
    .order('created_at', { ascending: true });

  return { data, error };
}

export async function updateEmailStatus(
  emailId: string,
  status: 'sent' | 'failed' | 'bounced',
  errorMessage?: string
) {
  const { error } = await supabase
    .from('email_queue')
    .update({
      status,
      error_message: errorMessage,
      sent_at: status === 'sent' ? new Date().toISOString() : null,
      retry_count: supabase.from('email_queue').select('retry_count'),
    })
    .eq('id', emailId);

  return { error };
}

export async function sendNewUserWelcomeEmail(email: string, displayName: string, password: string) {
  const loginUrl = `${config.app.url}/auth/login`;

  try {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1B72A8;">Welcome to ${config.email.appName}</h2>
        <p>Hi ${displayName},</p>
        <p>Your account has been created by an administrator. Here are your login credentials:</p>
        
        <div style="background-color: #f5f5f5; padding: 16px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #1B72A8;">
          <p style="margin: 0;"><strong>Email:</strong> ${email}</p>
          <p style="margin: 8px 0 0 0;"><strong>Temporary Password:</strong> ${password}</p>
        </div>

        <p style="color: #666; font-size: 14px;">
          Please change your password after your first login for security.
        </p>

        <a href="${loginUrl}" style="display: inline-block; padding: 12px 24px; background-color: #1B72A8; color: white; text-decoration: none; border-radius: 8px; margin: 20px 0;">Login to Your Account</a>

        <p style="color: #999; font-size: 12px; margin-top: 30px;">
          If you did not request this account creation, please contact support immediately.
        </p>
      </div>
    `;

    return await sendViaMailgun(
      email,
      `Welcome to ${config.email.appName} - Your Account is Ready`,
      html
    );
  } catch (error) {
    console.error('New user welcome email error:', error);
    throw error;
  }
}

export async function sendNewUserAdminNotification(email: string, displayName: string, role: string) {
  const adminUrl = `${config.app.url}/admin/users`;
  const adminEmail = config.email.adminNotificationEmail;

  try {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #E88860;">New User Registration</h2>
        
        <p>A new user has been added to ${config.email.appName}:</p>

        <div style="background-color: #f5f5f5; padding: 16px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #E88860;">
          <p style="margin: 0;"><strong>Name:</strong> ${displayName}</p>
          <p style="margin: 8px 0 0 0;"><strong>Email:</strong> ${email}</p>
          <p style="margin: 8px 0 0 0;"><strong>Role:</strong> ${role}</p>
          <p style="margin: 8px 0 0 0;"><strong>Created:</strong> ${new Date().toLocaleString()}</p>
        </div>

        <a href="${adminUrl}" style="display: inline-block; padding: 12px 24px; background-color: #E88860; color: white; text-decoration: none; border-radius: 8px; margin: 20px 0;">View User Management</a>

        <p style="color: #999; font-size: 12px; margin-top: 30px;">
          This is an automated notification from your admin panel.
        </p>
      </div>
    `;

    return await sendViaMailgun(
      adminEmail,
      `New User Created: ${displayName} (${role})`,
      html
    );
  } catch (error) {
    console.error('Admin notification email error:', error);
    throw error;
  }
}

export async function sendSetPasswordEmail(email: string, displayName: string, token: string) {
  const setPasswordUrl = `${config.app.url}/auth/set-password?token=${token}`;

  console.log('📧 [EMAIL] sendSetPasswordEmail called with:', {
    email,
    displayName,
    tokenLength: token.length,
    from: config.email.from,
    appName: config.email.appName,
    setPasswordUrl,
  });

  try {
    console.log('📧 [EMAIL] Sending via Mailgun...');
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1B72A8;">Welcome to ${config.email.appName}</h2>
        <p>Hi ${displayName},</p>
        
        <p>Thanks for signing up! To complete your account setup, click the button below to verify your email and set your password.</p>

        <a href="${setPasswordUrl}" style="display: inline-block; padding: 12px 24px; background-color: #1B72A8; color: white; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: bold;">Verify Email & Set Password</a>

        <p style="color: #666; font-size: 14px;">Or paste this link in your browser:</p>
        <p style="background-color: #f5f5f5; padding: 12px; border-radius: 4px; font-size: 12px; word-break: break-all; color: #666;">${setPasswordUrl}</p>

        <div style="border-top: 1px solid #e0e0e0; padding-top: 20px; margin-top: 30px;">
          <p style="color: #999; font-size: 12px;">
            This link will expire in 24 hours. If you didn't sign up for this account, please ignore this email.
          </p>
        </div>
      </div>
    `;

    const result = await sendViaMailgun(
      email,
      `Verify Your Email & Set Password - ${config.email.appName}`,
      html
    );

    console.log('📧 [EMAIL] Email sent successfully:', result);
    return result;
  } catch (error) {
    console.error('📧 [EMAIL] Set password email error:', {
      error,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : 'no stack',
    });
    throw error;
  }
}
