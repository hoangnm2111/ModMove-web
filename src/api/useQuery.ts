import { useCallback, useEffect, useRef, useState } from 'react';
import { errorMessage } from '../services/mock/storage';

export interface QueryState<T> {
  data: T | undefined;
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
  setData: (d: T) => void;
}

/**
 * Gọi API khi mount và mỗi khi `deps` đổi. `enabled=false` thì không gọi.
 * `refreshMs` > 0: tự tải lại định kỳ (không bật loading để UI không nháy).
 */
export function useQuery<T>(fn: () => Promise<T>, deps: unknown[] = [], opts: { enabled?: boolean; refreshMs?: number } = {}): QueryState<T> {
  const { enabled = true, refreshMs = 0 } = opts;
  const [data, setData] = useState<T | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(enabled);
  const [error, setError] = useState<string | null>(null);
  const fnRef = useRef(fn);
  fnRef.current = fn;
  const seq = useRef(0);

  const run = useCallback(async (silent: boolean) => {
    const id = ++seq.current;
    if (!silent) setLoading(true);
    try {
      const d = await fnRef.current();
      if (id === seq.current) {
        setData(d);
        setError(null);
      }
    } catch (e) {
      if (id === seq.current) setError(errorMessage(e));
    } finally {
      if (id === seq.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    void run(false);
    if (refreshMs > 0) {
      const t = setInterval(() => void run(true), refreshMs);
      return () => clearInterval(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, refreshMs, ...deps]);

  return { data, loading, error, reload: () => run(true), setData };
}

/** Chạy một thao tác (POST/PUT…) có trạng thái `busy` để khoá nút */
export function useAction() {
  const [busy, setBusy] = useState(false);
  const run = useCallback(async <R,>(fn: () => Promise<R>): Promise<R> => {
    setBusy(true);
    try {
      return await fn();
    } finally {
      setBusy(false);
    }
  }, []);
  return { busy, run };
}
