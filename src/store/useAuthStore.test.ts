import { beforeEach, describe, expect, it, vi } from 'vitest';
import { filledDraft } from '../test/fixtures';
import { User } from '../types/user.types';

const auth = vi.hoisted(() => ({ signIn: vi.fn(), signOut: vi.fn(async () => undefined), saveSession: vi.fn(), restoreSession: vi.fn(() => null) }));
vi.mock('../services/auth.service', () => ({ authService: auth }));

import { DRIVER_USE_MOBILE_MESSAGE, getRoleHomePath, useAuthStore } from './useAuthStore';
import { useBookingDraftStore } from './useBookingDraftStore';

const session = (role: User['role']) => ({ user: { id: '1', fullName: 'An', role } as User, accessToken: 'a', refreshToken: 'r' });

describe('đăng nhập và đăng xuất trên web', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    useAuthStore.setState({ user: null, token: null, refreshToken: null, isAuthenticated: false, activeRole: null });
    useBookingDraftStore.getState().reset();
  });

  it('tài khoản tài xế không đăng nhập được trên web, phiên bị thu hồi', async () => {
    auth.signIn.mockResolvedValueOnce(session('Driver'));

    await expect(useAuthStore.getState().signIn('driver@modmove.local', 'x')).rejects.toThrow(DRIVER_USE_MOBILE_MESSAGE);

    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(auth.signOut).toHaveBeenCalled();
    expect(auth.saveSession).toHaveBeenCalledWith(null);
  });

  it('khách đăng nhập được và vào thẳng trang đặt xe', async () => {
    auth.signIn.mockResolvedValueOnce(session('Customer'));

    const user = await useAuthStore.getState().signIn('customer@modmove.local', 'x');

    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(getRoleHomePath(user.role)).toBe('/booking');
  });

  it('đăng xuất xoá bản nháp đặt xe của phiên trước', () => {
    useAuthStore.setState({ isAuthenticated: true, user: session('Customer').user, activeRole: 'Customer' });
    useBookingDraftStore.setState({ draft: filledDraft() });
    useBookingDraftStore.getState().setPickup({ address: '12 Nguyễn Huệ' });

    useAuthStore.getState().logout();

    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useBookingDraftStore.getState().draft.pickup.address).toBe('');
    expect(localStorage.getItem('modmove:v4:bookingDraft')).toBeNull();
  });

  it('khách chưa đăng nhập gặp lỗi 401 (ví dụ tải ảnh) thì không mất bản nháp', () => {
    useBookingDraftStore.getState().setPickup({ address: '12 Nguyễn Huệ' });

    useAuthStore.getState().logout(); // api.ts gọi logout khi không làm mới được phiên

    expect(useBookingDraftStore.getState().draft.pickup.address).toBe('12 Nguyễn Huệ');
    expect(localStorage.getItem('modmove:v4:bookingDraft')).not.toBeNull();
  });
});
