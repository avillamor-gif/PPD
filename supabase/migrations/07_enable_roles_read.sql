-- Enable RLS on roles table and allow public read access
-- Roles is reference data, no sensitive info

ALTER TABLE roles ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read roles
CREATE POLICY "Everyone can read roles" ON roles FOR SELECT USING (true);
