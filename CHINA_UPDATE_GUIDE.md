# China to Mainland China Update Guide

## Overview
This guide documents the replacement of "China" with "Mainland China" across the website and database.

## Changes Made

### 1. **Code Changes** ✅
- **`lib/constants/policies.ts`** - Updated the COUNTRIES array
  - Changed: `{ code: "CN", name: "China", region: "East Asia" }`
  - To: `{ code: "CN", name: "Mainland China", region: "East Asia" }`

### 2. **Documentation Updates** ✅
- **`BUILD_SUMMARY.md`** - Updated all references
  - Region list on countries page
  - Sample data references

### 3. **Database Changes** ✅
Created migration file: **`supabase/migrations/08_update_china_to_mainland_china.sql`**
- Automatically updates existing country records in the database
- Handles both existing and new installations

## Deployment Steps

### Step 1: Deploy Code Changes
```bash
git add lib/constants/policies.ts BUILD_SUMMARY.md
git commit -m "refactor: replace 'China' with 'Mainland China'"
git push
```

### Step 2: Apply Database Migration

**Option A: Supabase Dashboard**
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to SQL Editor
4. Open `supabase/migrations/08_update_china_to_mainland_china.sql`
5. Copy and paste the SQL into a new query
6. Run the query

**Option B: Supabase CLI**
```bash
supabase db push --remote
```

**Option C: Manual SQL**
```sql
UPDATE countries 
SET name = 'Mainland China'
WHERE code = 'CN' AND name = 'China';

INSERT INTO countries (code, name, region)
VALUES ('CN', 'Mainland China', 'East Asia')
ON CONFLICT (code) DO UPDATE
SET name = 'Mainland China'
WHERE countries.name = 'China';
```

### Step 3: Sync Countries (Optional - for Initial Setup)
If you're setting up a new environment or want to ensure full synchronization:

```bash
# Ensure environment variables are set
export NEXT_PUBLIC_SUPABASE_URL="your_supabase_url"
export SUPABASE_SERVICE_ROLE_KEY="your_service_role_key"

# Run sync script
node scripts/sync-countries.js
```

## Verification

### Frontend Verification
1. Visit the application
2. Go to the Countries page or any dropdown with countries
3. Verify "Mainland China" appears instead of "China"
4. The country code should still be "CN"

### Database Verification

**Via Supabase Dashboard:**
1. Go to SQL Editor
2. Run this query:
```sql
SELECT * FROM countries WHERE code = 'CN';
```
3. Should return: `CN | Mainland China | East Asia`

**Via CLI:**
```bash
psql [your_database_url] -c "SELECT * FROM countries WHERE code = 'CN';"
```

### API Verification
```bash
curl https://your-app.com/api/reference-data
```
Look for the countries array to verify "Mainland China" is returned.

## Rollback Instructions

If you need to revert the changes:

```sql
UPDATE countries 
SET name = 'China'
WHERE code = 'CN' AND name = 'Mainland China';
```

Then revert the code changes:
```bash
git revert [commit_hash]
git push
```

## Notes

- The country code remains `CN` - only the display name changed
- All policies associated with `CN` will automatically display as "Mainland China"
- The `sync-countries.js` script ensures both the database and frontend are synchronized
- This change is purely a data update with no breaking changes to the API or database schema

## Files Modified

1. ✅ `/lib/constants/policies.ts` - Frontend constants
2. ✅ `/BUILD_SUMMARY.md` - Documentation
3. ✅ `/supabase/migrations/08_update_china_to_mainland_china.sql` - Database migration
4. ✅ `/scripts/sync-countries.js` - Synchronization utility (new)

## Support

If you encounter any issues:
1. Check the Supabase logs
2. Verify all environment variables are set correctly
3. Ensure the database migration ran successfully
4. Clear browser cache and rebuild the Next.js app if needed: `npm run build`
