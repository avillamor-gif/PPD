import { COUNTRIES } from '@/lib/constants';
import { supabaseAdmin } from '@/lib/supabase-admin';
import type { Policy } from '@/lib/types/policy';
import { CountryGridRealtime } from '@/app/components/CountryGridRealtime';

export const metadata = {
  title: "Countries — Plastic Policy Database",
  description: "Browse plastic-pollution policies across the 12 Asia Pacific countries covered in Phase 1.",
};

export const revalidate = 60; // ISR: revalidate every 60 seconds on Vercel

export default async function CountriesPage() {
  // Fetch policies from Supabase
  const { data: POLICIES = [], error } = await supabaseAdmin
    .from('policies')
    .select('*')
    .order('year', { ascending: false }) as { data: Policy[], error: any };

  if (error) {
    console.error('Error fetching policies:', error);
  }

  const initialCountryCounts = COUNTRIES.reduce<Record<string, { total: number; inForce: number }>>((acc, country) => {
    const countryPolicies = POLICIES.filter((p: Policy) => p.country === country.code);
    acc[country.code] = {
      total: countryPolicies.length,
      inForce: countryPolicies.filter((p: Policy) => p.status === 'In Force').length,
    };
    return acc;
  }, {});

  return (
    <div className="w-full">
      {/* Header Section */}
      <section className="border-b border-rule">
        <div className="mx-auto max-w-350 px-6 pb-16 pt-14 lg:px-10">
          <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-coral">
            The Countries
          </div>
          <h1 className="mt-4 font-fraunces text-5xl font-semibold leading-[1.02] tracking-[-0.02em] md:text-6xl">
            Twelve countries. Four sub-regions.
          </h1>
          <p className="mt-4 max-w-2xl text-pretty text-ink/60">
            Phase 1 covers English-language regulation in 12 Asia Pacific countries. Future phases
            will extend coverage to additional jurisdictions and languages.
          </p>
        </div>
      </section>

      {/* Regions Grid */}
      <section>
        <div className="mx-auto max-w-350 px-6 py-16 lg:px-10">
          <CountryGridRealtime variant="countries" initialCounts={initialCountryCounts} />
        </div>
      </section>
    </div>
  );
}
