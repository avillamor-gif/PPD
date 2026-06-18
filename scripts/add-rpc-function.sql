-- Create RPC function for updating email_confirmed
-- Run this in Supabase SQL editor

CREATE OR REPLACE FUNCTION update_user_email_confirmed(user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE auth.users
  SET email_confirmed_at = NOW()
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to service_role
GRANT EXECUTE ON FUNCTION update_user_email_confirmed(UUID) TO service_role;

-- Verify it worked
SELECT 'RPC function created successfully' as status;
