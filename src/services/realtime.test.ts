import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';

/* ---- Giả lập @microsoft/signalr: ghi lại kết nối và handler ---- */
interface FakeConn {
  handlers: Record<string, (...a: unknown[]) => void>;
  state: string;
  invoke: ReturnType<typeof vi.fn>;
}
const hub = vi.hoisted(() => ({ conns: [] as FakeConn[] }));
vi.mock('@microsoft/signalr', () => {
  class HubConnectionBuilder {
    withUrl() {
      return this;
    }
    withAutomaticReconnect() {
      return this;
    }
    configureLogging() {
      return this;
    }
    build() {
      const c: FakeConn = { handlers: {}, state: 'Disconnected', invoke: vi.fn(async () => undefined) };
      Object.assign(c, {
        on: (name: string, fn: (...a: unknown[]) => void) => (c.handlers[name] = fn),
        onreconnected: () => undefined,
        onclose: () => undefined,
        start: vi.fn(async () => {
          c.state = 'Connected';
        }),
        stop: vi.fn(async () => {
          c.state = 'Disconnected';
        }),
      });
      hub.conns.push(c);
      return c;
    }
  }
  return {
    HubConnectionBuilder,
    HubConnectionState: { Disconnected: 'Disconnected', Connected: 'Connected' },
    LogLevel: { Warning: 3 },
  };
});

import { useDriverLocations } from '../hooks/useRealtime';
import { realtime } from './realtime.service';
import { useAuthStore } from '../store/useAuthStore';

const loc = (orderId: number | null) => ({ driverProfileId: 3, orderId, latitude: 10.8, longitude: 106.6, at: '2026-11-18T10:00:00Z' });

beforeEach(() => {
  hub.conns.length = 0;
  useAuthStore.setState({ token: 'tok-1' });
});
afterEach(async () => {
  await realtime.stop();
  useAuthStore.setState({ token: null });
});

describe('LocationUpdated', () => {
  it('listener gets events until it unsubscribes', async () => {
    await realtime.start();
    const seen = vi.fn();
    const off = realtime.onLocationUpdated(seen);
    hub.conns[0].handlers.LocationUpdated(loc(7));
    off();
    hub.conns[0].handlers.LocationUpdated(loc(7));
    expect(seen).toHaveBeenCalledTimes(1);
    expect(seen).toHaveBeenCalledWith(loc(7));
  });

  it('with orderId: joins that order and gets only its events', async () => {
    await realtime.start();
    const seen = vi.fn();
    const { unmount } = renderHook(() => useDriverLocations(seen, 7));
    expect(hub.conns[0].invoke).toHaveBeenCalledWith('JoinOrder', 7);
    hub.conns[0].handlers.LocationUpdated(loc(7));
    hub.conns[0].handlers.LocationUpdated(loc(8));
    hub.conns[0].handlers.LocationUpdated(loc(null));
    expect(seen).toHaveBeenCalledTimes(1);
    unmount();
    hub.conns[0].handlers.LocationUpdated(loc(7));
    expect(seen).toHaveBeenCalledTimes(1);
  });

  it('without orderId (dispatcher): gets every driver', async () => {
    await realtime.start();
    const seen = vi.fn();
    const { unmount } = renderHook(() => useDriverLocations(seen));
    hub.conns[0].handlers.LocationUpdated(loc(7));
    hub.conns[0].handlers.LocationUpdated(loc(null));
    expect(seen).toHaveBeenCalledTimes(2);
    unmount();
  });
});
