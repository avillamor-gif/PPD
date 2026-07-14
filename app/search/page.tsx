'use client';

import Link from 'next/link';
import { useState, useMemo, useEffect } from 'react';
import { Search, ChevronDown, Loader } from 'lucide-react';
import { COUNTRIES } from '@/lib/constants';
import { useReferenceData } from '@/lib/hooks/useReferenceData';

// Transform policies to include country names for display
const transformPolicies = (policies: any[]) => {
  return policies.map((p: any) => {
    const countryData = COUNTRIES.find((c) => c.code === p.country);
    return {
      ...p,
      countryCode: p.country,
      country: countryData?.name || p.country,
    };
  });
};

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
  options,
  className
}: { 
  label: string; 
  value: string; 
  onChange: (v: string) => void; 
  options: Array<[string, string]>; 
  className?: string;
}) {
  return (
    <label className={`inline-flex items-center gap-2 rounded-full border border-ink/20 bg-paper px-4 py-1 text-sm ${className || ""}`}>
      <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink/60">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-full bg-transparent pr-2 py-0 text-sm focus:outline-none appearance-none cursor-pointer"
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
  const { data: referenceData, loading: refLoading } = useReferenceData();
  const [rawPolicies, setRawPolicies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [region, setRegion] = useState("All regions");
  const [country, setCountry] = useState("all");
  const [theme, setTheme] = useState("All Instrument Types");
  const [status, setStatus] = useState("Any status");
  const [sortBy, setSortBy] = useState("Year: Newest");

  // Statuses from reference data with "Any status" option
  const STATUSES = referenceData?.statuses 
    ? ["Any status", ...referenceData.statuses]
    : ["Any status", "In Force", "Proposed", "Phased", "Repealed"];

  // Sort options
  const SORT_OPTIONS = [
    ["Year: Newest", "Year: Newest"],
    ["Year: Oldest", "Year: Oldest"],
    ["Title: A-Z", "Title: A-Z"],
    ["Title: Z-A", "Title: Z-A"],
  ] as Array<[string, string]>;

  // Fetch policies from API
  useEffect(() => {
    const fetchPolicies = async () => {
      try {
        const res = await fetch('/api/policies');
        if (res.ok) {
          const response = await res.json();
          const policiesData = response.data || response;
          setRawPolicies(transformPolicies(Array.isArray(policiesData) ? policiesData : []));
        }
      } catch (err) {
        console.error('Error fetching policies:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPolicies();
  }, []);

  const POLICIES = rawPolicies;

  // Categories to exclude from the dropdown filter
  const EXCLUDED_CATEGORIES = ["Plastic Ban", "Circular Economy", "EPR"];

  // Get available themes from policies with usage count (instrument types)
  const availableThemes = useMemo(() => {
    const themeCounts = new Map<string, number>();
    POLICIES.forEach(p => {
      if (p?.category) {
        // Split comma-separated categories and count each individually
        p.category.split(',').forEach((cat: string) => {
          const trimmed = cat?.trim?.() || '';
          if (trimmed && !EXCLUDED_CATEGORIES.includes(trimmed)) {
            themeCounts.set(trimmed, (themeCounts.get(trimmed) || 0) + 1);
          }
        });
      }
    });
    // Sort by name and format with count
    const sorted = Array.from(themeCounts.entries())
      .sort((a, b) => (a[0] || '').localeCompare(b[0] || ''))
      .map(([name, count]) => `${name} (${count})`);
    return ["All Instrument Types", ...sorted];
  }, [POLICIES]);

  // Get available regions from policies with usage count (only show regions with entries)
  const availableRegions = useMemo(() => {
    const regionCounts = new Map<string, number>();
    POLICIES.forEach(p => {
      const countryData = COUNTRIES.find(c => c.code === p?.countryCode);
      const region = countryData?.region;
      if (region) {
        regionCounts.set(region, (regionCounts.get(region) || 0) + 1);
      }
    });
    // Sort by name and format with count
    const sorted = Array.from(regionCounts.entries())
      .sort((a, b) => (a[0] || '').localeCompare(b[0] || ''))
      .map(([name, count]) => `${name} (${count})`);
    return ["All regions", ...sorted];
  }, [POLICIES]);

  // Get available countries from policies with usage count (only show countries with entries)
  const countriesWithEntries = useMemo(() => {
    const countryCounts = new Map<string, number>();
    POLICIES.forEach(p => {
      countryCounts.set(p.countryCode, (countryCounts.get(p.countryCode) || 0) + 1);
    });
    return COUNTRIES.filter(c => countryCounts.has(c.code)).map(c => ({
      ...c,
      displayName: `${c.name} (${countryCounts.get(c.code) || 0})`
    }));
  }, [POLICIES]);

  // Filter countries by selected region - same logic as PolicyForm
  const filteredCountries = useMemo(() => {
    const allCountriesObj = { code: "all", name: "All countries", region: "", displayName: "All countries" };
    if (region === "All regions") {
      return [allCountriesObj, ...countriesWithEntries];
    }
    // Extract region name from region (remove the count: "Region (5)" -> "Region")
    const regionName = region.replace(/ \(\d+\)$/, '');
    return [
      allCountriesObj,
      ...countriesWithEntries.filter((c: any) => c.region === regionName)
    ];
  }, [region, countriesWithEntries]);

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
        // Extract region name from region (remove the count: "Region (5)" -> "Region")
        const regionName = region.replace(/ \(\d+\)$/, '');
        // Find the country in COUNTRIES to get its region
        const countryData = COUNTRIES.find((c) => c.code === p.countryCode);
        return countryData?.region === regionName;
      })
      .filter((p) => (country === "all" ? true : p.countryCode === country))
      .filter((p) => {
        if (theme === "All Instrument Types") return true;
        // Extract category name from theme (remove the count: "Name (5)" -> "Name")
        const themeName = theme.replace(/ \(\d+\)$/, '');
        // Handle comma-separated categories
        const categories = (p?.category || '').split(',').map((cat: string) => cat?.trim?.() || '') || [];
        return categories.includes(themeName);
      })
      .filter((p) => (status === "Any status" ? true : p.status === status))
      .filter((p) =>
        s
          ? (p.title?.toLowerCase().includes(s) ?? false) ||
            (p.summary?.toLowerCase().includes(s) ?? false) ||
            (p.instrument?.toLowerCase().includes(s) ?? false)
          : true,
      )
      .sort((a, b) => {
        switch (sortBy) {
          case "Year: Oldest":
            return a.year - b.year;
          case "Title: A-Z":
            return (a.title || "").localeCompare(b.title || "");
          case "Title: Z-A":
            return (b.title || "").localeCompare(a.title || "");
          case "Year: Newest":
          default:
            return b.year - a.year;
        }
      });
  }, [POLICIES, q, region, country, theme, status, sortBy]);

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
        {/* Search bar with Sort - row 1 */}
        <div className="flex w-full items-center gap-3 px-6 py-1 lg:px-10">
          <div className="relative flex-1">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search title, summary, instrument…"
              className="w-full rounded-full border border-ink/20 bg-paper px-5 py-1.5 pr-10 text-sm placeholder:text-ink/40 focus:border-ocean focus:outline-none focus:ring-2 focus:ring-ocean/20"
            />
            <Search className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/40" />
          </div>
          <div className="flex-shrink-0">
            <Select 
              label="Sort" 
              value={sortBy} 
              onChange={setSortBy} 
              options={SORT_OPTIONS} 
            />
          </div>
        </div>
        {/* Filters - row 2 */}
        <div className="flex w-full items-center gap-3 px-6 py-1 lg:px-10">
          <Select 
            label="Region" 
            value={region} 
            onChange={handleRegionChange} 
            options={availableRegions.map((r) => [r, r] as [string, string])} 
          />
          <Select 
            label="Country" 
            value={country} 
            onChange={setCountry} 
            options={filteredCountries.map((c: any) => [c.code, c.displayName || c.name] as [string, string])} 
          />
          <Select 
            label="Instrument Type" 
            value={theme} 
            onChange={setTheme} 
            options={availableThemes.map((c) => [c, c] as [string, string])}
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
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader className="w-6 h-6 animate-spin text-ocean" />
            </div>
          ) : rows.length === 0 ? (
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
                    <Link href={`/policies/${p.slug}`} className="block group/title">
                      <div className="font-fraunces text-lg font-medium leading-snug text-ink group-hover/title:text-coral transition-colors">
                        {p.title}
                      </div>
                    </Link>
                    <p className="mt-1 max-w-3xl text-sm text-ink/60 line-clamp-2">{p.summary}</p>
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
