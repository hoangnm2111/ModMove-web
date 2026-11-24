import { BUSINESS } from '../config/business';
import { msg } from '../constants/messages';

/** Trả về chuỗi lỗi hoặc null nếu hợp lệ */
export type Validator = (value: string) => string | null;

const VN_PHONE = /^(0|\+84)(3|5|7|8|9)\d{8}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const required = (field: string): Validator => (v) =>
  v.trim() ? null : msg('MSG01', { field_name: field });

export const isPhone = (v: string) => VN_PHONE.test(v.replace(/[\s.]/g, ''));

/** BE nhận số dạng 0xxxxxxxxx: bỏ khoảng trắng, dấu chấm và đổi +84 thành 0 */
export const normalizePhone = (v: string) => v.replace(/[\s.]/g, '').replace(/^\+84/, '0');
export const isEmail = (v: string) => EMAIL.test(v.trim());

export const phone = (field = 'Số điện thoại'): Validator => (v) =>
  !v.trim() ? msg('MSG01', { field_name: field }) : isPhone(v) ? null : msg('MSG02', { field_name: field.toLowerCase() });

export const email = (field = 'Email'): Validator => (v) =>
  !v.trim() ? msg('MSG01', { field_name: field }) : isEmail(v) ? null : msg('MSG02', { field_name: field.toLowerCase() });

/** GB-53: mật khẩu 8–20 ký tự (chốt nghiệp vụ K-13) */
export const password: Validator = (v) => {
  if (!v) return msg('MSG01', { field_name: 'Mật khẩu' });
  if (v.length < BUSINESS.PASSWORD_MIN || v.length > BUSINESS.PASSWORD_MAX) {
    return msg('MSG19', {
      password_error_message: `Mật khẩu phải dài từ ${BUSINESS.PASSWORD_MIN} đến ${BUSINESS.PASSWORD_MAX} ký tự`,
    });
  }
  return null;
};

export const confirmPassword = (pwd: string): Validator => (v) =>
  v === pwd ? null : msg('MSG19', { password_error_message: 'Mật khẩu xác nhận không khớp' });

/** Chạy lần lượt các validator, trả lỗi đầu tiên */
export function validate(value: string, ...validators: Validator[]): string | null {
  for (const fn of validators) {
    const err = fn(value);
    if (err) return err;
  }
  return null;
}

/** GB-06: ảnh JPG/PNG, tối đa 5MB */
export function validatePhotoFile(file: File): string | null {
  if (!BUSINESS.ALLOWED_PHOTO_TYPES.includes(file.type)) {
    return msg('MSG03', { field_name: `Ảnh "${file.name}"`, constraints: 'chỉ chấp nhận JPG hoặc PNG' });
  }
  if (file.size > BUSINESS.MAX_PHOTO_SIZE_MB * 1024 * 1024) {
    return msg('MSG03', { field_name: `Ảnh "${file.name}"`, constraints: `tối đa ${BUSINESS.MAX_PHOTO_SIZE_MB}MB` });
  }
  return null;
}

export function maskEmail(value: string): string {
  const [name, domain] = value.split('@');
  if (!domain) return value;
  return `${name.slice(0, 2)}${'*'.repeat(Math.max(1, name.length - 2))}@${domain}`;
}
