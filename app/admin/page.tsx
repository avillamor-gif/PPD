'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { COUNTRIES } from '@/lib/constants';
import type { Policy } from '@/lib/types';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Loader } from 'lucide-react';
import {
  PieChart, Pie, Cell, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

interface Analytics {
  summary: {
    totalPolicies: number;
    totalDiscussions: number;
    totalComments: number;
    totalUsers: number;
  };
  policyByStatus: Array<{ status: string; count: number }>;
  policyByCountry: Array<{ country: string; count: number }>;
  policyByCategory: Array<{ category: string; count: number }>;
  policyByYear: Array<{ year: number; count: number }>;
  policyByLifecycleStage: Array<{ stage: string; count: number }>;
  policyByLevel: Array<{ level: string; count: number }>;
  topCountries: Array<{ country: string; count: number }>;
  topCategories: Array<{ category: string; count: number }>;
}

const CHART_COLORS = {
  ocean: '#6bb4c8',
  coral: '#c67d5f',
  sand: '#d4b77f',
  oceanDeep: '#4a7a8a',
  ink: '#343129',
};

const ALL_INSTRUMENT_TYPES = [
  'Bans',
  'Circular Economy',
  'Environment Impact Assessment (EIA)',
  'Hazardous Waste',
  'Incentives',
  'Penalities',
  'Plastic Alternatives',
  'Polluter Pays',
  'Recycling Regulation',
  'Redesign',
  'Reuse',
  'Single-Use Plastics',
  'Taxes',
  'Umbrella law',
  'Waste Burning',
  'Waste Management Regulation',
  'Waste Reduction',
  'Waste Trade',
];

export default function AdminDashboard() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);

  // Check authentication and fetch data on mount
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

        // Fetch both policies and analytics data
        console.log('[ADMIN PAGE] Fetching data...');
        const [policiesRes, analyticsRes] = await Promise.all([
          fetch('/api/policies'),
          fetch('/api/analytics')
        ]);

        if (policiesRes.ok) {
          const data = await policiesRes.json();
          console.log('[ADMIN PAGE] Policies fetched:', data.data?.length);
          setPolicies(data.data || []);
        }

        if (analyticsRes.ok) {
          const data = await analyticsRes.json();
          console.log('[ADMIN PAGE] Analytics fetched');
          setAnalytics(data);
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

  const recentPolicies = policies.sort((a: any, b: any) => (b?.year || 0) - (a?.year || 0)).slice(0, 5);

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
    <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-10 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl md:text-3xl lg:text-4xl font-bold text-ink">Admin Dashboard</h1>
        <p className="mt-2 text-sm md:text-base text-ink/60">Manage policies and view analytics</p>
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
          <div className="mt-3 font-display text-5xl font-bold text-ink">{analytics?.summary.totalPolicies || 0}</div>
          <div className="mt-2 text-xs text-ink/50">Across {COUNTRIES.length} countries</div>
        </div>

        <div className="rounded-2xl border border-ink/10 bg-card p-6">
          <div className="text-sm font-mono uppercase tracking-[0.22em] text-ink/60">In Force</div>
          <div className="mt-3 font-display text-5xl font-bold text-ocean">
            {analytics?.policyByStatus.find(s => s.status === 'In Force')?.count || 0}
          </div>
          <div className="mt-2 text-xs text-ink/50">Active regulations</div>
        </div>

        <div className="rounded-2xl border border-ink/10 bg-card p-6">
          <div className="text-sm font-mono uppercase tracking-[0.22em] text-ink/60">Proposed</div>
          <div className="mt-3 font-display text-5xl font-bold text-coral">
            {analytics?.policyByStatus.find(s => s.status === 'Proposed')?.count || 0}
          </div>
          <div className="mt-2 text-xs text-ink/50">In development</div>
        </div>

        <div className="rounded-2xl border border-ink/10 bg-card p-6">
          <div className="text-sm font-mono uppercase tracking-[0.22em] text-ink/60">Year Range</div>
          <div className="mt-3 font-display text-5xl font-bold text-ink">
            {analytics?.policyByYear && analytics.policyByYear.length > 0
              ? `${Math.min(...analytics.policyByYear.map(y => y.year))}–${Math.max(...analytics.policyByYear.map(y => y.year))}`
              : '—'}
          </div>
          <div className="mt-2 text-xs text-ink/50">Coverage period</div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Policy Status Distribution - Pie Chart */}
        <div className="rounded-2xl border border-ink/10 bg-card p-8">
          <h2 className="font-display text-2xl font-bold text-ink mb-6">Policy Status Distribution</h2>
          {analytics?.policyByStatus && analytics.policyByStatus.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics.policyByStatus}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label
                >
                  {analytics.policyByStatus.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={[CHART_COLORS.ocean, CHART_COLORS.coral, CHART_COLORS.sand, CHART_COLORS.oceanDeep][index % 4]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-ink/60 text-center py-12">No data available</p>
          )}
        </div>

        {/* Instrument Type Distribution - Bar Chart */}
        <div className="rounded-2xl border border-ink/10 bg-card p-8 lg:col-span-2">
          <h2 className="font-display text-2xl font-bold text-ink mb-6">By Instrument Type</h2>
          {analytics?.policyByCategory && analytics.policyByCategory.length > 0 ? (
            <ResponsiveContainer width="100%" height={700}>
              <BarChart
                data={ALL_INSTRUMENT_TYPES.map(type => {
                  const found = analytics.policyByCategory.find((c: any) => c.category === type);
                  return { category: type, count: found?.count || 0 };
                })}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 280, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e8e8e0" />
                <XAxis type="number" tickFormatter={(value) => (value || 0).toString()} />
                <YAxis dataKey="category" type="category" width={270} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value: any) => (value || 0).toString()} />
                <Bar dataKey="count" fill={CHART_COLORS.oceanDeep} radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-ink/60 text-center py-12">No data available</p>
          )}
        </div>
      </div>

      {/* Top Countries & Years */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Top Countries - Bar Chart */}
        <div className="rounded-2xl border border-ink/10 bg-card p-8">
          <h2 className="font-display text-2xl font-bold text-ink mb-6">Policies by Country</h2>
          {analytics?.policyByCountry && analytics.policyByCountry.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={analytics.policyByCountry.slice(0, 10)}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 150, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e8e8e0" />
                <XAxis type="number" />
                <YAxis dataKey="country" type="category" width={140} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" fill={CHART_COLORS.ocean} radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-ink/60 text-center py-12">No data available</p>
          )}
        </div>

        {/* Policies by Year - Line Chart */}
        <div className="rounded-2xl border border-ink/10 bg-card p-8">
          <h2 className="font-display text-2xl font-bold text-ink mb-6">Policies by Year</h2>
          {analytics?.policyByYear && analytics.policyByYear.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics.policyByYear}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e8e8e0" />
                <XAxis dataKey="year" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke={CHART_COLORS.coral}
                  strokeWidth={3}
                  dot={{ fill: CHART_COLORS.coral, r: 5 }}
                  activeDot={{ r: 7 }}
                  name="Count"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-ink/60 text-center py-12">No data available</p>
          )}
        </div>
      </div>

      {/* Lifecycle Stage & Level Distribution */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Lifecycle Stage - Pie Chart */}
        <div className="rounded-2xl border border-ink/10 bg-card p-8">
          <h2 className="font-display text-2xl font-bold text-ink mb-6">Lifecycle Stage</h2>
          {analytics?.policyByLifecycleStage && analytics.policyByLifecycleStage.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics.policyByLifecycleStage}
                  dataKey="count"
                  nameKey="stage"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label
                >
                  {analytics.policyByLifecycleStage.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={[CHART_COLORS.ocean, CHART_COLORS.coral, CHART_COLORS.sand, CHART_COLORS.oceanDeep][index % 4]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-ink/60 text-center py-12">No data available</p>
          )}
        </div>

        {/* Policy Level - Pie Chart */}
        <div className="rounded-2xl border border-ink/10 bg-card p-8">
          <h2 className="font-display text-2xl font-bold text-ink mb-6">Policy Level</h2>
          {analytics?.policyByLevel && analytics.policyByLevel.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics.policyByLevel}
                  dataKey="count"
                  nameKey="level"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label
                >
                  {analytics.policyByLevel.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={[CHART_COLORS.sand, CHART_COLORS.ocean, CHART_COLORS.coral, CHART_COLORS.oceanDeep][index % 4]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-ink/60 text-center py-12">No data available</p>
          )}
        </div>
      </div>

      {/* Recently Added Policies */}
      <div className="rounded-2xl border border-ink/10 bg-card p-8">
        <h2 className="font-display text-2xl font-bold text-ink mb-6">Recently Added</h2>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {recentPolicies.length > 0 ? (
            recentPolicies.map((policy: any) => (
              <a
                key={policy.id}
                href={`/policies/${policy.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-4 border border-ink/10 rounded-lg hover:bg-sand/30 transition cursor-pointer"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-fraunces text-sm font-medium text-ink truncate">{policy.title}</h3>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className="inline-block px-2 py-1 text-[10px] font-mono uppercase rounded bg-sand text-ink">
                        {policy.instrument_type || 'Unknown'}
                      </span>
                      <span className="inline-block px-2 py-1 text-[10px] font-mono text-ink/60">
                        {COUNTRIES.find((c: any) => c.code === policy.country)?.name || policy.country}
                      </span>
                      <span className="inline-block px-2 py-1 text-[10px] font-mono text-ink/60">{policy.year}</span>
                    </div>
                  </div>
                  <div
                    className={`inline-block px-2 py-1 rounded text-[10px] font-mono font-semibold shrink-0 ${
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
            ))
          ) : (
            <p className="text-ink/60 text-center py-8">No policies added yet</p>
          )}
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
