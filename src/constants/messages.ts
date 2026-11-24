import { BUSINESS } from '../config/business';

/**
 * Thông điệp hệ thống – SRS V.2 System Messages (bản tiếng Việt).
 * Dùng `msg('MSG36', { order_id })` để điền tham số {…}.
 */
export const MESSAGES = {
  MSG01: '{field_name} là bắt buộc.',
  MSG02: 'Vui lòng nhập {field_name} hợp lệ.',
  MSG03: '{field_name} phải trong giới hạn cho phép: {constraints}.',
  MSG04: 'Đã lưu {record_name} thành công.',
  MSG05: 'Không thể hoàn tất thao tác. Vui lòng thử lại. Mã tham chiếu: {reference_id}.',
  MSG06: 'Bạn có thay đổi chưa lưu. Rời trang và huỷ các thay đổi?',
  MSG07: 'Thao tác hiện không khả dụng.',
  MSG08: 'Thông tin đăng nhập không đúng. Vui lòng thử lại.',
  MSG09: 'Vui lòng xác thực email trước khi đăng nhập.',
  MSG10: 'Tài khoản không khả dụng. Vui lòng liên hệ bộ phận hỗ trợ.',
  get MSG11() {
    return `Đăng nhập sai quá nhiều lần. Vui lòng thử lại sau ${BUSINESS.SIGNIN_LOCK_MINUTES} phút.`;
  },
  MSG12: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
  MSG13: 'Bạn không có quyền thực hiện thao tác này.',
  MSG14: 'Vui lòng đăng nhập hoặc đăng ký tài khoản để tiếp tục.',
  MSG15: 'Mã xác thực đã được gửi tới {masked_email}.',
  MSG16: 'Mã xác thực không đúng hoặc đã hết hạn. Vui lòng yêu cầu mã mới.',
  MSG17: 'Tài khoản khách hàng đã được tạo. Bạn có thể đăng nhập ngay.',
  MSG18: '{field_name} này đã được đăng ký.',
  MSG19: '{password_error_message}.',
  MSG20: 'Mật khẩu đã được cập nhật. Vui lòng đăng nhập lại bằng mật khẩu mới.',
  MSG21: 'Bạn đã đăng xuất.',
  MSG22: 'Xoá tài khoản? Tài khoản sẽ bị vô hiệu hoá và bạn mất quyền truy cập các chức năng.',
  MSG23: 'Hồ sơ tài xế đã được gửi và đang chờ duyệt.',
  MSG24: 'Hồ sơ tài xế của bạn đã được {status}. {additional_information}',
  MSG25: 'Tài khoản tài xế phải được duyệt và giấy tờ còn hiệu lực trước khi nhận cuốc.',
  MSG26: 'Số dư tiền cọc thấp hơn {required_balance}. Vui lòng nạp tiền cọc để nhận đơn tiền mặt.',
  MSG28: 'Vui lòng chọn {location_type} hợp lệ.',
  MSG29: 'Bạn chưa ở trong phạm vi {radius} của {location_type}. Hãy di chuyển lại gần và thử lại.',
  MSG30: 'Loại xe đã chọn không chở được hàng này. Vui lòng chọn loại xe phù hợp.',
  MSG31: 'Không thể áp dụng mã giảm giá: {reason}.',
  MSG32: 'Vui lòng đồng ý chính sách bảo hành và cam kết hàng hoá trước khi gửi yêu cầu.',
  MSG33: 'Đã gửi yêu cầu {order_id}. Chúng tôi đang tìm tài xế cho bạn.',
  MSG34: 'Đơn {order_id} đã chuyển sang {status}.',
  MSG35: 'Không có tài xế nhận đơn trong thời gian ghép. Vui lòng tạo yêu cầu mới.',
  MSG36: 'Huỷ đơn {order_id}? Huỷ miễn phí, đơn đã thanh toán sẽ được hoàn tiền 100%.',
  MSG37: 'Đơn {order_id} đã được huỷ. Khoản hoàn tiền (nếu có) sẽ theo chính sách.',
  MSG38: 'Thao tác không khả dụng ở trạng thái hiện tại của đơn. Vui lòng tải lại chi tiết đơn.',
  MSG39: 'Có đơn mới {order_id} gần bạn. Chạm để xem và nhận.',
  MSG40: 'Đơn này không còn khả dụng. Vui lòng chọn đơn khác.',
  MSG41: 'Ảnh kiểm hàng của đơn {order_id} đã sẵn sàng. Vui lòng duyệt trước khi xe khởi hành.',
  MSG42: 'Vui lòng chờ khách hàng duyệt ảnh kiểm hàng trước khi bắt đầu vận chuyển.',
  MSG43: 'Vị trí trực tiếp tạm thời không khả dụng. Cập nhật lần cuối: {last_updated_time}.',
  MSG44: 'Vui lòng tải lên {evidence_type} trước khi tiếp tục.',
  MSG45: 'Đơn {order_id} đã hoàn thành.',
  MSG46: 'Vui lòng thanh toán {amount} bằng link hoặc mã QR.',
  MSG47: 'Đang chờ xác nhận thanh toán. Vui lòng làm mới trạng thái trước khi thanh toán lại.',
  MSG48: 'Đã xác nhận thanh toán {amount} cho đơn {order_id}.',
  MSG49: 'Thanh toán thất bại. Vui lòng kiểm tra thông tin và thử lại.',
  MSG50: 'Mã thanh toán đã hết hạn. Vui lòng yêu cầu mã mới.',
  MSG51: 'Đã huỷ thanh toán. Đơn vẫn ở trạng thái chưa thanh toán.',
  MSG52: 'Xác nhận đã nhận {amount} tiền mặt cho đơn {order_id}?',
  MSG53: 'Đã ghi nhận thu tiền mặt cho đơn {order_id}.',
  MSG54: '{transaction_type} {amount} đã được xác nhận.',
  MSG55: 'Số tiền yêu cầu vượt quá thu nhập khả dụng.',
  MSG56: 'Vui lòng chọn từ 1 đến 5 sao.',
  MSG57: 'Đã gửi đánh giá của bạn.',
  MSG58: '{rating_restriction_message}.',
  MSG59: '{case_type} {case_id} đã chuyển sang {status}. {additional_information}',
  MSG60: 'Cần bổ sung thông tin cho {case_type} {case_id}: {requested_information}.',
  MSG62: 'Xác nhận {action_name}? Thay đổi có hiệu lực ngay.',
  MSG63: '{report_status_message}.',
  MSG64: 'Dịch vụ tạm thời không khả dụng. Vui lòng kiểm tra kết nối và thử lại.',
  MSG65: 'Bạn không thể vô hiệu hoá tài khoản đang đăng nhập.',
  MSG66: 'Vui lòng thêm tài khoản ngân hàng trước khi yêu cầu rút tiền.',
  MSG67: 'Khách hàng đã từ chối ảnh kiểm hàng: {reason}. Vui lòng chụp lại.',
  MSG68: 'Xác nhận đã nhận đơn {order_id}? Sau khi xác nhận bạn không thể khiếu nại.',
} as const;

export type MessageCode = keyof typeof MESSAGES;

export function msg(code: MessageCode, params: Record<string, string | number> = {}): string {
  return MESSAGES[code].replace(/\{(\w+)\}/g, (_, key: string) =>
    params[key] !== undefined ? String(params[key]) : ''
  ).trim();
}
