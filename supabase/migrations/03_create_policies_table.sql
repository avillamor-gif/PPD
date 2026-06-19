-- Create policies table for Plastic Policy Database
-- Run this migration to add the policies table to your Supabase database

CREATE TABLE IF NOT EXISTS policies (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  summary TEXT,
  year INTEGER,
  country VARCHAR(2) NOT NULL,
  level VARCHAR(50), -- National, Sub-national, Regional, International
  category TEXT NOT NULL, -- Themes
  keywords TEXT,
  status VARCHAR(50) DEFAULT 'Proposed', -- Proposed, Enacted, Repealed, etc
  instrument VARCHAR(100), -- Act, Bill, Regulation, Directive, etc
  authority TEXT NOT NULL, -- Competent authority
  link TEXT NOT NULL, -- Official policy link
  other_links TEXT, -- Additional references
  language VARCHAR(10), -- Language of the policy
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for policies
CREATE INDEX IF NOT EXISTS idx_policies_country ON policies(country);
CREATE INDEX IF NOT EXISTS idx_policies_year ON policies(year DESC);
CREATE INDEX IF NOT EXISTS idx_policies_category ON policies(category);
CREATE INDEX IF NOT EXISTS idx_policies_status ON policies(status);
CREATE INDEX IF NOT EXISTS idx_policies_created_at ON policies(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_policies_level ON policies(level);

-- Enable RLS on policies table
ALTER TABLE policies ENABLE ROW LEVEL SECURITY;

-- RLS Policies for policies table
CREATE POLICY IF NOT EXISTS "Anyone can view policies" ON policies FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Authenticated users can create policies" ON policies FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY IF NOT EXISTS "Admins can update policies" ON policies FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role_id = (SELECT id FROM roles WHERE name = 'admin')
  )
);
CREATE POLICY IF NOT EXISTS "Admins can delete policies" ON policies FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role_id = (SELECT id FROM roles WHERE name = 'admin')
  )
);

-- ============================================
-- INSERT SEED DATA
-- ============================================

INSERT INTO policies (id, title, summary, year, country, level, category, status, instrument, authority, link, language, created_at, updated_at) VALUES
  ('kh-1996-01', 'Law on Environmental Protection and Natural Resource Management (1996)', 'Key environmental regulation in the country. It is designed to prevent pollution, mandate Environmental Impact Assessments (EIAs), and encourage public participation', 1996, 'KH', 'National', 'Waste Management', 'In Force', 'Law', 'Ministry of Environment of Cambodia', 'https://data.opendevelopmentcambodia.net/en/dataset/5f94811e-f6fa-4a25-b73f-2271aaf6a096/resource/992eda27-8cd8-4bf3-9d34-c3e858e88552/download/74c2ccc6-998d-4b91-8484-89db8104e7bc.pdf', 'Khmer/English', NOW(), NOW()),
  ('kh-2015-02', 'Sub-Decree No. 113 on Urban Garbage and Solid Waste Management (2015)', 'It serves as the primary legal framework for municipal solid waste management (SWM) in the country. Its main objectives include decentralizing waste management responsibilities to local authorities, thereby enhancing effectiveness, transparency, and accountability in handling urban waste. The sub-decree mandates the separation, storage, collection, transportation, recycling, and disposal of solid waste while prohibiting illegal dumping and burning of waste. It also establishes penalties for non-compliance and emphasizes the importance of public health and environmental protection.', 2015, 'KH', 'National', 'Plastic Ban', 'In Force', 'Decree', 'Ministry of Environment of Cambodia', '', 'Khmer/English', NOW(), NOW()),
  ('kh-1999-03', 'Sub-Decree No. 36 on Solid Waste Management', 'This sub-decree focuses on the technical aspects of solid waste management, including the safe handling and disposal of hazardous waste. It mandates that producers manage their waste responsibly. The decree restricts the importation, production, distribution, and use of plastic bags with thickness less than 0.03 mm and a base width larger than 25 cm. The sub-decree mandates that supermarkets and shopping centers charge customers a fee for plastic bags.', 1999, 'KH', 'National', 'Waste Management', 'In Force', 'Decree', 'Ministry of Environment of Cambodia', 'https://cdc.gov.kh/wp-content/uploads/2022/04/Sub-Degree-36-on-Solid-Waste-Management_990427.pdf', 'Khmer/English', NOW(), NOW()),
  ('id-2019-01', 'NOMOR P.75/MENLHK/SETJEN/KUM.1/10/2019 or Regulation P.75/2019 on Waste Reduction Roadmap by Producers', 'Regulation No. P.75/2019 establishes a comprehensive roadmap for waste reduction by producers, aiming to significantly decrease waste generated from products and packaging, particularly plastics. The regulation sets a target for producers to achieve a 30% reduction in waste by the year 2029. It outlines specific responsibilities for manufacturers, brand owners, and retailers, emphasizing the need for sustainable design practices that minimize waste generation and promote the use of recyclable materials. Additionally, the regulation targets the phasing out of single-use plastics by January 1, 2030, reflecting Indonesia''s commitment to addressing plastic pollution and enhancing environmental sustainability. This regulatory framework is a crucial step towards implementing Extended Producer Responsibility (EPR) in the country, requiring active participation from various stakeholders in waste management efforts.', 2019, 'ID', 'National', 'EPR', 'In Force', 'Regulation', 'Ministry of Environment and Forestry (MoEF)', 'https://jdih.kemenkoinfra.go.id/en/peraturan-menteri-lingkungan-hidup-dan-kehutanan-no-p75menlhksetjenkum1102019-tahun-2019', 'Bahasa/English', NOW(), NOW()),
  ('ph-2001-01', 'Ecological Solid Waste Management Act of 2000 (Republic Act 9003)', 'The Act is the main regulatory framework for solid waste management in the Philippines. It lays out the role divisions, implementation mechanisms, and requirements for appropriate waste management including segregation, storage, collection, transfer and transport, processing and final disposal of solid waste as well as hazardous waste. The Act also mandates that an extensive network of treatment and disposal facilities is created in the country.', 2001, 'PH', 'National', 'Waste Management', 'In Force', 'Act', 'Department of Environment and Natural Resources', '', 'English', NOW(), NOW()),
  ('ph-2022-02', 'Extended Producer Responsibility Act [Republic Act 11898]', 'The Act amends RA 9003 in institutionalizes Extended Producer Responsibility for plastic packaging. It complements the plastic ban imposed by virtue of the BIR Memorandum Circular 2021-121 on February 4, 2022 which restricts the manufacturing and imports of flexible plastic packaging for plastic bags and sachets. The Act requires plastic product manufacturers and importers to be responsible for the end-of-life management of their products.', 2022, 'PH', 'National', 'EPR', 'In Force', 'Act', 'Department of Environment and Natural Resources', '', 'English', NOW(), NOW()),
  ('th-2022-03', 'Law on Environmental Protection (LEP) NO. 72/2020/QH14', 'This Law provides for environmental protection activities, rights, responsibilities and obligations of agencies, organizations, communities, and individuals in environmental protection. The law prohibits single-use plastic bags and the manufacture of plastic bags below a certain thickness.', 2022, 'TH', 'National', 'Plastic Ban', 'In Force', 'Law', 'Ministry of Natural Resources and Environment', '', 'Thai/English', NOW(), NOW()),
  ('th-2022-04', 'Decree No. 08/2022/ND-CP or Elaboration of Several Articles of the Law on Environmental Protection (2022)', 'It elaborates on several articles of the Law on Environmental Protection 2020. It provides guidelines for environmental protection including specific requirements on plastic packaging and single-use plastics.', 2022, 'TH', 'National', 'Plastic Ban', 'In Force', 'Decree', 'Ministry of Natural Resources and Environment', '', 'Thai/English', NOW(), NOW()),
  ('id-2008-02', 'Solid Waste and Public Cleansing Management Act 2007 (Act 676)', 'This Act is a comprehensive legal framework for the management, treatment, and disposal of solid waste. It establishes a mandatory integrated waste management system and the requirements for waste reduction, storage, collection, and final disposal of solid waste.', 2008, 'ID', 'National', 'Waste Management', 'In Force', 'Act', 'Ministry of Housing and Local Government', '', 'Indonesian/English', NOW(), NOW()),
  ('vn-2026-01', 'Draft Sustainable Packaging Management Act', 'The draft Act aims to set an international framework for an EPR scheme. Once enacted, it will form the legal basis for large commercial entities and manufacturers to pay fees into a compliance management scheme for plastic packaging.', 2026, 'VN', 'National', 'Circular Economy', 'Proposed', 'Act', 'Ministry of Environment and Natural Resources', 'https://example.com/', 'Vietnamese/English', NOW(), NOW()),
  ('th-2025-05', 'Plastic Scrap Import Control Policy', 'Department of Foreign Trade and Ministry of Commerce have published an import control policy on plastic scrap in the Kingdom of Thailand, B.C. 2567 DPCST.', 2025, 'TH', 'National', 'Plastic Ban', 'In Force', 'Policy', 'Department of Foreign Trade, Ministry of Commerce', '', 'Thai/English', NOW(), NOW()),
  ('vn-2022-05', 'Plastic Scrap Import Control Policy', 'Department of Foreign Trade and Ministry of Commerce have published import control policy on plastic scrap in the Kingdom of Thailand, B.C. 2567 DPCST.', 2022, 'VN', 'National', 'Plastic Ban', 'In Force', 'Policy', 'Department of Foreign Trade, Ministry of Commerce', '', 'Vietnamese/English', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;
