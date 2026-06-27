-- ============================================
-- SUPABASE SCHEMA: Plastic Policy Database
-- Industry-Standard User Management + Forum
-- ============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- 1. ROLES & PERMISSIONS
-- ============================================

CREATE TABLE IF NOT EXISTS roles (
  id BIGSERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default roles
INSERT INTO roles (name, description) VALUES
  ('admin', 'Administrator with full access'),
  ('moderator', 'Forum moderator'),
  ('expert', 'Policy expert or contributor'),
  ('user', 'Regular user'),
  ('guest', 'Unregistered guest')
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- 1.5. POLICIES (Plastic Policy Database)
-- ============================================

CREATE TABLE IF NOT EXISTS policies (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  summary TEXT,
  year INTEGER,
  commencement_date DATE,
  country VARCHAR(2) NOT NULL,
  level VARCHAR(50), -- National, Sub-national, Regional, International
  category TEXT NOT NULL, -- Themes
  keywords TEXT,
  status VARCHAR(50) DEFAULT 'Unknown', -- Unknown, Proposed, Enacted, Repealed, etc
  instrument VARCHAR(100), -- Act, Bill, Regulation, Directive, etc
  authority TEXT NOT NULL, -- Competent authority
  link TEXT NOT NULL, -- Official policy link
  other_links TEXT, -- Additional references
  language VARCHAR(10), -- Language of the policy
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for policies
CREATE INDEX IF NOT EXISTS idx_policies_country ON policies(country);
CREATE INDEX IF NOT EXISTS idx_policies_year ON policies(year DESC);
CREATE INDEX IF NOT EXISTS idx_policies_category ON policies(category);
CREATE INDEX IF NOT EXISTS idx_policies_status ON policies(status);
CREATE INDEX IF NOT EXISTS idx_policies_created_at ON policies(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_policies_level ON policies(level);

-- ============================================
-- 2. USER PROFILES (extends auth.users)
-- ============================================

CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  country_code VARCHAR(2),
  organization TEXT,
  role_id BIGINT REFERENCES roles(id) DEFAULT 4, -- 4 = 'user' role (hardcoded per insertion order)
  email_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 3. EMAIL VERIFICATION TOKENS
-- ============================================

CREATE TABLE IF NOT EXISTS email_verification_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, email)
);

-- ============================================
-- 4. PASSWORD RESET TOKENS
-- ============================================

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 5. USER PREFERENCES & SETTINGS
-- ============================================

CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email_on_reply BOOLEAN DEFAULT TRUE,
  email_on_mention BOOLEAN DEFAULT TRUE,
  email_weekly_digest BOOLEAN DEFAULT FALSE,
  email_policy_updates BOOLEAN DEFAULT TRUE,
  theme_preference VARCHAR(10) DEFAULT 'light', -- light, dark, auto
  language_preference VARCHAR(5) DEFAULT 'en',
  marketing_emails BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 6. DISCUSSION THREADS
-- ============================================

CREATE TABLE IF NOT EXISTS discussion_threads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  policy_id TEXT NOT NULL, -- references app/data/policies.ts
  title TEXT NOT NULL,
  description TEXT,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  status VARCHAR(20) DEFAULT 'open', -- open, closed, pinned, archived
  is_pinned BOOLEAN DEFAULT FALSE,
  comment_count INT DEFAULT 0,
  last_comment_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Create index for policy lookup
CREATE INDEX IF NOT EXISTS idx_discussion_threads_policy_id ON discussion_threads(policy_id);
CREATE INDEX IF NOT EXISTS idx_discussion_threads_author_id ON discussion_threads(author_id);
CREATE INDEX IF NOT EXISTS idx_discussion_threads_created_at ON discussion_threads(created_at DESC);

-- ============================================
-- 7. COMMENTS (nested replies supported)
-- ============================================

CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  thread_id UUID NOT NULL REFERENCES discussion_threads(id) ON DELETE CASCADE,
  policy_id TEXT NOT NULL, -- denormalized for quick access
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  parent_comment_id UUID REFERENCES comments(id) ON DELETE CASCADE, -- for nested replies
  content TEXT NOT NULL,
  is_edited BOOLEAN DEFAULT FALSE,
  edited_at TIMESTAMP WITH TIME ZONE,
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMP WITH TIME ZONE,
  vote_count INT DEFAULT 0,
  reply_count INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for comments
CREATE INDEX IF NOT EXISTS idx_comments_thread_id ON comments(thread_id);
CREATE INDEX IF NOT EXISTS idx_comments_author_id ON comments(author_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_comment_id ON comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_comments_policy_id ON comments(policy_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC);

-- ============================================
-- 8. COMMENT REACTIONS (votes, helpful, etc)
-- ============================================

CREATE TABLE IF NOT EXISTS comment_reactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reaction_type VARCHAR(20) NOT NULL, -- 'upvote', 'downvote', 'helpful', 'flag'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(comment_id, user_id, reaction_type)
);

CREATE INDEX IF NOT EXISTS idx_comment_reactions_comment_id ON comment_reactions(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_reactions_user_id ON comment_reactions(user_id);

-- ============================================
-- 9. NOTIFICATIONS
-- ============================================

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- 'reply', 'mention', 'thread_comment', 'policy_update'
  title TEXT NOT NULL,
  message TEXT,
  related_comment_id UUID REFERENCES comments(id) ON DELETE SET NULL,
  related_thread_id UUID REFERENCES discussion_threads(id) ON DELETE SET NULL,
  related_policy_id TEXT,
  action_url TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(user_id, created_at DESC);

-- ============================================
-- 10. EMAIL QUEUE (for Resend integration)
-- ============================================

CREATE TABLE IF NOT EXISTS email_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipient_email TEXT NOT NULL,
  recipient_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email_type VARCHAR(50) NOT NULL, -- 'verification', 'password_reset', 'comment_reply', 'mention', 'digest'
  subject TEXT NOT NULL,
  template_name TEXT NOT NULL,
  template_data JSONB,
  status VARCHAR(20) DEFAULT 'pending', -- pending, sent, failed, bounced
  retry_count INT DEFAULT 0,
  max_retries INT DEFAULT 3,
  error_message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_queue_status ON email_queue(status);
CREATE INDEX IF NOT EXISTS idx_email_queue_created_at ON email_queue(created_at);

-- ============================================
-- 11. AUDIT LOG (for admin/moderation)
-- ============================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL, -- 'delete_comment', 'ban_user', 'edit_thread', etc
  resource_type VARCHAR(50) NOT NULL, -- 'comment', 'thread', 'user', 'policy'
  resource_id TEXT NOT NULL,
  changes JSONB, -- before/after state
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_id ON audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- ============================================
-- 12. VIEWS: USER STATS
-- ============================================

CREATE OR REPLACE VIEW user_stats AS
SELECT
  u.id,
  u.email,
  up.display_name,
  r.name as role,
  COUNT(DISTINCT t.id) as thread_count,
  COUNT(DISTINCT c.id) as comment_count,
  MAX(CASE WHEN c.created_at IS NOT NULL THEN c.created_at ELSE t.created_at END) as last_activity_at,
  up.created_at
FROM auth.users u
LEFT JOIN user_profiles up ON u.id = up.id
LEFT JOIN roles r ON up.role_id = r.id
LEFT JOIN discussion_threads t ON u.id = t.author_id AND t.deleted_at IS NULL
LEFT JOIN comments c ON u.id = c.author_id AND c.is_deleted = FALSE
GROUP BY u.id, u.email, up.display_name, up.id, r.name;

-- ============================================
-- 13. ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE discussion_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- USER PROFILES RLS
CREATE POLICY "Users can view all profiles" ON user_profiles FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON user_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = id);
-- Allow service_role and postgres to insert (for triggers)
CREATE POLICY "Service role can insert profiles" ON user_profiles FOR INSERT WITH CHECK (auth.role() IN ('service_role', 'postgres'));

-- USER PREFERENCES RLS
CREATE POLICY "Users can view their own preferences" ON user_preferences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own preferences" ON user_preferences FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own preferences" ON user_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);
-- Allow service_role and postgres to insert (for triggers)
CREATE POLICY "Service role can insert preferences" ON user_preferences FOR INSERT WITH CHECK (auth.role() IN ('service_role', 'postgres'));

-- DISCUSSION THREADS RLS
CREATE POLICY "Anyone can view threads" ON discussion_threads FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create threads" ON discussion_threads FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Thread authors can update their threads" ON discussion_threads FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Thread authors or admins can delete threads" ON discussion_threads FOR DELETE USING (
  auth.uid() = author_id OR EXISTS (
    SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role_id = (SELECT id FROM roles WHERE name = 'admin')
  )
);

-- COMMENTS RLS
CREATE POLICY "Anyone can view comments" ON comments FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create comments" ON comments FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Comment authors can update their comments" ON comments FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Comment authors or admins can delete comments" ON comments FOR DELETE USING (
  auth.uid() = author_id OR EXISTS (
    SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role_id IN (SELECT id FROM roles WHERE name IN ('admin', 'moderator'))
  )
);

-- COMMENT REACTIONS RLS
CREATE POLICY "Anyone can view reactions" ON comment_reactions FOR SELECT USING (true);
CREATE POLICY "Authenticated users can add reactions" ON comment_reactions FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can delete their own reactions" ON comment_reactions FOR DELETE USING (auth.uid() = user_id);

-- NOTIFICATIONS RLS
CREATE POLICY "Users can view their own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- EMAIL QUEUE RLS (admins only)
CREATE POLICY "Admins can view email queue" ON email_queue FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role_id = (SELECT id FROM roles WHERE name = 'admin')
  )
);

-- AUDIT LOGS RLS (admins only)
CREATE POLICY "Admins can view audit logs" ON audit_logs FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role_id = (SELECT id FROM roles WHERE name = 'admin')
  )
);

-- ============================================
-- 14. FUNCTIONS & TRIGGERS
-- ============================================

-- Function: Update thread comment_count and last_comment_at
CREATE OR REPLACE FUNCTION update_thread_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE discussion_threads
    SET 
      comment_count = comment_count + 1,
      last_comment_at = NEW.created_at,
      updated_at = NOW()
    WHERE id = NEW.thread_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE discussion_threads
    SET 
      comment_count = GREATEST(0, comment_count - 1),
      updated_at = NOW()
    WHERE id = OLD.thread_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_thread_stats
AFTER INSERT OR DELETE ON comments
FOR EACH ROW
EXECUTE FUNCTION update_thread_stats();

-- Function: Update parent comment reply_count
CREATE OR REPLACE FUNCTION update_comment_reply_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.parent_comment_id IS NOT NULL THEN
    UPDATE comments
    SET reply_count = reply_count + 1
    WHERE id = NEW.parent_comment_id;
  ELSIF TG_OP = 'DELETE' AND OLD.parent_comment_id IS NOT NULL THEN
    UPDATE comments
    SET reply_count = GREATEST(0, reply_count - 1)
    WHERE id = OLD.parent_comment_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_comment_reply_count
AFTER INSERT OR DELETE ON comments
FOR EACH ROW
EXECUTE FUNCTION update_comment_reply_count();

-- Function: Sync user_profiles when new auth user created
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (id, display_name, email_verified)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    FALSE
  );

  INSERT INTO user_preferences (user_id)
  VALUES (NEW.id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_handle_new_user
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION handle_new_user();

-- Function: Update user profile when email verified
CREATE OR REPLACE FUNCTION handle_email_verified()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.email_confirmed_at IS NOT NULL AND OLD.email_confirmed_at IS NULL THEN
    UPDATE user_profiles
    SET email_verified = TRUE
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_handle_email_verified
AFTER UPDATE ON auth.users
FOR EACH ROW
EXECUTE FUNCTION handle_email_verified();

-- Function: RPC for updating user email_confirmed (used during verification)
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

-- ============================================
-- 15. SAMPLE DATA (Optional)
-- ============================================

-- Insert sample user profiles (for testing)
-- Note: These reference auth.users that should exist
-- INSERT INTO user_profiles (id, display_name, organization, role_id)
-- VALUES (...)
