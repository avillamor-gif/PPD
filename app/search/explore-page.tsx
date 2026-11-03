'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useMemo, useEffect, useCallback } from 'react';
import { Search, ChevronDown, Loader, Download, List, Grid3x3 } from 'lucide-react';
import { COUNTRIES } from '@/lib/constants';
import { supabase } from '@/lib/supabase';
import './explore-styles.css';

const transformPolicies = (policies: any[]) => {
  return policies.map((p: any) => {
    const countryData = COUNTRIES.find((c) => c.code === p.country);
    return {
      ...p,
      countryCode: p.country,
      country: countryData?.name || p.country,
      region: countryData?.region || '',
    };
  });
};

const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return '—';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return dateString;
  }
};

type SortField = 'year' | 'country' | 'title' | 'region' | 'level' | 'status' | 'date';
type SortOrder = 'asc' | 'desc' | 'none';

interface Policy {
  id: string;
  title: string;
  country: string;
  countryCode: string;
  status: string;
  topics: string[];
  year?: number;
  level?: string;
  type?: string;
  category?: string;
  summary?: string;
  [key: string]: any;
}

interface SortState {
  field: SortField | null;
  order: SortOrder;
}

interface CompareSelection {
  [key: string]: boolean;
}

export default function SearchPage() {
  const router = useRouter();
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [filteredPolicies, setFilteredPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedInstrumentType, setSelectedInstrumentType] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'list'>('table');
  const [sortState, setSortState] = useState<SortState>({ field: null, order: 'none' });
  const [compareSelection, setCompareSelection] = useState<CompareSelection>({});
  const [showCompareBar, setShowCompareBar] = useState(false);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [allInstrumentTypes, setAllInstrumentTypes] = useState<any[]>([]);
  const [allStatuses, setAllStatuses] = useState<any[]>([]);

  // Fetch policies
  useEffect(() => {
    const fetchPolicies = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/policies');
        if (response.ok) {
          const data = await response.json();
          const transformed = transformPolicies(data.data || []);
          setPolicies(transformed);
          setFilteredPolicies(transformed);
          
          // Extract unique instrument types (from category field)
          const instrumentTypes = new Set<string>();
          transformed.forEach((p: Policy) => {
            if (p.category) {
              p.category.split(',').forEach((cat: string) => {
                const trimmed = cat.trim();
                if (trimmed) instrumentTypes.add(trimmed);
              });
            }
          });
          setAllInstrumentTypes(Array.from(instrumentTypes).sort());
          
          // Extract unique statuses
          const statuses = new Set<string>();
          transformed.forEach((p: Policy) => {
            if (p.status) {
              statuses.add(p.status);
            }
          });
          setAllStatuses(Array.from(statuses).sort());
        }
      } catch (error) {
        console.error('Error fetching policies:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPolicies();
  }, []);

  // Apply filters and sorting
  useEffect(() => {
    let filtered = [...policies];

    // Text search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.title?.toLowerCase().includes(term) ||
          p.country?.toLowerCase().includes(term) ||
          p.summary?.toLowerCase().includes(term) ||
          p.category?.toLowerCase().includes(term)
      );
    }

    // Country filter
    if (selectedCountry) {
      filtered = filtered.filter((p) => p.countryCode === selectedCountry);
    }

    // Instrument Type filter
    if (selectedInstrumentType) {
      filtered = filtered.filter((p) =>
        p.category?.includes(selectedInstrumentType)
      );
    }

    // Status filter
    if (selectedStatus) {
      filtered = filtered.filter((p) => p.status === selectedStatus);
    }

    // Level filter
    if (selectedLevel) {
      filtered = filtered.filter((p) => p.level === selectedLevel);
    }

    // Year filter
    if (selectedYear) {
      filtered = filtered.filter((p) => p.year?.toString() === selectedYear);
    }

    // Apply sorting
    if (sortState.field && sortState.order !== 'none') {
      filtered.sort((a, b) => {
        const aVal = a[sortState.field!];
        const bVal = b[sortState.field!];

        if (aVal === undefined || aVal === null) return 1;
        if (bVal === undefined || bVal === null) return -1;

        let comparison = 0;
        if (typeof aVal === 'string') {
          comparison = aVal.localeCompare(bVal);
        } else {
          comparison = aVal > bVal ? 1 : -1;
        }

        return sortState.order === 'asc' ? comparison : -comparison;
      });
    }

    setFilteredPolicies(filtered);
  }, [
    policies,
    searchTerm,
    selectedCountry,
    selectedInstrumentType,
    selectedStatus,
    selectedLevel,
    selectedYear,
    sortState,
  ]);

  const handleSort = (field: SortField) => {
    setSortState((prev) => {
      if (prev.field === field) {
        const orders: Record<SortOrder, SortOrder> = {
          none: 'asc',
          asc: 'desc',
          desc: 'none',
        };
        return { field, order: orders[prev.order] };
      }
      return { field, order: 'asc' };
    });
  };

  const handleCompareToggle = (policyId: string) => {
    setCompareSelection((prev) => ({
      ...prev,
      [policyId]: !prev[policyId],
    }));
  };

  const selectedCount = Object.values(compareSelection).filter(Boolean).length;
  const canCompare = selectedCount >= 2 && selectedCount <= 4;

  useEffect(() => {
    setShowCompareBar(selectedCount > 0);
  }, [selectedCount]);

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCountry('');
    setSelectedInstrumentType('');
    setSelectedStatus('');
    setSelectedLevel('');
    setSelectedYear('');
    setSortState({ field: null, order: 'none' });
  };

  const clearCompare = () => {
    setCompareSelection({});
    setShowCompareBar(false);
  };

  const countries = useMemo(() => {
    return Array.from(new Set(policies.map((p) => p.country))).sort();
  }, [policies]);

  const years = useMemo(() => {
    return Array.from(new Set(policies.map((p) => p.year).filter(Boolean)))
      .sort((a, b) => (b as number) - (a as number));
  }, [policies]);

  const getSortArrow = (field: SortField) => {
    if (sortState.field !== field) return '↕';
    return sortState.order === 'asc' ? '↑' : '↓';
  };

  const getSortAria = (field: SortField) => {
    if (sortState.field !== field) return 'none';
    return sortState.order === 'asc' ? 'ascending' : 'descending';
  };

  const getSelectedPolicies = () => {
    return filteredPolicies.filter((p) => compareSelection[p.id]);
  };

  return (
    <div className="min-h-screen bg-paper">
      <div className="max-w-350 mx-auto px-4 md:px-6 py-10">
        {/* Header Section */}
        <div className="mb-10">
          <div className="text-xs font-mono uppercase tracking-widest text-coral mb-3">
            SEARCH THE DATABASE
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-bold text-ink mb-4">
            Explore policies.
          </h1>
          <p className="text-lg text-ink/70 max-w-2xl">
            Search by country, policy name, or topic. Use the filters to find the documents most relevant to your work.
          </p>
        </div>

        {/* Search and Filters */}
        <div className="explore-search-strip">
          <div className="search-field">
            <Search className="w-5 h-5 text-muted" />
            <input
              type="text"
              placeholder="Search policies, countries, or keywords..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-transparent border-0 outline-0 text-sm"
            />
          </div>
        </div>

        {/* Main Layout */}
        <div className="explore-layout">
          {/* Filters Sidebar */}
          <aside className="filters">
            <h3>Filter policies</h3>

            <div className="filter-block">
              <label htmlFor="countryFilter">Country</label>
              <select
                id="countryFilter"
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                className="filter-select"
              >
                <option value="">All countries</option>
                {countries.map((country) => (
                  <option key={country} value={COUNTRIES.find((c) => c.name === country)?.code || ''}>
                    {country}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-block">
              <label htmlFor="instrumentTypeFilter">Instrument Type</label>
              <select
                id="instrumentTypeFilter"
                value={selectedInstrumentType}
                onChange={(e) => setSelectedInstrumentType(e.target.value)}
                className="filter-select"
              >
                <option value="">All instrument types</option>
                {allInstrumentTypes?.map((instrumentType) => (
                  <option key={instrumentType} value={instrumentType}>
                    {instrumentType}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-block">
              <label htmlFor="statusFilter">Status</label>
              <select
                id="statusFilter"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="filter-select"
              >
                <option value="">All statuses</option>
                {allStatuses?.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-block">
              <label htmlFor="levelFilter">Government level</label>
              <select
                id="levelFilter"
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                className="filter-select"
              >
                <option value="">All levels</option>
                <option value="National">National</option>
                <option value="Subnational">Subnational</option>
              </select>
            </div>

            <div className="filter-block">
              <label htmlFor="yearFilter">Year</label>
              <select
                id="yearFilter"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="filter-select"
              >
                <option value="">All years</option>
                {years.map((year) => (
                  <option key={year} value={year?.toString() || ''}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            <button className="clear-link" onClick={clearFilters}>
              Clear all filters ↗
            </button>
          </aside>

          {/* Results */}
          <div className="results">
            {/* Results Toolbar */}
            <div className="results-toolbar">
              <div className="results-toolbar-main">
                <strong id="resultCount">
                  {filteredPolicies.length} result{filteredPolicies.length !== 1 ? 's' : ''}
                </strong>
                <p className="compare-helper">
                  <span className="compare-dot"></span>
                  Select 2 or more policies to compare
                </p>
              </div>
              <div className="result-tools">
                <span className="tiny-label">VIEW</span>
                <div className="toggle-group">
                  <button
                    id="listMode"
                    className={viewMode === 'list' ? 'active' : ''}
                    onClick={() => setViewMode('list')}
                    aria-pressed={viewMode === 'list'}
                  >
                    <List className="w-4 h-4" />
                    List
                  </button>
                  <button
                    id="tableMode"
                    className={viewMode === 'table' ? 'active' : ''}
                    onClick={() => setViewMode('table')}
                    aria-pressed={viewMode === 'table'}
                    aria-label="Table view"
                  >
                    <Grid3x3 className="w-4 h-4" />
                    Table
                  </button>
                </div>
              </div>
            </div>

            {/* Table View */}
            {viewMode === 'table' && (
              <div className="table-results">
                <div className="table-scroll" role="region" aria-label="Scrollable table of plastic policies">
                  {loading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader className="w-6 h-6 text-coral animate-spin" />
                    </div>
                  ) : filteredPolicies.length === 0 ? (
                    <div className="table-no-results">
                      No policies match your search and filters.
                    </div>
                  ) : (
                    <table className="policy-table">
                      <caption className="visually-hidden">
                        Plastic policy records matching the search and filters.
                      </caption>
                      <thead>
                        <tr>
                          <th scope="col" className="col-compare">Compare</th>
                          <th scope="col" aria-sort={getSortAria('year')}>
                            <button
                              type="button"
                              onClick={() => handleSort('year')}
                              data-sort="year"
                            >
                              Year <span className="sort-arrow">{getSortArrow('year')}</span>
                            </button>
                          </th>
                          <th scope="col" aria-sort={getSortAria('country')}>
                            <button
                              type="button"
                              onClick={() => handleSort('country')}
                              data-sort="country"
                            >
                              Country <span className="sort-arrow">{getSortArrow('country')}</span>
                            </button>
                          </th>
                          <th scope="col" className="col-policy" aria-sort={getSortAria('title')}>
                            <button
                              type="button"
                              onClick={() => handleSort('title')}
                              data-sort="title"
                            >
                              Policy / Instrument <span className="sort-arrow">{getSortArrow('title')}</span>
                            </button>
                          </th>
                          <th scope="col">Region</th>
                          <th scope="col" className="col-instrument-type">Instrument Type</th>
                          <th scope="col" aria-sort={getSortAria('level')}>
                            <button
                              type="button"
                              onClick={() => handleSort('level')}
                              data-sort="level"
                            >
                              Government Level <span className="sort-arrow">{getSortArrow('level')}</span>
                            </button>
                          </th>
                          <th scope="col" aria-sort={getSortAria('status')}>
                            <button
                              type="button"
                              onClick={() => handleSort('status')}
                              data-sort="status"
                            >
                              Status <span className="sort-arrow">{getSortArrow('status')}</span>
                            </button>
                          </th>
                          <th scope="col">Policy Date</th>
                          <th scope="col">Last Reviewed</th>
                        </tr>
                      </thead>
                      <tbody id="tableRows">
                        {filteredPolicies.map((policy) => (
                          <tr key={policy.id}>
                            <td className="checkbox-cell">
                              <input
                                type="checkbox"
                                checked={compareSelection[policy.id] || false}
                                onChange={() => handleCompareToggle(policy.id)}
                              />
                            </td>
                            <td>{policy.year || '—'}</td>
                            <td>{policy.country}</td>
                            <td className="policy-name-cell">
                              <Link href={`/policies/${policy.id}`} className="table-policy-link">
                                {policy.title}
                              </Link>
                              <span className="table-policy-small">{policy.category}</span>
                            </td>
                            <td>{policy.region || '—'}</td>
                            <td className="table-instrument-type-cell">
                              {policy.category ? (
                                <span className="table-instrument-type">
                                  {policy.category}
                                </span>
                              ) : (
                                '—'
                              )}
                            </td>
                            <td>{policy.level || '—'}</td>
                            <td>{policy.status || '—'}</td>
                            <td>{formatDate(policy.policy_date || policy.date_effective)}</td>
                            <td>{formatDate(policy.last_reviewed)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
                <p className="table-footnote">
                  Policy dates are taken from the database. Check original documents for current legal status.
                </p>
              </div>
            )}

            {/* List View */}
            {viewMode === 'list' && (
              <div className="space-y-6" style={{ paddingTop: '20px' }}>
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader className="w-6 h-6 text-coral animate-spin" />
                  </div>
                ) : filteredPolicies.length === 0 ? (
                  <div className="text-center py-12 text-muted">
                    No policies match your search and filters.
                  </div>
                ) : (
                  filteredPolicies.map((policy) => (
                    <div key={policy.id}>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', marginBottom: '12px' }}>
                        <input
                          type="checkbox"
                          checked={compareSelection[policy.id] || false}
                          onChange={() => handleCompareToggle(policy.id)}
                          style={{
                            width: '16px',
                            height: '16px',
                            minWidth: '16px',
                            cursor: 'pointer',
                            accentColor: 'var(--coral)',
                            marginTop: '3px',
                          }}
                        />
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '14px', color: '#63726b', fontFamily: 'var(--font-sans)', fontWeight: '700' }}>Select to compare</span>
                          <span style={{ fontSize: '12px', color: '#999', fontWeight: '500', fontFamily: 'var(--font-sans)' }}>Up to 4 policies</span>
                        </div>
                      </div>
                      <div className="flex gap-3 items-start">
                        <div className="flex-1">
                          <div className="flex gap-2 flex-wrap mb-3">
                            {policy.year && (
                              <span
                                style={{
                                  display: 'inline-block',
                                  padding: '6px 14px',
                                  background: '#ffe8f0',
                                  color: '#c05574',
                                  fontSize: '13px',
                                  fontWeight: '600',
                                  borderRadius: '20px',
                                  border: '1px solid #f5c5d9',
                                }}
                              >
                                {policy.year}
                              </span>
                            )}
                            {policy.country && (
                              <span
                                style={{
                                  display: 'inline-block',
                                  padding: '6px 14px',
                                  background: '#f5f2e8',
                                  color: '#2b3228',
                                  fontSize: '13px',
                                  fontWeight: '600',
                                  borderRadius: '20px',
                                  border: '1px solid #e8e3d6',
                                }}
                              >
                                {policy.country}
                              </span>
                            )}
                            {policy.region && (
                              <span
                                style={{
                                  display: 'inline-block',
                                  padding: '6px 14px',
                                  background: '#f5f2e8',
                                  color: '#2b3228',
                                  fontSize: '13px',
                                  fontWeight: '600',
                                  borderRadius: '20px',
                                  border: '1px solid #e8e3d6',
                                }}
                              >
                                {policy.region}
                              </span>
                            )}
                            {policy.level && (
                              <span
                                style={{
                                  display: 'inline-block',
                                  padding: '6px 14px',
                                  background: '#f5f2e8',
                                  color: '#2b3228',
                                  fontSize: '13px',
                                  fontWeight: '600',
                                  borderRadius: '20px',
                                  border: '1px solid #e8e3d6',
                                }}
                              >
                                {policy.level}
                              </span>
                            )}
                          </div>
                          <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1a1a1a', marginBottom: '8px', lineHeight: '1.3', fontFamily: 'var(--font-sans)' }}>
                            {policy.title}
                          </h3>
                          <p style={{ fontSize: '14px', color: '#666666', marginBottom: '12px', lineHeight: '1.5', maxWidth: '80%', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {policy.summary}
                          </p>
                          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', fontSize: '13px', color: '#63726b', marginBottom: '6px' }}>
                            <span>{formatDate(policy.policy_date || policy.date_effective)}</span>
                            <span>•</span>
                            <span>{policy.category || 'Not listed'}</span>
                            <span>•</span>
                            <Link href={`/policies/${policy.id}`} style={{ color: 'var(--coral)', fontWeight: '700', textDecoration: 'none' }}>
                              View policy ↗
                            </Link>
                          </div>
                          <p style={{ fontSize: '13px', color: '#79857e', marginTop: '4px' }}>
                            Last record review: {formatDate(policy.last_reviewed) || 'not recorded'}
                          </p>
                        </div>
                      </div>
                      <div style={{ height: '1px', background: '#dae3d8', marginTop: '16px' }} />
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Compare Bar */}
      {showCompareBar && (
        <div className="compare-bar">
          <div className="compare-bar-inner">
            <div className="compare-bar-copy">
              <strong>{selectedCount} policies selected</strong>
              <span>Choose 2 to 4 policies, then compare their details side by side.</span>
            </div>
            <div className="compare-bar-actions">
              <button
                className="px-4 py-2 rounded bg-paper/20 text-white font-semibold hover:bg-paper/30 transition"
                onClick={clearCompare}
              >
                Clear
              </button>
              <button
                className={`px-4 py-2 rounded font-semibold transition ${
                  canCompare
                    ? 'bg-coral text-white hover:bg-coral/90'
                    : 'bg-paper/20 text-white/50 cursor-not-allowed'
                }`}
                onClick={() => setShowCompareModal(true)}
                disabled={!canCompare}
              >
                Compare policies
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Compare Modal */}
      {showCompareModal && (
        <div className="compare-modal">
          <div className="compare-modal-backdrop" onClick={() => setShowCompareModal(false)} />
          <div className="compare-modal-dialog" role="dialog" aria-modal="true" aria-labelledby="compareModalTitle">
            <div className="compare-modal-head">
              <div>
                <div style={{ fontSize: '12px', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--coral)', marginBottom: '6px' }}>
                  POLICY COMPARISON
                </div>
                <h2 id="compareModalTitle" style={{ fontSize: '34px', lineHeight: '1.04', margin: '6px 0', color: '#203731' }}>
                  Compare selected policies
                </h2>
                <p style={{ margin: '0', color: '#53635b', maxWidth: '720px', marginTop: '6px' }}>
                  Compare the details recorded for each policy. Read the source documents before drawing legal conclusions.
                </p>
              </div>
              <button
                className="compare-close"
                onClick={() => setShowCompareModal(false)}
                aria-label="Close comparison"
              >
                ✕
              </button>
            </div>
            <div className="compare-modal-body">
              <div className="compare-summary">
                <p>
                  {getSelectedPolicies().length} policies selected. The table uses details from the database. Follow the links to read each policy record.
                </p>
                <button
                  type="button"
                  className="btn-secondary"
                  style={{
                    padding: '8px 16px',
                    border: '1px solid #cad4ca',
                    background: '#fffdfa',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    color: '#203731',
                    fontWeight: '600',
                    whiteSpace: 'nowrap',
                  }}
                  onClick={() => {
                    setCompareSelection({});
                    setShowCompareBar(false);
                    setShowCompareModal(false);
                  }}
                >
                  Clear selection
                </button>
              </div>
              <div className="compare-table-wrap">
                <table className="compare-table">
                  <thead>
                    <tr>
                      <th scope="col">Field</th>
                      {getSelectedPolicies().map((p) => (
                        <th key={p.id} scope="col">
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <strong style={{ fontSize: '16px', color: '#203731' }}>{p.title}</strong>
                            <span style={{ fontSize: '12px', color: '#63726b', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                              {p.country} · {p.year || 'N.D.'} · {p.type || 'Type not listed'}
                            </span>
                            <button
                              type="button"
                              style={{
                                marginTop: '8px',
                                border: 'none',
                                background: 'none',
                                padding: '0',
                                color: 'var(--coral)',
                                fontWeight: '700',
                                cursor: 'pointer',
                                fontSize: '13px',
                                textAlign: 'left',
                              }}
                              onClick={() => {
                                const newSelection = { ...compareSelection };
                                delete newSelection[p.id];
                                setCompareSelection(newSelection);
                                
                                // Close modal if less than 2 policies remain
                                const remainingCount = Object.keys(newSelection).length;
                                if (remainingCount < 2) {
                                  setShowCompareModal(false);
                                  setShowCompareBar(false);
                                }
                              }}
                            >
                              Remove
                            </button>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <th scope="row">Country</th>
                      {getSelectedPolicies().map((p) => (
                        <td key={p.id}>{p.country}</td>
                      ))}
                    </tr>
                    <tr>
                      <th scope="row">Region</th>
                      {getSelectedPolicies().map((p) => (
                        <td key={p.id}>{p.region || 'Not listed'}</td>
                      ))}
                    </tr>
                    <tr>
                      <th scope="row">Year</th>
                      {getSelectedPolicies().map((p) => (
                        <td key={p.id}>{p.year || 'N.D.'}</td>
                      ))}
                    </tr>
                    <tr>
                      <th scope="row">Government level</th>
                      {getSelectedPolicies().map((p) => (
                        <td key={p.id}>{p.level || 'Not listed'}</td>
                      ))}
                    </tr>
                    <tr>
                      <th scope="row">Status</th>
                      {getSelectedPolicies().map((p) => (
                        <td key={p.id}>{p.status || 'Not listed'}</td>
                      ))}
                    </tr>
                    <tr>
                      <th scope="row">Policy date</th>
                      {getSelectedPolicies().map((p) => (
                        <td key={p.id}>{formatDate(p.policy_date || p.date_effective) || 'Not listed'}</td>
                      ))}
                    </tr>
                    <tr>
                      <th scope="row">Instrument Type</th>
                      {getSelectedPolicies().map((p) => (
                        <td key={p.id}>
                          {p.category ? (
                            <div className="compare-cell-instrument-type">
                              {p.category}
                            </div>
                          ) : (
                            <span className="compare-empty">Not listed</span>
                          )}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <th scope="row">Summary</th>
                      {getSelectedPolicies().map((p) => (
                        <td key={p.id}>{p.summary || 'Not listed'}</td>
                      ))}
                    </tr>
                    <tr>
                      <th scope="row">Last reviewed</th>
                      {getSelectedPolicies().map((p) => (
                        <td key={p.id}>{formatDate(p.last_reviewed) || 'Not recorded'}</td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
