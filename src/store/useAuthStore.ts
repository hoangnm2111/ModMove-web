import { create } from 'zustand';
import { clearBookingDraft } from './useBookingDraftStore';
import { authService, Session } from '../services/auth.service';
import { User, UserRole } from '../types/user.types';

/**
 * Auth store – chỉ giữ trạng thái phiên; mọi nghiệp vụ nằm ở authService.
 */
export const getRoleHomePath = (role?: UserRole | null): string => {
  switch (role) {
    case 'Customer':
      return '/booking';
    case 'Driver':
      return '/'; // K-07: tài xế dùng app mobile, web không có trang tài xế
    case 'Dispatcher':
      return '/dispatcher/live-map';
    case 'Administrator':
      return '/admin/dashboard';
    default:
      return '/login';
  }
};

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  activeRole: UserRole | null;
  signIn: (identifier: string, password: string) => Promise<User>;
  setUser: (user: User) => void;
  logout: () => void;
  /** Gọi lại từ api.ts sau khi refresh access token thành công */
  applyRefreshedTokens: (accessToken: string, refreshToken: string) => void;
  /** Nạp lại hồ sơ khi mở ứng dụng, để xác nhận token cục bộ còn hợp lệ với server */
  bootstrap: () => Promise<void>;
}

const fromSession = (s: Session | null) => ({
  user: s?.user ?? null,
  token: s?.accessToken ?? null,
  refreshToken: s?.refreshToken ?? null,
  isAuthenticated: Boolean(s),
  activeRole: s?.user.role ?? null,
});

/** K-07: web phục vụ Guest, Customer, Dispatcher, Administrator; tài xế dùng app mobile */
export const DRIVER_USE_MOBILE_MESSAGE = 'Tài khoản tài xế chỉ dùng được trên ứng dụng ModMove cho điện thoại.';

const restoreWebSession = (): Session | null => {
  const s = authService.restoreSession();
  if (s?.user.role === 'Driver') {
    authService.saveSession(null);
    return null;
  }
  return s;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  ...fromSession(restoreWebSession()),

  signIn: async (identifier, password) => {
    const session = await authService.signIn(identifier, password);
    if (session.user.role === 'Driver') {
      await authService.signOut();
      authService.saveSession(null);
      throw new Error(DRIVER_USE_MOBILE_MESSAGE);
    }
    set(fromSession(session));
    return session.user;
  },

  setUser: (user) => {
    set({ user });
    const token = get().token;
    const refreshToken = get().refreshToken;
    if (token && refreshToken) authService.saveSession({ user, accessToken: token, refreshToken });
  },

  logout: () => {
    // Chỉ xoá nháp đặt xe khi thật sự có phiên: khách vãng lai gặp 401 (ví dụ tải ảnh) vẫn giữ nháp.
    const signedIn = get().isAuthenticated;
    void authService.signOut();
    if (signedIn) clearBookingDraft();
    set(fromSession(null));
  },

  applyRefreshedTokens: (accessToken, refreshToken) => {
    const user = get().user;
    if (!user) return;
    authService.saveSession({ user, accessToken, refreshToken });
    set({ token: accessToken, refreshToken });
  },

  bootstrap: async () => {
    if (!get().isAuthenticated) return;
    const user = await authService.refreshProfile();
    if (user) set({ user });
    else set(fromSession(null));
  },
}));
