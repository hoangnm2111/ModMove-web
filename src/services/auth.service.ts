import { normalizePhone, passwordPolicy as passwordRule } from '../domain/validators';
import { AccountStatus, User, UserRole } from '../types/user.types';
import { apiClient, toServiceError } from './api';
import { PagedResult } from './pagination';
import { readStore, ServiceError, subscribeStore, writeStore } from './mock/storage';

/** Auth service – api/public/auth/*, api/account/*, api/admin/users/*. */
export type OtpPurpose = 'register' | 'reset';
const OTP_PURPOSE_API: Record<OtpPurpose, 'Register' | 'ResetPassword'> = { register: 'Register', reset: 'ResetPassword' };

export interface Session {
  user: User;
  accessToken: string;
  refreshToken: string;
}

const SESSION = 'session';
const USERS_CACHE = 'adminUsers';

/** Giữ để các trang demo cũ hiển thị gợi ý mật khẩu; không còn dùng để đăng nhập thật. */
export const DEMO_PASSWORD = 'ModMove@123';

interface LoginResponseDto {
  accessToken: string;
  refreshToken: string;
  userId: number;
  fullName: string;
  role: UserRole;
}

interface ProfileResponseDto {
  id: number;
  fullName: string;
  phoneNumber: string;
  email: string;
  role: UserRole;
  emailVerified: boolean;
}

function toUser(p: ProfileResponseDto): User {
  return {
    id: String(p.id),
    fullName: p.fullName,
    phoneNumber: p.phoneNumber,
    email: p.email,
    role: p.role,
    status: 'Active',
    emailVerified: p.emailVerified,
  };
}

async function fetchProfile(accessToken?: string): Promise<ProfileResponseDto> {
  const { data } = await apiClient.get<ProfileResponseDto>('/account/Profile', accessToken ? { headers: { Authorization: `Bearer ${accessToken}` } } : undefined);
  return data;
}

export const authService = {
  subscribeUsers: (cb: () => void) => subscribeStore(USERS_CACHE, cb),

  restoreSession(): Session | null {
    return readStore<Session | null>(SESSION, () => null);
  },

  saveSession(session: Session | null) {
    writeStore(SESSION, session, false);
  },

  /** UC-CUS-01 */
  async signIn(identifier: string, password: string): Promise<Session> {
    try {
      const { data } = await apiClient.post<LoginResponseDto>('/public/Auth/login', { email: identifier.trim(), password });
      const profile = await fetchProfile(data.accessToken);
      const session: Session = { user: toUser(profile), accessToken: data.accessToken, refreshToken: data.refreshToken };
      writeStore(SESSION, session, false);
      return session;
    } catch (e) {
      throw toServiceError(e);
    }
  },

  async signOut(): Promise<void> {
    const session = readStore<Session | null>(SESSION, () => null);
    writeStore(SESSION, null, false);
    if (!session) return;
    try {
      await apiClient.post('/account/Logout', undefined, { headers: { Authorization: `Bearer ${session.accessToken}` } });
    } catch {
      /* đã xoá session cục bộ, bỏ qua lỗi gọi API đăng xuất */
    }
  },

  /** Nạp lại hồ sơ mới nhất (sau khi đổi profile, hoặc khi mở lại ứng dụng) */
  async refreshProfile(): Promise<User | null> {
    const session = readStore<Session | null>(SESSION, () => null);
    if (!session) return null;
    try {
      const profile = await fetchProfile();
      const user = toUser(profile);
      writeStore(SESSION, { ...session, user }, false);
      return user;
    } catch (e) {
      if ((e as { response?: { status?: number } })?.response?.status === 401) writeStore(SESSION, null, false);
      return null;
    }
  },

  /** UC-GST-01 bước 1: chỉ gửi OTP email; tài khoản Customer được tạo khi xác minh OTP thành công (BE 2026-11-12, D1). */
  async registerCustomer(data: { fullName: string; phoneNumber: string; email: string; password: string }): Promise<{ email: string }> {
    const err = passwordRule(data.password);
    if (err) throw new ServiceError(err);
    try {
      const { data: res } = await apiClient.post('/public/Auth/register', {
        fullName: data.fullName.trim(),
        phoneNumber: normalizePhone(data.phoneNumber), // BE chỉ nhận 0xxxxxxxxx: bỏ dấu cách/chấm, đổi +84 thành 0
        email: data.email.trim().toLowerCase(),
        password: data.password,
      });
      return res;
    } catch (e) {
      throw toServiceError(e);
    }
  },

  /** UC-GST-01 bước 2: xác thực OTP email vừa nhận. `password` là mật khẩu đã đăng ký; sai → 422 VERIFY_PASSWORD_MISMATCH (A-02). */
  async verifyEmail(email: string, code: string, password: string): Promise<void> {
    try {
      await apiClient.post('/public/Auth/verify-email', { email: email.trim().toLowerCase(), code, password });
    } catch (e) {
      throw toServiceError(e);
    }
  },

  /** Gửi lại mã OTP (đăng ký hoặc đặt lại mật khẩu) – luôn trả về 204 dù email không tồn tại. */
  /** Đăng ký: email đã có tài khoản chưa. Lỗi mạng/BE cũ → coi như chưa biết (true), BE vẫn chặn khi gửi form */
  async isEmailAvailable(email: string): Promise<boolean> {
    try {
      const { data } = await apiClient.get<{ available: boolean }>('/public/Auth/email-available', { params: { email: email.trim().toLowerCase() } });
      return data.available;
    } catch {
      return true;
    }
  },

  async resendOtp(email: string, purpose: OtpPurpose): Promise<void> {
    try {
      await apiClient.post('/public/Auth/otp/resend', { email: email.trim().toLowerCase(), purpose: OTP_PURPOSE_API[purpose] });
    } catch (e) {
      throw toServiceError(e);
    }
  },

  /** UC-CUS-02 bước 1 */
  async forgotPassword(email: string): Promise<void> {
    try {
      await apiClient.post('/public/Auth/forgot-password', { email: email.trim().toLowerCase() });
    } catch (e) {
      throw toServiceError(e);
    }
  },

  /** UC-CUS-02 bước 2 */
  async resetPassword(email: string, code: string, newPassword: string): Promise<void> {
    const err = passwordRule(newPassword);
    if (err) throw new ServiceError(err);
    try {
      await apiClient.post('/public/Auth/reset-password', { email: email.trim().toLowerCase(), code, newPassword });
    } catch (e) {
      throw toServiceError(e);
    }
  },

  /** UC-CUS-04 / GB-47: đổi mật khẩu thu hồi mọi phiên khác */
  async changePassword(_userId: string, oldPassword: string, newPassword: string): Promise<void> {
    const err = passwordRule(newPassword);
    if (err) throw new ServiceError(err);
    try {
      await apiClient.post('/account/Password', { currentPassword: oldPassword, newPassword });
    } catch (e) {
      throw toServiceError(e);
    }
  },

  /** UC-CUS-06 / GB-01 */
  async updateProfile(_userId: string, patch: { fullName: string; phoneNumber: string }): Promise<User> {
    try {
      await apiClient.put('/account/Profile', { fullName: patch.fullName.trim(), phoneNumber: patch.phoneNumber.trim() });
      const user = await authService.refreshProfile();
      if (!user) throw new ServiceError('Không nạp lại được hồ sơ.');
      return user;
    } catch (e) {
      throw toServiceError(e);
    }
  },

  /** UC-CUS-07: Customer tự xoá tài khoản (chuyển Inactive) */
  async deleteAccount(_userId: string, _password: string): Promise<void> {
    try {
      await apiClient.delete('/customer/Account');
      writeStore(SESSION, null, false);
    } catch (e) {
      throw toServiceError(e);
    }
  },

  // -------------------------------------------------------------- Admin
  listUsersSync: (): (User & { createdAt: string; statusReason?: string })[] => readStore(USERS_CACHE, () => []),

  async loadUsers(params: { page?: number; pageSize?: number; search?: string; role?: UserRole; status?: AccountStatus } = {}): Promise<void> {
    try {
      const { data } = await apiClient.get<PagedResult<{
        id: number;
        fullName: string;
        phoneNumber: string;
        email: string;
        role: UserRole;
        accountStatus: AccountStatus;
        emailVerified: boolean;
        createdAt: string;
      }>>('/admin/Users', { params: { page: 1, pageSize: 50, ...params } });
      writeStore(
        USERS_CACHE,
        data.items.map((u) => ({
          id: String(u.id),
          fullName: u.fullName,
          phoneNumber: u.phoneNumber,
          email: u.email,
          role: u.role,
          status: u.accountStatus,
          emailVerified: u.emailVerified,
          createdAt: u.createdAt,
        }))
      );
    } catch {
      /* giữ cache cũ nếu lỗi mạng */
    }
  },

  /** UC-ADM-06 / MSG65 */
  async setAccountStatus(_actorId: string, userId: string, status: AccountStatus, reason: string): Promise<void> {
    try {
      await apiClient.patch(`/admin/Users/${userId}/status`, { status, reason });
      await authService.loadUsers();
    } catch (e) {
      throw toServiceError(e);
    }
  },

  /** UC-ADM-07 */
  async createDispatcher(data: { fullName: string; phoneNumber: string; email: string; password: string }): Promise<void> {
    const err = passwordRule(data.password);
    if (err) throw new ServiceError(err);
    try {
      await apiClient.post('/admin/Users/dispatchers', {
        fullName: data.fullName.trim(),
        phoneNumber: data.phoneNumber.trim(),
        email: data.email.trim().toLowerCase(),
        password: data.password,
      });
      await authService.loadUsers();
    } catch (e) {
      throw toServiceError(e);
    }
  },
};
