'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface ThemeCount {
  name: string;
  count: number;
}

interface ThemesSectionProps {
  themeCounts: ThemeCount[];
  maxCat: number;
}

export function ThemesSection({ themeCounts, maxCat }: ThemesSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const displayedThemes = isExpanded ? themeCounts : themeCounts.slice(0, 5);
  const hasMore = themeCounts.length > 5;

  return (
    <div className="space-y-3">
      {displayedThemes.map((c) => (
        <div key={c.name} className="grid grid-cols-[200px_1fr_3ch] items-center gap-4 border-t border-rule py-4 md:grid-cols-[260px_1fr_3ch]">
          <div className="font-fraunces text-lg font-medium">{c.name}</div>
          <div className="relative h-2 overflow-hidden rounded-full bg-sand">
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-ocean-deep transition-all"
              style={{ width: `${(c.count / maxCat) * 100}%` }}
            />
          </div>
          <div className="text-right font-mono text-sm tabular-nums text-ink/70">{c.count}</div>
        </div>
      ))}
      
      {hasMore && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-4 flex items-center gap-2 text-sm font-medium text-ocean hover:text-ocean-deep transition-colors"
        >
          <span>{isExpanded ? 'Show less' : `Show all (${themeCounts.length})`}</span>
          <ChevronDown 
            size={18} 
            className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          />
        </button>
      )}
    </div>
  );
}
