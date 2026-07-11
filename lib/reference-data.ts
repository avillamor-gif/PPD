import { supabase } from '@/lib/supabase';

export interface ReferenceData {
  instrumentTypes: string[];
  lifecycleStages: string[];
  statuses: string[];
  countries: Array<{ code: string; name: string; region: string }>;
}

let cachedData: ReferenceData | null = null;

export async function fetchReferenceData(): Promise<ReferenceData> {
  // Return cached data if available
  if (cachedData) {
    return cachedData;
  }

  try {
    const [instrumentTypesRes, lifecycleStagesRes, statusesRes, countriesRes] = await Promise.all([
      supabase.from('instrument_types').select('name').order('name'),
      supabase.from('lifecycle_stages').select('name').order('name'),
      supabase.from('policy_statuses').select('name').order('name'),
      supabase.from('countries').select('code, name, region').order('name'),
    ]);

    if (
      instrumentTypesRes.error ||
      lifecycleStagesRes.error ||
      statusesRes.error ||
      countriesRes.error
    ) {
      throw new Error('Failed to fetch reference data');
    }

    cachedData = {
      instrumentTypes: instrumentTypesRes.data?.map((t: any) => t.name) || [],
      lifecycleStages: lifecycleStagesRes.data?.map((l: any) => l.name) || [],
      statuses: statusesRes.data?.map((s: any) => s.name) || [],
      countries: countriesRes.data || [],
    };

    return cachedData;
  } catch (error) {
    console.error('Error fetching reference data:', error);
    throw error;
  }
}

// Clear cache (useful for testing or after updates)
export function clearReferenceDataCache() {
  cachedData = null;
}
