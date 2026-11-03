import { create } from 'zustand';
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
      return '/driver';
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
  isAuthenticated: boolean;
  activeRole: UserRole | null;
  signIn: (identifier: string, password: string) => Promise<User>;
  setUser: (user: User) => void;
  logout: () => void;
}

const fromSession = (s: Session | null) => ({
  user: s?.user ?? null,
  token: s?.accessToken ?? null,
  isAuthenticated: Boolean(s),
  activeRole: s?.user.role ?? null,
});

export const useAuthStore = create<AuthState>((set) => ({
  ...fromSession(authService.restoreSession()),

  signIn: async (identifier, password) => {
    const session = await authService.signIn(identifier, password);
    set(fromSession(session));
    return session.user;
  },

  setUser: (user) => set({ user }),

  logout: () => {
    authService.signOut();
    set(fromSession(null));
  },
}));
