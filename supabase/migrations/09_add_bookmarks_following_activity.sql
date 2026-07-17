-- Migration: Add Bookmarks, Following, and Activity Features
-- Purpose: Enable users to bookmark policies, follow other users, and view activity
-- Date: 2026-07-17

-- ============================================
-- 1. POLICY BOOKMARKS
-- ============================================

CREATE TABLE IF NOT EXISTS policy_bookmarks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  policy_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, policy_id)
);

CREATE INDEX IF NOT EXISTS idx_policy_bookmarks_user_id ON policy_bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_policy_bookmarks_policy_id ON policy_bookmarks(policy_id);
CREATE INDEX IF NOT EXISTS idx_policy_bookmarks_created_at ON policy_bookmarks(user_id, created_at DESC);

-- ============================================
-- 2. USER FOLLOWING
-- ============================================

CREATE TABLE IF NOT EXISTS user_follows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

CREATE INDEX IF NOT EXISTS idx_user_follows_follower_id ON user_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_following_id ON user_follows(following_id);

-- ============================================
-- 3. USER ACTIVITY LOG
-- ============================================

CREATE TABLE IF NOT EXISTS user_activity (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type VARCHAR(50) NOT NULL, -- 'thread_created', 'comment_posted', 'policy_bookmarked', 'user_followed'
  activity_data JSONB, -- context data: policy_id, thread_id, comment_id, etc
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_activity_user_id ON user_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_created_at ON user_activity(user_id, created_at DESC);

-- ============================================
-- 4. ROW LEVEL SECURITY (RLS) FOR NEW TABLES
-- ============================================

ALTER TABLE policy_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity ENABLE ROW LEVEL SECURITY;

-- POLICY BOOKMARKS RLS
CREATE POLICY "Users can view their own bookmarks" ON policy_bookmarks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own bookmarks" ON policy_bookmarks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own bookmarks" ON policy_bookmarks FOR DELETE USING (auth.uid() = user_id);

-- USER FOLLOWS RLS
CREATE POLICY "Anyone can view follows" ON user_follows FOR SELECT USING (true);
CREATE POLICY "Users can create follows" ON user_follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Users can delete their follows" ON user_follows FOR DELETE USING (auth.uid() = follower_id);

-- USER ACTIVITY RLS
CREATE POLICY "Users can view their own activity" ON user_activity FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view public user activity" ON user_activity FOR SELECT USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = user_id AND bio IS NOT NULL) -- public profile
);
CREATE POLICY "System can insert activity" ON user_activity FOR INSERT WITH CHECK (auth.role() IN ('service_role', 'postgres'));

-- ============================================
-- 5. VIEWS FOR STATS
-- ============================================

-- User followers and following counts
CREATE OR REPLACE VIEW user_follow_stats AS
SELECT
  u.id,
  u.email,
  up.display_name,
  COUNT(DISTINCT uf1.follower_id) as followers_count,
  COUNT(DISTINCT uf2.following_id) as following_count
FROM auth.users u
LEFT JOIN user_profiles up ON u.id = up.id
LEFT JOIN user_follows uf1 ON u.id = uf1.following_id
LEFT JOIN user_follows uf2 ON u.id = uf2.follower_id
GROUP BY u.id, u.email, up.display_name, up.id;

-- User bookmark stats
CREATE OR REPLACE VIEW user_bookmark_stats AS
SELECT
  user_id,
  COUNT(*) as bookmark_count
FROM policy_bookmarks
GROUP BY user_id;

-- ============================================
-- 6. FUNCTIONS FOR ACTIVITY LOGGING
-- ============================================

-- Function: Log thread creation
CREATE OR REPLACE FUNCTION log_thread_activity()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_activity (user_id, activity_type, activity_data)
  VALUES (
    NEW.author_id,
    'thread_created',
    jsonb_build_object('thread_id', NEW.id, 'policy_id', NEW.policy_id, 'title', NEW.title)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_log_thread_activity
AFTER INSERT ON discussion_threads
FOR EACH ROW
EXECUTE FUNCTION log_thread_activity();

-- Function: Log comment creation
CREATE OR REPLACE FUNCTION log_comment_activity()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_activity (user_id, activity_type, activity_data)
  VALUES (
    NEW.author_id,
    'comment_posted',
    jsonb_build_object('comment_id', NEW.id, 'thread_id', NEW.thread_id, 'policy_id', NEW.policy_id)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_log_comment_activity
AFTER INSERT ON comments
FOR EACH ROW
EXECUTE FUNCTION log_comment_activity();

-- Function: Log bookmark creation
CREATE OR REPLACE FUNCTION log_bookmark_activity()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_activity (user_id, activity_type, activity_data)
  VALUES (
    NEW.user_id,
    'policy_bookmarked',
    jsonb_build_object('policy_id', NEW.policy_id)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_log_bookmark_activity
AFTER INSERT ON policy_bookmarks
FOR EACH ROW
EXECUTE FUNCTION log_bookmark_activity();

-- Function: Log user follow
CREATE OR REPLACE FUNCTION log_follow_activity()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_activity (user_id, activity_type, activity_data)
  VALUES (
    NEW.follower_id,
    'user_followed',
    jsonb_build_object('following_id', NEW.following_id)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_log_follow_activity
AFTER INSERT ON user_follows
FOR EACH ROW
EXECUTE FUNCTION log_follow_activity();
