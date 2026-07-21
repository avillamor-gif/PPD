'use client';

import { useState, useEffect } from 'react';
import { Download, X, Loader, ChevronDown } from 'lucide-react';

interface ExportFiltersProps {
  onClose: () => void;
}

interface ExportOptions {
  countries: string[];
  regions: string[];
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
    statuses: [],
    years: [],
  });

  // Multi-select state
  const [selectedCountries, setSelectedCountries] = useState<Set<string>>(
    new Set(options.countries)
  );
  const [selectedRegions, setSelectedRegions] = useState<Set<string>>(
    new Set(options.regions)
  );
  const [selectedStatuses, setSelectedStatuses] = useState<Set<string>>(
    new Set(options.statuses)
  );
  const [selectedYears, setSelectedYears] = useState<Set<number>>(
    new Set(options.years)
  );
  const [search, setSearch] = useState('');

  // Dropdown open state
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [searchFilters, setSearchFilters] = useState({
    countries: '',
    regions: '',
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

  // Update selected filters when options load
  useEffect(() => {
    if (options.countries.length > 0) {
      setSelectedCountries(new Set(options.countries));
    }
    if (options.regions.length > 0) {
      setSelectedRegions(new Set(options.regions));
    }
    if (options.statuses.length > 0) {
      setSelectedStatuses(new Set(options.statuses));
    }
    if (options.years.length > 0) {
      setSelectedYears(new Set(options.years));
    }
  }, [options]);

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

      const url = `/api/policies/export?${params.toString()}`;

      console.log('📤 [EXPORT] Sending request with URL:', url);
      console.log('📤 [EXPORT] Credentials: include');

      // Trigger download with auth credentials
      const response = await fetch(url, {
        credentials: 'include', // Include cookies for authentication
      });

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
    allItems,
  }: {
    label: string;
    items: (string | number)[];
    selected: Set<string | number>;
    onToggle: (value: string | number) => void;
    searchKey: keyof typeof searchFilters;
    allItems: (string | number)[];
  }) => {
    const isOpen = openDropdown === searchKey;
    const searchValue = searchFilters[searchKey];
    const filtered = items.filter((item) =>
      item.toString().toLowerCase().includes(searchValue.toLowerCase())
    );
    
    const allSelected = allItems.length > 0 && selected.size === allItems.length;
    
    const handleSelectAll = () => {
      if (allSelected) {
        // Deselect all
        allItems.forEach(item => {
          if (selected.has(item)) {
            onToggle(item);
          }
        });
      } else {
        // Select all
        allItems.forEach(item => {
          if (!selected.has(item)) {
            onToggle(item);
          }
        });
      }
    };

    return (
      <div className="relative">
        <button
          onClick={() => setOpenDropdown(isOpen ? null : searchKey)}
          className="w-full px-3 py-2 rounded-lg border border-ink/20 bg-white text-left text-sm flex items-center justify-between hover:border-ocean focus:border-ocean focus:outline-none focus:ring-2 focus:ring-ocean/20 transition"
        >
          <span className="text-ink">
            {allSelected ? (
              <span className="font-medium">{label}</span>
            ) : (
              <span className="font-medium">
                {label} <span className="text-ocean">({selected.size}/{allItems.length})</span>
              </span>
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
            <div className="p-2 border-b border-ink/10">
              <button
                onClick={handleSelectAll}
                className="w-full px-2 py-1 text-left text-sm font-medium text-ocean hover:bg-ocean/10 rounded transition"
              >
                {allSelected ? '✓ All selected' : 'Select all'}
              </button>
            </div>
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
              {/* Filters - Multi-select dropdowns */}
              {options.countries.length > 0 && (
                <MultiSelect
                  label="All Countries"
                  items={options.countries}
                  selected={selectedCountries}
                  onToggle={(val) => setSelectedCountries(toggle(selectedCountries, val))}
                  searchKey="countries"
                  allItems={options.countries}
                />
              )}

              {options.regions.length > 0 && (
                <MultiSelect
                  label="All Regions"
                  items={options.regions}
                  selected={selectedRegions}
                  onToggle={(val) => setSelectedRegions(toggle(selectedRegions, val))}
                  searchKey="regions"
                  allItems={options.regions}
                />
              )}

              {options.statuses.length > 0 && (
                <MultiSelect
                  label="All Statuses"
                  items={options.statuses}
                  selected={selectedStatuses}
                  onToggle={(val) => setSelectedStatuses(toggle(selectedStatuses, val))}
                  searchKey="statuses"
                  allItems={options.statuses}
                />
              )}

              {options.years.length > 0 && (
                <MultiSelect
                  label="All Years"
                  items={options.years}
                  selected={selectedYears}
                  onToggle={(val) => setSelectedYears(toggle(selectedYears, val as number))}
                  searchKey="years"
                  allItems={options.years}
                />
              )}

              {/* Summary */}
              {(selectedCountries.size < options.countries.length ||
                selectedRegions.size < options.regions.length ||
                selectedStatuses.size < options.statuses.length ||
                selectedYears.size < options.years.length) && (
                <div className="p-3 rounded-lg bg-ocean/10 border border-ocean/20 text-sm text-ink">
                  <strong>Filters:</strong> {selectedCountries.size < options.countries.length && `${selectedCountries.size}/${options.countries.length} countries`}
                  {selectedCountries.size < options.countries.length && selectedRegions.size < options.regions.length && ', '}
                  {selectedRegions.size < options.regions.length && `${selectedRegions.size}/${options.regions.length} regions`}
                  {(selectedCountries.size < options.countries.length || selectedRegions.size < options.regions.length) && selectedStatuses.size < options.statuses.length && ', '}
                  {selectedStatuses.size < options.statuses.length && `${selectedStatuses.size}/${options.statuses.length} statuses`}
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
