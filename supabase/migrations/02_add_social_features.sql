-- ============================================
-- MIGRATION: Add new tables for enhanced features
-- Features: Following, Direct Messaging, Social Links, Expertise
-- ============================================

-- ============================================
-- 1. MODIFY user_profiles to add new fields
-- ============================================

ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS expertise_areas TEXT[]; -- Array of expertise areas
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}'; -- {twitter: url, linkedin: url, etc}
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS follower_count INT DEFAULT 0;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS following_count INT DEFAULT 0;

-- ============================================
-- 2. USER FOLLOWERS (for following system)
-- ============================================

CREATE TABLE IF NOT EXISTS user_followers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id) -- Can't follow yourself
);

CREATE INDEX IF NOT EXISTS idx_user_followers_follower_id ON user_followers(follower_id);
CREATE INDEX IF NOT EXISTS idx_user_followers_following_id ON user_followers(following_id);

-- ============================================
-- 3. DIRECT MESSAGES
-- ============================================

CREATE TABLE IF NOT EXISTS direct_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,
  is_deleted_by_sender BOOLEAN DEFAULT FALSE,
  is_deleted_by_recipient BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_direct_messages_sender_id ON direct_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_direct_messages_recipient_id ON direct_messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_direct_messages_conversation ON direct_messages(
  LEAST(sender_id, recipient_id),
  GREATEST(sender_id, recipient_id),
  created_at DESC
);
CREATE INDEX IF NOT EXISTS idx_direct_messages_is_read ON direct_messages(recipient_id, is_read);

-- ============================================
-- 4. USER ACTIVITY (for activity feed)
-- ============================================

CREATE TABLE IF NOT EXISTS user_activity (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type VARCHAR(50) NOT NULL, -- 'comment', 'thread', 'policy_review', 'expert_contribution'
  activity_text TEXT,
  related_comment_id UUID REFERENCES comments(id) ON DELETE SET NULL,
  related_thread_id UUID REFERENCES discussion_threads(id) ON DELETE SET NULL,
  related_policy_id TEXT,
  visibility VARCHAR(20) DEFAULT 'public', -- 'public', 'followers', 'private'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_activity_user_id ON user_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_created_at ON user_activity(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_activity_type ON user_activity(activity_type);

-- ============================================
-- 5. RLS POLICIES FOR NEW TABLES
-- ============================================

-- Enable RLS
ALTER TABLE user_followers ENABLE ROW LEVEL SECURITY;
ALTER TABLE direct_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity ENABLE ROW LEVEL SECURITY;

-- USER FOLLOWERS RLS
CREATE POLICY "Anyone can view followers" ON user_followers FOR SELECT USING (true);
CREATE POLICY "Users can follow/unfollow" ON user_followers FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Users can unfollow" ON user_followers FOR DELETE USING (auth.uid() = follower_id);

-- DIRECT MESSAGES RLS
CREATE POLICY "Users can view their messages" ON direct_messages FOR SELECT USING (
  auth.uid() = sender_id OR auth.uid() = recipient_id
);
CREATE POLICY "Authenticated users can send messages" ON direct_messages FOR INSERT WITH CHECK (
  auth.role() = 'authenticated' AND auth.uid() = sender_id
);
CREATE POLICY "Users can update their message read status" ON direct_messages FOR UPDATE USING (
  auth.uid() = recipient_id
);

-- USER ACTIVITY RLS
CREATE POLICY "Public activity visible to all" ON user_activity FOR SELECT USING (
  visibility = 'public' OR 
  auth.uid() = user_id OR
  (visibility = 'followers' AND EXISTS (
    SELECT 1 FROM user_followers WHERE follower_id = auth.uid() AND following_id = user_activity.user_id
  ))
);
CREATE POLICY "Users can create their own activity" ON user_activity FOR INSERT WITH CHECK (
  auth.uid() = user_id
);

-- ============================================
-- 6. FUNCTIONS & TRIGGERS FOR NEW FEATURES
-- ============================================

-- Function: Update follower/following counts
CREATE OR REPLACE FUNCTION update_follower_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE user_profiles SET follower_count = follower_count + 1 WHERE id = NEW.following_id;
    UPDATE user_profiles SET following_count = following_count + 1 WHERE id = NEW.follower_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE user_profiles SET follower_count = GREATEST(0, follower_count - 1) WHERE id = OLD.following_id;
    UPDATE user_profiles SET following_count = GREATEST(0, following_count - 1) WHERE id = OLD.follower_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_follower_counts
AFTER INSERT OR DELETE ON user_followers
FOR EACH ROW
EXECUTE FUNCTION update_follower_counts();

-- Function: Auto-create activity when comment is created
CREATE OR REPLACE FUNCTION create_comment_activity()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_activity (user_id, activity_type, related_comment_id, related_thread_id, related_policy_id, visibility)
  VALUES (NEW.author_id, 'comment', NEW.id, NEW.thread_id, NEW.policy_id, 'public');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_comment_activity
AFTER INSERT ON comments
FOR EACH ROW
EXECUTE FUNCTION create_comment_activity();

-- Function: Auto-create activity when thread is created
CREATE OR REPLACE FUNCTION create_thread_activity()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_activity (user_id, activity_type, related_thread_id, related_policy_id, visibility)
  VALUES (NEW.author_id, 'thread', NEW.id, NEW.policy_id, 'public');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_thread_activity
AFTER INSERT ON discussion_threads
FOR EACH ROW
EXECUTE FUNCTION create_thread_activity();
