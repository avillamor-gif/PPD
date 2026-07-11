-- Restore the 3 policies that were deleted earlier
-- These were removed when we changed the category options

INSERT INTO policies (
  id,
  title,
  summary,
  year,
  country,
  authority,
  category,
  status,
  slug,
  link,
  created_at,
  updated_at
) VALUES 
  (
    gen_random_uuid(),
    'Plastic Ban Initiative',
    'National initiative to ban single-use plastics',
    2022,
    'IN',
    'Ministry of Environment, India',
    'Plastic Ban',
    'In Force',
    'plastic-ban-initiative-in-2022',
    'https://example.com/plastic-ban-india',
    NOW(),
    NOW()
  ),
  (
    gen_random_uuid(),
    'Circular Economy Framework',
    'Framework for promoting circular economy principles',
    2023,
    'SG',
    'National Environmental Agency, Singapore',
    'Circular Economy',
    'Proposed',
    'circular-economy-framework-sg-2023',
    'https://example.com/circular-economy-singapore',
    NOW(),
    NOW()
  ),
  (
    gen_random_uuid(),
    'Extended Producer Responsibility Scheme',
    'Producer responsibility scheme for packaging waste',
    2021,
    'ID',
    'Ministry of Environment and Forestry, Indonesia',
    'EPR',
    'In Force',
    'extended-producer-responsibility-scheme-id-2021',
    'https://example.com/epr-indonesia',
    NOW(),
    NOW()
  );
