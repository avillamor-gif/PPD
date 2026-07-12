import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://pnsaqfzkwvlyaqftnsai.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBuc2FxZnprd3ZseWFxZnRuc2FpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcxOTgxNTA1NywiZXhwIjoyMDM1MzkxMDU3fQ.gT_gP8CmMeVlH_jLDp0c_eOe9j8rHHtWfO1Fa5eQIpc'
);

async function runMigration() {
  try {
    console.log('Running migration: Creating policy_engagement table...');
    
    // Create the table through direct query
    const sql = `
CREATE TABLE IF NOT EXISTS policy_engagement (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  policy_id TEXT NOT NULL REFERENCES policies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT,
  engagement_type VARCHAR(20) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_policy_engagement_policy_id ON policy_engagement(policy_id);
CREATE INDEX IF NOT EXISTS idx_policy_engagement_user_id ON policy_engagement(user_id);
CREATE INDEX IF NOT EXISTS idx_policy_engagement_session_id ON policy_engagement(session_id);
CREATE INDEX IF NOT EXISTS idx_policy_engagement_type ON policy_engagement(engagement_type);

CREATE UNIQUE INDEX IF NOT EXISTS idx_policy_engagement_user_vote 
  ON policy_engagement(policy_id, user_id, engagement_type) 
  WHERE user_id IS NOT NULL AND engagement_type = 'helpful';
    `;

    // Try to insert a test record - if table doesn't exist, this will fail
    const { data: testData, error: testError } = await supabase
      .from('policy_engagement')
      .select('count')
      .limit(1);

    if (testError?.code === 'PGRST116') {
      console.log('Table does not exist yet. Please run this SQL in Supabase SQL editor:');
      console.log(sql);
    } else if (testError) {
      console.error('Error checking table:', testError);
    } else {
      console.log('✓ Table exists and is accessible');
      console.log('Test query result:', testData);
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

runMigration();
