# URGENT: Manual Database Fix Required

## Problem
User creation (both signup and admin) is failing because the Supabase trigger functions are missing `SECURITY DEFINER` clause, causing RLS permission errors.

**Error:** HTTP 500 "Database error creating new user"
**Affects:** All user creation (signup, admin users)
**Status:** 🔴 BLOCKING - needs immediate manual fix

## Solution: Execute Migration in Supabase Dashboard

### Step 1: Open Supabase Dashboard
1. Go to: https://supabase.com/dashboard/project/ygzomuopsdiacdafymoq/sql/new
2. You'll see the SQL Editor with a blank query window

### Step 2: Copy the Migration SQL
Open this file and copy all the SQL content:
📄 `/supabase/migrations/05_fix_auth_triggers.sql`

The SQL looks like this (first few lines):
```sql
DROP TRIGGER IF EXISTS trigger_handle_new_user ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
...
```

### Step 3: Paste into SQL Editor
1. In the Supabase SQL Editor, paste the entire SQL content
2. You should see all the SQL statements highlighted

### Step 4: Execute
1. Click the **Execute** button (or press Cmd+Enter on Mac / Ctrl+Enter on Windows)
2. Wait for execution to complete
3. Look for a success message like "16 statements executed" or similar

### Step 5: Verify Fix
Go back to the app and test:
- **Production URL:** https://ppd-pink.vercel.app/
- **Test Signup:** Try creating a new account
- **Test Admin User:** Go to /admin/users/create (if logged in as admin)

Both should now work without the 500 error.

## What the Fix Does

**Before (Current - Broken):**
```sql
CREATE OR REPLACE FUNCTION handle_new_user()  -- ❌ Missing SECURITY DEFINER
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles ...  -- ❌ RLS blocks this
  ...
END;
$$ LANGUAGE plpgsql;
```

**After (Fixed):**
```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()  -- ✅ With schema
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles ...
  ...
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;  -- ✅ Fixed!
```

The `SECURITY DEFINER` clause makes the function run with the permissions of the function owner (postgres), which bypasses RLS restrictions.

## Testing

### Test 1: Public Signup
1. Go to https://ppd-pink.vercel.app/auth/login
2. Click "Sign up"
3. Fill in credentials:
   - Email: test@example.com
   - Password: Test123!@#
4. Should create account without 500 error
5. Check email for verification link (may go to spam)

### Test 2: Admin User Creation
1. Log in as admin at https://ppd-pink.vercel.app/auth/login
   - Email: admin@example.com (or your admin account)
2. Go to https://ppd-pink.vercel.app/admin/users/create
3. Fill form:
   - Email: newuser@example.com
   - Display Name: Test User
   - Password: TestPass123!@#
   - Role: User
4. Click "Create User"
5. Should succeed and show confirmation

### Test 3: Verify User in Admin Panel
1. Go to https://ppd-pink.vercel.app/admin/users
2. Find the newly created user in the list
3. Should show:
   - ✅ Email verified: Yes
   - ✅ Role: User (or whatever was selected)
   - ✅ Status: Active

## Troubleshooting

### "Permission denied" error in SQL Editor
- Make sure you're logged in as the project owner
- Try logging out and back in
- Check that you're in the correct project (ygzomuopsdiacdafymoq)

### "Function already exists" error
- This is OK! The SQL has `DROP IF EXISTS` so it's safe to retry
- Just execute again

### Still getting 500 errors after fix
1. Check the browser console for error details
2. Check the server logs at: https://ppd-pink.vercel.app/api/health
3. Verify the fix executed successfully in Supabase dashboard

## Files Changed
- ✅ `supabase/migrations/05_fix_auth_triggers.sql` - Migration to fix triggers
- ✅ `app/api/admin/users/route.ts` - Enhanced error handling
- ✅ `app/api/admin/migrate/route.ts` - Migration endpoint (for future use)

## Next Steps After Fix
Once user creation is working:
1. Test the complete signup/login flow
2. Test admin user management  
3. Test email notifications (if applicable)
4. Monitor for any remaining 500 errors

---

**⏱️ Estimated time to fix:** 2-3 minutes
**🎯 Priority:** 🔴 CRITICAL - All user creation blocked

