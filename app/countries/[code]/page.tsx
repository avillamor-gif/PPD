import Link from 'next/link';
import { COUNTRIES } from '@/lib/constants';
import { notFound } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const metadata = {
  title: "Country — Plastic Policy Database",
  description: "Plastic-pollution policy regulations for Asia Pacific countries.",
};

export default async function CountryPage({ params }: { params: Promise<{ code: string }> }) {
  const resolvedParams = await params;
  const country = COUNTRIES.find((c) => c.code.toLowerCase() === resolvedParams.code);
  
  if (!country) {
    notFound();
  }

  // Fetch all policies from Supabase and filter by country
  let policies = [];
  try {
    const { data: allPolicies, error } = await supabaseAdmin
      .from('policies')
      .select()
      .eq('country', country.code)
      .order('year', { ascending: false });
    
    if (!error && allPolicies) {
      policies = allPolicies;
    }
  } catch (err) {
    console.error('Error fetching policies:', err);
  }

  // Fetch available instrument types for this country from reference data
  let availableThemes: string[] = [];
  try {
    const { data: instrumentTypes, error } = await supabaseAdmin
      .from('instrument_types')
      .select('name')
      .order('name');
    
    if (!error && instrumentTypes) {
      // Filter to only show themes that have policies in this country
      const allThemes = instrumentTypes.map((t: any) => t.name);
      availableThemes = allThemes.filter((theme: string) => 
        policies.some((p: any) => p?.category === theme)
      );
    }
  } catch (err) {
    console.error('Error fetching instrument types:', err);
    availableThemes = ['Waste Management Regulation'];
  }

  const THEMES = availableThemes.length > 0 ? availableThemes : ['Waste Management Regulation'];
  const byTheme = THEMES.map((c) => ({
    name: c,
    count: policies.filter((p: any) => p?.category && p.category.includes(c)).length,
  })).filter((c) => c.count > 0);

  const themeColors: Record<string, string> = {
    "Waste Management Regulation": "bg-sand text-ink",
  };

  const statusColors: Record<string, string> = {
    "In Force": "bg-ocean text-white",
    "Proposed": "bg-coral text-white",
    "Phased": "bg-sand text-ink",
    "Repealed": "bg-ink/10 text-ink/60",
  };

  return (
    <div className="w-full">
      {/* Header Section */}
      <section className="border-b border-rule">
        <div className="mx-auto max-w-350 px-6 pb-16 pt-12 lg:px-10">
          <Link 
            href="/countries" 
            className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink/60 hover:text-coral transition"
          >
            ← All countries
          </Link>
          <div className="mt-8 grid gap-10 lg:grid-cols-[1.4fr_1fr] lg:items-end">
            <div>
              <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-coral">{country.region}</div>
              <h1 className="mt-3 font-fraunces text-[clamp(2.5rem,6vw,4.5rem)] font-semibold leading-[0.92] tracking-[-0.03em]">
                {country.name}
              </h1>
            </div>
            <div className="grid grid-cols-3 gap-6 border-t border-ink/15 pt-6">
              <Mini n={policies.length} label="Indexed" />
              <Mini n={policies.filter((p: any) => p?.status === "In Force").length} label="In force" />
              <Mini n={byTheme.reduce((sum: number, t: any) => sum + t.count, 0)} label="Instrument Type" />
            </div>
          </div>

          {byTheme.length > 0 && (
            <div className="mt-8 flex flex-wrap gap-2">
              {byTheme.map((c) => (
                <span key={c.name} className="inline-block rounded-full border border-ink/15 bg-paper px-3 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-ink/75">
                  {c.name} <span className="ml-1 text-ink/40">{c.count}</span>
                </span>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Policies List */}
      <section>
        <div className="mx-auto max-w-350 px-6 py-16 lg:px-10">
          {policies.length === 0 ? (
            <p className="text-ink/60">No policies indexed for this country yet.</p>
          ) : (
            <ol className="overflow-hidden rounded-2xl border border-rule bg-rule">
              {policies.map((p: any, i: number) => (
                <li key={p?.id} className="grid gap-3 bg-paper p-8 md:grid-cols-[60px_1fr_auto] md:items-start md:gap-8">
                  <div className="font-mono text-sm tabular-nums text-ink/40">{String(i + 1).padStart(2, "0")}</div>
                  <div>
                    <div className="flex flex-wrap items-baseline gap-3">
                      <span className="font-mono text-sm tabular-nums text-coral">{p?.year}</span>
                      <Link href={`/policies/${p?.slug}`} className="font-fraunces text-2xl font-medium leading-snug text-ink hover:text-coral transition">
                        {p?.title}
                      </Link>
                    </div>
                    <p className="mt-3 max-w-3xl text-pretty text-base text-ink/75 line-clamp-2">{p?.summary}</p>
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <span className={`inline-block rounded-full px-3 py-1 font-mono text-[10px] uppercase tracking-[0.14em] font-semibold ${themeColors[p?.category] || 'bg-sand text-ink'}`}>
                        {p?.category}
                      </span>
                      <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink/50">
                        {p?.instrument} · {p?.level}
                      </span>
                    </div>
                  </div>
                  <div className={`inline-block rounded-full px-3 py-1 font-mono text-[10px] uppercase tracking-[0.14em] font-semibold whitespace-nowrap ${statusColors[p.status] || statusColors["In Force"]}`}>
                    {p.status}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>
      </section>
    </div>
  );
}

function Mini({ n, label }: { n: number; label: string }) {
  return (
    <div>
      <div className="font-fraunces text-4xl font-semibold tracking-tight">{n}</div>
      <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-ink/60">{label}</div>
    </div>
  );
}
