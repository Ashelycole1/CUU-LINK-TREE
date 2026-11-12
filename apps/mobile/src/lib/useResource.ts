import { useCallback, useEffect, useState, type DependencyList } from "react";
import { ApiError } from "@event-tree/api-client";

export interface Resource<T> {
  data: T | null;
  error: ApiError | null;
  loading: boolean;
  reload: () => Promise<void>;
  set: (value: T) => void;
}

/**
 * Loads async data for a screen. Same contract as the web hook, except
 * reload() returns a promise so pull-to-refresh knows when to stop spinning.
 */
export function useResource<T>(load: () => Promise<T>, deps: DependencyList): Resource<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [loading, setLoading] = useState(true);

  const run = useCallback(async () => {
    setLoading(true);
    try {
      setData(await load());
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err : new ApiError(0, "UNKNOWN", String(err)));
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    void run();
  }, [run]);

  return { data, error, loading, reload: run, set: setData };
}
