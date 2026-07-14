'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { COUNTRIES } from '@/lib/constants';
import type { Policy } from '@/lib/types/policy';

interface RecentlyIndexedSectionProps {
  policies: Policy[];
  themeColors: Record<string, string>;
  statusColors: Record<string, string>;
}

export function RecentlyIndexedSection({
  policies,
  themeColors,
  statusColors,
}: RecentlyIndexedSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const displayedPolicies = isExpanded ? policies : policies.slice(0, 3);

  return (
    <div className="space-y-4">
      <ul className="divide-y divide-rule border-y border-rule">
        {displayedPolicies.map((p) => {
          const country = COUNTRIES.find((c) => c.code === p.country)!;
          return (
            <li key={p.id} className="group grid gap-3 py-6 md:grid-cols-[120px_60px_1fr_auto] md:items-center md:gap-6">
              <div className="font-mono text-sm tabular-nums text-ink/60">{p.year}</div>
              <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-coral">{p.country}</div>
              <div>
                <div className="font-fraunces text-xl font-medium leading-snug text-ink group-hover:text-ocean">
                  {p.title}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-ink/60">
                  <span>{country.name}</span>
                  <span className="text-ink/30">·</span>
                  <span>{p.instrument}</span>
                  <span className="text-ink/30">·</span>
                  <span className={`inline-block rounded-full px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.12em] font-semibold ${themeColors[p.category] || 'bg-sand text-ink'}`}>
                    {p.category}
                  </span>
                </div>
              </div>
              <div className={`inline-block rounded-full px-3 py-1 font-mono text-[10px] uppercase tracking-[0.14em] font-semibold whitespace-nowrap ${statusColors[p.status] || statusColors["In Force"]}`}>
                {p.status}
              </div>
            </li>
          );
        })}
      </ul>

      {policies.length > 3 && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-4 flex items-center gap-2 text-sm font-medium text-ocean hover:text-ocean-deep transition-colors"
        >
          <span>{isExpanded ? 'Show less' : `Show all (${policies.length} entries)`}</span>
          <ChevronDown 
            size={18} 
            className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          />
        </button>
      )}
    </div>
  );
}
