'use client';

import { useEffect, useState } from 'react';
import { Stat } from './Stat';

interface SnapshotData {
  total: number;
  inForce: number;
  proposedDraft: number;
  countriesCovered: number;
}

interface SnapshotCardProps {
  staticData: SnapshotData; // Fallback server-rendered data
  earliestYear: number;
  earliestCountry?: string;
  earliestTitle?: string;
}

export function SnapshotCard({ staticData, earliestYear, earliestCountry, earliestTitle }: SnapshotCardProps) {
  const [data, setData] = useState<SnapshotData>(staticData);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fetch fresh snapshot data on mount
    const fetchSnapshot = async () => {
      try {
        const response = await fetch('/api/snapshot', {
          cache: 'no-store',
        });
        if (response.ok) {
          const freshData = await response.json();
          setData({
            total: freshData.total,
            inForce: freshData.inForce,
            proposedDraft: freshData.proposedDraft,
            countriesCovered: freshData.countriesCovered,
          });
        }
      } catch (error) {
        console.error('Failed to fetch snapshot data:', error);
        // Keep static data as fallback
      } finally {
        setIsLoading(false);
      }
    };

    fetchSnapshot();
  }, []);

  return (
    <div className="rounded-2xl border border-ink/10 bg-card p-8 shadow-[0_30px_80px_-40px_rgba(20,40,60,0.35)]">
      <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
        Snapshot {isLoading && <span className="text-xs">(live)</span>}
      </div>
      <div className="mt-6 grid grid-cols-2 gap-y-8 gap-x-4">
        <Stat n={data.total.toString()} label="Policies indexed" />
        <Stat n={data.countriesCovered.toString()} label="Countries covered" />
        <Stat n={data.inForce.toString()} label="In force" accent />
        <Stat n={data.proposedDraft.toString()} label="Proposed / in draft" />
      </div>
      <div className="mt-8 border-t border-rule pt-6">
        <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
          Earliest record
        </div>
        <div className="mt-1 font-display text-2xl font-semibold">{earliestYear}</div>
        <div className="text-sm text-muted-foreground">
          {earliestCountry} · {earliestTitle}
        </div>
      </div>
    </div>
  );
}
