/**
 * Giới hạn nghiệp vụ mà web kiểm tra hoặc hiển thị. Nguồn thật là BE (`GET /public/Config`, cùng `BusinessRules` của BE):
 * `applyPublicConfig` ghi đè các giá trị dưới đây ngay khi nhận được. Số ban đầu chỉ là dự phòng để biểu mẫu vẫn
 * kiểm tra được khi chưa gọi được BE; BE luôn kiểm tra lại.
 * Tiền (phí bốc xếp, tiền cọc) và bán kính ghép đơn do Admin chỉnh nên KHÔNG có số dự phòng, xem `PublicConfig`.
 */
export interface PublicRules {
  maxCargoPhotos: number;
  maxPhotoSizeMb: number;
  maxOrderNoteLength: number;
  minPickupPhotos: number;
  maxPickupSubmissions: number;
  maxEvidencePhotos: number;
  matchingTimeoutMinutes: number;
  unpaidPaymentMinutes: number;
  payOsCodeMinutes: number;
  complaintWindowHours: number;
  ratingWindowHours: number;
  autoCompleteHours: number;
  arrivalRadiusMeters: number;
  passwordMinLength: number;
  passwordMaxLength: number;
  otpLifetimeMinutes: number;
  maxFailedLogins: number;
  loginLockMinutes: number;
}

/** Phản hồi của `GET /public/Config`. */
export interface PublicConfig {
  /** VND cộng thêm khi khách chọn dịch vụ bốc xếp (Admin chỉnh) */
  loadingFee: number;
  /** VND tài xế cần giữ để nhận đơn tiền mặt (Admin chỉnh) */
  requiredDeposit: number;
  matchingRadiusKm: number;
  rules: PublicRules;
}

export const BUSINESS = {
  MAX_CARGO_PHOTOS: 5,
  MIN_CARGO_PHOTOS: 1,
  MAX_PHOTO_SIZE_MB: 5,
  MAX_NOTE_LENGTH: 500,
  ALLOWED_PHOTO_TYPES: ['image/jpeg', 'image/png'] as readonly string[],
  MAX_PICKUP_SUBMISSIONS: 5,
  MAX_EVIDENCE_PHOTOS: 5,
  MATCHING_TIMEOUT_MIN: 10,
  UNPAID_ORDER_TIMEOUT_MIN: 30,
  PAYOS_CODE_TTL_MIN: 10,
  COMPLAINT_WINDOW_HOURS: 24,
  RATING_WINDOW_HOURS: 24,
  AUTO_COMPLETE_HOURS: 24,
  PASSWORD_MIN: 8,
  PASSWORD_MAX: 20,
  /** Số chữ số của mã OTP (định dạng, không phải giới hạn) */
  OTP_LENGTH: 6,
  OTP_TTL_SECONDS: 5 * 60,
  MAX_FAILED_SIGNIN: 5,
  SIGNIN_LOCK_MINUTES: 10,
  /** Ô đăng nhập: BE vẫn nhận tới 100 ký tự cho tài khoản cũ */
  PASSWORD_LOGIN_MAX: 100,
};

/** Ghi đè giới hạn bằng số thật của BE. */
export function applyPublicConfig(cfg: PublicConfig): void {
  const r = cfg.rules;
  BUSINESS.MAX_CARGO_PHOTOS = r.maxCargoPhotos;
  BUSINESS.MAX_PHOTO_SIZE_MB = r.maxPhotoSizeMb;
  BUSINESS.MAX_NOTE_LENGTH = r.maxOrderNoteLength;
  BUSINESS.MAX_PICKUP_SUBMISSIONS = r.maxPickupSubmissions;
  BUSINESS.MAX_EVIDENCE_PHOTOS = r.maxEvidencePhotos;
  BUSINESS.MATCHING_TIMEOUT_MIN = r.matchingTimeoutMinutes;
  BUSINESS.UNPAID_ORDER_TIMEOUT_MIN = r.unpaidPaymentMinutes;
  BUSINESS.PAYOS_CODE_TTL_MIN = r.payOsCodeMinutes;
  BUSINESS.COMPLAINT_WINDOW_HOURS = r.complaintWindowHours;
  BUSINESS.RATING_WINDOW_HOURS = r.ratingWindowHours;
  BUSINESS.AUTO_COMPLETE_HOURS = r.autoCompleteHours;
  BUSINESS.PASSWORD_MIN = r.passwordMinLength;
  BUSINESS.PASSWORD_MAX = r.passwordMaxLength;
  BUSINESS.OTP_TTL_SECONDS = r.otpLifetimeMinutes * 60;
  BUSINESS.MAX_FAILED_SIGNIN = r.maxFailedLogins;
  BUSINESS.SIGNIN_LOCK_MINUTES = r.loginLockMinutes;
}

export const IS_DEMO = import.meta.env.DEV || import.meta.env.VITE_DEMO_MODE === 'true';
