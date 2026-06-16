// @ts-nocheck
import { supabaseAdmin } from '@/lib/supabase';
import { Resend } from 'resend';
import { NextRequest, NextResponse } from 'next/server';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function GET(req: NextRequest) {
  try {
    // Verify this is called from a trusted source (Vercel Cron)
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch pending emails from queue
    const { data: pendingEmails, error: fetchError } = await supabaseAdmin
      .from('email_queue')
      .select('*')
      .eq('status', 'pending')
      .lt('retry_count', 3) // Max 3 retries
      .order('created_at', { ascending: true })
      .limit(50);

    if (fetchError) throw fetchError;

    if (!pendingEmails || pendingEmails.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No pending emails',
        processed: 0,
      });
    }

    let successCount = 0;
    let failureCount = 0;

    // Process each email
    for (const email of pendingEmails) {
      try {
        // Build email based on template
        let htmlContent = '';
        let subject = email.subject;

        if (email.template_name === 'verification') {
          const data = email.template_data || {};
          htmlContent = `
            <h1>Verify Your Email</h1>
            <p>Click the link below to verify your email address:</p>
            <a href="${data.verificationLink}" style="background: #1B72A8; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block; margin: 20px 0;">
              Verify Email
            </a>
            <p style="color: #999; font-size: 12px; margin-top: 20px;">
              This link expires in 24 hours.
            </p>
          `;
        } else if (email.template_name === 'password_reset') {
          const data = email.template_data || {};
          htmlContent = `
            <h1>Reset Your Password</h1>
            <p>Click the link below to reset your password:</p>
            <a href="${data.resetLink}" style="background: #1B72A8; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block; margin: 20px 0;">
              Reset Password
            </a>
            <p style="color: #999; font-size: 12px; margin-top: 20px;">
              This link expires in 1 hour. If you didn't request this, ignore this email.
            </p>
          `;
        } else if (email.template_name === 'comment_notification') {
          const data = email.template_data || {};
          htmlContent = `
            <h1>New Reply to Your Comment</h1>
            <p>
              <strong>${data.authorName}</strong> replied to your comment on 
              <strong>${data.policyTitle}</strong>:
            </p>
            <blockquote style="border-left: 4px solid #E88860; padding-left: 16px; margin: 20px 0; color: #666;">
              "${data.commentPreview}"
            </blockquote>
            <a href="${data.threadLink}" style="background: #1B72A8; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block; margin: 20px 0;">
              View Conversation
            </a>
          `;
        } else {
          // Generic email template
          htmlContent = `<p>${email.template_data?.content || ''}</p>`;
        }

        // Send email via Resend
        const result = await resend.emails.send({
          from: 'Plastic Policy Database <noreply@plasticpolicydatabase.com>',
          to: email.recipient_email,
          subject,
          html: htmlContent,
        });

        if (result.error) {
          throw result.error;
        }

        // Mark as sent
        await supabaseAdmin
          .from('email_queue')
          .update({
            status: 'sent',
            sent_at: new Date().toISOString(),
          })
          .eq('id', email.id);

        successCount++;
      } catch (err) {
        console.error(`Error sending email ${email.id}:`, err);
        failureCount++;

        // Update retry count and mark as failed if max retries exceeded
        const retryCount = (email.retry_count || 0) + 1;
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';

        await supabaseAdmin
          .from('email_queue')
          .update({
            retry_count: retryCount,
            status: retryCount >= 3 ? 'failed' : 'pending',
            error_message: errorMessage,
          })
          .eq('id', email.id);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${successCount + failureCount} emails`,
      processed: successCount + failureCount,
      successful: successCount,
      failed: failureCount,
    });
  } catch (error) {
    console.error('Email queue processor error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
