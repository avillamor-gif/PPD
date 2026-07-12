-- Delete the old instrument types that were removed from the system
-- These should not appear in any dropdowns or management interfaces

DELETE FROM instrument_types 
WHERE name IN ('Plastic Ban', 'Circular Economy', 'EPR');
