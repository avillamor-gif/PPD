-- ============================================
-- MIGRATION: Add slug column to policies table
-- ============================================

-- Add slug column if it doesn't exist
ALTER TABLE policies ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;

-- Simple backfill: Generate slugs and handle duplicates with row number
WITH slug_gen AS (
  SELECT 
    id,
    CASE 
      WHEN ROW_NUMBER() OVER (
        PARTITION BY 
          LOWER(
            TRIM(
              SUBSTRING(
                REGEXP_REPLACE(
                  REGEXP_REPLACE(
                    REGEXP_REPLACE(title, '[^a-zA-Z0-9\s-]', '', 'g'),
                    '\s+', '-', 'g'
                  ),
                  '-+', '-', 'g'
                ),
                1, 80
              )
            )
          )
        ORDER BY created_at
      ) = 1 THEN
        LOWER(
          TRIM(
            SUBSTRING(
              REGEXP_REPLACE(
                REGEXP_REPLACE(
                  REGEXP_REPLACE(title, '[^a-zA-Z0-9\s-]', '', 'g'),
                  '\s+', '-', 'g'
                ),
                '-+', '-', 'g'
              ),
              1, 80
            )
          )
        )
      ELSE
        LOWER(
          TRIM(
            SUBSTRING(
              REGEXP_REPLACE(
                REGEXP_REPLACE(
                  REGEXP_REPLACE(title, '[^a-zA-Z0-9\s-]', '', 'g'),
                  '\s+', '-', 'g'
                ),
                '-+', '-', 'g'
              ),
              1, 80
            )
          )
        ) || '-' || ROW_NUMBER() OVER (
          PARTITION BY 
            LOWER(
              TRIM(
                SUBSTRING(
                  REGEXP_REPLACE(
                    REGEXP_REPLACE(
                      REGEXP_REPLACE(title, '[^a-zA-Z0-9\s-]', '', 'g'),
                      '\s+', '-', 'g'
                    ),
                    '-+', '-', 'g'
                  ),
                  1, 80
                )
              )
            )
          ORDER BY created_at
        ) - 1
    END AS generated_slug
  FROM policies
  WHERE slug IS NULL
)
UPDATE policies p
SET slug = sg.generated_slug
FROM slug_gen sg
WHERE p.id = sg.id;

-- Create index on slug for faster lookups
CREATE INDEX IF NOT EXISTS idx_policies_slug ON policies(slug);
