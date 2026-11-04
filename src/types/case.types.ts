/**
 * Incident / Refund / Wallet types – SRS Entities InTransitIncident, Refund, DriverWallet, WalletTransaction.
 */
/** Domain.Enums.IncidentType – chỉ 4 giá trị; "trễ"/"sai lộ trình" ghi là Other (DECISIONS 7.1) */
export type IncidentType = 'VehicleBreakdown' | 'DamagedCargo' | 'Accident' | 'Other';
export type IncidentStatus = 'Open' | 'InProgress' | 'Resolved' | 'Cancelled';
export type IncidentDecision = 'ContinueTrip' | 'ReassignDriver' | 'CancelOrder';

export interface Incident {
  id: string;
  orderId: string;
  orderCode: string;
  reportedBy: 'Customer' | 'Driver';
  /** UserID người báo (giữ lịch sử khi tài xế bị đổi) */
  reporterId?: string;
  type: IncidentType;
  description: string;
  photos: string[];
  gps?: { lat: number; lng: number };
  status: IncidentStatus;
  decision?: IncidentDecision;
  decisionNote?: string;
  createdAt: string;
  resolvedAt?: string;
}

/** Incident + các trường chỉ có ở chi tiết (GET /dispatcher/incidents/{id}) */
export interface DispatcherIncidentDetail extends Incident {
  customerName?: string;
  customerPhone?: string;
  driverName?: string;
  driverPhone?: string;
  driverProfileId?: string;
  vehiclePlate?: string;
  vehicleTypeName?: string;
  paymentMethod?: 'PayOS' | 'Cash';
}

export type RefundSource = 'Cancellation' | 'Incident' | 'Complaint';
/** Domain.Enums.RefundStatus thật; "đang chờ bổ sung/đề xuất" là field rời (waitingForYourReply, proposedAmount), không phải status riêng */
export type RefundStatus = 'Requested' | 'Approved' | 'Rejected' | 'Processed' | 'Failed' | 'Withdrawn';

export interface Refund {
  id: string;
  orderId: string;
  orderCode: string;
  /** Chỉ có khi source = Incident (hoàn tiền sự cố theo dõi theo id sự cố, không theo id hoàn tiền) */
  incidentId?: string;
  customerName: string;
  source: RefundSource;
  reason: string;
  evidence: string[];
  amountPaid: number;
  requestedAmount: number;
  proposedAmount?: number;
  approvedAmount?: number;
  /** Lý do Admin duyệt/từ chối (CUS-23) */
  decisionReason?: string;
  /** Ghi chú nội bộ của Dispatcher khi đề xuất – không trả về cho khách */
  proposalNote?: string;
  infoRequest?: string;
  infoReply?: string;
  /** Dispatcher đang chờ khách trả lời câu hỏi bổ sung (7.4) */
  waitingForYourReply?: boolean;
  status: RefundStatus;
  bankReferenceCode?: string;
  createdAt: string;
  updatedAt: string;
}

export type WalletTxType = 'TopUpDeposit' | 'TripEarning' | 'CommissionDeduction' | 'WithdrawEarnings';

export interface WalletTransaction {
  id: string;
  type: WalletTxType;
  amount: number;
  balanceAfter: number;
  orderCode?: string;
  referenceCode?: string;
  status: 'Pending' | 'Completed' | 'Failed';
  createdAt: string;
}

export interface WithdrawalRequest {
  id: string;
  driverId: string;
  driverName: string;
  bankName: string;
  bankAccount: string;
  amount: number;
  status: 'Pending' | 'Paid' | 'Rejected';
  bankReferenceCode?: string;
  rejectReason?: string;
  createdAt: string;
}
