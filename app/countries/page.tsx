import Link from 'next/link';
import { COUNTRIES, POLICIES } from '@/lib/constants';

export const metadata = {
  title: "Countries — Plastic Policy Database",
  description: "Browse plastic-pollution policies across the 12 Asia Pacific countries covered in Phase 1.",
};

export default function CountriesPage() {
  const regions = ["Southeast Asia", "South Asia", "East Asia", "Oceania"] as const;

  return (
    <div className="w-full">
      {/* Header Section */}
      <section className="border-b border-rule">
        <div className="mx-auto max-w-[1400px] px-6 pb-16 pt-14 lg:px-10">
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
        <div className="mx-auto max-w-[1400px] px-6 py-16 lg:px-10">
          {regions.map((region) => {
            const list = COUNTRIES.filter((c) => c.region === region);
            return (
              <div key={region} className="mb-16">
                <div className="mb-6 flex items-center gap-3">
                  <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-coral">
                    {region}
                  </span>
                  <span className="h-px flex-1 bg-rule" />
                  <span className="font-mono text-[11px] text-ink/40">{list.length}</span>
                </div>
                <div className="grid gap-px overflow-hidden rounded-2xl border border-rule bg-rule md:grid-cols-2 lg:grid-cols-3">
                  {list.map((c) => {
                    const count = POLICIES.filter((p) => p.country === c.code).length;
                    const inForce = POLICIES.filter((p) => p.country === c.code && p.status === "In Force").length;
                    return (
                      <Link
                        key={c.code}
                        href={`/countries/${c.code.toLowerCase()}`}
                        className="group flex items-center justify-between gap-6 bg-paper p-7 transition hover:bg-sand"
                      >
                        <div>
                          <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-coral">{c.code}</div>
                          <div className="mt-2 font-fraunces text-3xl font-semibold leading-tight">{c.name}</div>
                          <div className="mt-3 font-mono text-[11px] uppercase tracking-[0.18em] text-ink/60">
                            {count} {count === 1 ? 'policy' : 'policies'} · {inForce} in force
                          </div>
                        </div>
                        <span className="font-fraunces text-3xl text-ink/30 transition group-hover:translate-x-1 group-hover:text-coral">→</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
