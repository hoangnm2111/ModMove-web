import { useEffect, useRef, useState } from 'react';
import { accountApi } from '../api/endpoints';
import { useAuthStore } from '../store/useAuthStore';
import { decodePolyline } from '../utils/polyline';
import { isValidPoint, type LatLng } from '../components/mapTypes';

type Line = [number, number][];

/** Cache theo cặp điểm (làm tròn ~100 m): cùng tuyến không gọi BE lại. BE cũng có cache và giới hạn 10 lượt/phút/người. */
const cache = new Map<string, { at: number; line: Line | null }>();
const TTL_MS = 10 * 60 * 1000;
/** Vị trí tài xế đổi liên tục: cách nhau tối thiểu giữa hai lần gọi thật để không chạm giới hạn của BE. */
const MIN_GAP_MS = 15 * 1000;
let lastRequestAt = 0;

const r3 = (n: number) => n.toFixed(3);
const keyOf = (role: string | null, a: LatLng, b: LatLng) => `${role ?? '-'}|${r3(a.lat)},${r3(a.lng)}|${r3(b.lat)},${r3(b.lng)}`;

/**
 * Đường đi thật từ BE (MapVina Directions, có cache). Trả `line` = null khi chưa có/BE lỗi/429/BE cũ chưa có endpoint:
 * khi đó bản đồ vẽ đường thẳng nét đứt, không chặn luồng nào.
 */
export function useRoadRoute(from?: LatLng | null, to?: LatLng | null): { line: Line | null; loading: boolean } {
  const role = useAuthStore((s) => s.activeRole);
  const [state, setState] = useState<{ key: string; line: Line | null } | null>(null);
  const [loading, setLoading] = useState(false);
  const aborted = useRef(false);

  const ok = isValidPoint(from) && isValidPoint(to);
  const key = ok ? keyOf(role, from, to) : '';

  useEffect(() => {
    aborted.current = false;
    return () => {
      aborted.current = true;
    };
  }, []);

  useEffect(() => {
    if (!ok || !role) {
      setState(null);
      return;
    }
    const hit = cache.get(key);
    if (hit && Date.now() - hit.at < TTL_MS) {
      setState({ key, line: hit.line });
      return;
    }
    // Không gọi tới BE khi chưa đăng nhập (khách vãng lai ở trang đặt xe vẫn thấy bản đồ, chỉ không có đường thật).
    const wait = Math.max(0, lastRequestAt + MIN_GAP_MS - Date.now());
    const timer = window.setTimeout(async () => {
      lastRequestAt = Date.now();
      setLoading(true);
      try {
        const res = await accountApi.route(role, from!, to!);
        const line = res.polyline ? decodePolyline(res.polyline) : null;
        cache.set(key, { at: Date.now(), line: line && line.length > 1 ? line : null });
        if (!aborted.current) setState({ key, line: line && line.length > 1 ? line : null });
      } catch {
        // 404 (BE chưa có endpoint), 429, 5xx, hết hạn phiên: vẽ đường thẳng; nhớ ngắn để khỏi gọi dồn dập.
        cache.set(key, { at: Date.now() - TTL_MS + 60 * 1000, line: null });
        if (!aborted.current) setState({ key, line: null });
      } finally {
        if (!aborted.current) setLoading(false);
      }
    }, wait);
    return () => window.clearTimeout(timer);
    // from/to đã nằm trong key
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, role]);

  return { line: state && state.key === key ? state.line : null, loading };
}

/** Chỉ dùng cho test: xoá cache và bộ đếm giãn cách. */
export function __resetRoadRouteCache() {
  cache.clear();
  lastRequestAt = 0;
}
