import { useCallback, useEffect, useRef, useState } from 'react';
import { errorMessage } from '../services/mock/storage';

/**
 * Đọc dữ liệu từ service và tự cập nhật khi service phát sự kiện thay đổi
 * (cùng tab hoặc tab khác – ví dụ tài xế và khách mở 2 tab).
 */
export function useLiveData<T>(read: () => T, subscribe: (cb: () => void) => () => void, deps: unknown[] = []): [T, () => void] {
  const readRef = useRef(read);
  readRef.current = read;
  const [data, setData] = useState<T>(read);
  const refresh = useCallback(() => setData(readRef.current()), []);
  useEffect(() => {
    refresh();
    return subscribe(refresh);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return [data, refresh];
}

/** Bọc một action async: trạng thái loading + lỗi chuẩn hoá */
export function useAction<A extends unknown[], R>(fn: (...args: A) => Promise<R>) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const run = useCallback(
    async (...args: A): Promise<R | undefined> => {
      setPending(true);
      setError(null);
      try {
        return await fn(...args);
      } catch (e) {
        setError(errorMessage(e));
        return undefined;
      } finally {
        setPending(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fn]
  );
  return { run, pending, error, setError };
}

/** Đếm ngược theo giây tới một mốc thời gian */
export function useCountdown(deadline: number | null): number {
  const [left, setLeft] = useState(() => (deadline ? Math.max(0, Math.ceil((deadline - Date.now()) / 1000)) : 0));
  useEffect(() => {
    if (!deadline) return;
    const tick = () => setLeft(Math.max(0, Math.ceil((deadline - Date.now()) / 1000)));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [deadline]);
  return left;
}
