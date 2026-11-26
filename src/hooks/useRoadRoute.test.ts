import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';

const api = vi.hoisted(() => ({ route: vi.fn() }));
vi.mock('../api/endpoints', () => ({ accountApi: { route: api.route } }));
// Mỗi polyline trả về là một đường 2 điểm, nhận diện bằng chính chuỗi polyline
vi.mock('../utils/polyline', () => ({ decodePolyline: (p: string) => [[Number(p), 0], [Number(p), 1]] }));

import { __resetRoadRouteCache, useRoadRoute } from './useRoadRoute';
import { useAuthStore } from '../store/useAuthStore';
import type { LatLng } from '../components/mapTypes';

const pickup = { lat: 10.8, lng: 106.7 };
const dropoff = { lat: 10.9, lng: 106.8 };
const driverAt = (step: number) => ({ lat: 10.7 + step * 0.002, lng: 106.6 });

beforeEach(() => {
  vi.useFakeTimers();
  __resetRoadRouteCache();
  api.route.mockReset();
  let n = 0;
  api.route.mockImplementation(async () => ({ polyline: String(++n) }));
  useAuthStore.setState({ activeRole: 'Customer' } as never);
});
afterEach(() => vi.useRealTimers());

const setup = (from: LatLng, to: LatLng) => renderHook((p: { from: LatLng; to: LatLng }) => useRoadRoute(p.from, p.to), { initialProps: { from, to } });

describe('useRoadRoute khi tài xế di chuyển', () => {
  it('giữ đường cũ trong lúc chờ đường mới tới cùng điểm đến', async () => {
    const { result, rerender } = setup(driverAt(0), pickup);
    await act(() => vi.advanceTimersByTimeAsync(0));
    expect(result.current.line?.[0][0]).toBe(1);

    rerender({ from: driverAt(1), to: pickup }); // đi thêm ~200 m: key mới, phải chờ 15 giây mới gọi lại
    expect(result.current.line?.[0][0]).toBe(1);

    await act(() => vi.advanceTimersByTimeAsync(15_000));
    expect(result.current.line?.[0][0]).toBe(2);
  });

  it('đổi điểm đến thì bỏ đường cũ ngay', async () => {
    const { result, rerender } = setup(driverAt(0), pickup);
    await act(() => vi.advanceTimersByTimeAsync(0));
    expect(result.current.line).not.toBeNull();

    rerender({ from: driverAt(0), to: dropoff });
    expect(result.current.line).toBeNull();
  });
});
