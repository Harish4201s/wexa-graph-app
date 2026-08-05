import { useCallback, useEffect, useState } from 'react';

/**
 * Generic data-fetching hook with loading/error/data states and a
 * `refetch` escape hatch for retry buttons.
 *
 * fetcherFn: () => Promise<T>
 * deps: dependency array — refetches whenever these change
 */
export function useApi(fetcherFn, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetcherFn();
      setData(result);
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}
