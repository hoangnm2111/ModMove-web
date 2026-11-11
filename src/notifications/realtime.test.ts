import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { hubUrl, handleServerNotice, noticeBus } from './realtime';
import { notify, useToastStore } from './store';

/* ---- Giả lập @microsoft/signalr: ghi lại kết nối, tuỳ chọn và handler ---- */
interface FakeConn {
  handlers: Record<string, (...a: unknown[]) => void>;
  closeHandler?: () => void;
  state: string;
  start: ReturnType<typeof vi.fn>;
  stop: ReturnType<typeof vi.fn>;
}
const hub = vi.hoisted(() => ({
  conns: [] as FakeConn[],
  opts: [] as { accessTokenFactory: () => string | Promise<string> }[],
  failStart: false,
}));
vi.mock('@microsoft/signalr', () => {
  class HubConnectionBuilder {
    withUrl(_url: string, o: { accessTokenFactory: () => string | Promise<string> }) {
      hub.opts.push(o);
      return this;
    }
    withAutomaticReconnect() {
      return this;
    }
    configureLogging() {
      return this;
    }
    build() {
      const c: FakeConn = {
        handlers: {},
        state: 'Disconnected',
        start: vi.fn(async () => {
          if (hub.failStart) throw new Error('negotiate failed');
          c.state = 'Connected';
        }),
        stop: vi.fn(async () => {
          c.state = 'Disconnected';
        }),
      };
      Object.assign(c, {
        on: (name: string, fn: (...a: unknown[]) => void) => (c.handlers[name] = fn),
        onreconnected: () => undefined,
        onclose: (fn: () => void) => (c.closeHandler = fn),
        invoke: vi.fn(async () => undefined),
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

import { useRealtimeConnection } from '../hooks/useRealtime';
import { realtime } from '../services/realtime.service';
import { useAuthStore } from '../store/useAuthStore';

const items = () => useToastStore.getState().items;
const last = () => items()[0];
const user = (id: string) => ({ id, fullName: 'A', phoneNumber: '', email: '', role: 'Customer' as const, status: 'Active' as const, emailVerified: true });
const login = (id = '1', token = 'tok-1') => useAuthStore.setState({ user: user(id), token });
const logout = () => useAuthStore.setState({ user: null, token: null });
const flush = () => act(async () => void (await Promise.resolve()));

beforeEach(() => {
  hub.conns.length = 0;
  hub.opts.length = 0;
  hub.failStart = false;
  logout();
  useToastStore.getState().clear();
});
afterEach(async () => {
  await realtime.stop();
  logout();
  useToastStore.getState().clear();
  vi.restoreAllMocks();
});

describe('hubUrl', () => {
  it('derives the hub from the API base', () => {
    expect(hubUrl('http://localhost:5133/api')).toBe('http://localhost:5133/hubs/tracking');
    expect(hubUrl('https://x.vn/api/')).toBe('https://x.vn/hubs/tracking');
  });
});

describe('handleServerNotice', () => {
  it('valid payload → toast + bus', () => {
    const seen = vi.fn();
    const off = noticeBus.on(seen);
    handleServerNotice({ type: 'REFUND_INFO_REQUESTED', title: 'T', body: 'B', data: { orderId: '9' } });
    off();
    expect(last()).toMatchObject({ text: 'B', title: 'T' });
    expect(seen).toHaveBeenCalledWith('REFUND_INFO_REQUESTED', { orderId: '9' });
  });

  it('malformed payload ignored', () => {
    const seen = vi.fn();
    const off = noticeBus.on(seen);
    for (const bad of [{ body: 1 }, { type: 5 }, { type: '' }, null, undefined, 'x', 42]) handleServerNotice(bad);
    off();
    expect(items()).toHaveLength(0);
    expect(seen).not.toHaveBeenCalled();
  });

  it('numeric data values become strings; non-primitive values are dropped', () => {
    const seen = vi.fn();
    const off = noticeBus.on(seen);
    handleServerNotice({ type: 'ORDER_ACCEPTED', body: 'B', data: { orderId: 7, nested: { a: 1 }, flag: true } });
    off();
    expect(seen).toHaveBeenCalledWith('ORDER_ACCEPTED', { orderId: '7', flag: 'true' });
  });

  it('a throwing bus listener does not block the others', () => {
    const bad = noticeBus.on(() => {
      throw new Error('boom');
    });
    const good = vi.fn();
    const off = noticeBus.on(good);
    handleServerNotice({ type: 'ORDER_ACCEPTED', body: 'B' });
    bad();
    off();
    expect(good).toHaveBeenCalledTimes(1);
  });

  it('own action + server echo shows one toast', () => {
    notify('ORDER_CANCELLED', { orderId: '7', orderCode: 'MM01' });
    handleServerNotice({ type: 'ORDER_CANCELLED', title: 'Đơn đã huỷ', body: 'Đơn MM01 đã được huỷ.', data: { orderId: 7 } });
    expect(items()).toHaveLength(1);
  });
});

describe('useRealtimeConnection', () => {
  it('starts when token set, stops and clears toasts when token cleared', async () => {
    const { unmount } = renderHook(() => useRealtimeConnection());
    expect(hub.conns).toHaveLength(0);

    act(() => login());
    await flush();
    expect(hub.conns).toHaveLength(1);
    expect(hub.conns[0].start).toHaveBeenCalledTimes(1);

    act(() => notify('ORDER_ACCEPTED', { orderId: '7' }));
    expect(items()).toHaveLength(1);
    act(() => logout());
    await flush();
    expect(hub.conns[0].stop).toHaveBeenCalled();
    expect(items()).toHaveLength(0);
    unmount();
  });

  it('keeps the session-end toast that is shown right after logout', async () => {
    renderHook(() => useRealtimeConnection());
    act(() => login());
    await flush();
    act(() => {
      notify('ORDER_ACCEPTED', { orderId: '7' });
      logout();
      notify('SESSION_EXPIRED');
    });
    await flush();
    expect(items().map((t) => t.type)).toEqual(['SESSION_EXPIRED']);
  });

  it('switching account reconnects with a fresh connection and drops the old toasts', async () => {
    renderHook(() => useRealtimeConnection());
    act(() => login('1', 'tok-1'));
    await flush();
    act(() => notify('ORDER_ACCEPTED', { orderId: '7' }));
    act(() => login('2', 'tok-2'));
    await flush();
    expect(hub.conns).toHaveLength(2);
    expect(hub.conns[0].stop).toHaveBeenCalled();
    expect(hub.conns[1].start).toHaveBeenCalledTimes(1);
    expect(items()).toHaveLength(0);
  });

  it('a late onclose of the old connection does not orphan the new one', async () => {
    renderHook(() => useRealtimeConnection());
    act(() => login('1', 'tok-1'));
    await flush();
    act(() => login('2', 'tok-2'));
    await flush();
    hub.conns[0].closeHandler?.(); // SignalR báo đóng kết nối cũ sau khi đã dựng kết nối mới
    await realtime.start();
    expect(hub.conns).toHaveLength(2);
  });

  it('accessTokenFactory reads the latest token on every connect', async () => {
    renderHook(() => useRealtimeConnection());
    act(() => login('1', 'tok-1'));
    await flush();
    expect(await hub.opts[0].accessTokenFactory()).toBe('tok-1');
    useAuthStore.setState({ token: 'tok-2' }); // làm mới token khi kết nối đang mở
    expect(await hub.opts[0].accessTokenFactory()).toBe('tok-2');
  });

  it('NotificationReceived from the hub shows a toast', async () => {
    renderHook(() => useRealtimeConnection());
    act(() => login());
    await flush();
    act(() => hub.conns[0].handlers.NotificationReceived({ type: 'ORDER_ACCEPTED', title: 'Đơn đã có tài xế', body: 'X', data: { orderId: 7 } }));
    expect(last()).toMatchObject({ title: 'Đơn đã có tài xế', text: 'X' });
  });

  it('start failure does not toast', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    hub.failStart = true;
    renderHook(() => useRealtimeConnection());
    act(() => login());
    await flush();
    await flush();
    expect(items()).toHaveLength(0);
    expect(warn).toHaveBeenCalled();
  });
});
