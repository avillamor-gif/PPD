'use client';

import { useState } from 'react';
import { Download, X } from 'lucide-react';

interface ExportFiltersProps {
  onClose: () => void;
}

export function ExportModal({ onClose }: ExportFiltersProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [country, setCountry] = useState('');
  const [region, setRegion] = useState('');
  const [year, setYear] = useState('');
  const [category, setCategory] = useState('');
  const [lifecycle, setLifecycle] = useState('');
  const [search, setSearch] = useState('');

  // Available options
  const countries = [
    'AU', 'CA', 'CN', 'EU', 'GB', 'IN', 'JP', 'KR', 'MX', 'US', 'VN',
  ];

  const regions = [
    'National',
    'Sub-national',
    'Regional',
    'International',
  ];

  const categories = [
    'Plastic Ban',
    'Extended Producer Responsibility',
    'Tax/Levy',
    'Waste Management',
    'Other',
  ];

  const lifecycleStages = [
    'Upstream',
    'Midstream',
    'Downstream',
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 30 }, (_, i) => currentYear - i);

  const handleExport = async () => {
    try {
      setError(null);
      setLoading(true);

      // Build query parameters
      const params = new URLSearchParams();
      if (country) params.append('country', country);
      if (region) params.append('region', region);
      if (year) params.append('year', year);
      if (category) params.append('category', category);
      if (lifecycle) params.append('lifecycle', lifecycle);
      if (search) params.append('search', search);

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

          {/* Filters Grid */}
          <div className="grid grid-cols-2 gap-6">
            {/* Country */}
            <div>
              <label className="block text-sm font-medium text-ink mb-2">
                Country
              </label>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-ink/20 bg-white focus:border-ocean focus:outline-none focus:ring-2 focus:ring-ocean/20 transition"
              >
                <option value="">All Countries</option>
                {countries.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Region */}
            <div>
              <label className="block text-sm font-medium text-ink mb-2">
                Region/Level
              </label>
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-ink/20 bg-white focus:border-ocean focus:outline-none focus:ring-2 focus:ring-ocean/20 transition"
              >
                <option value="">All Levels</option>
                {regions.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            {/* Year */}
            <div>
              <label className="block text-sm font-medium text-ink mb-2">
                Year
              </label>
              <select
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-ink/20 bg-white focus:border-ocean focus:outline-none focus:ring-2 focus:ring-ocean/20 transition"
              >
                <option value="">All Years</option>
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-ink mb-2">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-ink/20 bg-white focus:border-ocean focus:outline-none focus:ring-2 focus:ring-ocean/20 transition"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Lifecycle Stage */}
            <div>
              <label className="block text-sm font-medium text-ink mb-2">
                Lifecycle Stage
              </label>
              <select
                value={lifecycle}
                onChange={(e) => setLifecycle(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-ink/20 bg-white focus:border-ocean focus:outline-none focus:ring-2 focus:ring-ocean/20 transition"
              >
                <option value="">All Stages</option>
                {lifecycleStages.map((stage) => (
                  <option key={stage} value={stage}>
                    {stage}
                  </option>
                ))}
              </select>
            </div>

            {/* Search Keywords */}
            <div>
              <label className="block text-sm font-medium text-ink mb-2">
                Search Keywords
              </label>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Policy title or keywords..."
                className="w-full px-3 py-2 rounded-lg border border-ink/20 bg-white focus:border-ocean focus:outline-none focus:ring-2 focus:ring-ocean/20 transition"
              />
            </div>
          </div>

          {/* Info */}
          <div className="p-4 rounded-lg bg-sand/20 border border-sand/40">
            <p className="text-sm text-ink/70">
              📊 The exported Excel file will contain all matching policies with beautiful formatting, headers frozen for easy navigation, and alternating row colors for readability.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 flex gap-3 p-6 border-t border-rule bg-paper">
          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-lg border border-ink/20 text-ink hover:bg-ink/5 transition font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={loading}
            className="flex-1 py-3 px-4 rounded-lg bg-ocean text-paper hover:bg-ocean-deep disabled:opacity-50 transition font-medium flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            {loading ? 'Generating...' : 'Export as Excel'}
          </button>
        </div>
      </div>
    </div>
  );
}
