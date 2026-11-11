import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../store/useAuthStore';
import { ServiceError } from './mock/storage';
import { ERROR_MESSAGES } from '../api/errors';

/** HTTP client cho backend ASP.NET Core (ModMove.WebApi). */
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5133/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = useAuthStore.getState().token;
  if (token && !config.headers.Authorization) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

interface RetryableConfig extends InternalAxiosRequestConfig {
  _retried?: boolean;
}

/** Gộp các request bị 401 cùng lúc lại, chỉ gọi /auth/refresh một lần (tránh vòng lặp refresh). */
let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = useAuthStore.getState().refreshToken;
  if (!refreshToken) return null;
  try {
    const { data } = await axios.post(`${API_BASE_URL}/public/Auth/refresh`, { refreshToken });
    useAuthStore.getState().applyRefreshedTokens(data.accessToken, data.refreshToken);
    return data.accessToken as string;
  } catch {
    return null;
  }
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as RetryableConfig | undefined;
    const isAuthEndpoint = config?.url?.includes('/public/Auth/');
    if (error.response?.status === 401 && config && !config._retried && !isAuthEndpoint) {
      config._retried = true;
      refreshPromise ??= refreshAccessToken().finally(() => {
        refreshPromise = null;
      });
      const newToken = await refreshPromise;
      if (newToken) {
        config.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(config);
      }
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);

/** Chuẩn hoá lỗi axios (ProblemDetails của backend) thành ServiceError để UI hiển thị. */
export function toServiceError(e: unknown): ServiceError {
  if (axios.isAxiosError(e)) {
    const status = e.response?.status;
    const data = e.response?.data as { detail?: string; title?: string; code?: string; errors?: Record<string, string[]> } | undefined;
    const code = data?.code;
    const firstFieldError = data?.errors ? Object.values(data.errors).flat()[0] : undefined;
    // 400 VALIDATION: hiển thị lỗi theo trường; mã khác: câu tiếng Việt theo `code` (DECISIONS 9.4)
    if (firstFieldError) return new ServiceError(firstFieldError, code ?? 'VALIDATION', status);
    if (code && ERROR_MESSAGES[code]) {
      // Các mã có số liệu trong `detail` (giá mới, số tiền còn hoàn được) → nối thêm chi tiết
      const withDetail = ['FARE_CHANGED', 'REFUND_TOTAL_EXCEEDED'].includes(code) && data?.detail;
      return new ServiceError(withDetail ? `${ERROR_MESSAGES[code]} (${data!.detail})` : ERROR_MESSAGES[code], code, status);
    }
    if (data?.detail) return new ServiceError(data.detail, code, status);
    if (data?.title) return new ServiceError(data.title, code, status);
    if (e.code === 'ECONNABORTED' || e.message === 'Network Error') {
      return new ServiceError('Không kết nối được tới máy chủ. Vui lòng kiểm tra mạng và thử lại.', 'NETWORK');
    }
  }
  return e instanceof ServiceError ? e : new ServiceError('Đã có lỗi xảy ra. Vui lòng thử lại.');
}
