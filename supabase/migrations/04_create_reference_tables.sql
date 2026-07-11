-- Create instrument_types reference table
CREATE TABLE IF NOT EXISTS instrument_types (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create lifecycle_stages reference table
CREATE TABLE IF NOT EXISTS lifecycle_stages (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create policy_statuses reference table
CREATE TABLE IF NOT EXISTS policy_statuses (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create countries reference table
CREATE TABLE IF NOT EXISTS countries (
  code VARCHAR(2) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  region VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Insert instrument types
INSERT INTO instrument_types (name, description) VALUES
('Umbrella law', 'Comprehensive environmental law'),
('Environment Impact Assessment (EIA)', 'Environmental impact assessment requirement'),
('Waste Management Regulation', 'Waste management regulation'),
('Recycling Regulation', 'Recycling regulation'),
('Penalities', 'Penalty provisions'),
('Taxes', 'Tax-based instruments'),
('Incentives', 'Incentive-based instruments'),
('Polluter Pays', 'Polluter pays principle'),
('Bans', 'Ban provisions'),
('Plastic Ban', 'Plastic ban'),
('Waste Reduction', 'Waste reduction'),
('Single-Use Plastics', 'Single-use plastics regulation'),
('Hazardous Waste', 'Hazardous waste management'),
('Waste Burning', 'Waste burning regulation'),
('Reuse', 'Reuse promotion'),
('Redesign', 'Product redesign'),
('Waste Trade', 'Waste trade regulation'),
('Plastic Alternatives', 'Plastic alternatives promotion'),
('Circular Economy', 'Circular economy framework'),
('EPR', 'Extended Producer Responsibility')
ON CONFLICT (name) DO NOTHING;

-- Insert lifecycle stages
INSERT INTO lifecycle_stages (name, description) VALUES
('Upstream', 'Raw material extraction and production'),
('Midstream', 'Distribution and retail'),
('Downstream', 'Use, disposal, and end-of-life')
ON CONFLICT (name) DO NOTHING;

-- Insert policy statuses
INSERT INTO policy_statuses (name, description) VALUES
('Unknown', 'Status unknown'),
('In Force', 'Currently in force'),
('Proposed', 'Proposed but not yet enacted'),
('Phased', 'Phased implementation'),
('Repealed', 'No longer in force')
ON CONFLICT (name) DO NOTHING;

-- Grant read permissions for public access
GRANT SELECT ON instrument_types TO anon;
GRANT SELECT ON lifecycle_stages TO anon;
GRANT SELECT ON policy_statuses TO anon;
GRANT SELECT ON countries TO anon;
