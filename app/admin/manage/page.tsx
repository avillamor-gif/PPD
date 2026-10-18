'use client';

import { useState, useEffect } from 'react';
import { COUNTRIES } from '@/lib/constants';
import Link from 'next/link';
import { Trash2, Pencil, Loader } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { UserRole } from '@/lib/roles';
import type { Policy } from '@/lib/types/policy';

const roleIdMap: Record<number, UserRole> = {
  1: UserRole.ADMIN,
  2: UserRole.MODERATOR,
  3: UserRole.EXPERT,
};

export default function AdminManagePage() {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [filteredPolicies, setFilteredPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; slug?: string } | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRegion, setFilterRegion] = useState('');
  const [filterCountry, setFilterCountry] = useState('');
  const [filterInstrumentType, setFilterInstrumentType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterYear, setFilterYear] = useState('');

  // Get unique values for filters
  const countries = Array.from(new Set(policies.map(p => p.country)))
    .map(code => COUNTRIES.find(c => c.code === code))
    .filter(Boolean);
  
  // Get regions from countries that have policies
  const regions = Array.from(new Set(
    countries.map(c => c?.region).filter(Boolean)
  )).sort();
  
  // Get countries filtered by selected region
  const filteredCountriesList = filterRegion 
    ? countries.filter(c => c?.region === filterRegion)
    : countries;
  
  // Get instrument types from comma-separated categories
  const instrumentTypes = Array.from(new Set(
    policies
      .map(p => p.category)
      .filter(Boolean)
      .flatMap(cat => cat.split(',').map(c => c.trim()))
  )).sort();
  
  const statuses = Array.from(new Set(policies.map(p => p.status)));
  const years = Array.from(new Set(policies.map(p => p.year))).sort((a, b) => b - a);

  // Get user role and ID first
  useEffect(() => {
    const getUserRole = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          setLoading(false);
          return;
        }

        setUserId(session.user.id);

        const { data: profile, error } = await supabase
          .from('user_profiles')
          .select('role_id')
          .eq('id', session.user.id)
          .single();

        if (!error && profile) {
          const role = roleIdMap[profile.role_id] || UserRole.EXPERT;
          setUserRole(role);
        }
      } catch (error) {
        console.error('Error fetching user role:', error);
      }
    };

    getUserRole();
  }, []);

  // Fetch policies
  useEffect(() => {
    const fetchPolicies = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/policies');
        if (!res.ok) throw new Error('Failed to fetch policies');
        const response = await res.json();
        const policiesData = response.data || response;
        
        let allPolicies = Array.isArray(policiesData) ? policiesData : [];
        
        // Filter for experts: show only their own submissions
        if (userRole === UserRole.EXPERT && userId) {
          allPolicies = allPolicies.filter(p => p.created_by === userId);
        }
        
        setPolicies(allPolicies);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load policies');
        console.error('Error fetching policies:', err);
      } finally {
        setLoading(false);
      }
    };

    if (userRole !== null) {
      fetchPolicies();
    }
  }, [userRole, userId]);

  // Apply filters
  useEffect(() => {
    let filtered = policies;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.summary.toLowerCase().includes(q)
      );
    }

    if (filterRegion) {
      const regionCountries = COUNTRIES.filter(c => c.region === filterRegion).map(c => c.code);
      filtered = filtered.filter(p => regionCountries.includes(p.country));
    }

    if (filterCountry) {
      filtered = filtered.filter(p => p.country === filterCountry);
    }

    if (filterInstrumentType) {
      filtered = filtered.filter(p => {
        const categories = p.category?.split(',').map(c => c.trim()) || [];
        return categories.includes(filterInstrumentType);
      });
    }

    if (filterStatus) {
      filtered = filtered.filter(p => p.status === filterStatus);
    }

    if (filterYear) {
      filtered = filtered.filter(p => p.year === parseInt(filterYear));
    }

    setFilteredPolicies(filtered);
  }, [policies, searchQuery, filterRegion, filterCountry, filterInstrumentType, filterStatus, filterYear]);

  const handleDelete = async (policyId: string, slug?: string) => {
    try {
      const identifier = slug || policyId;
      const res = await fetch(`/api/policies/${identifier}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete policy');
      setPolicies(policies.filter(p => p.id !== policyId));
      setDeleteConfirm(null);
    } catch (err) {
      console.error('Error deleting policy:', err);
      alert('Failed to delete policy');
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-4xl font-bold text-ink">Manage Entries</h1>
          <p className="mt-2 text-ink/60">View and manage all policies in the database</p>
        </div>
        <Link
          href="/admin/submit"
          className="inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 font-mono text-xs uppercase tracking-[0.18em] text-paper transition hover:bg-ocean-deep"
        >
          Add New +
        </Link>
      </div>

      {/* Filters Section */}
      <div className="rounded-2xl border border-ink/10 bg-card p-6 space-y-4">
        <h3 className="font-mono text-sm uppercase tracking-widest text-ink/70 font-semibold">Filters</h3>
        
        {/* Search Box */}
        <input
          type="text"
          placeholder="Search by title or summary..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 rounded-lg border border-ink/20 bg-paper focus:outline-none focus:border-ocean text-sm"
        />

        {/* Filter Row */}
        <div className="flex w-full items-center gap-2 flex-wrap">
          <select
            value={filterRegion}
            onChange={(e) => setFilterRegion(e.target.value)}
            className="flex-1 min-w-[120px] px-4 py-2 rounded-lg border border-ink/20 bg-paper focus:outline-none focus:border-ocean text-sm"
          >
            <option value="">All Regions</option>
            {regions.map(region => (
              <option key={region} value={region}>{region}</option>
            ))}
          </select>

          <select
            value={filterCountry}
            onChange={(e) => setFilterCountry(e.target.value)}
            className="flex-1 min-w-30 px-4 py-2 rounded-lg border border-ink/20 bg-paper focus:outline-none focus:border-ocean text-sm"
          >
            <option value="">All Countries</option>
            {filteredCountriesList.map(c => (
              <option key={c?.code} value={c?.code}>{c?.name}</option>
            ))}
          </select>

          <select
            value={filterInstrumentType}
            onChange={(e) => setFilterInstrumentType(e.target.value)}
            className="flex-1 min-w-30 px-4 py-2 rounded-lg border border-ink/20 bg-paper focus:outline-none focus:border-ocean text-sm"
          >
            <option value="">All Instrument Types</option>
            {instrumentTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="flex-1 min-w-30 px-4 py-2 rounded-lg border border-ink/20 bg-paper focus:outline-none focus:border-ocean text-sm"
          >
            <option value="">All Statuses</option>
            {statuses.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>

          <select
            value={filterYear}
            onChange={(e) => setFilterYear(e.target.value)}
            className="flex-1 min-w-30 px-4 py-2 rounded-lg border border-ink/20 bg-paper focus:outline-none focus:border-ocean text-sm"
          >
            <option value="">All Years</option>
            {years.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>

        {/* Clear Filters Button */}
        {(searchQuery || filterRegion || filterCountry || filterInstrumentType || filterStatus || filterYear) && (
          <button
            onClick={() => {
              setSearchQuery('');
              setFilterRegion('');
              setFilterCountry('');
              setFilterInstrumentType('');
              setFilterStatus('');
              setFilterYear('');
            }}
            className="text-sm text-ocean hover:underline"
          >
            Clear all filters
          </button>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader className="w-6 h-6 animate-spin text-ocean" />
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="rounded-2xl border border-coral/20 bg-coral/5 p-6">
          <p className="text-coral font-medium">Error: {error}</p>
        </div>
      )}

      {/* Policies Table */}
      {!loading && !error && (
        <div className="rounded-2xl border border-ink/10 bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-rule bg-sand/30">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-mono uppercase tracking-widest text-ink/60">Title</th>
                  <th className="px-6 py-4 text-left text-sm font-mono uppercase tracking-widest text-ink/60">Country</th>
                  <th className="px-6 py-4 text-left text-sm font-mono uppercase tracking-widest text-ink/60">Category</th>
                  <th className="px-6 py-4 text-left text-sm font-mono uppercase tracking-widest text-ink/60">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-mono uppercase tracking-widest text-ink/60">Approval</th>
                  <th className="px-6 py-4 text-left text-sm font-mono uppercase tracking-widest text-ink/60">Year</th>
                  <th className="px-6 py-4 text-left text-sm font-mono uppercase tracking-widest text-ink/60">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rule">
                {filteredPolicies.map((policy) => {
                  const country = COUNTRIES.find((c) => c.code === policy.country);
                  const statusColors: Record<string, string> = {
                    'In Force': 'bg-ocean/10 text-ocean',
                    'Proposed': 'bg-coral/10 text-coral',
                    'Phased': 'bg-sand text-ink',
                    'Repealed': 'bg-ink/10 text-ink/60',
                  };

                  // Get approval status display
                  const approvalStatus = policy.approval_status || 'draft';
                  const isPublished = approvalStatus === 'approved' || approvalStatus === 'draft';
                  const approvalStatusDisplay = isPublished ? 'Published' : 
                    approvalStatus === 'pending' ? 'Pending for Approval' :
                    approvalStatus === 'rejected' ? 'Rejected' : 'Unknown';
                  
                  const approvalColors: Record<string, string> = {
                    'Published': 'bg-ocean/10 text-ocean',
                    'Pending for Approval': 'bg-amber-100 text-amber-700',
                    'Rejected': 'bg-coral/10 text-coral',
                  };

                  return (
                    <tr key={policy.id} className="hover:bg-sand/20 transition">
                      <td className="px-6 py-4">
                        <div className="max-w-xs">
                          <div className="font-medium text-ink text-sm">{policy.title}</div>
                          <div className="text-xs text-ink/50 mt-1">{policy.summary.substring(0, 50)}...</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-ink">{country?.name || policy.country}</td>
                      <td className="px-6 py-4 text-sm text-ink">{policy.category}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-mono font-semibold ${statusColors[policy.status] || statusColors['In Force']}`}>
                          {policy.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-mono font-semibold ${approvalColors[approvalStatusDisplay] || 'bg-ink/10 text-ink/60'}`}>
                          {approvalStatusDisplay}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-ink/60 font-mono">{policy.year}</td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <Link
                            href={`/admin/manage/${policy.slug || policy.id}`}
                            className="p-2 hover:bg-ocean/10 rounded transition text-ocean"
                            title="Edit policy"
                          >
                            <Pencil className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => setDeleteConfirm({ id: policy.id, slug: policy.slug })}
                            className="p-2 hover:bg-coral/10 rounded transition text-coral"
                            title="Delete policy"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Delete Confirmation */}
                        {deleteConfirm?.id === policy.id && (
                          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                            <div className="bg-paper rounded-2xl max-w-sm w-full p-6 border border-ink/20">
                              <h3 className="font-display text-lg font-bold text-ink">Delete Policy?</h3>
                              <p className="mt-2 text-sm text-ink/60">This action cannot be undone.</p>
                              <div className="mt-6 flex gap-3">
                                <button
                                  onClick={() => handleDelete(deleteConfirm.id, deleteConfirm.slug)}
                                  className="flex-1 rounded-lg bg-coral px-4 py-2 font-mono text-xs uppercase tracking-widest text-white hover:bg-coral/90 transition"
                                >
                                  Delete
                                </button>
                                <button
                                  onClick={() => setDeleteConfirm(null)}
                                  className="flex-1 rounded-lg border border-ink/20 px-4 py-2 font-mono text-xs uppercase tracking-widest text-ink hover:bg-ink/5 transition"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {!loading && filteredPolicies.length === 0 && (
              <div className="px-6 py-12 text-center">
                <p className="text-ink/60">No policies found matching your filters.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Summary */}
      {!loading && !error && (
        <div className="rounded-2xl border border-ink/10 bg-card p-6">
          <p className="text-sm text-ink/60">
            Showing <strong>{filteredPolicies.length}</strong> of <strong>{policies.length}</strong> policies.
          </p>
        </div>
      )}
    </div>
  );
}
