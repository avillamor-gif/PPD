-- Add full commencement date support without dropping existing year data.
-- This migration is intentionally backward-compatible:
-- 1) Keeps existing "year" column and values.
-- 2) Adds "commencement_date" and backfills from year.
-- 3) Keeps year/date in sync on INSERT/UPDATE.

ALTER TABLE policies
ADD COLUMN IF NOT EXISTS commencement_date DATE;

-- Backfill commencement_date from existing year when missing.
UPDATE policies
SET commencement_date = make_date(year, 1, 1)
WHERE commencement_date IS NULL
  AND year IS NOT NULL;

-- Preserve data in the opposite direction too: if year is null but commencement_date exists.
UPDATE policies
SET year = EXTRACT(YEAR FROM commencement_date)::INTEGER
WHERE year IS NULL
  AND commencement_date IS NOT NULL;

-- Align default status with the new app default.
ALTER TABLE policies
ALTER COLUMN status SET DEFAULT 'Unknown';

CREATE OR REPLACE FUNCTION sync_policy_year_and_commencement_date()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.commencement_date IS NOT NULL THEN
    NEW.year := EXTRACT(YEAR FROM NEW.commencement_date)::INTEGER;
  ELSIF NEW.year IS NOT NULL AND NEW.commencement_date IS NULL THEN
    NEW.commencement_date := make_date(NEW.year, 1, 1);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_policy_year_and_commencement_date ON policies;

CREATE TRIGGER trg_sync_policy_year_and_commencement_date
BEFORE INSERT OR UPDATE ON policies
FOR EACH ROW
EXECUTE FUNCTION sync_policy_year_and_commencement_date();
