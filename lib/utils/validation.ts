import type { Policy } from '@/lib/types';

export interface ValidationError {
  field: string;
  message: string;
}

export function validatePolicy(data: Partial<Policy>): ValidationError[] {
  const errors: ValidationError[] = [];

  // Title validation
  if (!data.title?.trim()) {
    errors.push({ field: 'title', message: 'Policy title is required' });
  } else if (data.title.length < 5) {
    errors.push({ field: 'title', message: 'Title must be at least 5 characters' });
  } else if (data.title.length > 300) {
    errors.push({ field: 'title', message: 'Title cannot exceed 300 characters' });
  }

  // Country validation
  if (!data.country) {
    errors.push({ field: 'country', message: 'Country is required' });
  }

  // Category validation
  if (!data.category) {
    errors.push({ field: 'category', message: 'Category is required' });
  }

  // Status validation
  if (!data.status) {
    errors.push({ field: 'status', message: 'Status is required' });
  }

  // Year validation
  if (data.year) {
    if (data.year < 2000) {
      errors.push({ field: 'year', message: 'Year must be 2000 or later' });
    } else if (data.year > new Date().getFullYear() + 1) {
      errors.push({ field: 'year', message: 'Year cannot be in the future' });
    }
  }

  // Authority validation
  if (!data.authority?.trim()) {
    errors.push({ field: 'authority', message: 'Competent authority is required' });
  }

  // Link validation
  if (!data.link?.trim()) {
    errors.push({ field: 'link', message: 'Policy link is required' });
  } else {
    try {
      new URL(data.link);
    } catch {
      errors.push({ field: 'link', message: 'Please enter a valid URL' });
    }
  }

  // Summary validation (optional but validate if provided)
  if (data.summary && data.summary.length > 1000) {
    errors.push({ field: 'summary', message: 'Summary cannot exceed 1000 characters' });
  }

  return errors;
}

export function generatePolicyId(country: string, year: number, sequence: number = 1): string {
  // Format: country-year-sequence
  // Example: PH-2024-01
  return `${country.toLowerCase()}-${year}-${String(sequence).padStart(2, '0')}`;
}

export function sanitizeInput(input: string): string {
  return input.trim().replace(/\s+/g, ' ');
}

export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}
