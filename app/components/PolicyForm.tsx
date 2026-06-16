'use client';

import { useState } from 'react';
import { COUNTRIES, REGIONS, THEMES, STATUSES } from '@/lib/constants';
import type { Policy, PolicyLevel, PolicyStatus } from '@/lib/types';

const LEVELS: PolicyLevel[] = ['National', 'Sub-national', 'Regional', 'International'];

export interface PolicyFormProps {
  initialData?: Policy;
  isEditing?: boolean;
  onSuccess?: () => void;
}

export function PolicyForm({ initialData, isEditing = false, onSuccess }: PolicyFormProps) {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    summary: initialData?.summary || '',
    enactmentDate: initialData?.year ? `${initialData.year}-01-01` : new Date().toISOString().split('T')[0],
    region: '',
    country: initialData?.country || '',
    level: (initialData?.level || 'National') as PolicyLevel,
    category: initialData?.category || '',
    keywords: '',
    status: (initialData?.status || 'Proposed') as PolicyStatus,
    instrument: initialData?.instrument || '',
    authority: initialData?.authority || '',
    link: initialData?.link || '',
    otherLinks: '',
    language: initialData?.language || '',
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    
    if (name === 'region') {
      // When region changes, reset country to empty
      setFormData((prev) => ({
        ...prev,
        region: value,
        country: '',
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  // Filter countries by selected region
  const filteredCountries = formData.region
    ? COUNTRIES.filter((c) => c.region === formData.region)
    : COUNTRIES;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Validation
      if (!formData.title.trim()) throw new Error('Policy title is required');
      if (!formData.country) throw new Error('Country is required');
      if (!formData.category) throw new Error('Themes is required');
      if (!formData.authority.trim()) throw new Error('Authority is required');
      if (!formData.link.trim()) throw new Error('Policy link is required');

      // Validate URL
      try {
        new URL(formData.link);
      } catch {
        throw new Error('Please enter a valid URL');
      }

      // Make API call
      const method = isEditing ? 'PUT' : 'POST';
      const url = isEditing ? `/api/policies/${initialData?.id}` : '/api/policies';
      
      // Extract year from enactmentDate for API compatibility
      const year = parseInt(formData.enactmentDate.split('-')[0], 10);
      const apiData = {
        ...formData,
        year,
      };
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apiData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to submit policy');
      }

      setSubmitted(true);
      
      // Reset form only on create, not on edit
      if (!isEditing) {
        setFormData({
          title: '',
          summary: '',
          enactmentDate: new Date().toISOString().split('T')[0],
          region: '',
          country: '',
          level: 'National',
          category: '',
          keywords: '',
          status: 'Proposed',
          instrument: '',
          authority: '',
          link: '',
          otherLinks: '',
          language: '',
        });
      }

      // Call callback or redirect after 2 seconds
      setTimeout(() => {
        if (onSuccess) {
          onSuccess();
        } else {
          setSubmitted(false);
        }
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Success Message */}
      {submitted && (
        <div className="rounded-lg border border-ocean/30 bg-ocean/5 p-4">
          <p className="font-medium text-ocean">✓ Policy {isEditing ? 'updated' : 'submitted'} successfully!</p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="rounded-lg border border-coral/30 bg-coral/5 p-4">
          <p className="font-medium text-coral">✗ {error}</p>
        </div>
      )}

      {/* Basic Information */}
      <div className="rounded-2xl border border-ink/10 bg-card p-8">
        <h2 className="font-display text-2xl font-bold text-ink mb-6">Basic Information</h2>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-ink mb-2">Policy Title *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g., Single-Use Plastics Regulation Bill"
              className="w-full rounded-lg border border-ink/20 bg-paper px-4 py-2 text-ink placeholder:text-ink/40 focus:border-ocean focus:outline-none focus:ring-2 focus:ring-ocean/20"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-2">Summary</label>
            <textarea
              name="summary"
              value={formData.summary}
              onChange={handleChange}
              placeholder="Brief description of the policy..."
              rows={4}
              className="w-full rounded-lg border border-ink/20 bg-paper px-4 py-2 text-ink placeholder:text-ink/40 focus:border-ocean focus:outline-none focus:ring-2 focus:ring-ocean/20"
            />
          </div>
        </div>
      </div>

      {/* Policy Details */}
      <div className="rounded-2xl border border-ink/10 bg-card p-8">
        <h2 className="font-display text-2xl font-bold text-ink mb-6">Policy Details</h2>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-ink mb-2">Region</label>
            <select
              name="region"
              value={formData.region}
              onChange={handleChange}
              className="w-full rounded-lg border border-ink/20 bg-paper px-4 py-2 text-ink focus:border-ocean focus:outline-none focus:ring-2 focus:ring-ocean/20"
            >
              <option value="">Select a region...</option>
              {REGIONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-2">Country *</label>
            <select
              name="country"
              value={formData.country}
              onChange={handleChange}
              className="w-full rounded-lg border border-ink/20 bg-paper px-4 py-2 text-ink focus:border-ocean focus:outline-none focus:ring-2 focus:ring-ocean/20"
            >
              <option value="">Select a country...</option>
              {filteredCountries.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name} ({c.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-2">Date of Enactment or Commencement</label>
            <input
              type="date"
              name="enactmentDate"
              value={formData.enactmentDate}
              onChange={handleChange}
              className="w-full rounded-lg border border-ink/20 bg-paper px-4 py-2 text-ink focus:border-ocean focus:outline-none focus:ring-2 focus:ring-ocean/20"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-2">Themes *</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full rounded-lg border border-ink/20 bg-paper px-4 py-2 text-ink focus:border-ocean focus:outline-none focus:ring-2 focus:ring-ocean/20"
            >
              <option value="">Select themes...</option>
              {THEMES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-2">Keywords</label>
            <input
              type="text"
              name="keywords"
              value={formData.keywords}
              onChange={handleChange}
              placeholder="e.g., plastic ban, single-use, recyclable"
              className="w-full rounded-lg border border-ink/20 bg-paper px-4 py-2 text-ink placeholder:text-ink/40 focus:border-ocean focus:outline-none focus:ring-2 focus:ring-ocean/20"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-2">Level</label>
            <select
              name="level"
              value={formData.level}
              onChange={handleChange}
              className="w-full rounded-lg border border-ink/20 bg-paper px-4 py-2 text-ink focus:border-ocean focus:outline-none focus:ring-2 focus:ring-ocean/20"
            >
              {LEVELS.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-2">Status</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full rounded-lg border border-ink/20 bg-paper px-4 py-2 text-ink focus:border-ocean focus:outline-none focus:ring-2 focus:ring-ocean/20"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-2">Instrument Type</label>
            <input
              type="text"
              name="instrument"
              value={formData.instrument}
              onChange={handleChange}
              placeholder="e.g., Act, Bill, Regulation, Directive"
              className="w-full rounded-lg border border-ink/20 bg-paper px-4 py-2 text-ink placeholder:text-ink/40 focus:border-ocean focus:outline-none focus:ring-2 focus:ring-ocean/20"
            />
          </div>
        </div>
      </div>

      {/* Authority & Links */}
      <div className="rounded-2xl border border-ink/10 bg-card p-8">
        <h2 className="font-display text-2xl font-bold text-ink mb-6">Authority & References</h2>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-ink mb-2">Competent Authority *</label>
            <input
              type="text"
              name="authority"
              value={formData.authority}
              onChange={handleChange}
              placeholder="e.g., Ministry of Environment, National Agency..."
              className="w-full rounded-lg border border-ink/20 bg-paper px-4 py-2 text-ink placeholder:text-ink/40 focus:border-ocean focus:outline-none focus:ring-2 focus:ring-ocean/20"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-2">Official Policy Link *</label>
            <input
              type="url"
              name="link"
              value={formData.link}
              onChange={handleChange}
              placeholder="https://..."
              className="w-full rounded-lg border border-ink/20 bg-paper px-4 py-2 text-ink placeholder:text-ink/40 focus:border-ocean focus:outline-none focus:ring-2 focus:ring-ocean/20"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-2">Other Links</label>
            <input
              type="text"
              name="otherLinks"
              value={formData.otherLinks}
              onChange={handleChange}
              placeholder="e.g., https://example.com/related, https://example.com/docs"
              className="w-full rounded-lg border border-ink/20 bg-paper px-4 py-2 text-ink placeholder:text-ink/40 focus:border-ocean focus:outline-none focus:ring-2 focus:ring-ocean/20"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-2">Language</label>
            <input
              type="text"
              name="language"
              value={formData.language}
              onChange={handleChange}
              placeholder="e.g., English, Japanese, Vietnamese"
              className="w-full rounded-lg border border-ink/20 bg-paper px-4 py-2 text-ink placeholder:text-ink/40 focus:border-ocean focus:outline-none focus:ring-2 focus:ring-ocean/20"
            />
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-full bg-ink px-8 py-3 font-mono text-sm uppercase tracking-[0.18em] text-paper transition hover:bg-ocean-deep disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (isEditing ? 'Updating...' : 'Submitting...') : (isEditing ? 'Update Policy' : 'Submit Policy')} →
        </button>
        {!isEditing && (
          <button
            type="reset"
            onClick={() => setFormData({
              title: '', summary: '', enactmentDate: new Date().toISOString().split('T')[0],
              region: '', country: '', level: 'National', category: '', keywords: '', status: 'Proposed',
              instrument: '', authority: '', link: '', otherLinks: '', language: '',
            })}
            className="inline-flex items-center gap-2 rounded-full border border-ink/30 px-8 py-3 font-mono text-sm uppercase tracking-[0.18em] text-ink transition hover:bg-ink/5"
          >
            Clear Form
          </button>
        )}
      </div>

      <p className="text-xs text-ink/60">* Required fields.</p>
    </form>
  );
}
