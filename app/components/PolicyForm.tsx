'use client';

import { useState } from 'react';
import { COUNTRIES, REGIONS, INSTRUMENT_TYPES, LIFECYCLE_STAGES, STATUSES } from '@/lib/constants';
import { MultiSelectDropdown } from './MultiSelectDropdown';
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
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Convert snake_case from database to camelCase for form
  const getOtherLinks = () => {
    if (!initialData) return '';
    // Handle both camelCase (from form submission) and snake_case (from database)
    return (initialData as any).otherLinks || (initialData as any).other_links || '';
  };

  const getCommencementDate = () => {
    if (!initialData) return '';

    const explicitDate =
      (initialData as any).commencementDate || (initialData as any).commencement_date;

    if (typeof explicitDate === 'string' && explicitDate) {
      return explicitDate.slice(0, 10);
    }

    if (initialData?.year) {
      return `${initialData.year}-01-01`;
    }

    return '';
  };

  // Parse instrument types from comma-separated string
  const getInstrumentTypes = () => {
    if (!initialData?.category) return [];
    return initialData.category.split(',').map((item: string) => item.trim());
  };

  // Parse lifecycle stages from metadata or keywords field
  const getLifecycleStages = (): string[] => {
    if (!initialData) return [];
    // For now, lifecycle stages are stored in a separate field in the future
    // or as part of keywords - adjust as needed based on database schema
    return [];
  };

  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    summary: initialData?.summary || '',
    commencementDate: getCommencementDate(),
    region: '',
    country: initialData?.country || '',
    level: (initialData?.level || 'National') as PolicyLevel,
    instrumentTypes: getInstrumentTypes(),
    lifecycleStages: getLifecycleStages(),
    keywords: '',
    status: (initialData?.status || 'Unknown') as PolicyStatus,
    authority: initialData?.authority || '',
    link: initialData?.link || '',
    otherLinks: getOtherLinks(),
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
    setFieldErrors({});
    setLoading(true);

    try {
      // Validation
      if (!formData.title.trim()) throw new Error('Legislation/Regulation is required');
      if (!formData.country) throw new Error('Country is required');
      if (formData.instrumentTypes.length === 0) throw new Error('Instrument Type is required (select at least one)');
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
      
      // Extract only the fields that should be sent to the API
      // Remove 'region' since it's only for UI filtering, not stored in database
      const { region, instrumentTypes, lifecycleStages, ...dataToSend } = formData;

      const yearFromDate = dataToSend.commencementDate
        ? parseInt(dataToSend.commencementDate.slice(0, 4), 10)
        : undefined;
      
      const apiData = {
        ...dataToSend,
        category: instrumentTypes.join(', '), // Convert array to comma-separated string
        lifecycle_stage: lifecycleStages.join(', '), // Convert array to comma-separated string
        year: yearFromDate,
      };
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apiData),
      });

      if (!response.ok) {
        const data = await response.json();
        
        // Handle validation errors from API
        if (data.errors && Array.isArray(data.errors)) {
          const errorMap: Record<string, string> = {};
          const errorMessages: string[] = [];
          
          data.errors.forEach((err: { field: string; message: string }) => {
            errorMap[err.field] = err.message;
            errorMessages.push(err.message);
          });
          
          setFieldErrors(errorMap);
          throw new Error(errorMessages.join('; '));
        }
        
        // Handle generic error response
        throw new Error(data.error || 'Failed to submit policy');
      }

      setSubmitted(true);
      
      // Reset form only on create, not on edit
      if (!isEditing) {
        setFormData({
          title: '',
          summary: '',
          commencementDate: '',
          region: '',
          country: '',
          level: 'National',
          instrumentTypes: [],
          lifecycleStages: [],
          keywords: '',
          status: 'Unknown',
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
      }, 3500);
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
        <div className="sticky top-20 z-40 rounded-lg border border-ocean/30 bg-ocean/5 p-6 shadow-lg">
          <p className="font-display text-lg font-bold text-ocean">✓ Policy {isEditing ? 'updated' : 'submitted'} successfully!</p>
          <p className="text-sm text-ocean/70 mt-1">Redirecting in a moment...</p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="rounded-lg border border-coral/30 bg-coral/5 p-4">
          <p className="font-medium text-coral">✗ {error}</p>
          {Object.keys(fieldErrors).length > 0 && (
            <ul className="mt-2 text-sm text-coral/80 space-y-1">
              {Object.entries(fieldErrors).map(([field, message]) => (
                <li key={field}>• {message}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Basic Information */}
      <div className="rounded-2xl border border-ink/10 bg-card p-8">
        <h2 className="font-display text-2xl font-bold text-ink mb-6">Basic Information</h2>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-ink mb-2">Legislation/Regulation *</label>
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
            <label className="block text-sm font-medium text-ink mb-2">Description</label>
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
            <label className="block text-sm font-medium text-ink mb-2">Date of Commencement</label>
            <input
              type="date"
              name="commencementDate"
              value={formData.commencementDate}
              onChange={handleChange}
              min="1950-01-01"
              max={`${new Date().getFullYear() + 1}-12-31`}
              className="w-full rounded-lg border border-ocean/30 bg-paper px-4 py-2 text-ink hover:border-ocean/50 focus:border-ocean focus:outline-none focus:ring-2 focus:ring-ocean/20 scheme-light [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:rounded-md [&::-webkit-calendar-picker-indicator]:bg-ocean/10 [&::-webkit-calendar-picker-indicator]:p-1"
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

          <div className="md:col-span-2">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <MultiSelectDropdown
                  label="Instrument Type *"
                  options={INSTRUMENT_TYPES}
                  selectedValues={formData.instrumentTypes}
                  onChange={(values) =>
                    setFormData((prev) => ({
                      ...prev,
                      instrumentTypes: values,
                    }))
                  }
                  placeholder="Search and select instrument types..."
                  required={true}
                />
              </div>

              <div>
                <MultiSelectDropdown
                  label="Stage in Plastic Lifecycle"
                  options={LIFECYCLE_STAGES}
                  selectedValues={formData.lifecycleStages}
                  onChange={(values) =>
                    setFormData((prev) => ({
                      ...prev,
                      lifecycleStages: values,
                    }))
                  }
                  placeholder="Select lifecycle stages..."
                  required={false}
                />
              </div>
            </div>
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
          disabled={loading || submitted}
          className="inline-flex items-center gap-2 rounded-full bg-ink px-8 py-3 font-mono text-sm uppercase tracking-[0.18em] text-paper transition hover:bg-ocean-deep disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (isEditing ? 'Updating...' : 'Submitting...') : submitted ? (isEditing ? 'Updated ✓' : 'Submitted ✓') : (isEditing ? 'Update Policy' : 'Submit Policy')} →
        </button>
        {!isEditing && (
          <button
            type="reset"
            onClick={() => setFormData({
              title: '', summary: '', commencementDate: '',
              region: '', country: '', level: 'National', instrumentTypes: [], lifecycleStages: [], keywords: '', status: 'Unknown',
              authority: '', link: '', otherLinks: '', language: '',
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
