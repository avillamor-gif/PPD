'use client';

import { useState, useMemo } from 'react';
import { ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { COUNTRIES } from '@/lib/constants';
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';

type CountryCount = {
  total: number;
  inForce: number;
};

type CountryCounts = Record<string, CountryCount>;

interface CountriesSectionProps {
  initialCounts?: CountryCounts;
}

export function CountriesSection({ initialCounts }: CountriesSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [counts, setCounts] = useState<CountryCounts>(initialCounts || {});

  useEffect(() => {
    if (initialCounts) return;

    // Load counts if not provided
    const loadCounts = async () => {
      const { data } = await supabase.from('policies').select('country,status');
      if (data) {
        const newCounts: CountryCounts = {};
        COUNTRIES.forEach(c => {
          newCounts[c.code] = { total: 0, inForce: 0 };
        });
        
        data.forEach(row => {
          if (row.country && newCounts[row.country]) {
            newCounts[row.country].total += 1;
            if (row.status === 'In Force') {
              newCounts[row.country].inForce += 1;
            }
          }
        });
        
        setCounts(newCounts);
      }
    };

    loadCounts();
  }, [initialCounts]);

  // Sort countries by policy count (descending), then by name
  const sortedCountries = useMemo(() => {
    return [...COUNTRIES].sort((a, b) => {
      const countA = counts[a.code]?.total || 0;
      const countB = counts[b.code]?.total || 0;
      if (countB !== countA) return countB - countA;
      return a.name.localeCompare(b.name);
    });
  }, [counts]);

  const displayedCountries = isExpanded ? sortedCountries : sortedCountries.slice(0, 4);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-rule bg-rule md:grid-cols-3 lg:grid-cols-4">
        {displayedCountries.map((country) => {
          const countryCount = counts[country.code] || { total: 0, inForce: 0 };
          const hasData = countryCount.total > 0;

          if (!hasData) {
            return (
              <div
                key={country.code}
                className="relative flex flex-col justify-between bg-paper p-6 opacity-50 grayscale"
              >
                <div className="flex items-start justify-between">
                  <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink/60">
                    {country.region}
                  </div>
                  <span className="font-mono text-[11px] tabular-nums text-ink/50">
                    00
                  </span>
                </div>
                <div className="mt-12">
                  <div className="font-mono text-[11px] tracking-[0.2em] text-coral">{country.code}</div>
                  <div className="mt-1 font-fraunces text-2xl font-semibold leading-tight">{country.name}</div>
                </div>
                <span className="mt-6 inline-flex items-center gap-1 font-mono text-[11px] uppercase tracking-[0.16em] text-ink/50">
                  No entries
                </span>
              </div>
            );
          }

          return (
            <Link
              key={country.code}
              href={`/countries/${country.code.toLowerCase()}`}
              className="group relative flex flex-col justify-between bg-paper p-6 transition hover:bg-sand"
            >
              <div className="flex items-start justify-between">
                <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink/60">
                  {country.region}
                </div>
                <span className="font-mono text-[11px] tabular-nums text-ink/50">
                  {String(countryCount.total).padStart(2, '0')}
                </span>
              </div>
              <div className="mt-12">
                <div className="font-mono text-[11px] tracking-[0.2em] text-coral">{country.code}</div>
                <div className="mt-1 font-fraunces text-2xl font-semibold leading-tight">{country.name}</div>
              </div>
              <span className="mt-6 inline-flex items-center gap-1 font-mono text-[11px] uppercase tracking-[0.16em] text-ink/60 transition group-hover:text-coral">
                View policies <span className="transition group-hover:translate-x-1">→</span>
              </span>
            </Link>
          );
        })}
      </div>
      
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="mt-4 flex items-center gap-2 text-sm font-medium text-ocean hover:text-ocean-deep transition-colors"
      >
        <span>{isExpanded ? 'Show less' : `Show all (${COUNTRIES.length} countries)`}</span>
        <ChevronDown 
          size={18} 
          className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}
        />
      </button>
    </div>
  );
}
