import { useState, useEffect } from 'react';
import { ReferenceData, fetchReferenceData } from '@/lib/reference-data';

export function useReferenceData() {
  const [data, setData] = useState<ReferenceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const result = await fetchReferenceData();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  return { data, loading, error };
}
