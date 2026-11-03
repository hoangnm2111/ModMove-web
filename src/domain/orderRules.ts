import { BUSINESS } from '../config/business';
import { OrderStatus, ShippingOrder } from '../types/order.types';

/** Bảng chuyển trạng thái hợp lệ – SRS ShippingOrder lifecycle */
const TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  Pending: ['Accepted', 'Cancelled'],
  Accepted: ['Arrived', 'Cancelled'],
  Arrived: ['PickedUp', 'Cancelled'],
  PickedUp: ['InTransit', 'Cancelled'],
  InTransit: ['Delivered', 'Cancelled'],
  Delivered: ['Completed'],
  Completed: [],
  Cancelled: [],
};

export const canTransition = (from: OrderStatus, to: OrderStatus) => TRANSITIONS[from].includes(to);

/** Bước tiến trình hiển thị cho khách (UC-CUS-14) */
export const ORDER_FLOW: OrderStatus[] = ['Pending', 'Accepted', 'Arrived', 'PickedUp', 'InTransit', 'Delivered', 'Completed'];

const hoursSince = (iso?: string, now = new Date()) =>
  iso ? (now.getTime() - new Date(iso).getTime()) / 36e5 : Infinity;

/** GB-22: khách huỷ miễn phí khi Pending hoặc Accepted */
export const canCustomerCancel = (o: ShippingOrder) => o.status === 'Pending' || o.status === 'Accepted';

/** GB-41: đơn PayOS đã thanh toán bị huỷ → hoàn 100% */
export const refundOnCancel = (o: ShippingOrder) =>
  o.paymentMethod === 'PayOS' && o.paymentStatus === 'Paid' ? o.fare.total : 0;

/** GB-26 / UC-CUS-12: khách duyệt ảnh kiểm hàng khi PickedUp và ảnh đang Pending */
export const canReviewPickupEvidence = (o: ShippingOrder) =>
  o.status === 'PickedUp' && o.proof?.pickupStatus === 'Pending';

/** UC-CUS-19: xác nhận nhận hàng khi Delivered */
export const canConfirmReceipt = (o: ShippingOrder) => o.status === 'Delivered';

/** GB-18: khiếu nại khi Delivered và trong 24h sau giao */
export const canComplain = (o: ShippingOrder, now = new Date()) =>
  o.status === 'Delivered' && hoursSince(o.deliveredAt, now) <= BUSINESS.COMPLAINT_WINDOW_HOURS;

/** GB-42: hoàn tiền sự cố / khiếu nại chỉ áp dụng đơn PayOS đã thanh toán */
export const isRefundable = (o: ShippingOrder) => o.paymentMethod === 'PayOS' && o.paymentStatus === 'Paid';

/** GB-20: một lần, đơn Completed, trong 1 ngày */
export function ratingRestriction(o: ShippingOrder, now = new Date()): string | null {
  if (o.rating) return 'Bạn đã đánh giá đơn này';
  if (o.status !== 'Completed') return 'Chỉ đánh giá được đơn đã hoàn thành';
  if (hoursSince(o.completedAt, now) > BUSINESS.RATING_WINDOW_HOURS) return 'Đã quá thời hạn đánh giá (1 ngày)';
  return null;
}

/** UC-CUS-15: báo sự cố khi đơn đang chạy */
export const canReportIncident = (o: ShippingOrder) =>
  ['Accepted', 'Arrived', 'PickedUp', 'InTransit'].includes(o.status);

export const isActiveOrder = (o: ShippingOrder) =>
  !['Completed', 'Cancelled'].includes(o.status);

/** GB-31: đơn PayOS chỉ hiển thị cho tài xế sau khi Paid; đơn tiền mặt hiển thị ngay */
export const isVisibleToDrivers = (o: ShippingOrder) =>
  o.status === 'Pending' && (o.paymentMethod === 'Cash' || o.paymentStatus === 'Paid');

/** GB-16: điều kiện ký quỹ với đơn tiền mặt */
export const hasEnoughDeposit = (deposit: number, commission: number) =>
  deposit >= Math.max(BUSINESS.MIN_COD_DEPOSIT, commission);
