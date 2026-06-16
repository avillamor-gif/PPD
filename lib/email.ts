// @ts-nocheck
import { Resend } from 'resend';
import { supabase, supabaseAdmin } from './supabase';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendVerificationEmail(email: string, token: string) {
  const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/verify?token=${token}`;

  try {
    await resend.emails.send({
      from: 'noreply@plasticpolicydatabase.com',
      to: email,
      subject: 'Verify your email - Plastic Policy Database',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #E88860;">Welcome to Plastic Policy Database</h2>
          <p>Click the button below to verify your email address:</p>
          <a href="${verificationUrl}" style="display: inline-block; padding: 12px 24px; background-color: #E88860; color: white; text-decoration: none; border-radius: 8px; margin: 20px 0;">Verify Email</a>
          <p style="color: #666; font-size: 14px;">Or paste this link in your browser: ${verificationUrl}</p>
          <p style="color: #999; font-size: 12px;">This link expires in 24 hours.</p>
        </div>
      `,
    });
    return { success: true };
  } catch (error) {
    console.error('Email verification error:', error);
    return { success: false, error };
  }
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password?token=${token}`;

  try {
    await resend.emails.send({
      from: 'noreply@plasticpolicydatabase.com',
      to: email,
      subject: 'Reset your password - Plastic Policy Database',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #E88860;">Password Reset Request</h2>
          <p>Click the button below to reset your password:</p>
          <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #1B72A8; color: white; text-decoration: none; border-radius: 8px; margin: 20px 0;">Reset Password</a>
          <p style="color: #666; font-size: 14px;">Or paste this link in your browser: ${resetUrl}</p>
          <p style="color: #999; font-size: 12px;">This link expires in 1 hour. If you didn't request a password reset, ignore this email.</p>
        </div>
      `,
    });
    return { success: true };
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
  const policyUrl = `${process.env.NEXT_PUBLIC_APP_URL}/policies/${policyId}`;

  try {
    await resend.emails.send({
      from: 'noreply@plasticpolicydatabase.com',
      to: recipientEmail,
      subject: `${authorName} replied to your comment`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #E88860;">New Reply to Your Comment</h2>
          <p>Hi ${recipientName},</p>
          <p><strong>${authorName}</strong> replied to your comment on:</p>
          <p style="background-color: #f5f5f5; padding: 12px; border-left: 4px solid #E88860; margin: 16px 0;">
            <strong>${policyTitle}</strong>
          </p>
          <p style="color: #666; font-size: 14px; margin: 12px 0;"><em>"${commentPreview.substring(0, 150)}..."</em></p>
          <a href="${policyUrl}" style="display: inline-block; padding: 12px 24px; background-color: #1B72A8; color: white; text-decoration: none; border-radius: 8px; margin: 20px 0;">View Conversation</a>
        </div>
      `,
    });
    return { success: true };
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
