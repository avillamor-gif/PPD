-- Create admin user with proper Supabase auth structure
-- This uses pgcrypto (already enabled) to hash password correctly

INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  created_at,
  updated_at,
  last_sign_in_at,
  role,
  aud
)
VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'akawar@gmail.com',
  crypt('2ngbatang2ng!@#', gen_salt('bf')),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Admin User"}',
  false,
  NOW(),
  NOW(),
  NOW(),
  'authenticated',
  'authenticated'
);

-- Verify user was created
SELECT id, email, email_confirmed_at FROM auth.users WHERE email = 'akawar@gmail.com';

-- Create profile
INSERT INTO user_profiles (id, display_name, role_id)
SELECT u.id, 'Admin User', r.id
FROM auth.users u, roles r
WHERE u.email = 'akawar@gmail.com' AND r.name = 'admin'
AND u.id NOT IN (SELECT id FROM user_profiles);

-- Create preferences
INSERT INTO user_preferences (user_id)
SELECT id FROM auth.users 
WHERE email = 'akawar@gmail.com'
AND id NOT IN (SELECT user_id FROM user_preferences);

-- Verify all three
SELECT 
  u.id, u.email,
  COALESCE(up.display_name, 'NO PROFILE') as display_name,
  COALESCE(r.name, 'NO ROLE') as role
FROM auth.users u
LEFT JOIN user_profiles up ON u.id = up.id
LEFT JOIN roles r ON up.role_id = r.id
WHERE u.email = 'akawar@gmail.com';
