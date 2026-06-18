-- ============================================================
-- TEMPORARY: Disable RLS to test if it's blocking user creation
-- ============================================================
-- Run this in Supabase SQL Editor

ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences DISABLE ROW LEVEL SECURITY;

-- Now try signing up. If it works, RLS was the problem.
-- After confirming, run this to re-enable with proper policies:
/*
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Then create new policies that allow service_role:
DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert their own preferences" ON user_preferences;

CREATE POLICY "Users and service can insert profiles" ON user_profiles 
  FOR INSERT WITH CHECK (auth.uid() = id OR auth.role() IN ('service_role', 'postgres'));

CREATE POLICY "Users and service can insert preferences" ON user_preferences 
  FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.role() IN ('service_role', 'postgres'));

CREATE POLICY "Users can view all profiles" ON user_profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can view own preferences" ON user_preferences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own preferences" ON user_preferences FOR UPDATE USING (auth.uid() = user_id);
*/
