/**
 * Tham số nghiệp vụ lấy từ SRS – V.1 Business Rules.
 * Admin có thể thay đổi một số giá trị (COMMISSION_RATE, LOADING_FEE) qua trang cấu hình;
 * đây là giá trị mặc định.
 */
export const BUSINESS = {
  /** GB-14: hoa hồng mặc định 10% */
  DEFAULT_COMMISSION_RATE: 0.1,
  /** GB-29: phí bốc xếp (Admin cấu hình) */
  DEFAULT_LOADING_FEE: 50_000,
  /** GB-16 */
  MIN_COD_DEPOSIT: 200_000,
  /** GB-32 */
  MIN_DEPOSIT_TOPUP: 50_000,
  /** GB-08 */
  MATCHING_RADIUS_KM: 5,
  /** GB-24: Pending quá 10 phút bị huỷ */
  MATCHING_TIMEOUT_MIN: 10,
  /** LI-04: job alert 30 giây */
  JOB_ALERT_SECONDS: 30,
  /** GB-13: mã PayOS hết hạn sau 10 phút */
  PAYOS_CODE_TTL_SECONDS: 10 * 60,
  /** GB-13: đơn chưa thanh toán sau 30 phút bị huỷ */
  UNPAID_ORDER_TIMEOUT_MIN: 30,
  /** GB-06 */
  MAX_PHOTO_SIZE_MB: 5,
  MIN_CARGO_PHOTOS: 1,
  MAX_CARGO_PHOTOS: 5,
  ALLOWED_PHOTO_TYPES: ['image/jpeg', 'image/png'] as readonly string[],
  /** GB-11 */
  MIN_PICKUP_PHOTOS: 2,
  MAX_PICKUP_PHOTOS: 5,
  MAX_PICKUP_SUBMISSIONS: 5,
  /** GB-18: khiếu nại trong 24h sau giao */
  COMPLAINT_WINDOW_HOURS: 24,
  /** GB-20: đánh giá trong 1 ngày sau hoàn thành */
  RATING_WINDOW_HOURS: 24,
  /** GB-23 */
  AUTO_COMPLETE_HOURS: 24,
  /** GB-25 */
  OTP_LENGTH: 6,
  OTP_TTL_SECONDS: 5 * 60,
  OTP_MAX_ATTEMPTS: 5,
  /** GB-02 */
  MAX_FAILED_SIGNIN: 5,
  SIGNIN_LOCK_MINUTES: 10,
  /** GB-53 */
  PASSWORD_MIN: 8,
  PASSWORD_MAX: 20,
  /** Ô đăng nhập: BE vẫn nhận tới 100 ký tự cho tài khoản cũ */
  PASSWORD_LOGIN_MAX: 100,
  /** GB-39 */
  LOCATION_STALE_SECONDS: 30,
  /** GB-43 */
  MAX_EVIDENCE_PHOTOS: 5,
  /** LI-01: khu vực phục vụ */
  SERVICE_CITY: 'Hà Nội',
} as const;

/** Thông tin chuyển khoản hiển thị trên mã VietQR (mock PayOS) */
export const PAYOS_RECEIVER = {
  bankName: 'MB Bank',
  accountNumber: '0338967316',
  accountName: 'CONG TY MODMOVE',
} as const;

export const IS_DEMO = import.meta.env.DEV || import.meta.env.VITE_DEMO_MODE === 'true';
