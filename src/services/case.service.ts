import { BUSINESS } from '../config/business';
import { msg } from '../constants/messages';
import { canComplain, canReportIncident, isRefundable } from '../domain/orderRules';
import { Incident, IncidentDecision, IncidentType, Refund, RefundStatus } from '../types/case.types';
import { AssignedDriver, ShippingOrder } from '../types/order.types';
import { latency, readStore, ServiceError, subscribeStore, uid, writeStore } from './mock/storage';
import { orderService, registerCancellationRefundHandler } from './order.service';

/**
 * Incident & Refund service – API /incidents, /refunds.
 * Luồng hoàn tiền: GB-19, GB-41, GB-42; khiếu nại: GB-18.
 */
const INCIDENTS = 'incidents';
const REFUNDS = 'refunds';
const now = () => new Date().toISOString();

const seedIncidents = (): Incident[] => [
  {
    id: 'INC-881',
    orderId: 'ord_MM-78219',
    orderCode: 'MM-78219',
    reportedBy: 'Driver',
    reporterId: 'drv_88',
    type: 'VehicleBreakdown',
    description: 'Xe nổ lốp trên Đại lộ Thăng Long, cần 30 phút thay lốp.',
    photos: ['https://images.unsplash.com/photo-1597007066704-67bf2068d5b2?auto=format&fit=crop&w=600&q=80'],
    gps: { lat: 21.0115, lng: 105.65 },
    status: 'Open',
    createdAt: new Date(Date.now() - 8 * 60_000).toISOString(),
  },
];

const seedRefunds = (): Refund[] => [
  {
    id: 'RF-1001',
    orderId: 'ord_MM-84721',
    orderCode: 'MM-84721',
    customerName: 'Hoàng Nguyễn Mạnh',
    source: 'Complaint',
    reason: 'Cạnh tủ bị trầy xước khi bốc xuống.',
    evidence: ['https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=600&q=80'],
    amountPaid: 300_000,
    requestedAmount: 150_000,
    status: 'Requested',
    createdAt: new Date(Date.now() - 30 * 60_000).toISOString(),
    updatedAt: new Date(Date.now() - 30 * 60_000).toISOString(),
  },
];

const incidents = () => readStore(INCIDENTS, seedIncidents);
const refunds = () => readStore(REFUNDS, seedRefunds);

function updateRefund(id: string, fn: (r: Refund) => Refund): Refund {
  const list = refunds();
  const r = list.find((x) => x.id === id);
  if (!r) throw new ServiceError(msg('MSG07'));
  const next = { ...fn(r), updatedAt: now() };
  writeStore(REFUNDS, list.map((x) => (x.id === id ? next : x)));
  return next;
}

function updateIncident(id: string, fn: (i: Incident) => Incident): Incident {
  const list = incidents();
  const i = list.find((x) => x.id === id);
  if (!i) throw new ServiceError(msg('MSG07'));
  const next = fn(i);
  writeStore(INCIDENTS, list.map((x) => (x.id === id ? next : x)));
  return next;
}

const hasOpenRefund = (orderId: string, source: Refund['source']) =>
  refunds().some((r) => r.orderId === orderId && r.source === source && ['Requested', 'InfoRequested', 'Proposed', 'Approved'].includes(r.status));

function createRefund(order: ShippingOrder, data: Pick<Refund, 'source' | 'reason' | 'evidence' | 'requestedAmount'>, status: RefundStatus = 'Requested'): Refund {
  const r: Refund = {
    id: uid('RF').toUpperCase(),
    orderId: order.id,
    orderCode: order.code,
    customerName: order.customerName,
    amountPaid: order.fare.total,
    status,
    createdAt: now(),
    updatedAt: now(),
    ...data,
  };
  writeStore(REFUNDS, [r, ...refunds()]);
  return r;
}

// GB-41: huỷ đơn PayOS đã thanh toán → tự tạo refund 100%, chuyển thẳng Admin (bỏ qua Dispatcher)
registerCancellationRefundHandler((order, amount) => {
  if (hasOpenRefund(order.id, 'Cancellation')) return;
  createRefund(order, { source: 'Cancellation', reason: order.cancellationReason ?? 'Huỷ đơn', evidence: [], requestedAmount: amount }, 'Proposed');
  const list = refunds();
  writeStore(REFUNDS, list.map((r, i) => (i === 0 ? { ...r, proposedAmount: amount, proposalNote: 'Tự động hoàn 100% (GB-41)' } : r)));
});

export const caseService = {
  subscribe: (cb: () => void) => {
    const a = subscribeStore(INCIDENTS, cb);
    const b = subscribeStore(REFUNDS, cb);
    return () => {
      a();
      b();
    };
  },

  listIncidentsSync: (): Incident[] => incidents().sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  listRefundsSync: (): Refund[] => refunds().sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  listRefundsByOrderSync: (orderId: string) => refunds().filter((r) => r.orderId === orderId),
  listIncidentsByOrderSync: (orderId: string) => incidents().filter((i) => i.orderId === orderId),

  /** UC-CUS-15 / UC-DRV-18 */
  async reportIncident(order: ShippingOrder, input: { reportedBy: 'Customer' | 'Driver'; reporterId?: string; type: IncidentType; description: string; photos: string[] }): Promise<Incident> {
    await latency();
    if (!canReportIncident(order)) throw new ServiceError(msg('MSG38'));
    if (!input.description.trim()) throw new ServiceError(msg('MSG01', { field_name: 'Mô tả sự cố' }));
    if (input.photos.length > BUSINESS.MAX_EVIDENCE_PHOTOS) {
      throw new ServiceError(msg('MSG03', { field_name: 'Ảnh minh chứng', constraints: `tối đa ${BUSINESS.MAX_EVIDENCE_PHOTOS} ảnh` }));
    }
    const incident: Incident = {
      id: uid('INC').toUpperCase(),
      orderId: order.id,
      orderCode: order.code,
      status: 'Open',
      createdAt: now(),
      gps: order.assignedDriver ? { lat: order.assignedDriver.currentLat, lng: order.assignedDriver.currentLng } : undefined,
      ...input,
    };
    writeStore(INCIDENTS, [incident, ...incidents()]);
    return incident;
  },

  /** UC-CUS-17 / GB-42 */
  async requestIncidentRefund(order: ShippingOrder, input: { reason: string; evidence: string[]; requestedAmount: number }): Promise<Refund> {
    await latency();
    if (!isRefundable(order)) throw new ServiceError('Đơn tiền mặt được giải quyết ngoài hệ thống (GB-42).');
    if (input.requestedAmount <= 0 || input.requestedAmount > order.fare.total) {
      throw new ServiceError(msg('MSG03', { field_name: 'Số tiền yêu cầu', constraints: `1 – ${order.fare.total.toLocaleString('vi-VN')} đ` }));
    }
    if (hasOpenRefund(order.id, 'Incident')) throw new ServiceError('Đơn đã có yêu cầu hoàn tiền sự cố đang xử lý.');
    return createRefund(order, { source: 'Incident', ...input });
  },

  /** UC-CUS-21 / GB-18 */
  async submitComplaint(order: ShippingOrder, input: { reason: string; evidence: string[]; requestedAmount: number }): Promise<Refund> {
    await latency();
    if (!canComplain(order)) throw new ServiceError('Chỉ khiếu nại khi đơn ở trạng thái Đã giao và trong 24 giờ sau giao (GB-18).');
    if (hasOpenRefund(order.id, 'Complaint')) throw new ServiceError('Đơn đã có một khiếu nại đang mở (GB-18).');
    if (!input.reason.trim()) throw new ServiceError(msg('MSG01', { field_name: 'Nội dung khiếu nại' }));
    if (input.evidence.length === 0) throw new ServiceError(msg('MSG44', { evidence_type: 'ảnh minh chứng' }));
    const max = isRefundable(order) ? order.fare.total : 0;
    if (input.requestedAmount < 0 || input.requestedAmount > max) {
      throw new ServiceError(msg('MSG03', { field_name: 'Số tiền yêu cầu', constraints: `0 – ${max.toLocaleString('vi-VN')} đ` }));
    }
    return createRefund(order, { source: 'Complaint', ...input });
  },

  /** UC-CUS-24: chỉ rút khi còn Requested */
  async withdrawComplaint(refundId: string): Promise<Refund> {
    await latency();
    return updateRefund(refundId, (r) => {
      if (r.status !== 'Requested' && r.status !== 'InfoRequested') throw new ServiceError(msg('MSG07'));
      return { ...r, status: 'Withdrawn' };
    });
  },

  /** UC-DIS-14 / GB-43 */
  async requestMoreInfo(refundId: string, question: string): Promise<Refund> {
    await latency();
    if (!question.trim()) throw new ServiceError(msg('MSG01', { field_name: 'Nội dung cần bổ sung' }));
    return updateRefund(refundId, (r) => ({ ...r, status: 'InfoRequested', infoRequest: question }));
  },

  /** GB-43: khách trả lời 1 lần, tổng ảnh ≤ 5 */
  async replyMoreInfo(refundId: string, answer: string, photos: string[]): Promise<Refund> {
    await latency();
    return updateRefund(refundId, (r) => {
      if (r.status !== 'InfoRequested') throw new ServiceError(msg('MSG07'));
      if (r.evidence.length + photos.length > BUSINESS.MAX_EVIDENCE_PHOTOS) {
        throw new ServiceError(msg('MSG03', { field_name: 'Ảnh minh chứng', constraints: `tổng tối đa ${BUSINESS.MAX_EVIDENCE_PHOTOS} ảnh` }));
      }
      return { ...r, status: 'Requested', infoReply: answer, evidence: [...r.evidence, ...photos] };
    });
  },

  /** UC-DIS-09 / UC-DIS-15 / GB-42: đề xuất ≤ số tiền yêu cầu, gửi Admin (UC-DIS-17) */
  async proposeRefund(refundId: string, amount: number, note: string): Promise<Refund> {
    await latency();
    return updateRefund(refundId, (r) => {
      if (r.status !== 'Requested') throw new ServiceError(msg('MSG07'));
      if (amount < 0 || amount > r.requestedAmount) {
        throw new ServiceError(msg('MSG03', { field_name: 'Số tiền đề xuất', constraints: `0 – ${r.requestedAmount.toLocaleString('vi-VN')} đ` }));
      }
      if (!note.trim()) throw new ServiceError(msg('MSG01', { field_name: 'Lý do đề xuất' }));
      return { ...r, status: 'Proposed', proposedAmount: amount, proposalNote: note };
    });
  },

  /** UC-ADM-18 / GB-19, GB-27 */
  async approveRefund(refundId: string, bankReferenceCode: string): Promise<Refund> {
    await latency();
    return updateRefund(refundId, (r) => {
      if (r.status !== 'Proposed') throw new ServiceError(msg('MSG07'));
      const amount = r.proposedAmount ?? 0;
      // Đề xuất "không hoàn tiền" chỉ cần Admin chốt, không có chuyển khoản
      if (amount === 0) return { ...r, status: 'Approved', approvedAmount: 0 };
      if (!bankReferenceCode.trim()) throw new ServiceError(msg('MSG01', { field_name: 'Mã giao dịch ngân hàng' }));
      return { ...r, status: 'Processed', approvedAmount: amount, bankReferenceCode };
    });
  },

  async rejectRefund(refundId: string, reason: string): Promise<Refund> {
    await latency();
    return updateRefund(refundId, (r) => {
      if (!['Proposed', 'Requested'].includes(r.status)) throw new ServiceError(msg('MSG07'));
      return { ...r, status: 'Rejected', proposalNote: reason || r.proposalNote };
    });
  },

  /** UC-DIS-05: quyết định xử lý sự cố */
  async resolveIncident(incidentId: string, decision: IncidentDecision, note: string, opts?: { newDriver?: AssignedDriver; refundable?: boolean }): Promise<Incident> {
    await latency();
    const inc = incidents().find((i) => i.id === incidentId);
    if (!inc || inc.status === 'Resolved' || inc.status === 'Cancelled') throw new ServiceError(msg('MSG07'));
    if (decision === 'ReassignDriver') {
      if (!opts?.newDriver) throw new ServiceError('Vui lòng chọn tài xế thay thế.');
      await orderService.reassignDriver(inc.orderId, opts.newDriver);
    }
    if (decision === 'CancelOrder') {
      await orderService.cancelByDispatcher(inc.orderId, note || 'Huỷ do sự cố', opts?.refundable ?? true);
    }
    return updateIncident(incidentId, (i) => ({ ...i, status: 'Resolved', decision, decisionNote: note, resolvedAt: now() }));
  },

  /** UC-DIS-10: huỷ sự cố không hợp lệ */
  async cancelIncident(incidentId: string, reason: string): Promise<Incident> {
    await latency();
    if (!reason.trim()) throw new ServiceError(msg('MSG01', { field_name: 'Lý do huỷ sự cố' }));
    return updateIncident(incidentId, (i) => {
      if (i.status === 'Resolved' || i.status === 'Cancelled') throw new ServiceError(msg('MSG07'));
      return { ...i, status: 'Cancelled', decisionNote: reason, resolvedAt: now() };
    });
  },

  async markIncidentInProgress(incidentId: string): Promise<Incident> {
    return updateIncident(incidentId, (i) => (i.status === 'Open' ? { ...i, status: 'InProgress' } : i));
  },
};
