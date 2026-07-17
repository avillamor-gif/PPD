/**
 * Application Configuration
 * All hardcoded values should be defined here and loaded from environment variables
 * 
 * Environment Setup:
 * 1. For Email: Set RESEND_API_KEY at https://resend.com
 * 2. Copy .env.example to .env.local and fill in your values
 * 3. Run: npm run dev
 */

// Get values from environment variables with fallbacks for development
const config = {
  // Email Configuration
  email: {
    // Use onboarding@resend.dev for development/testing (no domain verification needed)
    // Use verified domain for production
    from: process.env.NEXT_PUBLIC_EMAIL_FROM || 'onboarding@resend.dev',
    appName: process.env.NEXT_PUBLIC_APP_NAME || 'Plastic Policy Database',
    adminNotificationEmail: process.env.ADMIN_NOTIFICATION_EMAIL || 'admin@plasticpolicydatabase.com',
  },

  // App URLs
  app: {
    url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  },

  // Auth Configuration
  auth: {
    passwordMinLength: parseInt(process.env.AUTH_PASSWORD_MIN_LENGTH || '8'),
    emailVerificationExpiryHours: parseInt(process.env.AUTH_EMAIL_VERIFICATION_EXPIRY_HOURS || '24'),
    passwordResetExpiryHours: parseInt(process.env.AUTH_PASSWORD_RESET_EXPIRY_HOURS || '1'),
  },

  // API Configuration
  api: {
    pageSize: parseInt(process.env.API_PAGE_SIZE || '10'),
  },

  // Feature Flags
  features: {
    emailVerificationRequired: process.env.FEATURE_EMAIL_VERIFICATION_REQUIRED !== 'false', // Enabled by default
    allowPublicSignup: process.env.FEATURE_ALLOW_PUBLIC_SIGNUP !== 'false',
  },
};

export default config;
