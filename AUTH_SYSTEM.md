# Authentication System Documentation

## Overview
This application uses Supabase for authentication with a complete auth flow including signup, login, email verification, and password reset.

## Architecture

### Components
1. **Supabase Auth** - Handles user authentication and session management
2. **User Profiles** - Single source of truth for all user data (created via database triggers)
3. **Email Service** - Uses Resend.com for transactional emails
4. **Token Storage** - Email verification and password reset tokens stored in PostgreSQL

## Auth Flow Diagrams

### Signup Flow
```
User → /auth/signup
  ↓
Form validation (display name, email, password)
  ↓
POST /api/auth/signup
  ↓
Create auth user + trigger creates user_profiles
  ↓
Generate verification token
  ↓
Send verification email via Resend
  ↓
User clicks link in email
  ↓
/auth/callback?code=...
  ↓
Session established
  ↓
Redirect to /admin dashboard
```

### Login Flow
```
User → /auth/login
  ↓
Enter email + password
  ↓
POST supabase.auth.signInWithPassword()
  ↓
Session created if credentials valid
  ↓
Redirect to /admin
```

### Password Reset Flow
```
User → /auth/reset-password
  ↓
Enter email
  ↓
POST /api/auth/password-reset-request
  ↓
Generate reset token (1 hour expiry)
  ↓
Send reset email with token link
  ↓
User clicks link in email
  ↓
/auth/reset-password?token=...
  ↓
Enter new password
  ↓
POST /api/auth/password-reset-confirm
  ↓
Update user password
  ↓
Redirect to /auth/login with success message
```

## Database Schema

### email_verification_tokens
- `id` (uuid) - Primary key
- `user_id` (uuid) - Reference to auth.users
- `token` (text) - Unique verification token
- `email` (text) - Email address
- `created_at` (timestamp) - Created time
- `expires_at` (timestamp) - Expiration time (24 hours)

### password_reset_tokens
- `id` (uuid) - Primary key
- `user_id` (uuid) - Reference to auth.users
- `token` (text) - Unique reset token
- `email` (text) - Email address
- `created_at` (timestamp) - Created time
- `expires_at` (timestamp) - Expiration time (1 hour)

## API Routes

### POST /api/auth/signup
Create a new user account.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "displayName": "John Doe"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com"
  },
  "message": "Signup successful. Please verify your email."
}
```

### POST /api/auth/password-reset-request
Request a password reset email.

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "If an account exists with this email, a reset link has been sent"
}
```

### POST /api/auth/password-reset-confirm
Confirm password reset with new password.

**Request:**
```json
{
  "token": "reset-token-from-email",
  "newPassword": "NewPassword456!"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password reset successfully. You can now log in with your new password."
}
```

## Environment Variables Required

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Email Service
RESEND_API_KEY=your_resend_api_key

# App URL (for email links)
NEXT_PUBLIC_APP_URL=http://localhost:3000  # or your production URL
```

## Implementation Checklist

- [x] Signup page with form validation
- [x] Login page with email/password authentication
- [x] Password reset page with two-step flow
- [x] Email verification page (pending)
- [x] Auth callback handler
- [x] API endpoints for signup, password reset
- [x] Database schema for tokens
- [x] Middleware for route protection
- [ ] Email templates customization
- [ ] Two-factor authentication (future)
- [ ] Social login (future)
- [ ] Session persistence across tabs
- [ ] Logout functionality
- [ ] Account deletion

## Security Considerations

1. **Tokens** - All tokens are cryptographically random (32 bytes) and single-use
2. **Expiration** - Email verification tokens expire in 24 hours, password reset tokens in 1 hour
3. **Rate Limiting** - Consider implementing rate limiting on auth endpoints
4. **HTTPS Only** - Ensure cookies are only sent over HTTPS in production
5. **CSRF Protection** - Use SameSite cookie attribute
6. **Sensitive Data** - Never log passwords or tokens to stdout
7. **API Keys** - Rotate Resend and Supabase API keys regularly

## Testing

### Test Signup
1. Go to `/auth/signup`
2. Fill in email, password (min 8 chars), display name
3. Submit form
4. Verify email appears on verification pending page

### Test Login
1. Go to `/auth/login`
2. Enter email and password from signup
3. Should redirect to `/admin` on success

### Test Password Reset
1. Go to `/auth/reset-password`
2. Enter registered email
3. Check email for reset link
4. Click link (or manually go to reset-password with token)
5. Enter new password
6. Should redirect to login with success message

## Troubleshooting

### "Failed to create user"
- Check if email already exists
- Verify password meets requirements (8+ characters)
- Check Supabase service role key is correct

### "Invalid or expired token"
- Token may have expired (24 hours for email verification, 1 hour for password reset)
- Request a new reset link
- Verify token is in URL correctly

### "Failed to send email"
- Check Resend API key is valid
- Verify email address is in correct format
- Check Resend dashboard for API errors

### User not created after signup
- Database triggers should auto-create user_profiles
- Check Supabase logs for trigger errors
- Ensure user_profiles table exists with correct schema

## Future Enhancements

1. **Email Templates** - Create branded HTML email templates
2. **Magic Links** - Passwordless authentication option
3. **Social Auth** - GitHub, Google OAuth integration
4. **2FA** - Two-factor authentication with TOTP
5. **Account Recovery** - Multiple recovery methods
6. **Session Management** - Better session refresh handling
7. **Admin Dashboard** - View all users, reset passwords, manage permissions
8. **Audit Logging** - Track all auth events

