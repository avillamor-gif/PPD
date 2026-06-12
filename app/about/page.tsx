'use client';

import Link from 'next/link';

export default function AboutPage() {
  const inScope = [
    "Government initiatives addressing plastic pollution",
    "Waste management rules and ordinances",
    "Plastic bans (national, regional, provincial)",
    "Reuse and refill policies",
    "Extended Producer Responsibility (EPR) schemes",
    "Circular economy frameworks",
    "Sustainable consumption plans",
    "Climate commitments related to plastic (national commitments only)",
  ];

  const outOfScope = [
    "Maritime sources of plastic and microplastics",
    "Chemicals-specific regulation",
    "Transparency-specific policies",
    "Organics and food-waste-only policies",
    "Decarbonization targets (climate commitments only included for plastic-linked commitments)",
    "Policy analysis or scoring — we summarize, we don't grade",
  ];

  const steps = [
    { number: "01", title: "Desk research", description: "Primary sources: official gazettes, ministry portals, parliamentary records." },
    { number: "02", title: "Member validation", description: "Civil society partners on the ground verify, contextualize, and flag gaps." },
    { number: "03", title: "Summarized faithfully", description: "Each entry is written to describe what the instrument does — not whether we like it." },
    { number: "04", title: "Iterated in phases", description: "Phase 1 covers 12 countries in English. More countries, languages, and depth follow." },
  ];

  return (
    <div className="w-full">
      {/* Header Section */}
      <section className="border-b border-rule">
        <div className="mx-auto max-w-[1400px] px-6 pb-20 pt-14 lg:px-10">
          <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-coral">About</div>
          <h1 className="mt-4 max-w-4xl font-fraunces text-[clamp(2.5rem,6vw,4.5rem)] font-semibold leading-[0.98] tracking-[-0.02em]">
            A repository, not a verdict.
          </h1>
          <p className="mt-8 max-w-2xl text-lg text-ink/75 leading-relaxed">
            The Plastic Policy Database tracks plastic-related regulations at the national and
            regional levels across Asia Pacific. We document what governments are doing — accurately,
            accessibly, and without spin — so members, journalists, researchers, and policymakers
            can find common ground in shared facts.
          </p>
        </div>
      </section>

      {/* In Scope / Out of Scope Section */}
      <section className="border-b border-rule">
        <div className="mx-auto grid max-w-[1400px] gap-12 px-6 py-20 lg:grid-cols-2 lg:px-10">
          {/* In Scope */}
          <div>
            <div className="mb-8">
              <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-coral">In scope</div>
              <h2 className="mt-2 font-fraunces text-2xl font-semibold">What we track.</h2>
            </div>
            <ul className="space-y-0">
              {inScope.map((item) => (
                <li key={item} className="flex gap-3 border-b border-rule pb-4 pt-4 first:pt-0">
                  <span className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-coral" />
                  <span className="text-base text-ink">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Out of Scope */}
          <div>
            <div className="mb-8">
              <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-coral">Out of scope</div>
              <h2 className="mt-2 font-fraunces text-2xl font-semibold">What we don't track.</h2>
            </div>
            <ul className="space-y-0">
              {outOfScope.map((item) => (
                <li key={item} className="flex gap-3 border-b border-rule pb-4 pt-4 first:pt-0 text-ink/70">
                  <span className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-ink/30" />
                  <span className="text-base">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Methodology Section */}
      <section className="border-b border-rule bg-sand/50">
        <div className="mx-auto max-w-[1400px] px-6 py-20 lg:px-10">
          <div className="mb-12">
            <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-coral">Method</div>
            <h2 className="mt-2 font-fraunces text-3xl font-semibold">How an entry gets in.</h2>
          </div>
          <ol className="grid gap-6 md:grid-cols-4">
            {steps.map((step, idx) => (
              <li key={idx} className="border-t border-ink pt-4">
                <div className="font-mono text-[11px] tracking-[0.22em] text-coral">{step.number}</div>
                <div className="mt-2 font-fraunces text-xl font-semibold">{step.title}</div>
                <p className="mt-2 text-sm text-ink/70">{step.description}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* CTA Section */}
      <section>
        <div className="mx-auto max-w-[1400px] px-6 py-24 lg:px-10">
          <div className="rounded-3xl border border-ocean-deep/15 bg-gradient-to-br from-ocean to-ocean-deep p-12 text-paper md:p-16">
            <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-coral">Get involved</span>
            <h2 className="mt-4 max-w-3xl font-fraunces text-4xl font-semibold leading-tight md:text-5xl">
              Spotted a missing policy, an error, or a translation we should add?
            </h2>
            <p className="mt-4 max-w-2xl text-paper/80 text-lg">
              This database lives or dies on its accuracy. Drop us a note and we'll review it.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a 
                href="mailto:hello@plasticpolicydb.org" 
                className="rounded-full bg-coral px-6 py-3 font-mono text-[11px] uppercase tracking-[0.18em] text-white transition hover:bg-coral/90 font-semibold"
              >
                hello@plasticpolicydb.org
              </a>
              <Link 
                href="/search" 
                className="rounded-full border border-paper/30 px-6 py-3 font-mono text-[11px] uppercase tracking-[0.18em] text-paper transition hover:bg-paper/10 font-semibold"
              >
                Browse the database →
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
