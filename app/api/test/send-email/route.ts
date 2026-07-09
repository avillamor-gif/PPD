import { sendNewUserWelcomeEmail, sendNewUserAdminNotification } from '@/lib/email';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { email, displayName, type } = await req.json();

    if (!email || !displayName) {
      return NextResponse.json(
        { error: 'Email and displayName required' },
        { status: 400 }
      );
    }

    // Only allow in development
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'Test email endpoint not available in production' },
        { status: 403 }
      );
    }

    console.log('📧 [TEST] Sending test email to:', email);
    console.log('📧 [TEST] Email type:', type || 'welcome');

    if (type === 'admin') {
      // Send admin notification
      await sendNewUserAdminNotification(email, displayName, 'user');
      console.log('📧 [TEST] Admin notification sent');
      return NextResponse.json({
        success: true,
        message: `Admin notification sent to ${email}`,
      });
    } else {
      // Send welcome email (default)
      await sendNewUserWelcomeEmail(email, displayName, 'test-password-123');
      console.log('📧 [TEST] Welcome email sent');
      return NextResponse.json({
        success: true,
        message: `Welcome email sent to ${email}`,
      });
    }
  } catch (error) {
    console.error('📧 [TEST] Email error:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to send email' },
      { status: 500 }
    );
  }
}
