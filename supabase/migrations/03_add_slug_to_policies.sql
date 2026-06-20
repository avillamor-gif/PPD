-- ============================================
-- MIGRATION: Add slug column to policies table
-- ============================================

-- Add slug column
ALTER TABLE policies ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;

-- Create function to generate slug from title
CREATE OR REPLACE FUNCTION generate_slug_from_title(title TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN LOWER(
    TRIM(
      SUBSTRING(
        REGEXP_REPLACE(
          REGEXP_REPLACE(
            REGEXP_REPLACE(title, '[^a-zA-Z0-9\s-]', '', 'g'),
            '\s+', '-', 'g'
          ),
          '-+', '-', 'g'
        ),
        1, 100
      )
    )
  );
END;
$$ LANGUAGE plpgsql;

-- Backfill slugs for existing policies
UPDATE policies 
SET slug = generate_slug_from_title(title)
WHERE slug IS NULL;

-- Make slug not nullable after backfill (if needed)
-- ALTER TABLE policies ALTER COLUMN slug SET NOT NULL;

-- Create index on slug for faster lookups
CREATE INDEX IF NOT EXISTS idx_policies_slug ON policies(slug);
