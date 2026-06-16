-- ============================================
-- CHECK ADMIN USER STATUS
-- Run this in Supabase SQL Editor
-- ============================================

-- Check if auth user exists
SELECT 'Auth Users' as check_type, COUNT(*) as count 
FROM auth.users 
WHERE email = 'akawar@gmail.com';

-- Check if profile exists
SELECT 'User Profiles' as check_type, COUNT(*) as count 
FROM user_profiles 
WHERE id IN (SELECT id FROM auth.users WHERE email = 'akawar@gmail.com');

-- Get full details
SELECT 
  'Full Details' as check_type,
  u.id,
  u.email,
  u.email_confirmed_at,
  COALESCE(up.display_name, 'NO PROFILE') as display_name,
  COALESCE(r.name, 'NO ROLE') as role
FROM auth.users u
LEFT JOIN user_profiles up ON u.id = up.id
LEFT JOIN roles r ON up.role_id = r.id
WHERE u.email = 'akawar@gmail.com';
