'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { COUNTRIES, THEMES, STATUSES } from '@/lib/constants';
import type { Policy, PolicyStatus } from '@/lib/types';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Loader } from 'lucide-react';

export default function AdminDashboard() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [policies, setPolicies] = useState<Policy[]>([]);

  // Check authentication and fetch policies on mount
  useEffect(() => {
    const initializeDashboard = async () => {
      try {
        console.log('[ADMIN PAGE] Starting initialization...');
        // Check authentication
        const { data: { session } } = await supabase.auth.getSession();
        console.log('[ADMIN PAGE] Session user:', session?.user?.id);
        if (!session?.user) {
          console.log('[ADMIN PAGE] No session, redirecting to login');
          router.push('/auth/login');
          return;
        }
        console.log('[ADMIN PAGE] Authentication successful');
        setIsAuthenticated(true);

        // Fetch policies from API
        console.log('[ADMIN PAGE] Fetching policies...');
        const response = await fetch('/api/policies');
        if (response.ok) {
          const data = await response.json();
          console.log('[ADMIN PAGE] Policies fetched:', data.data?.length);
          setPolicies(data.data || []);
        } else {
          console.error('[ADMIN PAGE] Failed to fetch policies:', response.status);
          setPolicies([]);
        }
      } catch (err) {
        console.error('[ADMIN PAGE] Error initializing dashboard:', err);
        router.push('/auth/login');
      } finally {
        console.log('[ADMIN PAGE] Initialization complete');
        setIsLoading(false);
      }
    };

    initializeDashboard();
  }, [router]);

  // Analytics data
  const POLICIES = policies;
  const totalPolicies = POLICIES.length;
  const policyByStatus = useMemo(() => {
    const counts: Record<PolicyStatus, number> = {
      'Unknown': 0,
      'In Force': 0,
      'Proposed': 0,
      'Phased': 0,
      'Repealed': 0,
    };
    POLICIES.forEach((p: any) => {
      if (p?.status && counts.hasOwnProperty(p.status)) {
        counts[p.status as PolicyStatus]++;
      }
    });
    return counts;
  }, []);

  const policyByCountry = useMemo(() => {
    const counts: Record<string, number> = {};
    POLICIES.forEach((p: any) => {
      if (p?.country) {
        counts[p.country] = (counts[p.country] || 0) + 1;
      }
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
    POLICIES.forEach((p: any) => {
      if (p?.category) {
        counts[p.category] = (counts[p.category] || 0) + 1;
      }
    });
    return Object.entries(counts)
      .map(([theme, count]) => ({ theme, count }))
      .sort((a, b) => b.count - a.count);
  }, []);

  const yearRange = useMemo(() => {
    const years = POLICIES.map((p: any) => p?.year || 0).filter((y) => y > 0);
    return { min: Math.min(...years), max: Math.max(...years) };
  }, []);

  const recentPolicies = useMemo(
    () => [...POLICIES].sort((a: any, b: any) => (b?.year || 0) - (a?.year || 0)).slice(0, 5),
    []
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-6 h-6 animate-spin text-ocean mx-auto" />
          <p className="mt-4 text-ink/60">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-10 py-8 space-y-4 md:space-y-6 lg:space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl md:text-3xl lg:text-4xl font-bold text-ink">Analytics Dashboard</h1>
        <p className="mt-2 text-sm md:text-base text-ink/60">Overview of all policies in the database</p>
      </div>

      {/* Admin Tools */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link
          href="/admin/users"
          className="rounded-lg border border-ink/20 bg-card p-6 hover:border-ocean hover:shadow-lg transition"
        >
          <div className="text-sm font-mono uppercase tracking-[0.18em] text-ocean font-semibold">👥</div>
          <h3 className="mt-3 font-semibold text-ink">User Management</h3>
          <p className="mt-1 text-sm text-ink/60">Manage users, roles & permissions</p>
        </Link>

        <Link
          href="/admin/moderation"
          className="rounded-lg border border-ink/20 bg-card p-6 hover:border-ocean hover:shadow-lg transition"
        >
          <div className="text-sm font-mono uppercase tracking-[0.18em] text-coral font-semibold">🛡️</div>
          <h3 className="mt-3 font-semibold text-ink">Forum Moderation</h3>
          <p className="mt-1 text-sm text-ink/60">Review & manage discussions</p>
        </Link>

        <Link
          href="/admin/submit"
          className="rounded-lg border border-ink/20 bg-card p-6 hover:border-ocean hover:shadow-lg transition"
        >
          <div className="text-sm font-mono uppercase tracking-[0.18em] text-sand font-semibold">➕</div>
          <h3 className="mt-3 font-semibold text-ink">Add New Policy</h3>
          <p className="mt-1 text-sm text-ink/60">Submit a new policy to database</p>
        </Link>

        <Link
          href="/admin/manage"
          className="rounded-lg border border-ink/20 bg-card p-6 hover:border-ocean hover:shadow-lg transition"
        >
          <div className="text-sm font-mono uppercase tracking-[0.18em] text-ink font-semibold">📋</div>
          <h3 className="mt-3 font-semibold text-ink">Manage Policies</h3>
          <p className="mt-1 text-sm text-ink/60">Edit, delete, and organize entries</p>
        </Link>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 gap-3 md:gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
                'Unknown': 'bg-ink/30',
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

      {/* Top Countries & Recently Added - Side by Side */}
      <div className="grid grid-cols-1 gap-3 md:gap-4 lg:grid-cols-2">
        {/* Top Countries */}
        <div className="rounded-2xl border border-ink/10 bg-card p-4 md:p-6">
          <h2 className="font-display text-lg md:text-xl font-bold text-ink">Top Countries</h2>
          <div className="mt-4">
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {policyByCountry.map(({ code, name, count }) => (
                <a
                  key={code}
                  href={`/countries/${code.toLowerCase()}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-sand/50 transition cursor-pointer"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-linear-to-br from-ocean to-ocean-deep flex items-center justify-center text-white text-xs font-bold shrink-0">
                      {code}
                    </div>
                    <span className="font-medium text-ink truncate">{name}</span>
                  </div>
                  <span className="font-display text-lg font-semibold text-ocean ml-2 shrink-0">{count}</span>
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Policies */}
        <div className="rounded-2xl border border-ink/10 bg-card p-4 md:p-6">
          <h2 className="font-display text-lg md:text-xl font-bold text-ink">Recently Added</h2>
          <div className="mt-4">
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {recentPolicies.map((policy: any) => (
                <a
                  key={policy.id}
                  href={`/policies/${policy.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-2 border border-ink/10 rounded-lg hover:bg-sand/30 transition cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-fraunces text-sm font-medium text-ink truncate">{policy.title}</h3>
                      <div className="mt-1 flex flex-wrap items-center gap-1">
                        <span className="inline-block px-1.5 py-0.5 text-[10px] font-mono uppercase rounded bg-sand text-ink">
                          {policy.category}
                        </span>
                        <span className="inline-block px-1.5 py-0.5 text-[10px] font-mono text-ink/60">
                          {COUNTRIES.find((c: any) => c.code === policy.country)?.name}
                        </span>
                        <span className="inline-block px-1.5 py-0.5 text-[10px] font-mono text-ink/60">{policy.year}</span>
                      </div>
                    </div>
                    <div
                      className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold shrink-0 ${
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
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Action Links */}
      <div className="flex flex-wrap gap-2 md:gap-3 pt-4">
        <Link
          href="/admin/submit"
          className="inline-flex items-center gap-2 rounded-full bg-ink px-4 md:px-6 py-2 md:py-3 font-mono text-[10px] md:text-xs uppercase tracking-[0.18em] text-paper transition hover:bg-ocean-deep"
        >
          Add New Policy →
        </Link>
        <Link
          href="/search"
          className="inline-flex items-center gap-2 rounded-full border border-ink/30 px-4 md:px-6 py-2 md:py-3 font-mono text-[10px] md:text-xs uppercase tracking-[0.18em] text-ink transition hover:bg-ink/5"
        >
          View Database
        </Link>
      </div>
    </div>
  );
}
