/**
 * Incident / Refund / Wallet types – SRS Entities InTransitIncident, Refund, DriverWallet, WalletTransaction.
 */
export type IncidentType = 'VehicleBreakdown' | 'DamagedCargo' | 'Accident' | 'Delay' | 'WrongRoute' | 'DriverMisconduct' | 'Other';
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

export type RefundSource = 'Cancellation' | 'Incident' | 'Complaint';
/** Requested → (InfoRequested) → Proposed → Approved/Rejected; Approved → Processed; Requested → Withdrawn */
export type RefundStatus = 'Requested' | 'InfoRequested' | 'Proposed' | 'Approved' | 'Rejected' | 'Processed' | 'Withdrawn';

export interface Refund {
  id: string;
  orderId: string;
  orderCode: string;
  customerName: string;
  source: RefundSource;
  reason: string;
  evidence: string[];
  amountPaid: number;
  requestedAmount: number;
  proposedAmount?: number;
  approvedAmount?: number;
  proposalNote?: string;
  infoRequest?: string;
  infoReply?: string;
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
