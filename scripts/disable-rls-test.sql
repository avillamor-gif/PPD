-- ============================================
-- TEMPORARILY DISABLE RLS TO TEST LOGIN
-- Run this in Supabase SQL Editor
-- ============================================

-- Disable RLS on auth-related tables
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences DISABLE ROW LEVEL SECURITY;
ALTER TABLE roles DISABLE ROW LEVEL SECURITY;

-- This allows us to test if RLS is the blocker
-- After testing, run:
-- ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
