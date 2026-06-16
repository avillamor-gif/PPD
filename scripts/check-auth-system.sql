-- Check if Supabase auth is set up
-- Run this in Supabase SQL Editor

-- 1. Check if auth schema exists
SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'auth';

-- 2. Check if auth.users table exists
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'auth' AND table_name = 'users';

-- 3. List all tables in auth schema
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'auth'
ORDER BY table_name;

-- 4. Count users in auth.users
SELECT COUNT(*) as user_count FROM auth.users;

-- 5. List all users
SELECT id, email, email_confirmed_at FROM auth.users ORDER BY created_at DESC LIMIT 10;
