import { msg } from '../constants/messages';
import { DispatcherIncidentDetail, Incident, IncidentDecision, IncidentType, Refund } from '../types/case.types';
import { AssignedDriver, ShippingOrder } from '../types/order.types';
import { apiClient, toServiceError } from './api';
import { readStore, ServiceError, subscribeStore, writeStore } from './mock/storage';
import { PagedResult } from './pagination';

/**
 * Incident & Refund service.
 * Customer: api/customer/incidents, api/customer/refunds.
 * Dispatcher: api/dispatcher/incidents, api/dispatcher/complaints.
 * Admin: api/admin/refunds.
 */
const MY_INCIDENTS = 'myIncidents';
const DISPATCHER_INCIDENTS = 'dispatcherIncidents';
const MY_REFUNDS = 'myRefunds';
const DISPATCHER_COMPLAINTS = 'dispatcherComplaints';
const ADMIN_REFUNDS = 'adminRefunds';

// -------------------------------------------------------------------- Incidents
interface MyIncidentDto {
  id: number;
  orderId: number;
  orderCode: string;
  incidentType: IncidentType;
  description: string;
  photoUrls: string[];
  reportedByYou: boolean;
  resolutionStatus: Incident['status'];
  resolutionDecision?: IncidentDecision;
  resolutionNote?: string;
  createdAt: string;
  resolvedAt?: string;
}

const myIncidentToFe = (d: MyIncidentDto): Incident => ({
  id: String(d.id),
  orderId: String(d.orderId),
  orderCode: d.orderCode,
  reportedBy: d.reportedByYou ? 'Customer' : 'Driver',
  type: d.incidentType,
  description: d.description,
  photos: d.photoUrls,
  status: d.resolutionStatus,
  decision: d.resolutionDecision,
  decisionNote: d.resolutionNote,
  createdAt: d.createdAt,
  resolvedAt: d.resolvedAt,
});

interface DispatcherIncidentDto {
  id: number;
  orderId: number;
  orderCode: string;
  orderStatus: string;
  incidentType: IncidentType;
  description: string;
  reportedById: number;
  reporterName: string;
  reporterRole: string;
  resolutionStatus: Incident['status'];
  handledById?: number;
  handledByName?: string;
  createdAt: string;
}

export const caseService = {
  subscribe: (cb: () => void) => {
    const a = subscribeStore(MY_INCIDENTS, cb);
    const b = subscribeStore(DISPATCHER_INCIDENTS, cb);
    const c = subscribeStore(MY_REFUNDS, cb);
    const d = subscribeStore(DISPATCHER_COMPLAINTS, cb);
    const e = subscribeStore(ADMIN_REFUNDS, cb);
    return () => {
      a();
      b();
      c();
      d();
      e();
    };
  },

  // --------------------------------------------------------------- Customer
  listIncidentsSync: (): Incident[] => readStore<Incident[]>(MY_INCIDENTS, () => []),
  listIncidentsByOrderSync: (orderId: string) => readStore<Incident[]>(MY_INCIDENTS, () => []).filter((i) => i.orderId === orderId),

  /** UC-CUS-16: GET /customer/incidents */
  async loadMyIncidents(): Promise<void> {
    try {
      const { data } = await apiClient.get<PagedResult<MyIncidentDto>>('/customer/Incidents', { params: { page: 1, pageSize: 50 } });
      writeStore(MY_INCIDENTS, data.items.map(myIncidentToFe));
    } catch {
      /* ignore */
    }
  },

  /** UC-CUS-15: POST /customer/incidents → trả về sự cố vừa tạo (dùng để mở yêu cầu hoàn tiền kèm theo) */
  async reportIncident(
    order: ShippingOrder,
    input: { reportedBy: 'Customer' | 'Driver'; reporterId?: string; type: IncidentType; description: string; photos: string[] }
  ): Promise<Incident> {
    try {
      const { data } = await apiClient.post<{ incidentId: number }>('/customer/Incidents', {
        orderId: Number(order.id),
        incidentType: input.type,
        description: input.description,
        photoUrls: input.photos,
      });
      const incident: Incident = {
        id: String(data.incidentId),
        orderId: order.id,
        orderCode: order.code,
        reportedBy: input.reportedBy,
        type: input.type,
        description: input.description,
        photos: input.photos,
        status: 'Open',
        createdAt: new Date().toISOString(),
      };
      writeStore(MY_INCIDENTS, [incident, ...readStore<Incident[]>(MY_INCIDENTS, () => [])]);
      return incident;
    } catch (e) {
      throw toServiceError(e);
    }
  },

  // ----------------------------------------------------------------- Refunds
  listRefundsSync: (): Refund[] => readStore<Refund[]>(MY_REFUNDS, () => []),
  listRefundsByOrderSync: (orderId: string) => readStore<Refund[]>(MY_REFUNDS, () => []).filter((r) => r.orderId === orderId),

  /** UC-CUS-16/23: GET /customer/refunds (+ chi tiết từng khoản để có đủ reason/evidence) */
  async loadMyRefunds(): Promise<void> {
    try {
      const { data } = await apiClient.get<
        PagedResult<{ id: number; orderId: number; orderCode: string; sourceType: Refund['source']; refundStatus: Refund['status']; requestedAmount: number; approvedAmount?: number; decisionReason?: string; waitingForYourReply: boolean; createdAt: string }>
      >('/customer/Refunds', { params: { page: 1, pageSize: 50 } });
      const details = await Promise.all(
        data.items.map(async (s) => {
          try {
            const { data: d } = await apiClient.get<{
              id: number; orderId: number; orderCode: string; incidentId?: number; sourceType: Refund['source']; refundStatus: Refund['status']; reason: string; reasonCode?: string;
              evidenceUrls: string[]; requestedAmount: number; approvedAmount?: number; decisionReason?: string; infoRequestNote?: string; customerReply?: string; waitingForYourReply: boolean;
              createdAt: string; decidedAt?: string; processedAt?: string;
            }>(`/customer/Refunds/${s.id}`);
            const r: Refund & { incidentId?: string } = {
              id: String(d.id),
              orderId: String(d.orderId),
              orderCode: d.orderCode,
              incidentId: d.incidentId != null ? String(d.incidentId) : undefined,
              customerName: '',
              source: d.sourceType,
              reason: d.reason,
              evidence: d.evidenceUrls,
              amountPaid: d.requestedAmount,
              requestedAmount: d.requestedAmount,
              approvedAmount: d.approvedAmount,
              decisionReason: d.decisionReason,
              infoRequest: d.infoRequestNote,
              infoReply: d.customerReply,
              waitingForYourReply: d.waitingForYourReply,
              status: d.refundStatus,
              createdAt: d.createdAt,
              updatedAt: d.decidedAt ?? d.processedAt ?? d.createdAt,
            };
            return r;
          } catch {
            return {
              id: String(s.id),
              orderId: String(s.orderId),
              orderCode: s.orderCode,
              customerName: '',
              source: s.sourceType,
              reason: '',
              evidence: [],
              amountPaid: s.requestedAmount,
              requestedAmount: s.requestedAmount,
              approvedAmount: s.approvedAmount,
              decisionReason: s.decisionReason,
              waitingForYourReply: s.waitingForYourReply,
              status: s.refundStatus,
              createdAt: s.createdAt,
              updatedAt: s.createdAt,
            } satisfies Refund;
          }
        })
      );
      writeStore(MY_REFUNDS, details);
    } catch {
      /* ignore */
    }
  },

  /** UC-CUS-17/18: cần incidentId (từ reportIncident) – POST /customer/refunds/incidents */
  async requestIncidentRefund(incidentId: string, input: { reason: string; evidence: string[]; requestedAmount: number }): Promise<Refund> {
    try {
      const { data } = await apiClient.post<{ refundId: number }>('/customer/Refunds/incidents', {
        incidentId: Number(incidentId),
        reason: input.reason,
        evidenceUrls: input.evidence,
        requestedAmount: Math.round(input.requestedAmount),
      });
      await caseService.loadMyRefunds();
      return readStore<Refund[]>(MY_REFUNDS, () => []).find((r) => r.id === String(data.refundId)) ?? ({ id: String(data.refundId) } as Refund);
    } catch (e) {
      throw toServiceError(e);
    }
  },

  /** UC-CUS-21/22: POST /customer/refunds/complaints */
  async submitComplaint(order: ShippingOrder, input: { reasonCode: string; reason: string; evidence: string[]; requestedAmount: number }): Promise<Refund> {
    try {
      const { data } = await apiClient.post<{ refundId: number }>('/customer/Refunds/complaints', {
        orderId: Number(order.id),
        reasonCode: input.reasonCode,
        reason: input.reason || null,
        evidenceUrls: input.evidence,
        requestedAmount: Math.round(input.requestedAmount),
      });
      await caseService.loadMyRefunds();
      return readStore<Refund[]>(MY_REFUNDS, () => []).find((r) => r.id === String(data.refundId)) ?? ({ id: String(data.refundId) } as Refund);
    } catch (e) {
      throw toServiceError(e);
    }
  },

  /** UC-CUS-24: POST /customer/refunds/{id}/withdraw */
  async withdrawComplaint(refundId: string): Promise<Refund> {
    try {
      await apiClient.post(`/customer/Refunds/${refundId}/withdraw`);
      await caseService.loadMyRefunds();
      return readStore<Refund[]>(MY_REFUNDS, () => []).find((r) => r.id === refundId) ?? ({ id: refundId } as Refund);
    } catch (e) {
      throw toServiceError(e);
    }
  },

  /** GB-43: POST /customer/refunds/{id}/reply */
  async replyMoreInfo(refundId: string, answer: string, photos: string[]): Promise<Refund> {
    try {
      await apiClient.post(`/customer/Refunds/${refundId}/reply`, { reply: answer, photoUrls: photos });
      await caseService.loadMyRefunds();
      return readStore<Refund[]>(MY_REFUNDS, () => []).find((r) => r.id === refundId) ?? ({ id: refundId } as Refund);
    } catch (e) {
      throw toServiceError(e);
    }
  },

  canComplain: (o: ShippingOrder) => o.status === 'Delivered',

  // ------------------------------------------------------------- Dispatcher
  listDispatcherComplaintsSync: (): (Refund & { stage: string })[] => readStore(DISPATCHER_COMPLAINTS, () => []),

  /** UC-DIS-11: GET /dispatcher/complaints – chỉ khiếu nại (Complaint); hoàn tiền sự cố xem trong chi tiết sự cố */
  async loadDispatcherComplaints(): Promise<void> {
    try {
      const { data } = await apiClient.get<
        PagedResult<{
          id: number; orderId: number; orderCode: string; customerName: string; reason: string; requestedAmount: number; proposedAmount?: number; stage: string; refundStatus: Refund['status']; deliveredAt?: string; createdAt: string;
        }>
      >('/dispatcher/Complaints', { params: { page: 1, pageSize: 50 } });
      writeStore(
        DISPATCHER_COMPLAINTS,
        data.items.map((d) => ({
          id: String(d.id),
          orderId: String(d.orderId),
          orderCode: d.orderCode,
          customerName: d.customerName,
          source: 'Complaint' as const,
          reason: d.reason,
          evidence: [],
          amountPaid: d.requestedAmount,
          requestedAmount: d.requestedAmount,
          proposedAmount: d.proposedAmount,
          status: d.refundStatus,
          stage: d.stage,
          createdAt: d.createdAt,
          updatedAt: d.createdAt,
        }))
      );
    } catch {
      /* ignore */
    }
  },

  /** UC-DIS-14: POST /dispatcher/complaints/{id}/request-info */
  async requestMoreInfo(refundId: string, question: string): Promise<void> {
    try {
      await apiClient.post(`/dispatcher/Complaints/${refundId}/request-info`, { note: question });
      await caseService.loadDispatcherComplaints();
    } catch (e) {
      throw toServiceError(e);
    }
  },

  /** UC-DIS-09/15/17: POST /dispatcher/complaints/{id}/proposal */
  async proposeRefund(refundId: string, amount: number, note: string): Promise<void> {
    try {
      await apiClient.post(`/dispatcher/Complaints/${refundId}/proposal`, { amount: Math.round(amount), reason: note });
      await caseService.loadDispatcherComplaints();
    } catch (e) {
      throw toServiceError(e);
    }
  },

  listIncidentsDispatcherSync: (): DispatcherIncidentDetail[] => readStore(DISPATCHER_INCIDENTS, () => []),

  /** UC-DIS-03: GET /dispatcher/incidents */
  async loadDispatcherIncidents(): Promise<void> {
    try {
      const { data } = await apiClient.get<PagedResult<DispatcherIncidentDto>>('/dispatcher/Incidents', { params: { page: 1, pageSize: 50 } });
      writeStore(
        DISPATCHER_INCIDENTS,
        data.items.map(
          (d): Incident => ({
            id: String(d.id),
            orderId: String(d.orderId),
            orderCode: d.orderCode,
            reportedBy: d.reporterRole === 'Driver' ? 'Driver' : 'Customer',
            type: d.incidentType,
            description: d.description,
            photos: [],
            status: d.resolutionStatus,
            createdAt: d.createdAt,
          })
        )
      );
    } catch {
      /* ignore */
    }
  },

  /** UC-DIS-04: GET /dispatcher/incidents/{id} – nạp đầy đủ khách/tài xế/xe/ảnh khi mở chi tiết 1 sự cố */
  async loadDispatcherIncidentDetail(incidentId: string): Promise<DispatcherIncidentDetail | undefined> {
    try {
      const { data } = await apiClient.get<{
        id: number; orderId: number; orderCode: string; orderStatus: string; incidentType: IncidentType; description: string; photoUrls: string[];
        reporterName: string; reporterRole: string; createdAt: string; resolvedAt?: string; resolutionStatus: Incident['status']; resolutionDecision?: IncidentDecision; resolutionNote?: string;
        order: { paymentMethod: string };
        customer: { fullName: string; phoneNumber: string };
        driver?: { driverProfileId: number; fullName: string; phoneNumber: string; licensePlate?: string; vehicleTypeName?: string };
      }>(`/dispatcher/Incidents/${incidentId}`);
      const list = readStore<Incident[]>(DISPATCHER_INCIDENTS, () => []);
      const idx = list.findIndex((i) => i.id === incidentId);
      const detail: DispatcherIncidentDetail = {
        id: String(data.id),
        orderId: String(data.orderId),
        orderCode: data.orderCode,
        reportedBy: data.reporterRole === 'Driver' ? 'Driver' : 'Customer',
        type: data.incidentType,
        description: data.description,
        photos: data.photoUrls,
        status: data.resolutionStatus,
        decision: data.resolutionDecision,
        decisionNote: data.resolutionNote,
        createdAt: data.createdAt,
        resolvedAt: data.resolvedAt,
        customerName: data.customer.fullName,
        customerPhone: data.customer.phoneNumber,
        driverName: data.driver?.fullName,
        driverPhone: data.driver?.phoneNumber,
        driverProfileId: data.driver ? String(data.driver.driverProfileId) : undefined,
        vehiclePlate: data.driver?.licensePlate,
        vehicleTypeName: data.driver?.vehicleTypeName,
        paymentMethod: data.order.paymentMethod as ShippingOrder['paymentMethod'],
      };
      if (idx >= 0) list[idx] = detail;
      else list.push(detail);
      writeStore(DISPATCHER_INCIDENTS, list);
      return detail;
    } catch (e) {
      throw toServiceError(e);
    }
  },

  /** UC-DIS-06: GET /dispatcher/incidents/{id}/replacement-drivers */
  async getReplacementDrivers(incidentId: string): Promise<AssignedDriver[]> {
    try {
      const { data } = await apiClient.get<
        { driverProfileId: number; fullName: string; phoneNumber: string; licensePlate: string; latitude: number; longitude: number; lastLocationAt: string }[]
      >(`/dispatcher/Incidents/${incidentId}/replacement-drivers`);
      return data.map((d) => ({ id: String(d.driverProfileId), name: d.fullName, phone: d.phoneNumber, avatar: '', rating: 0, licensePlate: d.licensePlate, currentLat: d.latitude, currentLng: d.longitude, lastLocationAt: d.lastLocationAt }));
    } catch (e) {
      throw toServiceError(e);
    }
  },

  /** UC-DIS-05/06/07: quyết định xử lý sự cố. `cargoDisposition` bắt buộc khi đơn PickedUp/InTransit (CARGO_DISPOSITION_REQUIRED, 2.6). */
  async resolveIncident(
    incidentId: string,
    decision: IncidentDecision,
    note: string,
    opts?: { newDriver?: AssignedDriver; refundable?: boolean; cargoDisposition?: 'ReturnToPickup' | 'Keep' }
  ): Promise<void> {
    try {
      if (decision === 'ContinueTrip') {
        await apiClient.post(`/dispatcher/Incidents/${incidentId}/resolve`, { reason: note });
      } else if (decision === 'ReassignDriver') {
        if (!opts?.newDriver) throw new ServiceError('Vui lòng chọn tài xế thay thế.');
        await apiClient.post(`/dispatcher/Incidents/${incidentId}/reassign`, { newDriverProfileId: Number(opts.newDriver.id), reason: note });
      } else {
        await apiClient.post(`/dispatcher/Incidents/${incidentId}/cancel-order`, {
          reason: note,
          refund: opts?.refundable ?? false,
          cargoDisposition: opts?.cargoDisposition,
        });
      }
      await caseService.loadDispatcherIncidents();
    } catch (e) {
      throw toServiceError(e);
    }
  },

  /** UC-DIS-10: POST /dispatcher/incidents/{id}/cancel */
  async cancelIncident(incidentId: string, reason: string): Promise<void> {
    try {
      await apiClient.post(`/dispatcher/Incidents/${incidentId}/cancel`, { reason });
      await caseService.loadDispatcherIncidents();
    } catch (e) {
      throw toServiceError(e);
    }
  },

  async markIncidentInProgress(incidentId: string): Promise<void> {
    try {
      await apiClient.post(`/dispatcher/Incidents/${incidentId}/start`);
      await caseService.loadDispatcherIncidents();
    } catch (e) {
      throw toServiceError(e);
    }
  },

  // ------------------------------------------------------------------ Admin
  listAdminRefundsSync: (): Refund[] => readStore(ADMIN_REFUNDS, () => []),

  /** UC-ADM-18: GET /admin/refunds */
  async loadAdminRefunds(): Promise<void> {
    try {
      const { data } = await apiClient.get<
        PagedResult<{
          id: number; orderId: number; orderCode: string; customerName: string; customerPhone: string; sourceType: Refund['source']; refundStatus: Refund['status'];
          requestedAmount: number; proposedAmount?: number; reason: string; proposalReason?: string; proposedByName?: string; decisionNote?: string; bankReferenceCode?: string; decidedAt?: string; processedAt?: string; createdAt: string;
        }>
      >('/admin/Refunds', { params: { page: 1, pageSize: 50 } });
      writeStore(
        ADMIN_REFUNDS,
        data.items.map(
          (d): Refund => ({
            id: String(d.id),
            orderId: String(d.orderId),
            orderCode: d.orderCode,
            customerName: d.customerName,
            source: d.sourceType,
            reason: d.reason,
            evidence: [],
            amountPaid: d.requestedAmount,
            requestedAmount: d.requestedAmount,
            proposedAmount: d.proposedAmount,
            proposalNote: d.proposalReason,
            decisionReason: d.decisionNote,
            bankReferenceCode: d.bankReferenceCode,
            status: d.refundStatus,
            createdAt: d.createdAt,
            updatedAt: d.decidedAt ?? d.processedAt ?? d.createdAt,
          })
        )
      );
    } catch {
      /* ignore */
    }
  },

  /** UC-ADM-19: POST /admin/refunds/{id}/approve (quyết định); chuyển khoản thật thực hiện riêng ở payoutRefund */
  async approveRefund(refundId: string, note?: string): Promise<void> {
    try {
      await apiClient.post(`/admin/Refunds/${refundId}/approve`, { note: note || null });
      await caseService.loadAdminRefunds();
    } catch (e) {
      throw toServiceError(e);
    }
  },

  /** UC-ADM-20 / GB-27: POST /admin/refunds/{id}/payout – ghi mã chuyển khoản sau khi đã Approved */
  async payoutRefund(refundId: string, bankReferenceCode: string): Promise<void> {
    try {
      await apiClient.post(`/admin/Refunds/${refundId}/payout`, { bankReferenceCode });
      await caseService.loadAdminRefunds();
    } catch (e) {
      throw toServiceError(e);
    }
  },

  async rejectRefund(refundId: string, note?: string): Promise<void> {
    try {
      await apiClient.post(`/admin/Refunds/${refundId}/reject`, { note: note || null });
      await caseService.loadAdminRefunds();
    } catch (e) {
      throw toServiceError(e);
    }
  },
};
