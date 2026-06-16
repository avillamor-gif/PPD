-- Delete the incorrectly created user
DELETE FROM auth.users WHERE email = 'akawar@gmail.com';

-- Verify deleted
SELECT COUNT(*) FROM auth.users WHERE email = 'akawar@gmail.com';
