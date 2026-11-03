/**
 * Mock persistence (localStorage) dùng tạm khi chưa có backend ASP.NET Core.
 * Mọi đọc/ghi đều bọc try/catch để chạy được cả khi storage bị chặn.
 */
const PREFIX = 'modmove:v4:';
export const STORAGE_EVENT = 'modmove:storage';

export function readStore<T>(key: string, seed: () => T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (raw) return JSON.parse(raw) as T;
  } catch {
    /* ignore */
  }
  const value = seed();
  writeStore(key, value, false);
  return value;
}

export function writeStore<T>(key: string, value: T, notify = true): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    /* ignore quota / privacy mode */
  }
  if (notify) window.dispatchEvent(new CustomEvent(STORAGE_EVENT, { detail: key }));
}

/** Đăng ký lắng nghe thay đổi (cùng tab và tab khác) */
export function subscribeStore(key: string, cb: () => void): () => void {
  const local = (e: Event) => (e as CustomEvent).detail === key && cb();
  const cross = (e: StorageEvent) => e.key === PREFIX + key && cb();
  window.addEventListener(STORAGE_EVENT, local);
  window.addEventListener('storage', cross);
  return () => {
    window.removeEventListener(STORAGE_EVENT, local);
    window.removeEventListener('storage', cross);
  };
}

/** Giả lập độ trễ mạng */
export const latency = (ms = 300) => new Promise<void>((r) => setTimeout(r, ms));

export const uid = (prefix: string) => `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

/** Lỗi nghiệp vụ trả về từ service (tương ứng HTTP 4xx của API) */
export class ServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ServiceError';
  }
}

export const errorMessage = (e: unknown) => (e instanceof Error ? e.message : 'Đã có lỗi xảy ra.');
