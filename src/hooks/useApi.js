import { useCallback, useEffect, useRef, useState } from 'react';
// Pass a stable useCallback loader. Failed refreshes retain the last successful data.
export function useApi(loader, { enabled = true } = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState(null);
  const alive = useRef(false);
  const generation = useRef(0);
  const refetch = useCallback(async () => {
    const current = ++generation.current;
    if (alive.current) { setLoading(true); setError(null); }
    try {
      const result = await loader();
      if (alive.current && generation.current === current) setData(result);
      return result;
    } catch (failure) {
      if (alive.current && generation.current === current) setError(failure.message);
      return null;
    } finally {
      if (alive.current && generation.current === current) setLoading(false);
    }
  }, [loader]);
  useEffect(() => {
    alive.current = true;
    if (enabled) refetch();
    else { setData(null); setError(null); setLoading(false); }
    return () => { alive.current = false; generation.current += 1; };
  }, [enabled, refetch]);
  return { data, loading, error, refetch };
}
