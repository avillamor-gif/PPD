'use client';

import { useState, useEffect } from 'react';
import { Download, X, Loader, ChevronDown } from 'lucide-react';

interface ExportFiltersProps {
  onClose: () => void;
}

interface ExportOptions {
  countries: string[];
  regions: string[];
  categories: string[];
  lifecycles: string[];
  statuses: string[];
  years: number[];
}

export function ExportModal({ onClose }: ExportFiltersProps) {
  const [loading, setLoading] = useState(false);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [options, setOptions] = useState<ExportOptions>({
    countries: [],
    regions: [],
    categories: [],
    lifecycles: [],
    statuses: [],
    years: [],
  });

  // Multi-select state
  const [selectedCountries, setSelectedCountries] = useState<Set<string>>(
    new Set()
  );
  const [selectedRegions, setSelectedRegions] = useState<Set<string>>(
    new Set()
  );
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(
    new Set()
  );
  const [selectedLifecycles, setSelectedLifecycles] = useState<Set<string>>(
    new Set()
  );
  const [selectedStatuses, setSelectedStatuses] = useState<Set<string>>(
    new Set()
  );
  const [selectedYears, setSelectedYears] = useState<Set<number>>(new Set());
  const [search, setSearch] = useState('');

  // Dropdown open state
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [searchFilters, setSearchFilters] = useState({
    countries: '',
    regions: '',
    categories: '',
    lifecycles: '',
    statuses: '',
    years: '',
  });

  // Fetch available options from database
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const response = await fetch('/api/policies/export-options');
        if (response.ok) {
          const data = await response.json();
          setOptions(data);
        }
      } catch (err) {
        console.error('Error fetching export options:', err);
        setError('Failed to load filter options');
      } finally {
        setOptionsLoading(false);
      }
    };
    fetchOptions();
  }, []);

  const toggle = (set: Set<any>, value: any) => {
    const newSet = new Set(set);
    if (newSet.has(value)) {
      newSet.delete(value);
    } else {
      newSet.add(value);
    }
    return newSet;
  };

  const handleExport = async () => {
    try {
      setError(null);
      setLoading(true);

      // Build query parameters - only add if selections exist
      const params = new URLSearchParams();

      // Add multiple countries
      if (selectedCountries.size > 0) {
        selectedCountries.forEach((c) => params.append('countries', c));
      }

      // Add multiple levels/regions
      if (selectedRegions.size > 0) {
        selectedRegions.forEach((l) => params.append('regions', l));
      }

      // Add multiple categories
      if (selectedCategories.size > 0) {
        selectedCategories.forEach((c) => params.append('categories', c));
      }

      // Add multiple lifecycles
      if (selectedLifecycles.size > 0) {
        selectedLifecycles.forEach((l) => params.append('lifecycles', l));
      }

      // Add multiple statuses
      if (selectedStatuses.size > 0) {
        selectedStatuses.forEach((s) => params.append('statuses', s));
      }

      // Add multiple years
      if (selectedYears.size > 0) {
        Array.from(selectedYears)
          .sort((a, b) => b - a)
          .forEach((y) => params.append('years', y.toString()));
      }

      // Add search
      if (search) {
        params.append('search', search);
      }

      const url = `/api/policies/export?${params.toString()}`;

      // Trigger download
      const response = await fetch(url);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to generate export');
      }

      // Create blob and download
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `policies_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setLoading(false);
    }
  };

  const MultiSelect = ({
    label,
    items,
    selected,
    onToggle,
    searchKey,
  }: {
    label: string;
    items: (string | number)[];
    selected: Set<string | number>;
    onToggle: (value: string | number) => void;
    searchKey: keyof typeof searchFilters;
  }) => {
    const isOpen = openDropdown === searchKey;
    const searchValue = searchFilters[searchKey];
    const filtered = items.filter((item) =>
      item.toString().toLowerCase().includes(searchValue.toLowerCase())
    );

    return (
      <div className="relative">
        <button
          onClick={() => setOpenDropdown(isOpen ? null : searchKey)}
          className="w-full px-3 py-2 rounded-lg border border-ink/20 bg-white text-left text-sm flex items-center justify-between hover:border-ocean focus:border-ocean focus:outline-none focus:ring-2 focus:ring-ocean/20 transition"
        >
          <span className="text-ink">
            {selected.size > 0 ? (
              <span className="font-medium">
                {label} <span className="text-ocean">({selected.size})</span>
              </span>
            ) : (
              <span className="text-ink/60">{label}</span>
            )}
          </span>
          <ChevronDown
            className={`w-4 h-4 text-ink/40 transition ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-ink/20 rounded-lg shadow-lg z-50">
            <input
              type="text"
              placeholder="Search..."
              value={searchValue}
              onChange={(e) =>
                setSearchFilters({ ...searchFilters, [searchKey]: e.target.value })
              }
              className="w-full px-3 py-2 border-b border-ink/10 focus:outline-none text-sm"
              autoFocus
            />
            <div className="max-h-40 overflow-y-auto">
              {filtered.length === 0 ? (
                <div className="px-3 py-2 text-sm text-ink/60">No options</div>
              ) : (
                filtered.map((item) => (
                  <label
                    key={item}
                    className="flex items-center gap-2 px-3 py-2 hover:bg-sand/20 cursor-pointer transition text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={selected.has(item)}
                      onChange={() => onToggle(item)}
                      className="w-4 h-4 cursor-pointer accent-ocean rounded"
                    />
                    <span>{item}</span>
                  </label>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-paper rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between p-6 border-b border-rule bg-paper">
          <h2 className="text-2xl font-bold text-ink flex items-center gap-2">
            <Download className="w-6 h-6" />
            Export Policies
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-sand/20 rounded-lg transition"
          >
            <X className="w-5 h-5 text-ink/60" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="p-4 rounded-lg bg-coral/10 border border-coral/20 text-coral text-sm">
              {error}
            </div>
          )}

          {optionsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader className="w-6 h-6 animate-spin text-ocean" />
            </div>
          ) : (
            <>
              {/* Search */}
              <div>
                <label className="block text-sm font-medium text-ink mb-2">
                  Keywords
                </label>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by title, summary, or keywords…"
                  className="w-full px-3 py-2 rounded-lg border border-ink/20 bg-white focus:border-ocean focus:outline-none focus:ring-2 focus:ring-ocean/20 transition text-sm"
                />
              </div>

              {/* Filters - Multi-select dropdowns */}
              {options.countries.length > 0 && (
                <MultiSelect
                  label="Countries"
                  items={options.countries}
                  selected={selectedCountries}
                  onToggle={(val) => setSelectedCountries(toggle(selectedCountries, val))}
                  searchKey="countries"
                />
              )}

              {options.regions.length > 0 && (
                <MultiSelect
                  label="Region"
                  items={options.regions}
                  selected={selectedRegions}
                  onToggle={(val) => setSelectedRegions(toggle(selectedRegions, val))}
                  searchKey="regions"
                />
              )}

              {options.categories.length > 0 && (
                <MultiSelect
                  label="Instrument Type"
                  items={options.categories}
                  selected={selectedCategories}
                  onToggle={(val) => setSelectedCategories(toggle(selectedCategories, val))}
                  searchKey="categories"
                />
              )}

              {options.lifecycles.length > 0 && (
                <MultiSelect
                  label="Lifecycle Stage"
                  items={options.lifecycles}
                  selected={selectedLifecycles}
                  onToggle={(val) => setSelectedLifecycles(toggle(selectedLifecycles, val))}
                  searchKey="lifecycles"
                />
              )}

              {options.statuses.length > 0 && (
                <MultiSelect
                  label="Status"
                  items={options.statuses}
                  selected={selectedStatuses}
                  onToggle={(val) => setSelectedStatuses(toggle(selectedStatuses, val))}
                  searchKey="statuses"
                />
              )}

              {options.years.length > 0 && (
                <MultiSelect
                  label="Year"
                  items={options.years}
                  selected={selectedYears}
                  onToggle={(val) => setSelectedYears(toggle(selectedYears, val as number))}
                  searchKey="years"
                />
              )}

              {/* Summary */}
              {(selectedCountries.size > 0 ||
                selectedRegions.size > 0 ||
                selectedCategories.size > 0 ||
                selectedLifecycles.size > 0 ||
                selectedStatuses.size > 0 ||
                selectedYears.size > 0 ||
                search) && (
                <div className="p-3 rounded-lg bg-ocean/10 border border-ocean/20 text-sm text-ink">
                  <strong>Filters:</strong> {selectedCountries.size > 0 && `${selectedCountries.size} countries`}
                  {selectedCountries.size > 0 && selectedRegions.size > 0 && ', '}
                  {selectedRegions.size > 0 && `${selectedRegions.size} regions`}
                  {(selectedCountries.size > 0 || selectedRegions.size > 0) && selectedCategories.size > 0 && ', '}
                  {selectedCategories.size > 0 && `${selectedCategories.size} categories`}
                  {(selectedCountries.size > 0 || selectedRegions.size > 0 || selectedCategories.size > 0) && selectedStatuses.size > 0 && ', '}
                  {selectedStatuses.size > 0 && `${selectedStatuses.size} statuses`}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 flex gap-3 p-6 border-t border-rule bg-paper">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 rounded-lg border border-ink/20 text-ink hover:bg-sand/10 transition font-medium text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={loading || optionsLoading}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-ocean text-white hover:bg-ocean-deep disabled:opacity-50 disabled:cursor-not-allowed transition font-medium text-sm"
          >
            {loading ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                Generating…
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Download Excel
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
