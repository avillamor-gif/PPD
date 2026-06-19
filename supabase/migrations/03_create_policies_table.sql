-- Create policies table for Plastic Policy Database
-- Run this migration to add the policies table to your Supabase database

CREATE TABLE IF NOT EXISTS policies (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  summary TEXT,
  year INTEGER,
  country VARCHAR(2) NOT NULL,
  level VARCHAR(50), -- National, Sub-national, Regional, International
  category TEXT NOT NULL, -- Themes
  keywords TEXT,
  status VARCHAR(50) DEFAULT 'Proposed', -- Proposed, Enacted, Repealed, etc
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

-- Enable RLS on policies table
ALTER TABLE policies ENABLE ROW LEVEL SECURITY;

-- RLS Policies for policies table
CREATE POLICY "Anyone can view policies" ON policies FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create policies" ON policies FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Admins can update policies" ON policies FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role_id = (SELECT id FROM roles WHERE name = 'admin')
  )
);
CREATE POLICY "Admins can delete policies" ON policies FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role_id = (SELECT id FROM roles WHERE name = 'admin')
  )
);
