import { OrderStatus } from '../types/order.types';
import { IncidentStatus, IncidentType, RefundSource, RefundStatus } from '../types/case.types';

export const ORDER_STATUS_CONFIG: Record<OrderStatus, { label: string; bg: string; text: string; border: string }> = {
  Pending: { label: 'Đang tìm tài xế', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  Accepted: { label: 'Đã nhận đơn', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  Arrived: { label: 'Đã đến điểm lấy', bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
  PickedUp: { label: 'Đã lấy hàng', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  InTransit: { label: 'Đang giao hàng', bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200' },
  Delivered: { label: 'Đã giao hàng', bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200' },
  Completed: { label: 'Hoàn thành', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  Cancelled: { label: 'Đã huỷ', bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200' },
};

export const INCIDENT_TYPE_LABEL: Record<IncidentType, string> = {
  VehicleBreakdown: 'Hỏng xe',
  DamagedCargo: 'Hư hỏng hàng hoá',
  Accident: 'Tai nạn',
  Other: 'Khác',
};

export const INCIDENT_STATUS_LABEL: Record<IncidentStatus, string> = {
  Open: 'Mới tiếp nhận',
  InProgress: 'Đang xử lý',
  Resolved: 'Đã giải quyết',
  Cancelled: 'Đã huỷ',
};

export const REFUND_SOURCE_LABEL: Record<RefundSource, string> = {
  Cancellation: 'Huỷ đơn',
  Incident: 'Sự cố',
  Complaint: 'Khiếu nại',
};

export const REFUND_STATUS_LABEL: Record<RefundStatus, string> = {
  Requested: 'Đang xử lý',
  Approved: 'Đã duyệt',
  Rejected: 'Từ chối',
  Processed: 'Đã hoàn tiền',
  Failed: 'Hoàn tiền lỗi',
  Withdrawn: 'Đã rút',
};

export const CARGO_TYPE_OPTIONS = [
  { value: 'Furniture', label: 'Nội thất' },
  { value: 'Electronics', label: 'Điện tử' },
  { value: 'Household', label: 'Gia dụng' },
  { value: 'Documents', label: 'Tài liệu' },
  { value: 'Other', label: 'Khác' },
] as const;
