-- Add column to track old slugs for redirects
ALTER TABLE policies 
ADD COLUMN IF NOT EXISTS previous_slugs TEXT[] DEFAULT '{}';

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_policies_previous_slugs ON policies USING GIN(previous_slugs);

-- Migrate existing policies that had truncated slugs
-- Update with their old truncated slugs as "previous_slugs"
UPDATE policies 
SET previous_slugs = ARRAY[
  CASE 
    WHEN slug = 'decree-no-082022nd-cp-or-elaboration-of-several-articles-of-' THEN 'decree-no-082022nd-cp-or-elaboration-of-several'
    WHEN slug = 'containers-and-packaging-recycling-law-or-law-for-promotion-' THEN 'containers-and-packaging-recycling-law-or-law-for'
    WHEN slug = 'national-sword-policy-2017' AND id = 'national-sword-policy-2017-1' THEN 'national-sword-policy-2017-1'
    WHEN slug = 'plastic-scrap-import-control-policydepartment-of-foreign-trade-ministry-of-comme' THEN 'plastic-scrap-import-control-policydepartment-of-foreign-trade-ministry-of-comme'
    WHEN slug = 'restrictions-on-the-manufacture-import-and-sale-of-personal-care-and-cosmetics-' THEN 'restrictions-on-the-manufacture-import-and-sale-of-personal-'
    WHEN slug = 'gazette-extraordinary-no-203433-national-environmental-polyt' THEN 'gazette-extraordinary-no-203433-national-environmental'
    WHEN slug = 'solid-waste-and-public-cleansing-management-act-2007-act-676' THEN 'solid-waste-and-public-cleansing-management-act-2007'
    WHEN slug = 'gazette-extraordinary-no-203436-or-national-environmental-pr' THEN 'gazette-extraordinary-no-203436-or-national-environmental-pr'
  END
]
WHERE previous_slugs = '{}';
