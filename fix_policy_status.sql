-- Set all draft policies to approved (these are legacy policies)
UPDATE policies
SET approval_status = 'approved'
WHERE approval_status = 'draft';

-- Verify
SELECT COUNT(*), approval_status FROM policies GROUP BY approval_status;
