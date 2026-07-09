# Database Migration: Fix User Creation Triggers

**Status**: ⏳ **READY TO EXECUTE** - Code deployed, migration SQL ready

## The Problem

User creation (signup and admin) is currently returning HTTP 500 errors because trigger functions in Supabase are missing the `SECURITY DEFINER` clause, which prevents them from bypassing Row Level Security (RLS).

## The Solution

Execute this SQL migration in your Supabase project:

### Option 1: Supabase Dashboard (Recommended)

1. **Navigate to SQL Editor**:
   - Go to: https://supabase.com/dashboard/project/ygzomuopsdiacdafymoq/sql/new

2. **Copy the migration SQL**:
   - Open `/supabase/migrations/05_fix_auth_triggers.sql` in your editor
   - Select ALL text (Cmd+A)
   - Copy it (Cmd+C)

3. **Paste and Execute**:
   - Click in the Supabase SQL Editor textarea
   - Paste the SQL (Cmd+V)
   - Click the blue "Run" button (or press Cmd+Enter)
   - **IMPORTANT**: Confirm when prompted about destructive operations

4. **Verify Success**:
   - Look for completion message (not an error)
   - Result should show query executed successfully

### Option 2: Using Supabase CLI

If you prefer the CLI:

```bash
cd /Users/leopura/Desktop/ppd
supabase link --project-ref ygzomuopsdiacdafymoq
supabase db push --skip-seed
```

(Requires Supabase account access and authentication token)

### Option 3: Direct SQL Execution

If you have direct database access:

```bash
psql "postgresql://[user]:[password]@db.[project-id].supabase.co:5432/postgres" \
  -f /Users/leopura/Desktop/ppd/supabase/migrations/05_fix_auth_triggers.sql
```

## What Gets Fixed

The migration recreates two trigger functions with `SECURITY DEFINER`:

1. **`handle_new_user()`** - Executes on auth.users INSERT
   - Creates user_profiles record
   - Creates user_preferences record
   - Assigns default 'user' role

2. **`handle_email_verified()`** - Executes on auth.users UPDATE
   - Updates email_verified status when user confirms email

## Testing After Migration

### Test 1: Public Signup
```
1. Go to: https://ppd-pink.vercel.app/auth/login
2. Click "Sign up"
3. Enter: test@example.com / TestPassword123!
4. Should complete without errors
```

### Test 2: Admin User Creation
```
1. Go to: https://ppd-pink.vercel.app/admin/users/create
2. Fill form with:
   - Email: avillamor0409@gmail.com
   - Display Name: Test User
   - Password: 2ngbatang2ng!@#
   - Role: User
3. Click "Create User"
4. Should show success message
```

### Test 3: Verify User Created
```
1. Go to: https://ppd-pink.vercel.app/admin/users
2. Should see the new user listed
3. Email verified status should show "Yes"
4. User can login with credentials
```

## Troubleshooting

**If you get syntax errors when pasting**:
- Try copying/pasting in smaller chunks (DDL statements separately)
- Or use the CLI approach instead
- Or contact Supabase support with the SQL file

**If the migration says "0 rows"**:
- This is normal! DDL commands (CREATE/DROP) don't return rows
- Look for "success" message, not row count

**If user creation still fails after migration**:
- Clear browser cache
- Check that no RLS policies are blocking inserts
- Verify the trigger functions exist: `SELECT proname FROM pg_proc WHERE proname LIKE 'handle_%'`

## Database Schema Changes

No schema changes - only recreation of existing functions with SECURITY DEFINER clause.

### Before
```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- ... function body
END;
$$ LANGUAGE plpgsql;  -- ❌ Missing SECURITY DEFINER
```

### After
```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- ... function body
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;  -- ✅ Added
```

## Important Notes

- **Backup Recommended**: Though we're not modifying data, consider backing up your database first
- **No Data Loss**: This migration only affects trigger functions, not user data
- **Immediate Effect**: Changes take effect immediately after execution
- **Reversible**: Can revert by re-applying the old functions (though not recommended)

## Success Indicators

After successful migration:
- ✅ User creation works without HTTP 500 errors
- ✅ Users appear in admin list immediately
- ✅ Email verification process works
- ✅ All user roles assigned correctly
- ✅ User preferences created automatically

---

**Need help?** Check the migration file for detailed SQL comments:
`/Users/leopura/Desktop/ppd/supabase/migrations/05_fix_auth_triggers.sql`

**Deployed Code**: All frontend changes are live at https://ppd-pink.vercel.app/
**Ready**: Just waiting for this database migration to be executed!
