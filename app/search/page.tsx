'use client';

import Link from 'next/link';
import { useState, useMemo } from 'react';
import { Search, ChevronDown } from 'lucide-react';
import { COUNTRIES, REGIONS as ALL_REGIONS } from '@/lib/constants';

const POLICIES = [
  {
    id: "phil-2024-01",
    year: 2024,
    country: "Philippines",
    countryCode: "PH",
    title: "Single-Use Plastics Regulation Bill",
    summary: "Pending legislation on comprehensive single-use plastic use policies nationwide",
    category: "Plastic Ban",
    instrument: "Bill",
    level: "National",
    status: "Proposed",
    authority: "Philippine Senate",
    link: "https://congress.gov.ph/",
    language: "English"
  },
  {
    id: "japan-2024-01",
    year: 2024,
    country: "Japan",
    countryCode: "JP",
    title: "Draft Act on Management of Packaging Waste (EPRR)",
    summary: "Establishing extended producer responsibility for packaging waste",
    category: "EPR",
    instrument: "Regulation",
    level: "National",
    status: "Proposed",
    authority: "Ministry of Economy, Trade and Industry (METI)",
    link: "https://www.meti.go.jp/",
    language: "Japanese"
  },
  {
    id: "viet-2023-01",
    year: 2023,
    country: "Vietnam",
    countryCode: "VN",
    title: "Circular Economy Policy Framework for Plastics",
    summary: "Framework for implementing circular economy principles in plastics management",
    category: "Circular Economy",
    instrument: "Framework",
    level: "National",
    status: "In Force",
    authority: "Ministry of Natural Resources and Environment",
    link: "https://www.monre.gov.vn/",
    language: "Vietnamese"
  },
  {
    id: "sing-2023-01",
    year: 2023,
    country: "Singapore",
    countryCode: "SG",
    title: "Disposable Carrier Bag Charge",
    summary: "Mandatory 5-cent minimum charge on single-use plastic bags",
    category: "Plastic Ban",
    instrument: "Regulation",
    level: "National",
    status: "In Force",
    authority: "National Environment Agency (NEA)",
    link: "https://www.nea.gov.sg/",
    language: "English"
  },
  {
    id: "indo-2023-01",
    year: 2023,
    country: "Indonesia",
    countryCode: "ID",
    title: "Extended Producer Responsibility Act (IGA 11890)",
    summary: "Producer responsibility for end-of-life packaging and waste management",
    category: "EPR",
    instrument: "Act",
    level: "National",
    status: "In Force",
    authority: "Ministry of Environment and Forestry",
    link: "https://www.menlhk.go.id/",
    language: "Indonesian"
  },
  {
    id: "india-2023-01",
    year: 2023,
    country: "India",
    countryCode: "IN",
    title: "Plastic Waste Management (Amendment) Rules",
    summary: "Rules and ordinances for plastic waste management and recycling",
    category: "Waste Management",
    instrument: "Rules",
    level: "National",
    status: "In Force",
    authority: "Ministry of Environment, Forest and Climate Change",
    link: "https://www.moef.gov.in/",
    language: "English"
  },
  {
    id: "thai-2022-01",
    year: 2022,
    country: "Thailand",
    countryCode: "TH",
    title: "Roadmap on Plastic Waste Management 2018-2030",
    summary: "Comprehensive roadmap for managing plastic waste and reducing single-use plastics",
    category: "Waste Management",
    instrument: "Roadmap",
    level: "National",
    status: "In Force",
    authority: "Ministry of Natural Resources and Environment",
    link: "https://www.mnre.go.th/",
    language: "Thai"
  },
  {
    id: "china-2022-01",
    year: 2022,
    country: "China",
    countryCode: "CN",
    title: "National Plastic Waste Reduction Strategy",
    summary: "Targets for reduction of marine plastic waste and microplastics",
    category: "Plastic Ban",
    instrument: "Strategy",
    level: "National",
    status: "In Force",
    authority: "Ministry of Ecology and Environment",
    link: "https://www.mee.gov.cn/",
    language: "Chinese"
  },
  {
    id: "aus-2022-01",
    year: 2022,
    country: "Australia",
    countryCode: "AU",
    title: "Recycling and Waste Reduction Act",
    summary: "Export ban on unprocessed plastic waste, mandatory recycling targets",
    category: "Waste Management",
    instrument: "Act",
    level: "National",
    status: "In Force",
    authority: "Department of Climate Change, Energy, Environment and Water",
    link: "https://www.dcceew.gov.au/",
    language: "English"
  },
  {
    id: "sk-2021-01",
    year: 2021,
    country: "South Korea",
    countryCode: "KR",
    title: "National Plastics Plan",
    summary: "Phase plan for plastic consumption reduction and circular economy transition",
    category: "Circular Economy",
    instrument: "Plan",
    level: "National",
    status: "In Force",
    authority: "Ministry of Environment",
    link: "https://www.me.go.kr/",
    language: "Korean"
  },
  {
    id: "mal-2021-01",
    year: 2021,
    country: "Malaysia",
    countryCode: "MY",
    title: "Roadmap Towards Zero Single-Use Plastics 2018-2030",
    summary: "Multi-stage roadmap for eliminating single-use plastics",
    category: "Plastic Ban",
    instrument: "Roadmap",
    level: "National",
    status: "Phased",
    authority: "Ministry of Environment and Water",
    link: "https://www.kasa.gov.my/",
    language: "Malay"
  },
  {
    id: "nz-2020-01",
    year: 2020,
    country: "New Zealand",
    countryCode: "NZ",
    title: "Plastic Shipping Bags Ban",
    summary: "Ban on plastic shipping bags and loose-fill polystyrene packaging",
    category: "Plastic Ban",
    instrument: "Regulation",
    level: "National",
    status: "In Force",
    authority: "Ministry for the Environment",
    link: "https://www.mfe.govt.nz/",
    language: "English"
  },
];

const THEMES = [
  "All themes",
  "Plastic Ban",
  "EPR",
  "Waste Management",
  "Circular Economy",
];

const STATUSES = [
  "Any status",
  "In Force",
  "Proposed",
  "Phased",
  "Repealed",
];

const REGIONS = ["All regions", ...ALL_REGIONS];

function StatusPill({ status }: { status: string }) {
  const colors: Record<string, string> = {
    "In Force": "bg-ocean text-white",
    "Proposed": "bg-coral text-white",
    "Phased": "bg-sand text-ink",
    "Repealed": "bg-ink/10 text-ink/60",
  };
  return (
    <span className={`inline-block px-3 py-1 rounded-full font-mono text-[10px] uppercase tracking-[0.14em] font-semibold ${colors[status] || colors["In Force"]}`}>
      {status}
    </span>
  );
}

function ThemeTag({ theme }: { theme: string }) {
  return (
    <span className="inline-block px-3 py-1 rounded-full font-mono text-[10px] uppercase tracking-[0.14em] font-semibold bg-sand/70 text-ink">
      {theme}
    </span>
  );
}

function Select({ 
  label, 
  value, 
  onChange, 
  options 
}: { 
  label: string; 
  value: string; 
  onChange: (v: string) => void; 
  options: Array<[string, string]>; 
}) {
  return (
    <label className="inline-flex items-center gap-2 rounded-full border border-ink/20 bg-paper px-4 py-2 text-sm">
      <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink/60">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-full bg-transparent pr-2 py-1 text-sm focus:outline-none appearance-none cursor-pointer"
      >
        {options.map(([v, l]) => (
          <option key={v} value={v}>{l}</option>
        ))}
      </select>
      <ChevronDown className="w-4 h-4 text-ink/60 pointer-events-none" />
    </label>
  );
}

export default function SearchPage() {
  const [q, setQ] = useState("");
  const [region, setRegion] = useState("All regions");
  const [country, setCountry] = useState("all");
  const [theme, setTheme] = useState("All themes");
  const [status, setStatus] = useState("Any status");

  // Filter countries by selected region - same logic as PolicyForm
  const filteredCountries = useMemo(() => {
    if (region === "All regions") {
      return [{ code: "all", name: "All countries" }, ...COUNTRIES];
    }
    return [
      { code: "all", name: "All countries" },
      ...COUNTRIES.filter((c) => c.region === region)
    ];
  }, [region]);

  // Update country selection when region changes
  const handleRegionChange = (newRegion: string) => {
    setRegion(newRegion);
    // Reset country when region changes (like the form behavior)
    setCountry("all");
  };

  const rows = useMemo(() => {
    const s = q.trim().toLowerCase();
    return POLICIES
      .filter((p) => {
        // Filter by region
        if (region === "All regions") return true;
        // Find the country in COUNTRIES to get its region
        const countryData = COUNTRIES.find((c) => c.code === p.countryCode);
        return countryData?.region === region;
      })
      .filter((p) => (country === "all" ? true : p.countryCode === country))
      .filter((p) => (theme === "All themes" ? true : p.category === theme))
      .filter((p) => (status === "Any status" ? true : p.status === status))
      .filter((p) =>
        s
          ? p.title.toLowerCase().includes(s) ||
            p.summary.toLowerCase().includes(s) ||
            p.instrument.toLowerCase().includes(s)
          : true,
      )
      .sort((a, b) => b.year - a.year);
  }, [q, region, country, theme, status]);

  return (
    <div className="w-full">
      {/* Header */}
      <section className="border-b border-rule">
        <div className="mx-auto max-w-350 px-6 pb-10 pt-14 lg:px-10">
          <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-coral">
            The database · {POLICIES.length} entries
          </div>
          <h1 className="mt-4 font-fraunces text-5xl font-semibold leading-[1.02] tracking-[-0.02em] md:text-6xl">
            Search every indexed regulation.
          </h1>
          <p className="mt-4 max-w-2xl text-pretty text-ink/60">
            Filter by country, theme, status, or full-text search. All entries link to their originating
            instrument and summarize what the regulation does, not what we think about it.
          </p>
        </div>
      </section>

      {/* Sticky Controls */}
      <section className="sticky top-14 z-20 border-b border-rule bg-paper">
        <div className="mx-auto flex max-w-350 flex-wrap items-center gap-3 px-6 py-5 lg:px-10">
          <div className="relative min-w-60 flex-1">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search title, summary, instrument…"
              className="w-full rounded-full border border-ink/20 bg-paper px-5 py-2.5 pr-10 text-sm placeholder:text-ink/40 focus:border-ocean focus:outline-none focus:ring-2 focus:ring-ocean/20"
            />
            <Search className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/40" />
          </div>
          <Select 
            label="Region" 
            value={region} 
            onChange={handleRegionChange} 
            options={REGIONS.map((r) => [r, r] as [string, string])} 
          />
          <Select 
            label="Country" 
            value={country} 
            onChange={setCountry} 
            options={filteredCountries.map((c) => [c.code, c.code === "all" ? c.name : `${c.name} (${c.code})`] as [string, string])} 
          />
          <Select 
            label="Theme" 
            value={theme} 
            onChange={setTheme} 
            options={THEMES.map((c) => [c, c] as [string, string])} 
          />
          <Select 
            label="Status" 
            value={status} 
            onChange={setStatus} 
            options={STATUSES.map((s) => [s, s] as [string, string])} 
          />
          <div className="ml-auto font-mono text-[11px] uppercase tracking-[0.18em] text-ink/60">
            {rows.length} result{rows.length === 1 ? "" : "s"}
          </div>
        </div>
      </section>

      {/* Results Table */}
      <section>
        <div className="mx-auto max-w-350 px-6 py-10 lg:px-10">
          {rows.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-ink/20 p-16 text-center">
              <div className="font-fraunces text-2xl font-semibold">No matches</div>
              <p className="mt-2 text-sm text-ink/60">Try widening your filters or clearing the search.</p>
            </div>
          ) : (
            <ul className="divide-y divide-rule border-y border-rule">
              {rows.map((p) => (
                <li 
                  key={p.id} 
                  className="group grid gap-3 py-6 md:grid-cols-[80px_120px_1fr_180px_140px_140px_80px] md:items-start md:gap-6"
                >
                  <div className="font-mono text-sm tabular-nums text-ink/60">{p.year}</div>
                  <div>
                    <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-coral">{p.country}</div>
                    <div className="text-xs text-ink/60 mt-1">{p.countryCode}</div>
                  </div>
                  <div>
                    <Link href={`/policies/${p.id}`} className="block group/title">
                      <div className="font-fraunces text-lg font-medium leading-snug text-ink group-hover/title:text-coral transition-colors">
                        {p.title}
                      </div>
                    </Link>
                    <p className="mt-1 max-w-3xl text-sm text-ink/60">{p.summary}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <ThemeTag theme={p.category} />
                      <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink/50">
                        {p.instrument}
                      </span>
                    </div>
                  </div>
                  <div className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink/60">
                    {p.level}
                  </div>
                  <div><StatusPill status={p.status} /></div>
                  <div className="text-xs text-ink/60 leading-snug wrap-break-word">
                    {p.authority}
                  </div>
                  <div className="text-xs text-ocean hover:text-ocean-deep transition">
                    <a href={p.link} target="_blank" rel="noopener noreferrer" className="underline">
                      View
                    </a>
                  </div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink/60">
                    {p.language}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
