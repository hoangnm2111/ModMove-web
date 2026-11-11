/**
 * Danh mục sự kiện thông báo chung (spec 2026-11-11-status-notifications-design, mục 3).
 * Khoá = `type` ổn định mà backend gửi qua SignalR `NotificationReceived`; sự kiện chỉ client biết
 * (kết quả thao tác, thanh toán…) dùng mã cùng kiểu. Chữ của server luôn được ưu tiên;
 * danh mục chỉ cấp loại (màu/icon), tiêu đề, chữ dự phòng và đích khi bấm "Xem".
 */
import { msg } from '../constants/messages';
import type { UserRole } from '../types/user.types';

export type ToastKind = 'success' | 'error' | 'info' | 'warning';

export interface NoticeData {
  orderId?: string;
  orderCode?: string;
  [k: string]: string | undefined;
}

interface Variant {
  kind: ToastKind;
  text: (d: NoticeData) => string;
}

export interface NoticeDef extends Variant {
  title: string;
  /** Đích của nút "Xem" theo vai trò người nhận; undefined = không có nút */
  href?: (d: NoticeData, role: UserRole) => string | undefined;
  /** Dùng khi chính người dùng vừa thao tác (client tự phát, không có chữ từ server) */
  own?: Variant;
}

/** Mã đơn để chèn vào câu; thiếu thì nói "này" cho câu vẫn đọc được */
const ord = (d: NoticeData) => d.orderCode ?? (d.orderId ? `#${d.orderId}` : 'này');

const order = (d: NoticeData, role: UserRole) => {
  if (role === 'Customer') return d.orderId ? `/orders/${d.orderId}` : '/orders';
  if (role === 'Driver') return '/driver/trip';
  return undefined;
};
const customerOrder = (d: NoticeData, role: UserRole) => (role === 'Customer' ? order(d, role) : undefined);
const driverTrip = (_d: NoticeData, role: UserRole) => (role === 'Driver' ? '/driver/trip' : undefined);
const driverIncidents = (_d: NoticeData, role: UserRole) => (role === 'Driver' ? '/driver/incidents' : undefined);
const driverProfile = (_d: NoticeData, role: UserRole) => (role === 'Driver' ? '/driver/profile' : undefined);

export const NOTICE: Record<string, NoticeDef> = {
  /* ---- Đơn hàng ---- */
  ORDER_CREATED: { kind: 'success', title: 'Đã gửi yêu cầu', text: (d) => msg('MSG33', { order_id: ord(d) }), href: customerOrder },
  NEW_MATCHING_ORDER: {
    kind: 'info',
    title: 'Có đơn mới',
    text: (d) => msg('MSG39', { order_id: ord(d) }),
    href: (_d, role) => (role === 'Driver' ? '/driver' : undefined),
  },
  ORDER_ACCEPTED: { kind: 'info', title: 'Đơn đã có tài xế', text: (d) => `Tài xế đã nhận đơn ${ord(d)} và đang đến điểm lấy hàng.`, href: customerOrder },
  DRIVER_ARRIVED: { kind: 'info', title: 'Tài xế đã đến', text: (d) => `Tài xế đã đến điểm lấy hàng của đơn ${ord(d)}.`, href: customerOrder },
  DRIVER_ARRIVED_DROPOFF: { kind: 'info', title: 'Tài xế đã đến điểm giao', text: (d) => `Tài xế đã đến điểm giao hàng của đơn ${ord(d)}.`, href: customerOrder },
  PICKUP_PHOTOS_TO_REVIEW: { kind: 'warning', title: 'Duyệt ảnh kiểm hàng', text: (d) => msg('MSG41', { order_id: ord(d) }), href: customerOrder },
  PICKUP_APPROVED: { kind: 'success', title: 'Khách đã duyệt ảnh', text: (d) => `Khách đã duyệt ảnh hàng của đơn ${ord(d)}. Bạn có thể bắt đầu vận chuyển.`, href: driverTrip },
  PICKUP_REJECTED: {
    kind: 'warning',
    title: 'Khách từ chối ảnh',
    text: (d) => msg('MSG67', { reason: d.reason ?? 'chưa đạt yêu cầu' }),
    href: driverTrip,
  },
  ORDER_DELIVERED: {
    kind: 'warning',
    title: 'Đơn đã được giao',
    text: (d) => `Đơn ${ord(d)} đã được giao. Xác nhận nhận hàng hoặc khiếu nại trong 24 giờ.`,
    href: customerOrder,
  },
  RECEIPT_CONFIRMED: { kind: 'success', title: 'Đã nhận hàng', text: (d) => `Đã xác nhận nhận hàng đơn ${ord(d)}.`, href: customerOrder },
  ORDER_COMPLETED: { kind: 'success', title: 'Đơn hoàn thành', text: (d) => msg('MSG45', { order_id: ord(d) }), href: order },
  ORDER_CANCELLED: { kind: 'warning', title: 'Đơn đã huỷ', text: (d) => msg('MSG37', { order_id: ord(d) }), href: order },

  /* ---- Thanh toán ---- */
  PAYMENT_CONFIRMED: {
    kind: 'success',
    title: 'Đã thanh toán',
    text: (d) => msg('MSG48', { amount: d.amount ?? '', order_id: ord(d) }),
    href: customerOrder,
  },
  PAYMENT_PENDING: { kind: 'warning', title: 'Chờ xác nhận thanh toán', text: () => msg('MSG47') },
  PAYMENT_FAILED: { kind: 'error', title: 'Thanh toán thất bại', text: () => msg('MSG49') },
  PAYMENT_EXPIRED: { kind: 'warning', title: 'Mã thanh toán hết hạn', text: () => msg('MSG50') },
  PAYMENT_CANCELLED: { kind: 'info', title: 'Đã huỷ thanh toán', text: () => msg('MSG51') },
  CASH_COLLECTED: { kind: 'success', title: 'Đã thu tiền mặt', text: (d) => msg('MSG53', { order_id: ord(d) }) },

  /* ---- Sự cố ---- */
  INCIDENT_REPORTED: {
    kind: 'warning',
    title: 'Sự cố mới',
    text: (d) => `Khách đã báo sự cố cho đơn ${ord(d)}.`,
    href: (_d, role) => (role === 'Dispatcher' ? '/dispatcher/incidents' : role === 'Driver' ? '/driver/incidents' : undefined),
    own: { kind: 'success', text: () => 'Đã gửi báo cáo sự cố. Điều phối viên sẽ xử lý ngay.' },
  },
  INCIDENT_IN_PROGRESS: {
    kind: 'info',
    title: 'Sự cố đang xử lý',
    text: (d) => `Điều phối viên đã tiếp nhận sự cố của đơn ${ord(d)}.`,
    href: (d, role) => customerOrder(d, role) ?? driverIncidents(d, role),
  },
  INCIDENT_DECIDED: { kind: 'warning', title: 'Sự cố đã có quyết định', text: (d) => `Sự cố của đơn ${ord(d)} đã có quyết định từ điều phối viên.`, href: driverIncidents },
  INCIDENT_RESOLVED: { kind: 'success', title: 'Sự cố đã xử lý xong', text: (d) => `Sự cố của đơn ${ord(d)} đã có kết quả.`, href: customerOrder },

  /* ---- Khiếu nại / hoàn tiền ---- */
  COMPLAINT_SUBMITTED: {
    kind: 'warning',
    title: 'Khiếu nại mới',
    text: (d) => `Khiếu nại mới cho đơn ${ord(d)}.`,
    href: (d, role) => (role === 'Dispatcher' ? '/dispatcher/complaints' : customerOrder(d, role)),
    own: { kind: 'success', text: () => 'Đã gửi khiếu nại. Điều phối viên sẽ xem xét.' },
  },
  INCIDENT_REFUND_REQUESTED: {
    kind: 'warning',
    title: 'Yêu cầu hoàn tiền',
    text: (d) => `Có yêu cầu hoàn tiền cho đơn ${ord(d)}.`,
    href: (d, role) => (role === 'Dispatcher' ? '/dispatcher/incidents' : customerOrder(d, role)),
    own: { kind: 'success', text: () => 'Đã gửi yêu cầu hoàn tiền.' },
  },
  REFUND_INFO_REQUESTED: {
    kind: 'warning',
    title: 'Cần bổ sung thông tin',
    text: (d) => `Cần bổ sung thông tin cho yêu cầu của đơn ${ord(d)}.`,
    href: customerOrder,
  },
  REFUND_INFO_REPLIED: {
    kind: 'info',
    title: 'Khách đã bổ sung thông tin',
    text: (d) => `Khách đã bổ sung thông tin cho đơn ${ord(d)}.`,
    href: (d, role) => (role === 'Dispatcher' ? '/dispatcher/complaints' : customerOrder(d, role)),
    own: { kind: 'success', text: () => 'Đã gửi thông tin bổ sung.' },
  },
  REFUND_DECIDED: { kind: 'info', title: 'Đã có kết quả hoàn tiền', text: (d) => `Yêu cầu hoàn tiền của đơn ${ord(d)} đã có kết quả.`, href: customerOrder },
  REFUND_BANK_INFO_REQUIRED: {
    kind: 'warning',
    title: 'Cần tài khoản nhận hoàn tiền',
    text: (d) => `Đơn ${ord(d)} có khoản hoàn tiền. Vui lòng cung cấp tài khoản ngân hàng.`,
    href: customerOrder,
  },
  REFUND_PAYOUT_FAILED: {
    kind: 'error',
    title: 'Hoàn tiền không thành công',
    text: (d) => `Chuyển hoàn tiền cho đơn ${ord(d)} không thành công. Vui lòng kiểm tra lại tài khoản nhận.`,
    href: customerOrder,
  },
  REFUND_WITHDRAWN: { kind: 'info', title: 'Đã rút yêu cầu', text: () => 'Đã rút yêu cầu.', href: customerOrder },

  /* ---- Hồ sơ tài xế ---- */
  DOCUMENT_UPLOADED: { kind: 'success', title: 'Đã tải lên', text: (d) => `Đã tải lên ${d.document ?? 'tệp'}.` },
  DOCUMENT_UPLOAD_FAILED: {
    kind: 'error',
    title: 'Tải lên thất bại',
    text: (d) => `Không tải được ${d.document ?? 'tệp'}${d.reason ? `: ${d.reason}` : '.'}`,
  },
  DRIVER_DRAFT_SAVED: { kind: 'info', title: 'Đã lưu nháp', text: () => msg('MSG04', { record_name: 'bản nháp hồ sơ' }) },
  DRIVER_APPLICATION_SUBMITTED: { kind: 'success', title: 'Đã gửi hồ sơ', text: () => msg('MSG23'), href: driverProfile },
  DRIVER_APPLICATION_APPROVED: { kind: 'success', title: 'Hồ sơ đã được duyệt', text: () => 'Chúc mừng bạn! Hồ sơ đã được phê duyệt.', href: driverProfile },
  DRIVER_APPLICATION_REJECTED: {
    kind: 'error',
    title: 'Hồ sơ chưa được duyệt',
    text: () => 'Hồ sơ chưa được duyệt. Vui lòng kiểm tra lý do và gửi lại.',
    href: driverProfile,
  },

  /* ---- Khác ---- */
  RATING_SUBMITTED: { kind: 'success', title: 'Đã gửi đánh giá', text: () => msg('MSG57') },
  RATING_RECEIVED: {
    kind: 'info',
    title: 'Có đánh giá mới',
    text: (d) => (d.stars ? `Khách đã đánh giá ${d.stars} sao cho đơn ${ord(d)}.` : `Khách đã đánh giá đơn ${ord(d)}.`),
  },
  WITHDRAWAL_DECIDED: {
    kind: 'info',
    title: 'Yêu cầu rút tiền',
    text: () => 'Yêu cầu rút tiền của bạn đã có kết quả.',
    href: (_d, role) => (role === 'Driver' ? '/driver/earnings' : undefined),
  },
  SESSION_EXPIRED: { kind: 'warning', title: 'Hết phiên đăng nhập', text: () => msg('MSG12') },
  LOGGED_OUT: { kind: 'info', title: 'Đã đăng xuất', text: () => msg('MSG21') },
  NETWORK_ERROR: { kind: 'error', title: 'Mất kết nối', text: () => msg('MSG64') },

  /* ---- Toast chung (API cũ toast.*): không tiêu đề, chữ do nơi gọi truyền vào ---- */
  ACTION_DONE: { kind: 'success', title: '', text: () => 'Đã xong.' },
  ACTION_INFO: { kind: 'info', title: '', text: () => 'Đã cập nhật.' },
  ACTION_WARNING: { kind: 'warning', title: '', text: () => 'Vui lòng kiểm tra lại.' },
  ACTION_ERROR: { kind: 'error', title: '', text: () => 'Đã có lỗi xảy ra. Vui lòng thử lại.' },
};
