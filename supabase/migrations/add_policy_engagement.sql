-- Add policy engagement tracking table
CREATE TABLE IF NOT EXISTS policy_engagement (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  policy_id TEXT NOT NULL REFERENCES policies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT, -- For tracking anonymous users
  engagement_type VARCHAR(20) NOT NULL, -- 'view', 'helpful'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_policy_engagement_policy_id ON policy_engagement(policy_id);
CREATE INDEX IF NOT EXISTS idx_policy_engagement_user_id ON policy_engagement(user_id);
CREATE INDEX IF NOT EXISTS idx_policy_engagement_session_id ON policy_engagement(session_id);
CREATE INDEX IF NOT EXISTS idx_policy_engagement_type ON policy_engagement(engagement_type);

-- Create unique constraint to prevent duplicate votes from same user
CREATE UNIQUE INDEX IF NOT EXISTS idx_policy_engagement_user_vote 
  ON policy_engagement(policy_id, user_id, engagement_type) 
  WHERE user_id IS NOT NULL AND engagement_type = 'helpful';
