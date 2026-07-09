export type PolicyStatus = "Unknown" | "In Force" | "Proposed" | "Phased" | "Repealed";
export type PolicyCategory = "Umbrella law" | "Environment Impact Assessment (EIA)" | "Waste Management Regulation" | "Recycling Regulation" | "Penalities" | "Taxes" | "Incentives" | "Polluter Pays" | "Bans" | "Waste Reduction" | "Single-Use Plastics" | "Hazardous Waste" | "Waste Burning" | "Reuse" | "Redesign" | "Waste Trade" | "Plastic Alternatives" | "Circular Economy" | "Upstream" | "Midstream" | "Downstream";
export type PolicyLevel = "National" | "Sub-national" | "Regional" | "International";

export interface Policy {
  id: string;
  slug?: string;
  year: number;
  commencementDate?: string | null;
  commencement_date?: string | null;
  country: string;
  title: string;
  summary: string;
  category: PolicyCategory;
  instrument: string;
  level: PolicyLevel;
  status: PolicyStatus;
  authority: string;
  link: string;
  language: string;
}
