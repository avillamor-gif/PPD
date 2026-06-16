-- Delete the broken user completely
DELETE FROM auth.users WHERE email = 'akawar@gmail.com';

-- Verify deletion
SELECT COUNT(*) as remaining_users FROM auth.users WHERE email = 'akawar@gmail.com';
