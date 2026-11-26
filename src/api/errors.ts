import { BUSINESS } from '../config/business';

/**
 * Map `code` của ProblemDetails (ModMove-backend/docs/api/README.md "Mã lỗi") sang câu tiếng Việt.
 * Client rẽ nhánh theo `code`, không theo `detail` tiếng Anh (DECISIONS 9.4).
 */
export const ERROR_MESSAGES: Record<string, string> = {
  // Các câu có số liệu lấy từ BE (BUSINESS được ghi đè bởi GET /public/Config): viết bằng getter để luôn đọc số mới nhất
  get PICKUP_PHOTO_LIMIT() {
    const n = BUSINESS.MAX_PICKUP_SUBMISSIONS;
    return `Đã hết ${n} lần gửi ảnh lấy hàng. Khách đã từ chối cả ${n} lần nên không thể cho tiếp tục chuyến: hãy đổi tài xế hoặc huỷ đơn.`;
  },
  get RATING_WINDOW_CLOSED() {
    return `Đã quá ${BUSINESS.RATING_WINDOW_HOURS} giờ kể từ khi hoàn thành, không thể đánh giá.`;
  },
  get COMPLAINT_WINDOW_CLOSED() {
    return `Chỉ khiếu nại được khi đơn đã giao và trong vòng ${BUSINESS.COMPLAINT_WINDOW_HOURS} giờ.`;
  },
  get TOO_MANY_PHOTOS() {
    return `Tối đa ${BUSINESS.MAX_EVIDENCE_PHOTOS} ảnh bằng chứng.`;
  },
  get FILE_TOO_LARGE() {
    return `Ảnh vượt quá ${BUSINESS.MAX_PHOTO_SIZE_MB} MB. Vui lòng chọn ảnh nhỏ hơn.`;
  },
  VALIDATION: 'Dữ liệu chưa hợp lệ. Vui lòng kiểm tra lại các trường.',
  UNAUTHORIZED: 'Sai thông tin đăng nhập hoặc phiên đã hết hạn.',
  FORBIDDEN: 'Bạn không có quyền thực hiện thao tác này.',
  EMAIL_NOT_VERIFIED: 'Email chưa được xác minh. Vui lòng nhập mã OTP đã gửi tới email.',
  // BE 2026-11-12: tài khoản chỉ được tạo sau khi xác minh OTP; mật khẩu sai → đăng ký lại với mật khẩu mong muốn
  ACCOUNT_INACTIVE: 'Tài khoản đã bị khóa hoặc vô hiệu hóa. Liên hệ hỗ trợ.',
  ACCOUNT_HAS_PENDING_WITHDRAWAL: 'Còn yêu cầu rút tiền đang chờ Quản trị viên chuyển. Hãy chờ xử lý xong rồi xoá tài khoản.',
  ACCOUNT_HAS_WALLET_BALANCE: 'Ví còn tiền hoặc tiền cọc đang âm. Hãy rút hết hoặc nạp cho đủ trước khi xoá tài khoản.',
  DRIVER_HAS_ACTIVE_ORDER: 'Đang có đơn chạy nên chưa thể tắt nhận đơn. Hãy hoàn tất chuyến trước.',
  REFUND_ZERO_PROPOSAL: 'Điều phối viên đề xuất hoàn 0đ: khoản này chỉ có thể từ chối.',
  NOT_FOUND: 'Không tìm thấy dữ liệu.',
  CONFLICT: 'Dữ liệu vừa bị thay đổi hoặc bị trùng. Vui lòng tải lại rồi thử lại.',
  // MSG18 (GB-01): BE nói rõ trường nào bị trùng
  EMAIL_TAKEN: 'Email này đã được đăng ký.',
  PHONE_TAKEN: 'Số điện thoại này đã được đăng ký.',
  TOO_MANY_REQUESTS: 'Bạn thao tác quá nhanh. Vui lòng thử lại sau ít phút.',
  BUSINESS_RULE: 'Thao tác không được phép ở trạng thái hiện tại.',
  OTP_INVALID: 'Mã OTP sai, hết hạn hoặc đã dùng. Hãy xin mã mới.',
  VERIFY_PASSWORD_MISMATCH: 'Mã đúng nhưng mật khẩu không khớp với mật khẩu lúc đăng ký. Hãy đăng ký lại với mật khẩu bạn muốn dùng.',
  WRONG_PASSWORD: 'Mật khẩu hiện tại không đúng.',
  ACCOUNT_HAS_OPEN_ORDERS: 'Còn đơn hàng đang chạy nên chưa thể xoá hoặc khoá tài khoản này.',
  ACCOUNT_HAS_OPEN_REFUNDS: 'Không thể xoá tài khoản khi còn yêu cầu hoàn tiền đang mở.',
  COMPLAINT_OPEN: 'Đơn đang có khiếu nại mở, chưa thể xác nhận nhận hàng. Đơn sẽ hoàn tất khi khiếu nại được đóng.',
  ORDER_NOT_CANCELLABLE: 'Đơn không còn huỷ được (tài xế đã đến điểm lấy hoặc đơn đã kết thúc). Hãy báo sự cố.',
  ORDER_NOT_YOURS: 'Đơn hàng không thuộc tài khoản của bạn.',
  ORDER_CANCELLED: 'Đơn hàng đã bị huỷ.',
  PAYMENT_AMOUNT_MISMATCH: 'Số tiền thanh toán không khớp.',
  INCIDENT_PENDING: 'Tài xế đã báo sự cố, chuyến đang tạm dừng chờ điều phối viên.',
  WITHDRAWAL_EXCEEDS_BALANCE: 'Số tiền rút vượt số dư được phép rút. Khi đang có đơn chạy chỉ rút được phần thu nhập.',
  TOP_UP_BELOW_MISSING_DEPOSIT: 'Số tiền nạp nhỏ hơn phần tiền cọc còn thiếu. Hãy nạp ít nhất phần thiếu.',
  REFUND_BANK_ACCOUNT_REQUIRED: 'Khách chưa khai tài khoản nhận hoàn tiền nên chưa thể chuyển khoản hoặc báo chuyển khoản lỗi.',
  REFUND_PAYOUT_LOCKED: 'Khoản hoàn đã xử lý xong hoặc đã đóng, không sửa được tài khoản nhận.',
  REFUND_PAYOUT_UNCHANGED: 'Chuyển khoản lần trước bị lỗi với tài khoản này. Hãy nhập tài khoản khác.',
  NO_SUGGESTED_PAYOUT_ACCOUNT: 'Đơn này không có tài khoản đã thanh toán để gợi ý. Hãy nhập tài khoản nhận tay.',
  RATING_NOT_ALLOWED: 'Chỉ đánh giá được đơn đã hoàn thành.',
  REFUND_AMOUNT_INVALID: 'Số tiền yêu cầu phải lớn hơn 0 và không vượt tổng cước đơn.',
  REFUND_TOTAL_EXCEEDED: 'Tổng các khoản hoàn của đơn sẽ vượt tổng cước.',
  INCIDENT_NOT_ALLOWED: 'Đơn không ở trạng thái cho phép báo sự cố (khách: Đã đến…Đang giao; tài xế và điều phối: Đã nhận…Đang giao).',
  REFUND_NOT_FOR_DISPATCHER: 'Hoàn tiền do huỷ đơn được chuyển thẳng cho Quản trị viên, Điều phối viên không xử lý.',
  NO_INFO_REQUEST: 'Chưa có yêu cầu bổ sung thông tin nào để trả lời.',
  FARE_CHANGED: 'Giá cước vừa thay đổi. Vui lòng xem lại giá mới trước khi đặt.',
  ADDRESS_NOT_FOUND: 'Không tìm thấy địa chỉ lấy hoặc giao hàng. Hãy nhập cụ thể hơn.',
  ROUTE_NOT_FOUND: 'Không tìm được tuyến đường bộ giữa hai điểm.',
  VEHICLE_TOO_SMALL: 'Hàng vượt tải trọng hoặc không lọt thùng của loại xe đã chọn.',
  COUPON_NOT_FOUND: 'Mã giảm giá không tồn tại.',
  COUPON_INACTIVE: 'Mã giảm giá đang tắt.',
  COUPON_EXPIRED: 'Mã giảm giá chưa tới hạn hoặc đã hết hạn.',
  COUPON_LIMIT_REACHED: 'Mã giảm giá đã hết lượt sử dụng.',
  COUPON_MIN_ORDER_NOT_MET: 'Đơn chưa đạt giá trị tối thiểu để dùng mã này.',
  COMMISSION_RATE_LOCKED: 'Không thể đổi tỷ lệ hoa hồng khi còn đơn đang chạy (từ Đã nhận đến trước Đã giao).',
  APPLICATION_NOT_EDITABLE: 'Hồ sơ đang chờ duyệt hoặc đã được duyệt, không thể nộp lại.',
  CANNOT_CHANGE_OWN_STATUS: 'Không thể tự khoá/vô hiệu hoá tài khoản của chính mình.',
  ORDER_NOT_ACTIVE: 'Chuyến không còn đang chạy nên không thể cho tiếp tục.',
  DRIVER_NOT_ELIGIBLE: 'Tài xế không đủ điều kiện (Online, đã duyệt, đúng loại xe, GPS mới, trong bán kính, ví cọc).',
  CARGO_DISPOSITION_REQUIRED: 'Hàng đang trên xe: phải chọn trả về điểm lấy hay giữ lại.',
  REFUND_NOT_ALLOWED: 'Chỉ hoàn tiền cho đơn PayOS đã thanh toán.',
  WRONG_BANK_ACCOUNT: 'Số tài khoản ngân hàng không đúng hoặc chưa được khai.',
  COLLECT_CASH_WRONG_LOCATION: 'Cần ở trong bán kính 500 m quanh điểm thu tiền.',
  RESUBMIT_MISSING_REJECTED_ITEMS: 'Hãy cập nhật đủ các mục đã bị từ chối rồi nộp lại.',
  UNSUPPORTED_FILE_TYPE: 'Chỉ nhận ảnh JPG hoặc PNG hợp lệ.',
  UPLOAD_FAILED: 'Không tải được ảnh lên. Vui lòng thử lại.',
  SERVER_ERROR: 'Lỗi máy chủ. Vui lòng thử lại sau.',
};

/** Lấy mã lỗi từ một lỗi bất kỳ (ServiceError giữ `code`) */
export const errorCode = (e: unknown): string | undefined => (e as { code?: string } | null)?.code;
