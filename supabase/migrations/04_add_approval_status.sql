-- Add approval status column to policies table
ALTER TABLE policies ADD COLUMN IF NOT EXISTS approval_status VARCHAR(50) DEFAULT 'draft';
-- Values: draft (unpublished), pending (awaiting approval), approved (published), rejected

-- Add approved_by column to track which admin approved it
ALTER TABLE policies ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add approval_date column
ALTER TABLE policies ADD COLUMN IF NOT EXISTS approval_date TIMESTAMP WITH TIME ZONE;

-- Add rejection reason
ALTER TABLE policies ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Create index for pending policies (for admin dashboard)
CREATE INDEX IF NOT EXISTS idx_policies_approval_status ON policies(approval_status);
CREATE INDEX IF NOT EXISTS idx_policies_pending ON policies(approval_status) WHERE approval_status = 'pending';
