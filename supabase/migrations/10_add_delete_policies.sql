-- Add DELETE policies for service_role to enable automatic user deletion

-- USER PROFILES: Allow service_role to delete
CREATE POLICY "Service role can delete profiles" ON user_profiles FOR DELETE USING (auth.role() = 'service_role');

-- USER PROFILES: Allow admins to delete (manual Supabase deletion)
CREATE POLICY "Admins can delete profiles" ON user_profiles FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role_id = (SELECT id FROM roles WHERE name = 'admin')
  )
);

-- USER PREFERENCES: Allow service_role to delete
CREATE POLICY "Service role can delete preferences" ON user_preferences FOR DELETE USING (auth.role() = 'service_role');

-- EMAIL VERIFICATION TOKENS: Allow service_role to delete
CREATE POLICY "Service role can delete verification tokens" ON email_verification_tokens FOR DELETE USING (auth.role() = 'service_role');

-- PASSWORD RESET TOKENS: Allow service_role to delete
CREATE POLICY "Service role can delete reset tokens" ON password_reset_tokens FOR DELETE USING (auth.role() = 'service_role');

-- COMMENT REACTIONS: Allow service_role to delete
CREATE POLICY "Service role can delete reactions" ON comment_reactions FOR DELETE USING (auth.role() = 'service_role');

-- NOTIFICATIONS: Allow service_role to delete
CREATE POLICY "Service role can delete notifications" ON notifications FOR DELETE USING (auth.role() = 'service_role');
