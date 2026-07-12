'use client';

import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Users, MessageSquare, Globe, Tag, Calendar, Layers } from 'lucide-react';

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
  statusTrends: Array<{ year: number; count: number }>;
  topCountries: Array<{ country: string; count: number }>;
  topCategories: Array<{ category: string; count: number }>;
}

export default function AnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const res = await fetch('/api/analytics');
      if (!res.ok) throw new Error('Failed to load analytics');
      const data = await res.json();
      setAnalytics(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-ink/60">Loading analytics...</p>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-coral">{error || 'Failed to load analytics'}</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="border-b border-rule bg-white mb-6">
        <div className="px-6 py-6">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-ocean" />
            <h1 className="text-3xl font-bold text-ink">Analytics Dashboard</h1>
          </div>
          <p className="text-ink/60 mt-2">Comprehensive policy database metrics and insights</p>
        </div>
      </div>

      {/* Summary Stats */}
      <section className="mb-8">
        <div className="grid gap-6 md:grid-cols-4">
          <div className="rounded-xl border border-ink/10 bg-paper p-6 space-y-2">
            <p className="text-xs text-ink/60 uppercase tracking-widest font-semibold">Total Policies</p>
            <p className="text-4xl font-bold text-ocean">{analytics.summary.totalPolicies}</p>
          </div>
          <div className="rounded-xl border border-ink/10 bg-paper p-6 space-y-2">
            <p className="text-xs text-ink/60 uppercase tracking-widest font-semibold">Discussions</p>
            <p className="text-4xl font-bold text-coral">{analytics.summary.totalDiscussions}</p>
          </div>
          <div className="rounded-xl border border-ink/10 bg-paper p-6 space-y-2">
            <p className="text-xs text-ink/60 uppercase tracking-widest font-semibold">Comments</p>
            <p className="text-4xl font-bold text-sand">{analytics.summary.totalComments}</p>
          </div>
          <div className="rounded-xl border border-ink/10 bg-paper p-6 space-y-2">
            <p className="text-xs text-ink/60 uppercase tracking-widest font-semibold">Users</p>
            <p className="text-4xl font-bold text-ocean-deep">{analytics.summary.totalUsers}</p>
          </div>
        </div>
      </section>

      {/* Policy Status Distribution */}
      <section className="mb-8">
        <h2 className="text-xl font-bold text-ink mb-4 flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-ocean" />
          Policy Status Distribution
        </h2>
        <div className="rounded-xl border border-ink/10 overflow-hidden bg-white">
          <table className="w-full text-sm">
            <thead className="bg-paper border-b border-ink/10">
              <tr>
                <th className="px-6 py-3 text-left font-semibold text-ink">Status</th>
                <th className="px-6 py-3 text-right font-semibold text-ink">Count</th>
                <th className="px-6 py-3 text-right font-semibold text-ink">Percentage</th>
              </tr>
            </thead>
            <tbody>
              {analytics.policyByStatus.map((item) => (
                <tr key={item.status} className="border-t border-ink/10 hover:bg-paper/50 transition">
                  <td className="px-6 py-3 font-medium text-ink">{item.status}</td>
                  <td className="px-6 py-3 text-right text-ocean font-bold">{item.count}</td>
                  <td className="px-6 py-3 text-right text-ink/60">
                    {((item.count / analytics.summary.totalPolicies) * 100).toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Top Countries */}
      <section className="mb-8">
        <h2 className="text-xl font-bold text-ink mb-4 flex items-center gap-2">
          <Globe className="w-6 h-6 text-coral" />
          Top 5 Countries by Policy Count
        </h2>
        <div className="grid gap-4 md:grid-cols-5">
          {analytics.topCountries.map((item) => (
            <div key={item.country} className="rounded-xl border border-ink/10 bg-white p-4 text-center">
              <p className="text-3xl font-bold text-coral mb-2">{item.count}</p>
              <p className="text-sm font-semibold text-ink">{item.country}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Top Categories */}
      <section className="mb-8">
        <h2 className="text-xl font-bold text-ink mb-4 flex items-center gap-2">
          <Tag className="w-6 h-6 text-sand" />
          Top 5 Categories by Policy Count
        </h2>
        <div className="grid gap-4 md:grid-cols-5">
          {analytics.topCategories.map((item) => (
            <div key={item.category} className="rounded-xl border border-ink/10 bg-white p-4 text-center">
              <p className="text-3xl font-bold text-sand mb-2">{item.count}</p>
              <p className="text-sm font-semibold text-ink">{item.category}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Policies by Category */}
      <section className="mb-8">
        <h2 className="text-xl font-bold text-ink mb-4 flex items-center gap-2">
          <Tag className="w-6 h-6 text-ocean" />
          All Categories
        </h2>
        <div className="rounded-xl border border-ink/10 overflow-hidden bg-white">
          <table className="w-full text-sm">
            <thead className="bg-paper border-b border-ink/10">
              <tr>
                <th className="px-6 py-3 text-left font-semibold text-ink">Category</th>
                <th className="px-6 py-3 text-right font-semibold text-ink">Count</th>
                <th className="px-6 py-3 text-right font-semibold text-ink">Percentage</th>
              </tr>
            </thead>
            <tbody>
              {analytics.policyByCategory.map((item) => (
                <tr key={item.category} className="border-t border-ink/10 hover:bg-paper/50 transition">
                  <td className="px-6 py-3 font-medium text-ink">{item.category}</td>
                  <td className="px-6 py-3 text-right text-ocean font-bold">{item.count}</td>
                  <td className="px-6 py-3 text-right text-ink/60">
                    {((item.count / analytics.summary.totalPolicies) * 100).toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Policies by Lifecycle Stage */}
      <section className="mb-8">
        <h2 className="text-xl font-bold text-ink mb-4 flex items-center gap-2">
          <Layers className="w-6 h-6 text-coral" />
          Lifecycle Stage Distribution
        </h2>
        <div className="rounded-xl border border-ink/10 overflow-hidden bg-white">
          <table className="w-full text-sm">
            <thead className="bg-paper border-b border-ink/10">
              <tr>
                <th className="px-6 py-3 text-left font-semibold text-ink">Lifecycle Stage</th>
                <th className="px-6 py-3 text-right font-semibold text-ink">Count</th>
                <th className="px-6 py-3 text-right font-semibold text-ink">Percentage</th>
              </tr>
            </thead>
            <tbody>
              {analytics.policyByLifecycleStage.map((item) => (
                <tr key={item.stage} className="border-t border-ink/10 hover:bg-paper/50 transition">
                  <td className="px-6 py-3 font-medium text-ink">{item.stage}</td>
                  <td className="px-6 py-3 text-right text-coral font-bold">{item.count}</td>
                  <td className="px-6 py-3 text-right text-ink/60">
                    {((item.count / analytics.summary.totalPolicies) * 100).toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Policies by Level */}
      <section className="mb-8">
        <h2 className="text-xl font-bold text-ink mb-4 flex items-center gap-2">
          <Layers className="w-6 h-6 text-sand" />
          Policy Level Distribution
        </h2>
        <div className="rounded-xl border border-ink/10 overflow-hidden bg-white">
          <table className="w-full text-sm">
            <thead className="bg-paper border-b border-ink/10">
              <tr>
                <th className="px-6 py-3 text-left font-semibold text-ink">Level</th>
                <th className="px-6 py-3 text-right font-semibold text-ink">Count</th>
                <th className="px-6 py-3 text-right font-semibold text-ink">Percentage</th>
              </tr>
            </thead>
            <tbody>
              {analytics.policyByLevel.map((item) => (
                <tr key={item.level} className="border-t border-ink/10 hover:bg-paper/50 transition">
                  <td className="px-6 py-3 font-medium text-ink">{item.level}</td>
                  <td className="px-6 py-3 text-right text-sand font-bold">{item.count}</td>
                  <td className="px-6 py-3 text-right text-ink/60">
                    {((item.count / analytics.summary.totalPolicies) * 100).toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Policies by Year */}
      <section className="mb-8">
        <h2 className="text-xl font-bold text-ink mb-4 flex items-center gap-2">
          <Calendar className="w-6 h-6 text-ocean-deep" />
          Policies by Year
        </h2>
        <div className="rounded-xl border border-ink/10 overflow-hidden bg-white">
          <table className="w-full text-sm">
            <thead className="bg-paper border-b border-ink/10">
              <tr>
                <th className="px-6 py-3 text-left font-semibold text-ink">Year</th>
                <th className="px-6 py-3 text-right font-semibold text-ink">Count</th>
                <th className="px-6 py-3 text-right font-semibold text-ink">Percentage</th>
              </tr>
            </thead>
            <tbody>
              {analytics.policyByYear.map((item) => (
                <tr key={item.year} className="border-t border-ink/10 hover:bg-paper/50 transition">
                  <td className="px-6 py-3 font-medium text-ink">{item.year}</td>
                  <td className="px-6 py-3 text-right text-ocean-deep font-bold">{item.count}</td>
                  <td className="px-6 py-3 text-right text-ink/60">
                    {((item.count / analytics.summary.totalPolicies) * 100).toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* All Countries */}
      <section>
        <h2 className="text-xl font-bold text-ink mb-4 flex items-center gap-2">
          <Globe className="w-6 h-6 text-ocean" />
          All Countries
        </h2>
        <div className="rounded-xl border border-ink/10 overflow-hidden bg-white">
          <table className="w-full text-sm">
            <thead className="bg-paper border-b border-ink/10">
              <tr>
                <th className="px-6 py-3 text-left font-semibold text-ink">Country</th>
                <th className="px-6 py-3 text-right font-semibold text-ink">Count</th>
                <th className="px-6 py-3 text-right font-semibold text-ink">Percentage</th>
              </tr>
            </thead>
            <tbody>
              {analytics.policyByCountry.map((item) => (
                <tr key={item.country} className="border-t border-ink/10 hover:bg-paper/50 transition">
                  <td className="px-6 py-3 font-medium text-ink">{item.country}</td>
                  <td className="px-6 py-3 text-right text-ocean font-bold">{item.count}</td>
                  <td className="px-6 py-3 text-right text-ink/60">
                    {((item.count / analytics.summary.totalPolicies) * 100).toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
