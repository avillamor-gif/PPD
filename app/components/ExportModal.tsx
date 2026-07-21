'use client';

import { useState, useEffect } from 'react';
import { Download, X, Loader } from 'lucide-react';

interface ExportFiltersProps {
  onClose: () => void;
}

interface ExportOptions {
  countries: string[];
  levels: string[];
  categories: string[];
  lifecycles: string[];
  years: number[];
}

export function ExportModal({ onClose }: ExportFiltersProps) {
  const [loading, setLoading] = useState(false);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [options, setOptions] = useState<ExportOptions>({
    countries: [],
    levels: [],
    categories: [],
    lifecycles: [],
    years: [],
  });

  // Multi-select state
  const [selectedCountries, setSelectedCountries] = useState<Set<string>>(
    new Set()
  );
  const [selectedLevels, setSelectedLevels] = useState<Set<string>>(
    new Set()
  );
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(
    new Set()
  );
  const [selectedLifecycles, setSelectedLifecycles] = useState<Set<string>>(
    new Set()
  );
  const [selectedYears, setSelectedYears] = useState<Set<number>>(new Set());
  const [search, setSearch] = useState('');

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

  const toggleCountry = (country: string | number) => {
    const newSet = new Set(selectedCountries);
    if (newSet.has(country as string)) {
      newSet.delete(country as string);
    } else {
      newSet.add(country as string);
    }
    setSelectedCountries(newSet);
  };

  const toggleLevel = (level: string | number) => {
    const newSet = new Set(selectedLevels);
    if (newSet.has(level as string)) {
      newSet.delete(level as string);
    } else {
      newSet.add(level as string);
    }
    setSelectedLevels(newSet);
  };

  const toggleCategory = (category: string | number) => {
    const newSet = new Set(selectedCategories);
    if (newSet.has(category as string)) {
      newSet.delete(category as string);
    } else {
      newSet.add(category as string);
    }
    setSelectedCategories(newSet);
  };

  const toggleLifecycle = (lifecycle: string | number) => {
    const newSet = new Set(selectedLifecycles);
    if (newSet.has(lifecycle as string)) {
      newSet.delete(lifecycle as string);
    } else {
      newSet.add(lifecycle as string);
    }
    setSelectedLifecycles(newSet);
  };

  const toggleYear = (year: string | number) => {
    const numYear = typeof year === 'string' ? parseInt(year) : year;
    const newSet = new Set(selectedYears);
    if (newSet.has(numYear)) {
      newSet.delete(numYear);
    } else {
      newSet.add(numYear);
    }
    setSelectedYears(newSet);
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

      // Add multiple levels
      if (selectedLevels.size > 0) {
        selectedLevels.forEach((l) => params.append('levels', l));
      }

      // Add multiple categories
      if (selectedCategories.size > 0) {
        selectedCategories.forEach((c) => params.append('categories', c));
      }

      // Add multiple lifecycles
      if (selectedLifecycles.size > 0) {
        selectedLifecycles.forEach((l) => params.append('lifecycles', l));
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

  const CheckboxGroup = ({
    title,
    items,
    selected,
    onToggle,
  }: {
    title: string;
    items: (string | number)[];
    selected: Set<string | number>;
    onToggle: (item: string | number) => void;
  }) => (
    <div>
      <label className="block text-sm font-medium text-ink mb-3">
        {title} {selected.size > 0 && <span className="text-ocean">({selected.size})</span>}
      </label>
      <div className="space-y-2 max-h-48 overflow-y-auto p-3 rounded-lg border border-ink/10 bg-white">
        {items.length === 0 ? (
          <p className="text-sm text-ink/60">No options available</p>
        ) : (
          items.map((item) => (
            <label
              key={item}
              className="flex items-center gap-2 cursor-pointer hover:bg-sand/20 p-2 rounded transition"
            >
              <input
                type="checkbox"
                checked={selected.has(item)}
                onChange={() => onToggle(item)}
                className="w-4 h-4 cursor-pointer accent-ocean rounded"
              />
              <span className="text-sm text-ink">{item}</span>
            </label>
          ))
        )}
      </div>
    </div>
  );

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
        <div className="p-6 space-y-6">
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
                  className="w-full px-3 py-2 rounded-lg border border-ink/20 bg-white focus:border-ocean focus:outline-none focus:ring-2 focus:ring-ocean/20 transition"
                />
              </div>

              {/* Filters Grid */}
              <div className="grid grid-cols-2 gap-6">
                {/* Countries */}
                {options.countries.length > 0 && (
                  <CheckboxGroup
                    title="Countries"
                    items={options.countries}
                    selected={selectedCountries}
                    onToggle={toggleCountry}
                  />
                )}

                {/* Levels */}
                {options.levels.length > 0 && (
                  <CheckboxGroup
                    title="Region/Level"
                    items={options.levels}
                    selected={selectedLevels}
                    onToggle={toggleLevel}
                  />
                )}

                {/* Categories */}
                {options.categories.length > 0 && (
                  <CheckboxGroup
                    title="Instrument Type"
                    items={options.categories}
                    selected={selectedCategories}
                    onToggle={toggleCategory}
                  />
                )}

                {/* Lifecycles */}
                {options.lifecycles.length > 0 && (
                  <CheckboxGroup
                    title="Lifecycle Stage"
                    items={options.lifecycles}
                    selected={selectedLifecycles}
                    onToggle={toggleLifecycle}
                  />
                )}

                {/* Years */}
                {options.years.length > 0 && (
                  <CheckboxGroup
                    title="Year"
                    items={options.years}
                    selected={selectedYears}
                    onToggle={toggleYear}
                  />
                )}
              </div>

              {/* Summary */}
              {(selectedCountries.size > 0 ||
                selectedLevels.size > 0 ||
                selectedCategories.size > 0 ||
                selectedLifecycles.size > 0 ||
                selectedYears.size > 0 ||
                search) && (
                <div className="p-3 rounded-lg bg-ocean/10 border border-ocean/20 text-sm text-ink">
                  <strong>Filters selected:</strong> {selectedCountries.size} countries,{' '}
                  {selectedLevels.size} levels, {selectedCategories.size} categories,{' '}
                  {selectedLifecycles.size} lifecycles, {selectedYears.size} years
                  {search && `, searching for "${search}"`}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 flex gap-3 p-6 border-t border-rule bg-paper">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 rounded-lg border border-ink/20 text-ink hover:bg-sand/10 transition font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={loading || optionsLoading}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-ocean text-white hover:bg-ocean-deep disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
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
