import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../store/useAuthStore';

/**
 * HTTP client cho backend ASP.NET Core (chưa dùng – các service đang chạy mock).
 * Khi tích hợp: thay thân hàm trong *.service.ts bằng apiClient.get/post, giữ nguyên chữ ký.
 */
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://localhost:7001/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // MSG12: phiên hết hạn → đăng xuất
    if (error.response?.status === 401) useAuthStore.getState().logout();
    return Promise.reject(error);
  }
);
