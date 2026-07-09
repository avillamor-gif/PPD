-- Add lifecycle_stage column to policies table
-- Stores comma-separated values: Downstream, Midstream, Upstream

ALTER TABLE policies
ADD COLUMN IF NOT EXISTS lifecycle_stage TEXT;

-- Create index for lifecycle_stage for faster queries
CREATE INDEX IF NOT EXISTS idx_policies_lifecycle_stage ON policies(lifecycle_stage);

-- Update schema.sql comment to reflect the new field
COMMENT ON COLUMN policies.lifecycle_stage IS 'Stage in Plastic Lifecycle (comma-separated): Downstream, Midstream, Upstream';
