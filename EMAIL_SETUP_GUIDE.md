# Email Verification Setup Guide

## Current Status
Email verification emails are **not being sent** because the Resend configuration is incomplete.

## Root Causes

### 1. Missing Resend API Key
- **Environment Variable**: `RESEND_API_KEY`
- **Status**: ❌ Not configured
- **Impact**: Email sending fails silently

### 2. Unverified Email Domain
- **Current From Address**: `noreply@plasticpolicydatabase.com`
- **Status**: ❌ Not verified with Resend
- **Impact**: Only verified domains can send emails through Resend

### 3. Incorrect Default Configuration
- **Development Mode**: Should use `onboarding@resend.dev` (Resend's test domain)
- **Production Mode**: Should use verified custom domain
- **Current**: Using unverified domain by default

## 🚀 Quick Fix (5 minutes)

### Step 1: Get Resend API Key
1. Go to https://resend.com
2. Sign in (or create free account)
3. Go to API Keys section
4. Click "Create API Key"
5. Copy the key (starts with `re_`)

### Step 2: Set Environment Variables

#### For Development (Local):
```bash
# Create or update .env.local
RESEND_API_KEY=re_YOUR_API_KEY_HERE
NEXT_PUBLIC_EMAIL_FROM=onboarding@resend.dev
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

#### For Production (Vercel):
1. Go to Vercel Project Settings
2. Environment Variables → Add
3. Add `RESEND_API_KEY=re_YOUR_API_KEY_HERE`
4. Add `NEXT_PUBLIC_EMAIL_FROM=onboarding@resend.dev` (for testing)
5. Redeploy project

### Step 3: Verify Configuration
```bash
# Test email sending locally
node test-signup-email.js

# Should see: ✅ Email sent successfully!
```

## 📧 For Production Email Domain

### Option A: Use Resend's onboarding Domain (✅ Recommended for Testing)
- Works immediately
- No domain verification needed
- Emails come from: `onboarding@resend.dev`
- Perfect for testing entire workflow

```env
NEXT_PUBLIC_EMAIL_FROM=onboarding@resend.dev
```

### Option B: Use Your Custom Domain (Production)
1. Go to Resend Dashboard
2. Domains → Add Domain
3. Enter: `plasticpolicydatabase.com`
4. Follow DNS verification steps
5. Update `.env`:

```env
NEXT_PUBLIC_EMAIL_FROM=noreply@plasticpolicydatabase.com
```

## 🔍 How to Verify It's Working

### 1. Check Resend Dashboard
- https://resend.com/emails
- Should show sent emails after signup

### 2. Test Email Sending
```bash
# Run test script
node test-signup-email.js

# Check output:
# ✅ Email sent successfully! (Good)
# ❌ Email sending failed (Check API key)
```

### 3. Test Full Signup Flow
1. Go to http://localhost:3000/auth/login
2. Click "Sign up"
3. Enter: `test@example.com` / `Test User`
4. Check browser console and server logs for:
   - `📧 [EMAIL] sendSetPasswordEmail called`
   - `📧 [EMAIL] Email sent successfully`
5. Check Resend dashboard for sent email

## 📋 Configuration Checklist

- [ ] Resend account created at https://resend.com
- [ ] API key obtained (starts with `re_`)
- [ ] `RESEND_API_KEY` set in `.env.local` (development)
- [ ] `RESEND_API_KEY` set in Vercel (production)
- [ ] `NEXT_PUBLIC_EMAIL_FROM=onboarding@resend.dev` for testing
- [ ] `NEXT_PUBLIC_APP_URL` set to correct domain
- [ ] Run `node test-signup-email.js` to verify
- [ ] Test signup flow and check for email

## 🆘 Troubleshooting

### Email Sending Fails
**Check**: 
1. Is `RESEND_API_KEY` set?
   ```bash
   echo $RESEND_API_KEY  # Should print your key
   ```
2. Is the key valid?
   - Keys start with `re_`
   - Check it matches Resend dashboard

### Emails Not Received
**Check**:
1. Is `NEXT_PUBLIC_EMAIL_FROM` set correctly?
   - For testing: `onboarding@resend.dev`
   - For production: verified domain
2. Check spam folder
3. Check Resend dashboard for delivery status

### "Missing Resend configuration" Error
**Fix**:
```bash
# Make sure API key is set
export RESEND_API_KEY=re_YOUR_KEY
# Restart dev server
npm run dev
```

## 📊 Email Flow Diagram

```
1. User Signs Up
   ↓
2. POST /api/auth/signup
   ↓
3. sendSetPasswordEmail() called
   ↓
4. getResend() - initializes client
   ↓
5. Check: RESEND_API_KEY set?
   ├─ No → Error: Missing Resend configuration
   └─ Yes → Continue
   ↓
6. resendClient.emails.send()
   ↓
7. Check: Email domain verified?
   ├─ No → Error: Domain not verified
   └─ Yes → Email sent!
   ↓
8. Email received in inbox
   ↓
9. User clicks verification link
   ↓
10. Password setup → Redirect to dashboard
```

## 🎯 Next Steps

1. **Immediate** (Now):
   - [ ] Get Resend API key from https://resend.com
   - [ ] Add to `.env.local`
   - [ ] Run `npm run dev`
   - [ ] Test with `node test-signup-email.js`

2. **Short-term** (This week):
   - [ ] Test complete signup → email → set password flow
   - [ ] Verify password redirect works
   - [ ] Confirm auto-login happens

3. **Long-term** (Production):
   - [ ] Verify custom domain with Resend
   - [ ] Update email from address
   - [ ] Test end-to-end in production

## 📞 Support

If emails still don't arrive:
1. Check Resend dashboard: https://resend.com/emails
2. Check browser console for errors
3. Check server logs: `npm run dev` output
4. Verify all environment variables are set
5. Contact Resend support: https://resend.com/support
