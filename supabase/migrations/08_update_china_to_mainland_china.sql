-- Migration: Update China to Mainland China
-- Purpose: Update the country name for CN from "China" to "Mainland China"
-- Date: 2026-07-17

-- Update existing country record if it exists
UPDATE countries 
SET name = 'Mainland China'
WHERE code = 'CN' AND name = 'China';

-- Insert if it doesn't exist (for fresh installs)
INSERT INTO countries (code, name, region)
VALUES ('CN', 'Mainland China', 'East Asia')
ON CONFLICT (code) DO UPDATE
SET name = 'Mainland China'
WHERE countries.name = 'China';
