-- ============================================================
-- FIX: Allow service_role to insert profiles/preferences via triggers
-- ============================================================
-- Run this in Supabase SQL Editor to fix RLS blocking user creation

-- Drop existing policies that are blocking the trigger
DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert their own preferences" ON user_preferences;

-- Create new policies that allow both users AND service_role
-- This lets the trigger create profiles when new users sign up
CREATE POLICY "Users can insert their own profile" ON user_profiles 
  FOR INSERT WITH CHECK (
    auth.uid() = id 
    OR auth.role() IN ('service_role', 'postgres')
  );

CREATE POLICY "Service role can manage profiles" ON user_profiles 
  FOR INSERT WITH CHECK (auth.role() IN ('service_role', 'postgres'));

CREATE POLICY "Users can insert their own preferences" ON user_preferences 
  FOR INSERT WITH CHECK (
    auth.uid() = user_id 
    OR auth.role() IN ('service_role', 'postgres')
  );

CREATE POLICY "Service role can manage preferences" ON user_preferences 
  FOR INSERT WITH CHECK (auth.role() IN ('service_role', 'postgres'));

-- Verify the policies exist
SELECT tablename, policyname FROM pg_policies 
WHERE tablename IN ('user_profiles', 'user_preferences')
ORDER BY tablename, policyname;
