'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { POLICIES, COUNTRIES, THEMES, STATUSES } from '@/lib/constants';
import type { Policy, PolicyStatus } from '@/lib/types';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function AdminDashboard() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          // Redirect to login if not authenticated
          router.push('/auth/login');
          return;
        }
        setIsAuthenticated(true);
      } catch (err) {
        console.error('Auth check error:', err);
        router.push('/auth/login');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  // Analytics data
  const totalPolicies = POLICIES.length;
  const policyByStatus = useMemo(() => {
    const counts: Record<PolicyStatus, number> = {
      'In Force': 0,
      'Proposed': 0,
      'Phased': 0,
      'Repealed': 0,
    };
    POLICIES.forEach((p) => {
      counts[p.status as PolicyStatus]++;
    });
    return counts;
  }, []);

  const policyByCountry = useMemo(() => {
    const counts: Record<string, number> = {};
    POLICIES.forEach((p) => {
      counts[p.country] = (counts[p.country] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([code, count]) => {
        const country = COUNTRIES.find((c) => c.code === code);
        return { code, name: country?.name || code, count };
      })
      .sort((a, b) => b.count - a.count);
  }, []);

  const policyByTheme = useMemo(() => {
    const counts: Record<string, number> = {};
    POLICIES.forEach((p) => {
      counts[p.category] = (counts[p.category] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([theme, count]) => ({ theme, count }))
      .sort((a, b) => b.count - a.count);
  }, []);

  const yearRange = useMemo(() => {
    const years = POLICIES.map((p) => p.year);
    return { min: Math.min(...years), max: Math.max(...years) };
  }, []);

  const recentPolicies = useMemo(
    () => [...POLICIES].sort((a, b) => b.year - a.year).slice(0, 5),
    []
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-ocean/20 border-t-ocean rounded-full animate-spin"></div>
          <p className="mt-4 text-ink/60">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-display text-4xl font-bold text-ink">Analytics Dashboard</h1>
        <p className="mt-2 text-ink/60">Overview of all policies in the database</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-ink/10 bg-card p-6">
          <div className="text-sm font-mono uppercase tracking-[0.22em] text-ink/60">Total Policies</div>
          <div className="mt-3 font-display text-5xl font-bold text-ink">{totalPolicies}</div>
          <div className="mt-2 text-xs text-ink/50">Across {COUNTRIES.length} countries</div>
        </div>

        <div className="rounded-2xl border border-ink/10 bg-card p-6">
          <div className="text-sm font-mono uppercase tracking-[0.22em] text-ink/60">In Force</div>
          <div className="mt-3 font-display text-5xl font-bold text-ocean">{policyByStatus['In Force']}</div>
          <div className="mt-2 text-xs text-ink/50">Active regulations</div>
        </div>

        <div className="rounded-2xl border border-ink/10 bg-card p-6">
          <div className="text-sm font-mono uppercase tracking-[0.22em] text-ink/60">Proposed</div>
          <div className="mt-3 font-display text-5xl font-bold text-coral">{policyByStatus['Proposed']}</div>
          <div className="mt-2 text-xs text-ink/50">In development</div>
        </div>

        <div className="rounded-2xl border border-ink/10 bg-card p-6">
          <div className="text-sm font-mono uppercase tracking-[0.22em] text-ink/60">Year Range</div>
          <div className="mt-3 font-display text-5xl font-bold text-ink">
            {yearRange.min}–{yearRange.max}
          </div>
          <div className="mt-2 text-xs text-ink/50">Coverage period</div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Status Distribution */}
        <div className="rounded-2xl border border-ink/10 bg-card p-8">
          <h2 className="font-display text-2xl font-bold text-ink">By Status</h2>
          <div className="mt-6 space-y-4">
            {Object.entries(policyByStatus).map(([status, count]) => {
              const total = totalPolicies;
              const percentage = ((count / total) * 100).toFixed(0);
              const colors: Record<string, string> = {
                'In Force': 'bg-ocean',
                'Proposed': 'bg-coral',
                'Phased': 'bg-sand',
                'Repealed': 'bg-ink/20',
              };
              return (
                <div key={status}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-ink">{status}</span>
                    <span className="text-sm font-mono text-ink/60">
                      {count} ({percentage}%)
                    </span>
                  </div>
                  <div className="h-2 bg-ink/10 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${colors[status]}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Theme Distribution */}
        <div className="rounded-2xl border border-ink/10 bg-card p-8">
          <h2 className="font-display text-2xl font-bold text-ink">By Theme</h2>
          <div className="mt-6 space-y-4">
            {policyByTheme.map(({ theme, count }) => {
              const percentage = ((count / totalPolicies) * 100).toFixed(0);
              return (
                <div key={theme}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-ink">{theme}</span>
                    <span className="text-sm font-mono text-ink/60">
                      {count} ({percentage}%)
                    </span>
                  </div>
                  <div className="h-2 bg-ink/10 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-ocean-deep"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Top Countries */}
      <div className="rounded-2xl border border-ink/10 bg-card p-8">
        <h2 className="font-display text-2xl font-bold text-ink">Top Countries by Policy Count</h2>
        <div className="mt-6">
          <div className="space-y-3">
            {policyByCountry.map(({ code, name, count }) => (
              <div key={code} className="flex items-center justify-between p-3 rounded-lg hover:bg-sand/50 transition">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-linear-to-br from-ocean to-ocean-deep flex items-center justify-center text-white text-xs font-bold">
                    {code}
                  </div>
                  <span className="font-medium text-ink">{name}</span>
                </div>
                <span className="font-display text-2xl font-semibold text-ocean">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Policies */}
      <div className="rounded-2xl border border-ink/10 bg-card p-8">
        <h2 className="font-display text-2xl font-bold text-ink">Recently Added Policies</h2>
        <div className="mt-6">
          <div className="space-y-3">
            {recentPolicies.map((policy) => (
              <div key={policy.id} className="p-4 border border-ink/10 rounded-lg hover:bg-sand/30 transition">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-fraunces text-lg font-medium text-ink">{policy.title}</h3>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className="inline-block px-2 py-1 text-xs font-mono uppercase tracking-widest rounded bg-sand text-ink">
                        {policy.category}
                      </span>
                      <span className="inline-block px-2 py-1 text-xs font-mono text-ink/60">
                        {COUNTRIES.find((c) => c.code === policy.country)?.name}
                      </span>
                      <span className="inline-block px-2 py-1 text-xs font-mono text-ink/60">{policy.year}</span>
                    </div>
                  </div>
                  <div
                    className={`inline-block px-2 py-1 rounded text-xs font-mono font-semibold ${
                      policy.status === 'In Force'
                        ? 'bg-ocean text-white'
                        : policy.status === 'Proposed'
                          ? 'bg-coral text-white'
                          : policy.status === 'Phased'
                            ? 'bg-sand text-ink'
                            : 'bg-ink/10 text-ink/60'
                    }`}
                  >
                    {policy.status}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Action Links */}
      <div className="flex gap-3 pt-4">
        <Link
          href="/admin/submit"
          className="inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 font-mono text-xs uppercase tracking-[0.18em] text-paper transition hover:bg-ocean-deep"
        >
          Add New Policy →
        </Link>
        <Link
          href="/search"
          className="inline-flex items-center gap-2 rounded-full border border-ink/30 px-6 py-3 font-mono text-xs uppercase tracking-[0.18em] text-ink transition hover:bg-ink/5"
        >
          View Database
        </Link>
      </div>
    </div>
  );
}
