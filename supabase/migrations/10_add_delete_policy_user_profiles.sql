-- Add DELETE policy for service_role on user_profiles
-- Allows admin deletion of user profiles via API

CREATE POLICY "Service role can delete profiles" ON user_profiles FOR DELETE WITH CHECK (auth.role() IN ('service_role', 'postgres'));
