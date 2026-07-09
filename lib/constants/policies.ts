import type { Policy, PolicyStatus, PolicyCategory, Country } from '@/lib/types';

export const COUNTRIES: Country[] = [
  // Southeast Asia
  { code: "ID", name: "Indonesia", region: "Southeast Asia" },
  { code: "PH", name: "Philippines", region: "Southeast Asia" },
  { code: "VN", name: "Vietnam", region: "Southeast Asia" },
  { code: "TH", name: "Thailand", region: "Southeast Asia" },
  { code: "MY", name: "Malaysia", region: "Southeast Asia" },
  { code: "SG", name: "Singapore", region: "Southeast Asia" },
  { code: "KH", name: "Cambodia", region: "Southeast Asia" },
  { code: "LA", name: "Laos", region: "Southeast Asia" },
  { code: "MM", name: "Myanmar", region: "Southeast Asia" },
  { code: "BN", name: "Brunei", region: "Southeast Asia" },
  // South Asia
  { code: "IN", name: "India", region: "South Asia" },
  { code: "PK", name: "Pakistan", region: "South Asia" },
  { code: "BD", name: "Bangladesh", region: "South Asia" },
  { code: "LK", name: "Sri Lanka", region: "South Asia" },
  { code: "NP", name: "Nepal", region: "South Asia" },
  { code: "BT", name: "Bhutan", region: "South Asia" },
  // East Asia
  { code: "JP", name: "Japan", region: "East Asia" },
  { code: "KR", name: "South Korea", region: "East Asia" },
  { code: "CN", name: "China", region: "East Asia" },
  { code: "TW", name: "Taiwan", region: "East Asia" },
  { code: "MN", name: "Mongolia", region: "East Asia" },
  // Oceania
  { code: "AU", name: "Australia", region: "Oceania" },
  { code: "NZ", name: "New Zealand", region: "Oceania" },
  { code: "FJ", name: "Fiji", region: "Oceania" },
  { code: "PG", name: "Papua New Guinea", region: "Oceania" },
  { code: "SB", name: "Solomon Islands", region: "Oceania" },
];

export const REGIONS: string[] = [
  ...new Set(COUNTRIES.map(c => c.region))
].sort();

export const INSTRUMENT_TYPES: PolicyCategory[] = [
  "Umbrella law",
  "Environment Impact Assessment (EIA)",
  "Waste Management Regulation",
  "Recycling Regulation",
  "Penalities",
  "Taxes",
  "Incentives",
  "Polluter Pays",
  "Bans",
  "Waste Reduction",
  "Single-Use Plastics",
  "Hazardous Waste",
  "Waste Burning",
  "Reuse",
  "Redesign",
  "Waste Trade",
  "Plastic Alternatives",
  "Circular Economy",
];

export const STATUSES: PolicyStatus[] = [
  "Unknown",
  "In Force",
  "Proposed",
  "Phased",
  "Repealed",
];

// POLICIES are now fetched from Supabase database
// Use API endpoint /api/policies to get the list of policies
