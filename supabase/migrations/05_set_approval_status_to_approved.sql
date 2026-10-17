-- Migration: Set approval_status to 'approved' for all existing policies
-- This ensures legacy policies remain visible after adding the approval workflow

UPDATE policies
SET approval_status = 'approved'
WHERE approval_status IS NULL OR approval_status = '';
