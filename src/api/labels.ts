/** Nhãn tiếng Việt + màu cho các enum của backend */
import type * as T from './types';

type Tone = { label: string; cls: string };
const tone = (label: string, cls: string): Tone => ({ label, cls });

export const ORDER_STATUS: Record<T.OrderStatus, Tone> = {
  Pending: tone('Đang tìm tài xế', 'bg-amber-50 text-amber-700 border-amber-200'),
  Accepted: tone('Tài xế đã nhận', 'bg-blue-50 text-blue-700 border-blue-200'),
  Arrived: tone('Đã đến điểm lấy', 'bg-indigo-50 text-indigo-700 border-indigo-200'),
  PickedUp: tone('Đã lấy hàng', 'bg-purple-50 text-purple-700 border-purple-200'),
  InTransit: tone('Đang giao hàng', 'bg-sky-50 text-sky-700 border-sky-200'),
  Delivered: tone('Đã giao hàng', 'bg-teal-50 text-teal-700 border-teal-200'),
  Completed: tone('Hoàn thành', 'bg-emerald-50 text-emerald-700 border-emerald-200'),
  Cancelled: tone('Đã huỷ', 'bg-slate-100 text-slate-600 border-slate-200'),
};
export const ORDER_FLOW: T.OrderStatus[] = ['Pending', 'Accepted', 'Arrived', 'PickedUp', 'InTransit', 'Delivered', 'Completed'];

export const PAYMENT_STATUS: Record<T.PaymentStatus, Tone> = {
  Unpaid: tone('Chưa thanh toán', 'bg-rose-50 text-rose-700 border-rose-200'),
  Paid: tone('Đã thanh toán', 'bg-emerald-50 text-emerald-700 border-emerald-200'),
};
export const PAYMENT_METHOD: Record<T.PaymentMethod, string> = { Cash: 'Tiền mặt', PayOS: 'PayOS (QR/chuyển khoản)' };
export const PAYER_ROLE: Record<T.PayerRole, string> = { Sender: 'Người gửi trả khi lấy hàng', Receiver: 'Người nhận trả khi giao hàng' };
export const PAYMENT_TX_STATUS: Record<string, Tone> = {
  Pending: tone('Chờ thanh toán', 'bg-amber-50 text-amber-700 border-amber-200'),
  Paid: tone('Đã thanh toán', 'bg-emerald-50 text-emerald-700 border-emerald-200'),
  Failed: tone('Thất bại', 'bg-rose-50 text-rose-700 border-rose-200'),
  Cancelled: tone('Đã huỷ', 'bg-slate-100 text-slate-600 border-slate-200'),
  Expired: tone('Hết hạn', 'bg-slate-100 text-slate-600 border-slate-200'),
};

export const INCIDENT_TYPE: Record<T.IncidentType, string> = {
  VehicleBreakdown: 'Hỏng xe',
  DamagedCargo: 'Hư hỏng hàng hoá',
  Accident: 'Tai nạn',
  Other: 'Khác (trễ, sai tuyến, vắng mặt…)',
};
export const INCIDENT_STATUS: Record<T.IncidentResolutionStatus, Tone> = {
  Open: tone('Đang chờ xử lý', 'bg-rose-50 text-rose-700 border-rose-200'),
  InProgress: tone('Điều phối viên đang xử lý', 'bg-amber-50 text-amber-700 border-amber-200'),
  Resolved: tone('Đã xử lý', 'bg-emerald-50 text-emerald-700 border-emerald-200'),
  Cancelled: tone('Báo cáo đã bị hủy', 'bg-slate-100 text-slate-600 border-slate-200'),
};
export const INCIDENT_DECISION: Record<T.IncidentDecision, string> = {
  ContinueTrip: 'Tiếp tục chuyến',
  ReassignDriver: 'Đổi tài xế',
  CancelOrder: 'Huỷ đơn',
};

export const REFUND_SOURCE: Record<T.RefundSourceType, string> = { Cancellation: 'Hoàn do huỷ đơn', Incident: 'Hoàn do sự cố', Complaint: 'Khiếu nại' };
export const REFUND_STATUS: Record<T.RefundStatus, Tone> = {
  Requested: tone('Đang xem xét', 'bg-amber-50 text-amber-700 border-amber-200'),
  Approved: tone('Đã duyệt – chờ chi', 'bg-blue-50 text-blue-700 border-blue-200'),
  Rejected: tone('Từ chối', 'bg-rose-50 text-rose-700 border-rose-200'),
  Processed: tone('Đã chuyển khoản', 'bg-emerald-50 text-emerald-700 border-emerald-200'),
  Failed: tone('Chi trả lỗi', 'bg-rose-50 text-rose-700 border-rose-200'),
  Withdrawn: tone('Đã rút', 'bg-slate-100 text-slate-600 border-slate-200'),
};
export const COMPLAINT_STAGE: Record<T.ComplaintStage, Tone> = {
  NeedsReview: tone('Cần xem xét', 'bg-rose-50 text-rose-700 border-rose-200'),
  WaitingForCustomer: tone('Chờ khách bổ sung', 'bg-amber-50 text-amber-700 border-amber-200'),
  CustomerReplied: tone('Khách đã trả lời', 'bg-indigo-50 text-indigo-700 border-indigo-200'),
  ProposedToAdmin: tone('Đã đề xuất Quản trị viên', 'bg-blue-50 text-blue-700 border-blue-200'),
  Closed: tone('Đã đóng', 'bg-slate-100 text-slate-600 border-slate-200'),
};
export const PROOF_STATUS: Record<T.ProofStatus, Tone> = {
  Pending: tone('Chờ khách duyệt', 'bg-amber-50 text-amber-700 border-amber-200'),
  Verified: tone('Khách đã duyệt', 'bg-emerald-50 text-emerald-700 border-emerald-200'),
  Rejected: tone('Khách từ chối', 'bg-rose-50 text-rose-700 border-rose-200'),
};
export const APPROVAL_STATUS: Record<T.ApprovalStatus, Tone> = {
  Pending: tone('Chờ duyệt', 'bg-amber-50 text-amber-700 border-amber-200'),
  Approved: tone('Đã duyệt', 'bg-emerald-50 text-emerald-700 border-emerald-200'),
  Rejected: tone('Bị từ chối', 'bg-rose-50 text-rose-700 border-rose-200'),
};
export const ACCOUNT_STATUS: Record<T.AccountStatus, Tone> = {
  Active: tone('Hoạt động', 'bg-emerald-50 text-emerald-700 border-emerald-200'),
  Inactive: tone('Vô hiệu hoá', 'bg-slate-100 text-slate-600 border-slate-200'),
  Locked: tone('Đã khoá', 'bg-rose-50 text-rose-700 border-rose-200'),
};
export const ROLE_LABEL: Record<T.UserRole, string> = { Customer: 'Khách hàng', Driver: 'Tài xế', Dispatcher: 'Điều phối viên', Administrator: 'Quản trị viên' };
export const WITHDRAWAL_STATUS: Record<T.WalletTransactionStatus, Tone> = {
  Pending: tone('Chờ xử lý', 'bg-amber-50 text-amber-700 border-amber-200'),
  Completed: tone('Đã chuyển', 'bg-emerald-50 text-emerald-700 border-emerald-200'),
  Failed: tone('Sai số tài khoản', 'bg-rose-50 text-rose-700 border-rose-200'),
  Rejected: tone('Từ chối', 'bg-slate-100 text-slate-600 border-slate-200'),
};
/** Loại biến động ví tài xế (api/driver/wallet/transactions) */
export const WALLET_TX_TYPE: Record<string, string> = {
  TopUpDeposit: 'Nạp tiền cọc',
  TripEarning: 'Thu nhập chuyến đi',
  CommissionDeduction: 'Trừ hoa hồng đơn tiền mặt',
  DepositRefill: 'Tự bù tiền cọc từ thu nhập',
  Withdrawal: 'Rút tiền',
};
export const CHANGED_BY: Record<string, string> = { Customer: 'Khách hàng', Driver: 'Tài xế', Dispatcher: 'Điều phối viên', Administrator: 'Quản trị viên', System: 'Hệ thống' };
export const MASTER_CATEGORY: Record<T.MasterDataCategory, { label: string; hint: string }> = {
  POLICY: { label: 'Chính sách', hint: 'Bảo hành, hoàn tiền, điều khoản, quyền riêng tư – nội dung ở mô tả' },
  SERVICE_INFO: { label: 'Giới thiệu dịch vụ', hint: 'Giới thiệu, khu vực phục vụ, lợi ích – hiển thị trang chủ' },
  CARGO_TYPE: { label: 'Loại hàng hoá', hint: 'Khách chọn khi đặt đơn' },
  CANCELLATION_REASON: { label: 'Lý do huỷ đơn', hint: 'Khách chọn khi huỷ đơn; mã OTHER bắt buộc ghi lý do' },
  COMPLAINT_REASON: { label: 'Lý do khiếu nại', hint: 'Khách chọn khi khiếu nại; mã OTHER bắt buộc ghi lý do' },
  INCIDENT_CATEGORY: { label: 'Nhóm sự cố', hint: 'Danh mục tham khảo cho sự cố' },
  BANK: { label: 'Ngân hàng', hint: 'Ngân hàng nhận hoàn tiền; mã là 6 chữ số (mã BIN), khách chọn khi khai tài khoản nhận hoàn tiền' },
};

/** Người báo sự cố (Q6b: Dispatcher tự mở sự cố trên đơn đang chạy) */
export const reporterLabel = (role: string) => (role === 'Driver' ? 'Tài xế' : role === 'Dispatcher' ? 'Điều phối viên' : 'Khách hàng');
