import { useCallback, useEffect, useState, type DependencyList } from "react";
import { ApiError } from "@event-tree/api-client";

export interface Resource<T> {
  data: T | null;
  error: ApiError | null;
  loading: boolean;
  reload: () => void;
  /** Replace the data locally (e.g. after a POST returns the updated event). */
  set: (value: T) => void;
}

/** Loads async data for a component, ignoring answers that arrive after unmount or a newer request. */
export function useResource<T>(load: () => Promise<T>, deps: DependencyList): Resource<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let current = true;
    setLoading(true);
    load()
      .then((value) => {
        if (!current) return;
        setData(value);
        setError(null);
      })
      .catch((err: unknown) => {
        if (!current) return;
        setError(err instanceof ApiError ? err : new ApiError(0, "UNKNOWN", String(err)));
      })
      .finally(() => current && setLoading(false));
    return () => {
      current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);

  const reload = useCallback(() => setTick((t) => t + 1), []);
  return { data, error, loading, reload, set: setData };
}
