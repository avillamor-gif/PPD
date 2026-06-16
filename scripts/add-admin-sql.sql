-- ============================================
-- ADD ADMIN USER VIA SQL (Supabase Compatible)
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Create new user with hashed password
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_user_meta_data,
  created_at,
  updated_at,
  last_sign_in_at,
  role
)
VALUES (
  gen_random_uuid(),
  'akawar@gmail.com',
  crypt('2ngbatang2ng!@#', gen_salt('bf')),
  NOW(),
  '{"full_name": "Admin User"}',
  NOW(),
  NOW(),
  NOW(),
  'authenticated'
);

-- 2. Update the profile to admin role (trigger should have created it)
UPDATE user_profiles
SET role_id = (SELECT id FROM roles WHERE name = 'admin')
WHERE id = (SELECT id FROM auth.users WHERE email = 'akawar@gmail.com');

-- 3. Verify the user was created
SELECT 
  u.id,
  u.email,
  u.email_confirmed_at,
  up.display_name,
  r.name as role
FROM auth.users u
LEFT JOIN user_profiles up ON u.id = up.id
LEFT JOIN roles r ON up.role_id = r.id
WHERE u.email = 'akawar@gmail.com';
