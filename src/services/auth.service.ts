import { BUSINESS, IS_DEMO } from '../config/business';
import { msg } from '../constants/messages';
import { isEmail, isPhone, maskEmail, password as passwordRule } from '../domain/validators';
import { AccountStatus, User, UserRole } from '../types/user.types';
import { latency, readStore, ServiceError, subscribeStore, uid, writeStore } from './mock/storage';

/**
 * Auth service – API /auth/*. Mock lưu tài khoản ở localStorage.
 * Lưu ý: trên backend mật khẩu được hash BCrypt (GB-53); mock chỉ để demo.
 */
interface StoredAccount extends User {
  password: string;
  failedAttempts: number;
  lockedUntil?: string;
  /** Lý do Admin đổi trạng thái gần nhất (UC-ADM-06) */
  statusReason?: string;
  createdAt: string;
}

interface OtpRecord {
  email: string;
  code: string;
  purpose: OtpPurpose;
  expiresAt: number;
  attempts: number;
}

export type OtpPurpose = 'register' | 'reset';

export interface Session {
  user: User;
  accessToken: string;
}

const USERS = 'users';
const OTP = 'otp';
const SESSION = 'session';

export const DEMO_PASSWORD = 'Modmove@123';

const seedUsers = (): StoredAccount[] => {
  const base = { password: DEMO_PASSWORD, failedAttempts: 0, status: 'Active' as AccountStatus, emailVerified: true, createdAt: '2026-09-01T00:00:00Z' };
  return [
    { ...base, id: 'cust_01', fullName: 'Hoàng Nguyễn Mạnh', phoneNumber: '0338967316', email: 'customer@modmove.vn', role: 'Customer', avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80' },
    { ...base, id: 'drv_88', fullName: 'Nguyễn Văn Hùng', phoneNumber: '0912345678', email: 'driver@modmove.vn', role: 'Driver', avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80' },
    { ...base, id: 'disp_01', fullName: 'Trần Trung Hiếu', phoneNumber: '0988116487', email: 'dispatcher@modmove.vn', role: 'Dispatcher', avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80' },
    { ...base, id: 'adm_01', fullName: 'Quản trị hệ thống', phoneNumber: '0356116856', email: 'admin@modmove.vn', role: 'Administrator', avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80' },
    { ...base, id: 'cust_02', fullName: 'Nguyễn Văn Nam', phoneNumber: '0912889900', email: 'nam.nguyen@gmail.com', role: 'Customer' },
    { ...base, id: 'drv_33', fullName: 'Phạm Quốc Bảo', phoneNumber: '0983112233', email: 'bao.pham@gmail.com', role: 'Driver' },
  ];
};

const users = () => readStore(USERS, seedUsers);
const saveUsers = (list: StoredAccount[]) => writeStore(USERS, list);
const toUser = ({ password, failedAttempts, lockedUntil, createdAt, statusReason, ...u }: StoredAccount): User => u;

function findByIdentifier(identifier: string): StoredAccount | undefined {
  const id = identifier.trim().toLowerCase();
  return users().find((u) => u.email.toLowerCase() === id || u.phoneNumber === id.replace(/\s/g, ''));
}

function patchUser(id: string, patch: Partial<StoredAccount>): StoredAccount {
  const list = users();
  const idx = list.findIndex((u) => u.id === id);
  if (idx < 0) throw new ServiceError(msg('MSG07'));
  list[idx] = { ...list[idx], ...patch };
  saveUsers(list);
  return list[idx];
}

function assertUnique(phone: string, email: string, exceptId?: string) {
  const list = users().filter((u) => u.id !== exceptId);
  if (list.some((u) => u.phoneNumber === phone)) throw new ServiceError(msg('MSG18', { field_name: 'Số điện thoại' }));
  if (list.some((u) => u.email.toLowerCase() === email.toLowerCase())) throw new ServiceError(msg('MSG18', { field_name: 'Email' }));
}

function issueSession(u: StoredAccount): Session {
  const session = { user: toUser(u), accessToken: `mock.${btoa(u.id)}.${Date.now()}` };
  writeStore(SESSION, session, false);
  return session;
}

export const authService = {
  subscribeUsers: (cb: () => void) => subscribeStore(USERS, cb),

  restoreSession(): Session | null {
    const s = readStore<Session | null>(SESSION, () => null);
    if (!s) return null;
    // GB-46: tài khoản Inactive/Locked không dùng được token cũ
    const u = users().find((x) => x.id === s.user.id);
    if (!u || u.status !== 'Active') {
      writeStore(SESSION, null, false);
      return null;
    }
    return { ...s, user: toUser(u) };
  },

  /** UC-CUS-01 – GB-02, GB-44, GB-46 */
  async signIn(identifier: string, password: string): Promise<Session> {
    await latency(400);
    if (!identifier.trim() || !password) throw new ServiceError(msg('MSG08'));
    const acc = findByIdentifier(identifier);
    if (!acc) throw new ServiceError(msg('MSG08'));
    if (acc.lockedUntil && new Date(acc.lockedUntil) > new Date()) throw new ServiceError(msg('MSG11'));
    if (acc.password !== password) {
      const failed = acc.failedAttempts + 1;
      if (failed >= BUSINESS.MAX_FAILED_SIGNIN) {
        patchUser(acc.id, { failedAttempts: 0, lockedUntil: new Date(Date.now() + BUSINESS.SIGNIN_LOCK_MINUTES * 60_000).toISOString() });
        throw new ServiceError(msg('MSG11'));
      }
      patchUser(acc.id, { failedAttempts: failed });
      throw new ServiceError(`${msg('MSG08')} (còn ${BUSINESS.MAX_FAILED_SIGNIN - failed} lần thử)`);
    }
    if (!acc.emailVerified) throw new ServiceError(msg('MSG09'));
    if (acc.status !== 'Active') throw new ServiceError(msg('MSG10'));
    return issueSession(patchUser(acc.id, { failedAttempts: 0, lockedUntil: undefined }));
  },

  signOut() {
    writeStore(SESSION, null, false);
  },

  /** GB-25: OTP 6 số, hết hạn 5 phút, tối đa 5 lần nhập sai */
  async requestOtp(email: string, purpose: OtpPurpose): Promise<{ maskedEmail: string; devCode?: string }> {
    await latency(400);
    if (!isEmail(email)) throw new ServiceError(msg('MSG02', { field_name: 'email' }));
    if (purpose === 'reset' && !findByIdentifier(email)) {
      // Không tiết lộ email có tồn tại hay không
      return { maskedEmail: maskEmail(email) };
    }
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const records = readStore<OtpRecord[]>(OTP, () => []).filter((r) => r.email !== email || r.purpose !== purpose);
    writeStore(OTP, [...records, { email, code, purpose, expiresAt: Date.now() + BUSINESS.OTP_TTL_SECONDS * 1000, attempts: 0 }], false);
    return { maskedEmail: maskEmail(email), devCode: IS_DEMO ? code : undefined };
  },

  verifyOtp(email: string, purpose: OtpPurpose, code: string): void {
    const records = readStore<OtpRecord[]>(OTP, () => []);
    const rec = records.find((r) => r.email === email && r.purpose === purpose);
    if (!rec || rec.expiresAt < Date.now() || rec.attempts >= BUSINESS.OTP_MAX_ATTEMPTS) throw new ServiceError(msg('MSG16'));
    if (rec.code !== code) {
      writeStore(OTP, records.map((r) => (r === rec ? { ...r, attempts: r.attempts + 1 } : r)), false);
      throw new ServiceError(msg('MSG16'));
    }
    writeStore(OTP, records.filter((r) => r !== rec), false); // dùng một lần
  },

  /** UC-GST-01 – chỉ tạo Customer (GB-45) */
  async validateRegistration(data: { fullName: string; phoneNumber: string; email: string; password: string }) {
    if (!data.fullName.trim()) throw new ServiceError(msg('MSG01', { field_name: 'Họ và tên' }));
    if (!isPhone(data.phoneNumber)) throw new ServiceError(msg('MSG02', { field_name: 'số điện thoại' }));
    if (!isEmail(data.email)) throw new ServiceError(msg('MSG02', { field_name: 'email' }));
    const pwdErr = passwordRule(data.password);
    if (pwdErr) throw new ServiceError(pwdErr);
    assertUnique(data.phoneNumber, data.email);
  },

  async registerCustomer(data: { fullName: string; phoneNumber: string; email: string; password: string }, otp: string): Promise<User> {
    await latency(400);
    await this.validateRegistration(data);
    this.verifyOtp(data.email, 'register', otp);
    const acc: StoredAccount = {
      id: uid('cust'),
      fullName: data.fullName.trim(),
      phoneNumber: data.phoneNumber.trim(),
      email: data.email.trim().toLowerCase(),
      role: 'Customer',
      status: 'Active',
      emailVerified: true,
      password: data.password,
      failedAttempts: 0,
      createdAt: new Date().toISOString(),
    };
    saveUsers([...users(), acc]);
    return toUser(acc);
  },

  /** UC-CUS-02 */
  async resetPassword(email: string, otp: string, newPassword: string): Promise<void> {
    await latency(400);
    const err = passwordRule(newPassword);
    if (err) throw new ServiceError(err);
    this.verifyOtp(email, 'reset', otp);
    const acc = findByIdentifier(email);
    if (acc) patchUser(acc.id, { password: newPassword, failedAttempts: 0, lockedUntil: undefined });
  },

  /** UC-CUS-04 / GB-47: đổi mật khẩu thu hồi mọi phiên */
  async changePassword(userId: string, oldPassword: string, newPassword: string): Promise<void> {
    await latency(400);
    const acc = users().find((u) => u.id === userId);
    if (!acc || acc.password !== oldPassword) throw new ServiceError(msg('MSG08'));
    const err = passwordRule(newPassword);
    if (err) throw new ServiceError(err);
    if (oldPassword === newPassword) throw new ServiceError(msg('MSG19', { password_error_message: 'Mật khẩu mới phải khác mật khẩu cũ' }));
    patchUser(userId, { password: newPassword });
    this.signOut();
  },

  /** UC-CUS-06 / GB-01 */
  async updateProfile(userId: string, patch: { fullName: string; phoneNumber: string; avatarUrl?: string }): Promise<User> {
    await latency(400);
    if (!patch.fullName.trim()) throw new ServiceError(msg('MSG01', { field_name: 'Họ và tên' }));
    if (!isPhone(patch.phoneNumber)) throw new ServiceError(msg('MSG02', { field_name: 'số điện thoại' }));
    const acc = users().find((u) => u.id === userId);
    if (!acc) throw new ServiceError(msg('MSG07'));
    assertUnique(patch.phoneNumber, acc.email, userId);
    const updated = toUser(patchUser(userId, { fullName: patch.fullName.trim(), phoneNumber: patch.phoneNumber.trim(), avatarUrl: patch.avatarUrl ?? acc.avatarUrl }));
    const s = readStore<Session | null>(SESSION, () => null);
    if (s) writeStore(SESSION, { ...s, user: updated }, false);
    return updated;
  },

  /** UC-CUS-07 / GB-46: xoá = chuyển Inactive, giữ lịch sử */
  async deleteAccount(userId: string, password: string): Promise<void> {
    await latency(400);
    const acc = users().find((u) => u.id === userId);
    if (!acc || acc.password !== password) throw new ServiceError(msg('MSG08'));
    patchUser(userId, { status: 'Inactive' });
    this.signOut();
  },

  // -------------------------------------------------------------- Admin
  listUsersSync: (): (User & { createdAt: string; statusReason?: string })[] => users().map((u) => ({ ...toUser(u), createdAt: u.createdAt, statusReason: u.statusReason })),

  /** UC-ADM-06 / MSG65 – đổi trạng thái bắt buộc có lý do; khoá sẽ thu hồi mọi phiên (GB-47) */
  async setAccountStatus(actorId: string, userId: string, status: AccountStatus, reason: string): Promise<User> {
    await latency();
    if (actorId === userId) throw new ServiceError(msg('MSG65'));
    if (!reason.trim()) throw new ServiceError(msg('MSG01', { field_name: 'Lý do' }));
    return toUser(patchUser(userId, { status, statusReason: reason.trim(), failedAttempts: 0, lockedUntil: undefined }));
  },

  /** UC-ADM-07 / GB-45 */
  async createDispatcher(data: { fullName: string; phoneNumber: string; email: string; password: string }): Promise<User> {
    await latency();
    if (!data.fullName.trim()) throw new ServiceError(msg('MSG01', { field_name: 'Họ và tên' }));
    if (!isPhone(data.phoneNumber)) throw new ServiceError(msg('MSG02', { field_name: 'số điện thoại' }));
    if (!isEmail(data.email)) throw new ServiceError(msg('MSG02', { field_name: 'email' }));
    const err = passwordRule(data.password);
    if (err) throw new ServiceError(err);
    assertUnique(data.phoneNumber, data.email);
    const acc: StoredAccount = {
      id: uid('disp'),
      fullName: data.fullName.trim(),
      phoneNumber: data.phoneNumber.trim(),
      email: data.email.trim().toLowerCase(),
      role: 'Dispatcher' as UserRole,
      status: 'Active',
      emailVerified: true,
      password: data.password,
      failedAttempts: 0,
      createdAt: new Date().toISOString(),
    };
    saveUsers([...users(), acc]);
    return toUser(acc);
  },
};
