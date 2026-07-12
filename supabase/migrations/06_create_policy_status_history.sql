-- Create policy_status_history table to track all status changes
CREATE TABLE IF NOT EXISTS policy_status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  policy_id TEXT NOT NULL REFERENCES policies(id) ON DELETE CASCADE,
  old_status VARCHAR(50),
  new_status VARCHAR(50) NOT NULL,
  change_date DATE NOT NULL, -- The date when the status change actually occurred
  notes TEXT, -- Optional notes about the change
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- When the change was recorded in the system
  recorded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_policy_status_history_policy_id ON policy_status_history(policy_id);
CREATE INDEX IF NOT EXISTS idx_policy_status_history_change_date ON policy_status_history(change_date DESC);
CREATE INDEX IF NOT EXISTS idx_policy_status_history_recorded_at ON policy_status_history(recorded_at DESC);
