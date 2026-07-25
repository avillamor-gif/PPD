import Link from 'next/link';
import { COUNTRIES } from '@/lib/constants';
import { supabaseAdmin } from '@/lib/supabase-admin';
import type { Policy } from '@/lib/types/policy';
import { CountriesSection } from '@/app/components/CountriesSection';
import { ThemesSection } from '@/app/components/ThemesSection';
import { RecentlyIndexedSection } from '@/app/components/RecentlyIndexedSection';
import { SnapshotCard } from '@/app/components/SnapshotCard';

export const metadata = {
  title: "Plastic Policy Database — Asia Pacific",
  description: "Research, track, and visualize plastic-pollution regulations across 12 Asia Pacific countries.",
};

export const revalidate = 60; // ISR: revalidate every 60 seconds on Vercel

export default async function Home() {
  // Fetch policies and instrument types from Supabase
  const [
    { data: POLICIES = [], error: policiesError },
    { data: instrumentTypes = [], error: typesError }
  ] = await Promise.all([
    supabaseAdmin
      .from('policies')
      .select('*')
      .order('year', { ascending: false }) as { data: Policy[], error: any },
    supabaseAdmin
      .from('instrument_types')
      .select('name')
      .order('name') as { data: Array<{ name: string }>, error: any }
  ]);

  if (policiesError) {
    console.error('Error fetching policies:', policiesError);
  }

  if (typesError) {
    console.error('Error fetching instrument types:', typesError);
  }

  const INSTRUMENT_TYPES = instrumentTypes.map(t => t.name);

  const total = POLICIES.length;
  const inForce = POLICIES.filter((p: Policy) => p.status === "In Force").length;
  const proposed = POLICIES.filter((p: Policy) => p.status === "Proposed" || p.status === "Draft").length;
  const earliest = POLICIES.length > 0 ? Math.min(...POLICIES.map((p: Policy) => p.year || new Date().getFullYear())) : new Date().getFullYear();
  const earliestPolicy = POLICIES.length > 0 ? [...POLICIES].filter((p: Policy) => p.year === earliest).sort((a, b) => a.year - b.year)[0] : null;
  const countriesCovered = new Set(POLICIES.map((p: Policy) => p.country)).size;
  const recent = POLICIES.slice(0, 6);
  const initialCountryCounts = COUNTRIES.reduce<Record<string, { total: number; inForce: number }>>((acc, country) => {
    const countryPolicies = POLICIES.filter((p: Policy) => p.country === country.code);
    acc[country.code] = {
      total: countryPolicies.length,
      inForce: countryPolicies.filter((p: Policy) => p.status === 'In Force').length,
    };
    return acc;
  }, {});

  // theme counts for the bar
  const themeCounts = INSTRUMENT_TYPES.map((c) => ({
    name: c,
    count: POLICIES.filter((p: Policy) => 
      p.category && p.category.split(',').map((t: string) => t.trim()).includes(c)
    ).length,
  })).sort((a, b) => b.count - a.count);
  const maxCat = Math.max(...themeCounts.map((c) => c.count), 1);

  const themeColors: Record<string, string> = {
    "Umbrella law": "bg-ocean/20 text-ocean",
    "Environment Impact Assessment (EIA)": "bg-ocean-deep/20 text-ocean-deep",
    "Waste Management Regulation": "bg-sand text-ink",
    "Recycling Regulation": "bg-ocean/20 text-ocean",
    "Penalities": "bg-coral/20 text-coral",
    "Taxes": "bg-sand text-ink",
    "Incentives": "bg-ocean/20 text-ocean",
    "Polluter Pays": "bg-ocean-deep/20 text-ocean-deep",
    "Bans": "bg-coral/20 text-coral",
    "Waste Reduction": "bg-sand text-ink",
    "Single-Use Plastics": "bg-coral/20 text-coral",
    "Hazardous Waste": "bg-ocean-deep/20 text-ocean-deep",
    "Waste Burning": "bg-coral/20 text-coral",
    "Reuse": "bg-ocean/20 text-ocean",
    "Redesign": "bg-sand text-ink",
    "Waste Trade": "bg-ocean-deep/20 text-ocean-deep",
    "Plastic Alternatives": "bg-ocean/20 text-ocean",
  };

  const statusColors: Record<string, string> = {
    "In Force": "bg-ocean text-white",
    "Proposed": "bg-coral text-white",
    "Phased": "bg-sand text-ink",
    "Repealed": "bg-ink/10 text-ink/60",
  };

  return (
    <div className="w-full">
      {/* HERO */}
      <section className="grain relative overflow-hidden border-b border-rule">
        <div className="mx-auto grid max-w-350 gap-12 px-6 pb-20 pt-14 lg:grid-cols-[1.45fr_1.0fr] lg:gap-16 lg:px-10 lg:pt-20">
          <div>
            <h1 className="font-display text-[clamp(2.5rem,6vw,5.5rem)] font-semibold leading-[0.95] tracking-[-0.03em] text-ink">
              <span className="text-coral">Plastic Policies</span>
              <br />
              in a single living<br />
              database
            </h1>
            <p className="mt-8 max-w-xl text-pretty text-lg text-ink/75">
              A living repository of national and regional policies on plastic pollution in Asia Pacific. Brought to you by GAIA Asia Pacific and its membership, this public tool is built for advocates, researchers, journalists, students, and policymakers to learn current policy trends, actions and initiatives to address the plastic crisis in the region.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Link
                href="/search"
                className="group inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 font-mono text-[12px] uppercase tracking-[0.18em] text-paper transition hover:bg-ocean-deep"
              >
                Explore the database
                <span className="transition group-hover:translate-x-1">→</span>
              </Link>
              <Link
                href="/countries"
                className="inline-flex items-center gap-2 rounded-full border border-ink/30 px-6 py-3 font-mono text-[12px] uppercase tracking-[0.18em] text-ink transition hover:bg-ink/5"
              >
                Browse by country
              </Link>
            </div>
          </div>

          {/* Stat block */}
          <div className="relative">
            <SnapshotCard 
              staticData={{
                total,
                inForce,
                proposedDraft: proposed,
                countriesCovered
              }}
              earliestYear={earliest}
              earliestCountry={COUNTRIES.find((c) => c.code === earliestPolicy?.country)?.name}
              earliestTitle={earliestPolicy?.title}
            />
            <div className="pointer-events-none absolute -right-6 -top-6 hidden h-24 w-24 rounded-full bg-coral/20 blur-3xl md:block" />
          </div>
        </div>
      </section>

      {/* THEME BAR */}
      <section className="border-b border-rule">
        <div className="mx-auto max-w-350 px-6 py-20 lg:px-10">
          <SectionHeading
            eyebrow="What's regulated"
            title={<>Where governments are <em className="text-ocean">acting</em>.</>}
          >
            Distribution of indexed instruments by policy type. Bans and EPR dominate the
            first wave; circular economy remains growing.
          </SectionHeading>

          <ThemesSection themeCounts={themeCounts} maxCat={maxCat} />
        </div>
      </section>

      {/* COUNTRIES GRID */}
      <section className="border-b border-rule">
        <div className="mx-auto max-w-350 px-6 py-20 lg:px-10">
          <SectionHeading
            eyebrow="12 countries · phase 1"
            title="From Jakarta to Wellington."
          >
            Coverage spans Southeast Asia, South Asia, East Asia, and Oceania. Each country page
            lists the full text of indexed regulations, their status, and instrument type.
          </SectionHeading>

          <CountriesSection initialCounts={initialCountryCounts} />
        </div>
      </section>

      {/* RECENT */}
      <section className="border-b border-rule bg-sand/50">
        <div className="mx-auto max-w-350 px-6 py-20 lg:px-10">
          <div className="flex items-end justify-between gap-6">
            <SectionHeading
              eyebrow="Newest entries"
              title="Recently indexed."
            />
            <Link
              href="/search"
              className="hidden shrink-0 font-mono text-[11px] uppercase tracking-[0.18em] text-ink/70 underline-offset-4 hover:text-coral hover:underline md:inline-block"
            >
              See full database →
            </Link>
          </div>

          <RecentlyIndexedSection policies={recent} themeColors={themeColors} statusColors={statusColors} />
        </div>
      </section>

      {/* MANIFESTO */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-350 px-6 py-24 lg:px-10">
          <div className="grid gap-12 lg:grid-cols-[1fr_1.4fr]">
            <div>
              <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-coral">
                Why this exists
              </span>
            </div>
            <div>
              <p className="font-fraunces text-pretty text-3xl font-medium leading-tight text-ink md:text-4xl">
                Plastic pollution isn't an opinion problem — it's a coordination problem.
                We built this database so the next press release, parliamentary brief, or
                campaign strategy can start from <em className="text-coral">what already exists</em>,
                not from a blank page.
              </p>
              <div className="mt-10 grid gap-6 sm:grid-cols-3">
                <Tenet n="01" title="Repository, not analysis">Primary-source instruments, summarized faithfully and tagged.</Tenet>
                <Tenet n="02" title="Civil-society-led">Curated and validated with members across the region.</Tenet>
                <Tenet n="03" title="Open & evolving">Phased rollout — more countries, languages, and detail to come.</Tenet>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function Tenet({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-ink/15 pt-4">
      <div className="font-mono text-[11px] tracking-[0.2em] text-coral">{n}</div>
      <div className="mt-2 font-fraunces text-lg font-semibold">{title}</div>
      <p className="mt-1 text-sm text-ink/60">{children}</p>
    </div>
  );
}

function SectionHeading({ eyebrow, title, children }: { eyebrow: string; title: React.ReactNode; children?: React.ReactNode }) {
  return (
    <div className="mb-12">
      <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-coral">{eyebrow}</div>
      <h2 className="mt-3 font-fraunces text-4xl font-semibold leading-tight text-ink md:text-5xl">
        {title}
      </h2>
      {children && (
        <p className="mt-4 max-w-2xl text-lg text-ink/75">
          {children}
        </p>
      )}
    </div>
  );
}
