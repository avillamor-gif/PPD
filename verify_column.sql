-- Verify the lifecycle_stage column exists
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'policies' 
  AND column_name = 'lifecycle_stage';

-- Also list all columns in policies table
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'policies'
ORDER BY ordinal_position;
