# Apply Database Trigger Fix - 3 Simple Steps

## The Problem
Both **public signup** and **admin user creation** are failing because Supabase's trigger function `handle_new_user()` is missing permissions. It needs the `SECURITY DEFINER` clause to bypass Row Level Security (RLS).

## How to Fix (Choose ONE option)

### Option 1: Supabase Dashboard (Easiest - 2 minutes)

1. **Go to Supabase Dashboard**
   - URL: https://app.supabase.com
   - Log in with your Supabase account
   - Select project: `ppd` (ref: ygzomuopsdiacdafymoq)

2. **Open SQL Editor**
   - Click **SQL Editor** in left sidebar
   - Click **+ New Query** button

3. **Copy and Execute**
   - Copy the entire SQL from: `supabase/migrations/fix_auth_triggers.sql`
   - Paste it into the SQL editor
   - Click **Execute** button (or Cmd+Enter)
   - Wait for completion ✅

4. **Test it works**
   - Go to http://localhost:3000/auth/signup
   - Fill form with test email: test@example.com
   - Should work now!

---

### Option 2: Command Line (If you have Supabase CLI access)

```bash
cd /Users/leopura/Desktop/ppd

# Requires SUPABASE_ACCESS_TOKEN to be set
supabase db push --linked

# Or manually execute the SQL file
supabase db query < supabase/migrations/fix_auth_triggers.sql
```

---

### Option 3: Contact Supabase Support (If you need help)

**Tell them:**
- Project ref: `ygzomuopsdiacdafymoq`
- Problem: Auth user creation fails with HTTP 500 when trigger tries to insert into `user_profiles`
- Root cause: Function `handle_new_user()` missing `SECURITY DEFINER` clause
- Solution file: `supabase/migrations/fix_auth_triggers.sql`

---

## What the Fix Does

**Before (Broken):**
```sql
CREATE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles ...  -- Fails! No permissions
END;
$$ LANGUAGE plpgsql;  -- Missing SECURITY DEFINER!
```

**After (Fixed):**
```sql
CREATE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles ...  -- Works! Has permissions
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
```

---

## Verify the Fix Works

After applying, try both:

**Public Signup (Test in browser):**
- Go to http://localhost:3000/auth/signup
- Enter: email=test123@example.com, displayName=Test User
- Should see: "Check your email" message
- Email should arrive in your inbox

**Admin User Creation (Test in browser):**
- Go to http://localhost:3000/admin/users/create
- Enter: email=admin.test@example.com, displayName=Admin Test, password=Test123!@#, role=User
- Should see: Success message and redirect to /admin/users

---

## Still Stuck?

If the SQL doesn't execute or you get errors:

1. **Check you're logged in as project owner** in Supabase dashboard
2. **Check it's the correct project** (ref: ygzomuopsdiacdafymoq)
3. **Try running the SQL in steps** - copy each function separately
4. **Check error message** in SQL editor output panel

---

## Files Involved

- SQL Fix: `supabase/migrations/fix_auth_triggers.sql`
- Public Signup: `app/auth/signup/page.tsx` + `app/api/auth/signup/route.ts`
- Admin Creation: `app/admin/users/create/page.tsx` + `app/api/admin/users/route.ts`
- Email Logic: `lib/email.ts`

Both need the trigger fix applied to work.
