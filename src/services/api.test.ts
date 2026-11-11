import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { apiClient } from './api';
import { useAuthStore } from '../store/useAuthStore';
import { useToastStore } from '../notifications/store';

const unauthorized = (config: InternalAxiosRequestConfig) =>
  Promise.reject(new AxiosError('Unauthorized', 'ERR_BAD_REQUEST', config, null, { status: 401, statusText: '', data: {}, headers: {}, config }));

const signedIn = {
  user: { id: '1', fullName: 'A', phoneNumber: '', email: '', role: 'Customer' as const, status: 'Active' as const, emailVerified: true },
  token: 'old',
  refreshToken: 'r',
  isAuthenticated: true,
};
const originalLogout = useAuthStore.getState().logout;
const originalAdapter = apiClient.defaults.adapter;

beforeEach(() => {
  useToastStore.getState().clear();
  // logout thật gọi mạng; thay bằng bản chỉ xoá trạng thái
  useAuthStore.setState({ ...signedIn, logout: () => useAuthStore.setState({ user: null, token: null, refreshToken: null, isAuthenticated: false }) });
  apiClient.defaults.adapter = (config) => unauthorized(config);
  vi.spyOn(axios, 'post').mockRejectedValue(new Error('refresh failed'));
});
afterEach(() => {
  vi.restoreAllMocks();
  apiClient.defaults.adapter = originalAdapter;
  useAuthStore.setState({ user: null, token: null, refreshToken: null, isAuthenticated: false, logout: originalLogout });
  useToastStore.getState().clear();
});

describe('session expiry', () => {
  it('failed refresh logs out and shows SESSION_EXPIRED once, even for concurrent 401s', async () => {
    const results = await Promise.allSettled([apiClient.get('/a'), apiClient.get('/b'), apiClient.get('/c')]);
    expect(results.every((r) => r.status === 'rejected')).toBe(true);
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    const expired = useToastStore.getState().items.filter((t) => t.type === 'SESSION_EXPIRED');
    expect(expired).toHaveLength(1);
    expect(expired[0].text).toBe('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
  });

  it('a 401 for a guest (not signed in) shows no session toast', async () => {
    useAuthStore.setState({ user: null, token: null, refreshToken: null, isAuthenticated: false });
    await apiClient.get('/a').catch(() => undefined);
    expect(useToastStore.getState().items).toHaveLength(0);
  });
});
