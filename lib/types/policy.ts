export type PolicyStatus = "Unknown" | "In Force" | "Proposed" | "Phased" | "Repealed";
export type PolicyCategory = "Plastic Ban" | "EPR" | "Waste Management" | "Circular Economy";
export type PolicyLevel = "National" | "Sub-national" | "Regional" | "International";

export interface Policy {
  id: string;
  slug?: string;
  year: number;
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
