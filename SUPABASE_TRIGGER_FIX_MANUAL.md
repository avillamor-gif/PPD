# Manual Supabase Trigger Function Fix

## Problem
Admin user creation is failing with HTTP 500 error from Supabase. The trigger function `handle_new_user()` in the production database is missing the `SECURITY DEFINER` clause, causing permissions errors when trying to insert into the `user_profiles` table during user creation.

## Error Message
```
Error: Database error creating new user
Status: 500
Error Code: unexpected_failure
```

## Solution: Manual SQL Execution in Supabase Dashboard

### Step 1: Access Supabase Dashboard
1. Go to https://app.supabase.com
2. Log in with your Supabase account
3. Select your project: **ppd** (project-ref: `ygzomuopsdiacdafymoq`)

### Step 2: Open SQL Editor
1. In the left sidebar, click on **SQL Editor**
2. Click **+ New Query** (or **New**)
3. You should see a blank SQL editor

### Step 3: Copy and Paste the Fix SQL
Copy the entire contents of the file `create-rpc-and-fix.sql` from this repository and paste it into the SQL Editor.

The SQL will:
- Drop the old trigger and functions
- Recreate the trigger functions with proper `SECURITY DEFINER` clause
- Fix schema references to use `public.` prefix
- Restore the email verification handler trigger

### Step 4: Execute the SQL
1. Click the **Execute** button (or press `Cmd+Enter` / `Ctrl+Enter`)
2. Wait for the execution to complete
3. Check the output panel for any errors
4. Should see confirmations like "Query executed successfully" or similar

### Step 5: Verify the Fix
Go back to the Next.js app and try creating a user again:
1. Navigate to http://localhost:3000/admin/users/create (dev) or https://ppd-pink.vercel.app/admin/users/create (production)
2. Fill in the form with test credentials:
   - Email: avillamor0409@gmail.com
   - Display Name: Test User
   - Password: TestPass123!@#
   - Role: User
3. Click "Create User"
4. Should see success message and redirect to /admin/users

## Troubleshooting

### If you see permission errors in SQL Editor:
- Make sure you're logged in as the project owner
- Verify you're in the correct project
- Check that the API key has admin/service_role permissions

### If execution fails with function already exists error:
This is normal - the SQL includes `DROP IF EXISTS` statements. It's safe to retry.

### If it still doesn't work:
1. Contact Supabase support with these details:
   - Project reference ID: ygzomuopsdiacdafymoq
   - Error type: trigger function causing auth user creation to fail
   - Error message: "Database error creating new user" (status 500)

## What the Fix Does

### Current (Broken) Trigger Function
```sql
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (id, display_name, email_verified)
  VALUES (NEW.id, COALESCE(...), FALSE);
  INSERT INTO user_preferences (user_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;  -- ❌ Missing SECURITY DEFINER!
```

### Fixed Trigger Function  
```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (...)
  VALUES (...);
  INSERT INTO public.user_preferences (user_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;  -- ✅ Fixed!
```

**Key Changes:**
1. Added `public.` schema prefix to function name and table references
2. Added `SECURITY DEFINER` clause to grant proper permissions
3. Added `SET search_path = public` for consistent schema resolution
4. Fixed role_id default from implicit to explicit value (4)
5. Added email verification trigger handler

## Files Referenced
- `create-rpc-and-fix.sql` - SQL fix to paste in dashboard
- `app/api/admin/users/route.ts` - Admin user creation API (will work after fix)
- `app/admin/users/create/page.tsx` - Admin user creation form interface

## Testing After Fix

### Create Test User
- Email: test@example.com
- Password: Test123!@#
- Role: User

### Verify in Admin Panel
- User should appear in /admin/users list
- Status should show "Active"
- Email verified should show "Yes"

### Test Login
- Go to /auth/login
- Use the test credentials
- Should successfully log in and redirect to profile
