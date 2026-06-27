'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { COUNTRIES } from '@/lib/constants';
import { supabase } from '@/lib/supabase';

const REGIONS = ['Southeast Asia', 'South Asia', 'East Asia', 'Oceania'] as const;

type CountryCount = {
  total: number;
  inForce: number;
};

type CountryCounts = Record<string, CountryCount>;

type CountryGridRealtimeProps = {
  initialCounts?: CountryCounts;
  variant: 'home' | 'countries';
};

function getEmptyCounts(): CountryCounts {
  const counts: CountryCounts = {};
  COUNTRIES.forEach((country) => {
    counts[country.code] = { total: 0, inForce: 0 };
  });
  return counts;
}

function aggregateCounts(rows: Array<{ country: string | null; status: string | null }>): CountryCounts {
  const counts = getEmptyCounts();

  rows.forEach((row) => {
    if (!row.country || !counts[row.country]) {
      return;
    }

    counts[row.country].total += 1;
    if (row.status === 'In Force') {
      counts[row.country].inForce += 1;
    }
  });

  return counts;
}

export function CountryGridRealtime({ initialCounts, variant }: CountryGridRealtimeProps) {
  const [counts, setCounts] = useState<CountryCounts>(initialCounts || getEmptyCounts());

  useEffect(() => {
    let active = true;

    const loadCounts = async () => {
      const { data, error } = await supabase.from('policies').select('country,status');
      if (error || !data || !active) {
        return;
      }

      setCounts(aggregateCounts(data));
    };

    void loadCounts();

    const channel = supabase
      .channel(`policies-country-counts-${variant}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'policies' },
        () => {
          void loadCounts();
        }
      )
      .subscribe();

    return () => {
      active = false;
      void supabase.removeChannel(channel);
    };
  }, [variant]);

  const countriesByRegion = useMemo(() => {
    if (variant !== 'countries') {
      return [];
    }

    return REGIONS.map((region) => ({
      region,
      list: COUNTRIES.filter((country) => country.region === region),
    }));
  }, [variant]);

  if (variant === 'home') {
    return (
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-rule bg-rule md:grid-cols-3 lg:grid-cols-4">
        {COUNTRIES.map((country) => {
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
    );
  }

  return (
    <>
      {countriesByRegion.map(({ region, list }) => (
        <div key={region} className="mb-16">
          <div className="mb-6 flex items-center gap-3">
            <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-coral">{region}</span>
            <span className="h-px flex-1 bg-rule" />
            <span className="font-mono text-[11px] text-ink/40">{list.length}</span>
          </div>
          <div className="grid gap-px overflow-hidden rounded-2xl border border-rule bg-rule md:grid-cols-2 lg:grid-cols-3">
            {list.map((country) => {
              const countryCount = counts[country.code] || { total: 0, inForce: 0 };
              const hasData = countryCount.total > 0;

              const content = (
                <div>
                  <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-coral">{country.code}</div>
                  <div className="mt-2 font-fraunces text-3xl font-semibold leading-tight">{country.name}</div>
                  <div className="mt-3 font-mono text-[11px] uppercase tracking-[0.18em] text-ink/60">
                    {countryCount.total} {countryCount.total === 1 ? 'policy' : 'policies'} · {countryCount.inForce} in force
                  </div>
                </div>
              );

              if (!hasData) {
                return (
                  <div
                    key={country.code}
                    className="flex flex-col items-start justify-between gap-4 bg-paper p-7 opacity-50 grayscale cursor-not-allowed"
                  >
                    <div className="flex-1">{content}</div>
                    <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink/40">No entries</div>
                  </div>
                );
              }

              return (
                <Link
                  key={country.code}
                  href={`/countries/${country.code.toLowerCase()}`}
                  className="group flex items-center justify-between gap-6 bg-paper p-7 transition hover:bg-sand"
                >
                  {content}
                  <span className="font-fraunces text-3xl text-ink/30 transition group-hover:translate-x-1 group-hover:text-coral">→</span>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </>
  );
}
