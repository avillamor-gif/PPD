-- Update all existing policies that don't have an approval_status to 'approved'
-- This ensures legacy policies remain visible in search
UPDATE policies
SET approval_status = 'approved'
WHERE approval_status IS NULL OR approval_status = '';

-- Verify the update
SELECT COUNT(*), approval_status FROM policies GROUP BY approval_status;
