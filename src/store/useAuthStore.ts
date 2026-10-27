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
    aliases: ['admin', 'administrator', 'quantri', 'admin@modmove.vn'],
    password: '123456',
    role: 'Administrator',
    label: 'Quản trị viên (Admin)',
    description: 'Báo cáo doanh thu, duyệt tài xế, quản lý tài khoản & bảng giá',
    defaultPath: '/admin/dashboard',
  },
  {
    username: 'driver',
    aliases: ['driver', 'taixe', '0912345678', '912345678', 'driver@modmove.vn'],
    password: '123456',
    role: 'Driver',
    label: 'Tài xế đối tác (Driver)',
    description: 'Bàn làm việc nhận cuốc, ví thu nhập tài xế, hồ sơ giấy tờ xe',
    defaultPath: '/driver',
  },
  {
    username: 'dispatcher',
    aliases: ['dispatcher', 'dieuphoi', '0988116487', '988116487', 'dispatcher@modmove.vn'],
    password: '123456',
    role: 'Dispatcher',
    label: 'Điều phối viên (Dispatcher)',
    description: 'Bản đồ giám sát hạm đội xe trực tiếp, giải quyết sự cố, điều phối lại',
    defaultPath: '/dispatcher/live-map',
  },
  {
    username: 'customer',
    aliases: ['customer', 'khachhang', '0338967316', '338967316', 'customer@modmove.vn'],
    password: '123456',
    role: 'Customer',
    label: 'Khách hàng (Customer)',
    description: 'Đặt dịch vụ vận chuyển đồ đạc, theo dõi đơn, nạp ví PayOS',
    defaultPath: '/booking',
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
  login: (username: string, password: string) => { success: boolean; message?: string; defaultPath?: string };
  registerCustomer: (data: { fullName: string; phoneNumber: string; email: string; password: string }) => {
    success: boolean;
    message?: string;
  };
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

    registerCustomer: (data: { fullName: string; phoneNumber: string; email: string; password: string }) => {
      const cleanPhone = data.phoneNumber.trim();
      const cleanEmail = data.email.trim().toLowerCase();

      const existing = HARDCODED_ACCOUNTS.find(
        (acc) =>
          acc.username === cleanPhone ||
          acc.aliases.includes(cleanPhone) ||
          acc.aliases.includes(cleanEmail)
      );

      if (existing) {
        return {
          success: false,
          message: 'Số điện thoại hoặc email này đã tồn tại trên hệ thống. Vui lòng chuyển sang tab Đăng nhập.',
        };
      }

      const newAccount: HardcodedAccount = {
        username: cleanPhone,
        aliases: [cleanPhone, cleanEmail, data.fullName.trim().toLowerCase()],
        password: data.password || '123456',
        role: 'Customer',
        label: `${data.fullName} (Khách hàng)`,
        description: 'Tài khoản khách hàng mới đăng ký',
        defaultPath: '/booking',
      };
      HARDCODED_ACCOUNTS.push(newAccount);

      return {
        success: true,
        message: 'Tài khoản đã được đăng ký và kích hoạt thành công!',
      };
    },

    login: (usernameInput: string, passwordInput: string) => {
      const cleanUser = usernameInput.trim().toLowerCase();
      const cleanPass = passwordInput.trim();

      let matched = HARDCODED_ACCOUNTS.find(
        (acc) => acc.username === cleanUser || acc.aliases.includes(cleanUser)
      );

      // Cho phép đăng nhập linh hoạt nếu người dùng nhập số điện thoại mới với mật khẩu mặc định 123456
      if (!matched && (/^0\d{8,10}$/.test(cleanUser) || /^\+?84\d{8,10}$/.test(cleanUser))) {
        matched = {
          username: cleanUser,
          aliases: [cleanUser],
          password: cleanPass || '123456',
          role: 'Customer',
          label: `Khách hàng (${cleanUser})`,
          description: 'Tài khoản khách hàng di động',
          defaultPath: '/booking',
        };
        HARDCODED_ACCOUNTS.push(matched);
      }

      if (!matched) {
        return {
          success: false,
          message: 'Tài khoản không tồn tại. Vui lòng kiểm tra lại số điện thoại/email hoặc sử dụng 4 tài khoản có sẵn.',
        };
      }

      if (cleanPass && cleanPass !== matched.password) {
        return {
          success: false,
          message: 'Mật khẩu không chính xác. Mật khẩu mặc định hệ thống là 123456.',
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
