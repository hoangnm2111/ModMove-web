import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { handleServerNotice, noticeBus } from './realtime';
import { useToastStore } from './store';
import { useAuthStore } from '../store/useAuthStore';
import { useNoticeRefresh } from './useNoticeRefresh';

const notice = (type: string, orderId?: number) => handleServerNotice({ type, body: 'B', data: orderId ? { orderId } : {} });

beforeEach(() => useToastStore.getState().clear());
afterEach(() => {
  useToastStore.getState().clear();
  window.history.pushState({}, '', '/');
  useAuthStore.setState({ user: null });
});

describe('useNoticeRefresh', () => {
  it('calls reload once when match is true', () => {
    const reload = vi.fn();
    renderHook(() => useNoticeRefresh((_t, d) => d.orderId === '7', reload));
    notice('ORDER_ACCEPTED', 7);
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('does not call reload when match is false', () => {
    const reload = vi.fn();
    renderHook(() => useNoticeRefresh((_t, d) => d.orderId === '7', reload));
    notice('ORDER_ACCEPTED', 8);
    notice('NEW_MATCHING_ORDER');
    expect(reload).not.toHaveBeenCalled();
  });

  it('unsubscribes on unmount', () => {
    const reload = vi.fn();
    const { unmount } = renderHook(() => useNoticeRefresh(() => true, reload));
    unmount();
    notice('ORDER_ACCEPTED', 7);
    expect(reload).not.toHaveBeenCalled();
  });

  it('uses the latest match/reload without re-subscribing every render', () => {
    const on = vi.spyOn(noticeBus, 'on');
    const first = vi.fn();
    const second = vi.fn();
    const { rerender } = renderHook(({ reload }) => useNoticeRefresh(() => true, reload), { initialProps: { reload: first } });
    rerender({ reload: second });
    notice('ORDER_ACCEPTED', 7);
    expect(on).toHaveBeenCalledTimes(1);
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
    on.mockRestore();
  });
});

describe('toast for the page that is already open', () => {
  it('has no "Xem" link when the destination is the current page', () => {
    useAuthStore.setState({ user: { id: '1', fullName: 'A', phoneNumber: '', email: '', role: 'Customer', status: 'Active', emailVerified: true } });
    window.history.pushState({}, '', '/orders/7');
    notice('ORDER_ACCEPTED', 7);
    expect(useToastStore.getState().items[0]).toMatchObject({ type: 'ORDER_ACCEPTED', href: undefined });
  });

  it('keeps the link when the destination is another page', () => {
    useAuthStore.setState({ user: { id: '1', fullName: 'A', phoneNumber: '', email: '', role: 'Customer', status: 'Active', emailVerified: true } });
    window.history.pushState({}, '', '/orders/8');
    notice('ORDER_ACCEPTED', 7);
    expect(useToastStore.getState().items[0].href).toBe('/orders/7');
  });
});
