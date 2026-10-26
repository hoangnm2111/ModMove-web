import { create } from 'zustand';
import { User, UserRole } from '../types/user.types';

export interface HardcodedAccount {
  username: string;
  aliases: string[];
  password: string;
  role: UserRole;
  label: string;
  description: string;
  defaultPath: string;
}

export const HARDCODED_ACCOUNTS: HardcodedAccount[] = [
  {
    username: 'admin',
    aliases: ['admin', 'administrator', 'quantri'],
    password: '123456',
    role: 'Administrator',
    label: 'Quản trị viên (Admin)',
    description: 'Báo cáo doanh thu, duyệt tài xế, quản lý tài khoản & bảng giá',
    defaultPath: '/admin/dashboard',
  },
  {
    username: 'driver',
    aliases: ['driver', 'taixe'],
    password: '123456',
    role: 'Driver',
    label: 'Tài xế đối tác (Driver)',
    description: 'Bàn làm việc nhận cuốc, ví thu nhập tài xế, hồ sơ giấy tờ xe',
    defaultPath: '/driver',
  },
  {
    username: 'dispatcher',
    aliases: ['dispatcher', 'dieuphoi'],
    password: '123456',
    role: 'Dispatcher',
    label: 'Điều phối viên (Dispatcher)',
    description: 'Bản đồ giám sát hạm đội xe trực tiếp, giải quyết sự cố, điều phối lại',
    defaultPath: '/dispatcher/live-map',
  },
  {
    username: 'customer',
    aliases: ['customer', 'khachhang'],
    password: '123456',
    role: 'Customer',
    label: 'Khách hàng (Customer)',
    description: 'Đặt dịch vụ vận chuyển đồ đạc, theo dõi đơn, nạp ví PayOS',
    defaultPath: '/',
  },
];

export const ROLE_PROFILES: Record<UserRole, User> = {
  Customer: {
    id: 'cust_01',
    fullName: 'Hoàng Nguyễn Mạnh (Khách hàng)',
    phoneNumber: '0338967316',
    email: 'customer@modmove.vn',
    role: 'Customer',
    status: 'Active',
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
    walletBalance: 1250000,
  },
  Driver: {
    id: 'drv_88',
    fullName: 'Nguyễn Văn Hùng (Tài xế)',
    phoneNumber: '0912345678',
    email: 'driver@modmove.vn',
    role: 'Driver',
    status: 'Active',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    walletBalance: 3850000,
  },
  Dispatcher: {
    id: 'disp_01',
    fullName: 'Trần Trung Hiếu (Điều phối viên)',
    phoneNumber: '0988116487',
    email: 'dispatcher@modmove.vn',
    role: 'Dispatcher',
    status: 'Active',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
    walletBalance: 0,
  },
  Administrator: {
    id: 'adm_01',
    fullName: 'Ban Quản Trị Hệ Thống ModMove',
    phoneNumber: '0338967316',
    email: 'admin@modmove.vn',
    role: 'Administrator',
    status: 'Active',
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80',
    walletBalance: 348500000,
  },
};

export const getRoleHomePath = (role?: UserRole | null): string => {
  if (!role) return '/login';
  switch (role) {
    case 'Customer':
      return '/';
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
  login: (username: string, password: string) => { success: boolean; message?: string; defaultPath?: string };
  loginWithRole: (role: UserRole) => string;
  setUserRole: (role: UserRole) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => {
  const savedRole = localStorage.getItem('modmove_role') as UserRole | null;
  const savedToken = localStorage.getItem('modmove_token');

  const isValidSavedRole = savedRole && Boolean(ROLE_PROFILES[savedRole]);
  const initialRole: UserRole | null = isValidSavedRole ? savedRole : null;
  const initialUser: User | null = isValidSavedRole ? ROLE_PROFILES[savedRole] : null;
  const initialAuth: boolean = Boolean(isValidSavedRole);

  return {
    user: initialUser,
    token: savedToken || (isValidSavedRole ? `modmove_jwt_${savedRole?.toLowerCase()}_demo` : null),
    isAuthenticated: initialAuth,
    activeRole: initialRole,

    login: (usernameInput: string, passwordInput: string) => {
      const cleanUser = usernameInput.trim().toLowerCase();
      const cleanPass = passwordInput.trim();

      const matched = HARDCODED_ACCOUNTS.find(
        (acc) => acc.username === cleanUser || acc.aliases.includes(cleanUser)
      );

      if (!matched) {
        return {
          success: false,
          message: 'Tài khoản không tồn tại. Vui lòng nhập một trong 4 tài khoản: admin, driver, dispatcher, customer.',
        };
      }

      if (cleanPass !== matched.password) {
        return {
          success: false,
          message: 'Mật khẩu không chính xác. Mật khẩu mặc định là 123456.',
        };
      }

      const role = matched.role;
      const user = ROLE_PROFILES[role];
      const token = `modmove_jwt_${role.toLowerCase()}_${Date.now()}`;

      localStorage.setItem('modmove_role', role);
      localStorage.setItem('modmove_token', token);

      set({
        user,
        token,
        isAuthenticated: true,
        activeRole: role,
      });

      return {
        success: true,
        defaultPath: matched.defaultPath,
      };
    },

    loginWithRole: (role: UserRole) => {
      const matched = HARDCODED_ACCOUNTS.find((acc) => acc.role === role);
      const user = ROLE_PROFILES[role];
      const token = `modmove_jwt_${role.toLowerCase()}_${Date.now()}`;

      localStorage.setItem('modmove_role', role);
      localStorage.setItem('modmove_token', token);

      set({
        user,
        token,
        isAuthenticated: true,
        activeRole: role,
      });

      return matched?.defaultPath || '/';
    },

    setUserRole: (role: UserRole) => {
      const user = ROLE_PROFILES[role];
      const token = `modmove_jwt_${role.toLowerCase()}_${Date.now()}`;
      localStorage.setItem('modmove_role', role);
      localStorage.setItem('modmove_token', token);

      set({
        activeRole: role,
        user,
        token,
        isAuthenticated: true,
      });
    },

    logout: () => {
      localStorage.removeItem('modmove_role');
      localStorage.removeItem('modmove_token');
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        activeRole: null,
      });
    },
  };
});
