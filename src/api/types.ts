/**
 * Kiểu dữ liệu khớp 1-1 với DTO của backend (ModMove.Application, JSON camelCase).
 * Nguồn: ModMove-backend/src/ModMove.Application/Features/** và docs/api/README.md.
 * Không thêm/bớt field ở đây — đổi thì đổi theo BE.
 */

/* ============================================================ Chung */
export interface PagedResult<T> {
  items: T[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
}

export type UserRole = 'Customer' | 'Driver' | 'Dispatcher' | 'Administrator';
export type AccountStatus = 'Active' | 'Inactive' | 'Locked';
export type OrderStatus = 'Pending' | 'Accepted' | 'Arrived' | 'PickedUp' | 'InTransit' | 'Delivered' | 'Completed' | 'Cancelled';
export type PaymentMethod = 'Cash' | 'PayOS';
export type PaymentStatus = 'Unpaid' | 'Paid';
export type PaymentTransactionStatus = 'Pending' | 'Paid' | 'Failed' | 'Cancelled' | 'Expired';
export type PayerRole = 'Sender' | 'Receiver';
export type IncidentType = 'VehicleBreakdown' | 'DamagedCargo' | 'Accident' | 'Other';
export type IncidentResolutionStatus = 'Open' | 'InProgress' | 'Resolved' | 'Cancelled';
export type IncidentDecision = 'ContinueTrip' | 'ReassignDriver' | 'CancelOrder';
export type RefundSourceType = 'Cancellation' | 'Incident' | 'Complaint';
export type RefundStatus = 'Requested' | 'Approved' | 'Rejected' | 'Processed' | 'Failed' | 'Withdrawn';
export type ComplaintStage = 'NeedsReview' | 'WaitingForCustomer' | 'CustomerReplied' | 'ProposedToAdmin' | 'Closed';
export type ProofStatus = 'Pending' | 'Verified' | 'Rejected';
export type ApprovalStatus = 'Pending' | 'Approved' | 'Rejected';
export type WalletTransactionStatus = 'Pending' | 'Completed' | 'Failed' | 'Rejected';
export type CargoDisposition = 'ReturnToPickup' | 'Keep';
export type OrderView = 'All' | 'Active' | 'History' | 'Completed' | 'Cancelled';
export type HandledCaseType = 'Incident' | 'Complaint' | 'IncidentRefund' | 'Refund';
export type OtpPurpose = 'Register' | 'ResetPassword';
export type PaymentPlatform = 'Web' | 'App';
export type MasterDataCategory = 'POLICY' | 'SERVICE_INFO' | 'CARGO_TYPE' | 'CANCELLATION_REASON' | 'COMPLAINT_REASON' | 'INCIDENT_CATEGORY' | 'BANK';

/* ============================================================ Auth / Account */
export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  userId: number;
  fullName: string;
  role: UserRole;
}
export interface RegisterRequest {
  fullName: string;
  phoneNumber: string;
  email: string;
  password: string;
}
/** BE 2026-11-12: chỉ gửi OTP, tài khoản được tạo khi verify-email thành công nên không còn userId. */
export interface RegisterResponse {
  email: string;
}
export interface ProfileResponse {
  id: number;
  fullName: string;
  phoneNumber: string;
  email: string;
  role: UserRole;
  emailVerified: boolean;
}

/* ============================================================ Public */
export interface VehicleTypeResponse {
  id: number;
  name: string;
  maxLoadWeightKg: number;
  cargoBedLengthCm: number;
  cargoBedWidthCm: number;
  cargoBedHeightCm: number;
  baseFare: number;
  pricePerKm: number;
  minimumFare: number;
}
export interface ContentResponse {
  code: string;
  name: string;
  description: string | null;
}
export interface FareEstimateRequest {
  vehicleTypeId: number;
  pickupAddress: string;
  dropoffAddress: string;
  weightKg: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  hasLoadingService: boolean;
  couponCode?: string | null;
}
export interface FareEstimateResponse {
  distanceKm: number;
  durationMinutes: number;
  distanceFee: number;
  serviceFee: number;
  discountAmount: number;
  totalFee: number;
}
export interface SupportRequestBody {
  fullName: string;
  contact: string;
  content: string;
}

/* ============================================================ Customer: đơn hàng */
export interface CargoInput {
  cargoType: string;
  quantity: number;
  weightKg: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  photoUrls: string[];
  specialNotes?: string | null;
}
export interface CreateOrderRequest {
  vehicleTypeId: number;
  pickupAddress: string;
  dropoffAddress: string;
  receiverName: string;
  receiverPhone: string;
  cargo: CargoInput;
  hasLoadingService: boolean;
  couponCode?: string | null;
  paymentMethod: PaymentMethod;
  payerRole: PayerRole | null;
  prohibitedGoodsCommitment: boolean;
  expectedTotalFee?: number | null;
}
export interface CreateOrderResponse {
  orderId: number;
  orderCode: string;
  totalFee: number;
}
export interface MyOrdersQuery {
  page?: number;
  pageSize?: number;
  view?: OrderView;
  search?: string;
  status?: OrderStatus;
  fromDate?: string;
  toDate?: string;
  receiverPhone?: string;
}
export interface OrderSummaryResponse {
  id: number;
  orderCode: string;
  orderStatus: OrderStatus;
  pickupAddress: string;
  dropoffAddress: string;
  vehicleTypeName: string;
  totalFee: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  createdAt: string;
  receiverName: string;
  receiverPhone: string;
}
export interface CargoResponse {
  cargoType: string;
  quantity: number;
  weightKg: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  photoUrls: string[];
  specialNotes: string | null;
  cargoTypeName: string | null;
}
export interface DriverResponse {
  fullName: string;
  phoneNumber: string;
  licensePlate: string | null;
}
export interface ProofResponse {
  pickupPhotoUrls: string[];
  proofStatus: ProofStatus;
  pickupSubmissionCount: number;
  rejectionReason: string | null;
  deliveryPhotoUrl: string | null;
  deliveredAt: string | null;
}
export interface StatusHistoryResponse {
  fromStatus: OrderStatus | null;
  toStatus: OrderStatus;
  changedByRole: string;
  note: string | null;
  changedAt: string;
}
export interface PaymentResponse {
  transactionStatus: string;
  checkoutUrl: string | null;
  expiresAt: string | null;
  paidAt: string | null;
  isExpired: boolean;
}
export interface OrderDetailResponse {
  id: number;
  /** Sự cố do tài xế báo còn Open/InProgress: chuyến tạm dừng, khách chưa duyệt được ảnh lấy hàng (null/không có = không chặn) */
  pendingDriverIncidentId?: number | null;
  orderCode: string;
  orderStatus: OrderStatus;
  pickupAddress: string;
  dropoffAddress: string;
  vehicleTypeName: string;
  receiverName: string;
  receiverPhone: string;
  estimatedDistanceKm: number;
  estimatedDurationMin: number;
  hasLoadingService: boolean;
  distanceFee: number;
  serviceFee: number;
  discountAmount: number;
  totalFee: number;
  paymentMethod: PaymentMethod;
  payerRole: PayerRole | null;
  paymentStatus: PaymentStatus;
  createdAt: string;
  cargo: CargoResponse;
  driver: DriverResponse | null;
  proof: ProofResponse | null;
  history: StatusHistoryResponse[];
  couponCode: string | null;
  payment: PaymentResponse | null;
}
export interface GeoPoint {
  latitude: number;
  longitude: number;
}
export interface OrderTrackingResponse {
  orderId: number;
  orderStatus: OrderStatus;
  pickup: GeoPoint;
  dropoff: GeoPoint;
  driver: { latitude: number; longitude: number; at: string; isStale: boolean } | null;
  eta: { target: 'Pickup' | 'Handover' | 'Dropoff'; durationMinutes: number } | null;
}
export interface CreateOrderPaymentResponse {
  transactionId: number;
  checkoutUrl: string;
  qrCode: string | null;
  amount: number;
  expiresAt: string;
}
export interface AvailableCouponResponse {
  discountCode: string;
  discountValue: number;
  minimumOrderValue: number;
  expiresAt: string;
  remainingUses: number | null;
}

/* ============================================================ Customer: đánh giá, sự cố, hoàn tiền */
export interface MyRatingResponse {
  id: number;
  orderId: number;
  orderCode: string;
  ratingStars: number;
  reviewComment: string | null;
  driverName: string;
  createdAt: string;
}
export interface MyIncidentResponse {
  id: number;
  orderId: number;
  orderCode: string;
  incidentType: IncidentType;
  description: string;
  photoUrls: string[];
  reportedByYou: boolean;
  resolutionStatus: IncidentResolutionStatus;
  resolutionDecision: IncidentDecision | null;
  resolutionNote: string | null;
  createdAt: string;
  resolvedAt: string | null;
}
/** GET /driver/incidents: sự cố tài xế đã báo hoặc nằm trên đơn đang giao cho mình. reportedByYou=false thì mô tả là câu chung, không có ảnh */
export interface DriverIncidentResponse {
  id: number;
  orderId: number;
  orderCode: string;
  orderStatus: OrderStatus;
  incidentType: IncidentType;
  description: string;
  photoUrls: string[];
  latitude: number | null;
  longitude: number | null;
  reportedByYou: boolean;
  resolutionStatus: IncidentResolutionStatus;
  resolutionDecision: IncidentDecision | null;
  resolutionNote: string | null;
  createdAt: string;
  resolvedAt: string | null;
}
/** GET /driver/Trips/active, /driver/Trips/{id}: chi tiết chuyến của tài xế. */
export interface DriverTripDetailResponse {
  id: number;
  orderCode: string;
  orderStatus: OrderStatus;
  pickupAddress: string;
  pickupLatitude: number;
  pickupLongitude: number;
  dropoffAddress: string;
  dropoffLatitude: number;
  dropoffLongitude: number;
  /** Có giá trị khi đơn được chuyển cho tài xế này giữa đường: đến đây nhận hàng từ xe trước (7.2). */
  handoverPoint: { latitude: number; longitude: number } | null;
  vehicleTypeName: string;
  estimatedDistanceKm: number;
  estimatedDurationMin: number;
  hasLoadingService: boolean;
  customerName: string;
  customerPhone: string;
  receiverName: string;
  receiverPhone: string;
  totalFee: number;
  commissionAmount: number;
  driverEarning: number;
  paymentMethod: PaymentMethod;
  payerRole: PayerRole | null;
  paymentStatus: PaymentStatus;
  cashToCollect: number;
  cargo: { cargoType: string; cargoTypeName: string | null; quantity: number; weightKg: number; lengthCm: number; widthCm: number; heightCm: number; photoUrls: string[]; specialNotes: string | null };
  proof: { pickupPhotoUrls: string[]; proofStatus: ProofStatus; pickupSubmissionCount: number; remainingPickupSubmissions: number; rejectionReason: string | null; deliveryPhotoUrl: string | null } | null;
  statusHistories: { fromStatus: OrderStatus | null; toStatus: OrderStatus; changedByRole: string; note: string | null; changedAt: string }[];
  /** Sự cố trên đơn; sự cố không do tài xế báo chỉ có câu mô tả chung (8.3). */
  incidents: { id: number; incidentType: IncidentType; description: string; reportedByYou: boolean; resolutionStatus: IncidentResolutionStatus }[];
}
export interface DriverIncidentsQuery {
  orderId?: number;
  status?: IncidentResolutionStatus;
  page?: number;
  pageSize?: number;
}
export interface ReportIncidentRequest {
  orderId: number;
  incidentType: IncidentType;
  description: string;
  photoUrls?: string[];
  latitude?: number | null;
  longitude?: number | null;
}
/** Tài khoản nhận tiền hoàn: nhập tay (bankCode từ lookups/banks) hoặc dùng tài khoản đã trả qua PayOS */
export interface PayoutAccountInput {
  useSuggested: boolean;
  bankCode?: string | null;
  accountNumber?: string | null;
  accountHolder?: string | null;
}
/** Tài khoản nhận hoàn tiền như khách nhìn thấy: số tài khoản luôn bị che */
export interface PayoutAccountView {
  bankCode: string;
  bankName: string;
  maskedAccountNumber: string;
  accountHolder: string;
}
export interface SubmitComplaintRequest {
  orderId: number;
  reasonCode: string;
  reason?: string | null;
  evidenceUrls?: string[];
  requestedAmount: number;
  payoutAccount: PayoutAccountInput;
}
export interface RequestIncidentRefundRequest {
  incidentId: number;
  reason: string;
  evidenceUrls?: string[];
  requestedAmount: number;
  payoutAccount: PayoutAccountInput;
}
export interface MyRefundSummaryResponse {
  id: number;
  orderId: number;
  orderCode: string;
  sourceType: RefundSourceType;
  refundStatus: RefundStatus;
  requestedAmount: number;
  approvedAmount: number | null;
  decisionReason: string | null;
  waitingForYourReply: boolean;
  /** Chưa có tài khoản nhận tiền và khoản hoàn còn Requested/Approved/Failed */
  needsPayoutAccount: boolean;
  createdAt: string;
}
export interface MyRefundDetailResponse extends MyRefundSummaryResponse {
  incidentId: number | null;
  reason: string;
  reasonCode: string | null;
  evidenceUrls: string[];
  infoRequestNote: string | null;
  customerReply: string | null;
  decidedAt: string | null;
  processedAt: string | null;
  payoutAccount: PayoutAccountView | null;
  /** Lý do Admin báo chuyển khoản lỗi */
  payoutFailureReason: string | null;
  bankReferenceCode: string | null;
  /** Tài khoản đã trả qua PayOS để khách xác nhận (hiện luôn null) */
  suggestedPayoutAccount: PayoutAccountView | null;
}

/* ============================================================ Driver */
export interface DriverStatusResponse {
  hasProfile: boolean;
  approvalStatus: ApprovalStatus | null;
  isOnline: boolean;
  vehicleTypeId: number | null;
  licensePlate: string | null;
  depositBalance: number;
  earningsBalance: number;
  walletStatus: string | null;
  activeOrderId: number | null;
  lastLatitude: number | null;
  lastLongitude: number | null;
  lastLocationAt: string | null;
  isGpsStale: boolean;
  canReceiveOrders: boolean;
}
/** GET /driver/wallet – hai ví: tiền cọc + thu nhập; rút được cả hai khi không có đơn đang chạy */
export interface DriverWalletResponse {
  walletId: number;
  walletStatus: string;
  depositBalance: number;
  earningsBalance: number;
  walletTotal: number;
  /** Phần tiền cọc còn thiếu so với mức tối thiểu (0 nếu đủ) */
  missingDepositAmount: number;
  maxWithdrawableAmount: number;
  requiredDeposit: number;
  canReceiveOrders: boolean;
  hasActiveOrder: boolean;
  hasPendingWithdrawal: boolean;
  pendingWithdrawalAmount: number;
  bankAccount: { bankName: string | null; bankAccountNumber: string | null; bankAccountHolder: string | null } | null;
}
export interface DriverWalletTransactionDto {
  id: number;
  transactionType: string;
  amount: number;
  earningsAmount: number;
  depositAmount: number;
  balanceAfter: number;
  transactionStatus: WalletTransactionStatus;
  orderId: number | null;
  orderCode: string | null;
  referenceCode: string | null;
  createdAt: string;
}
export interface DriverOnboardingStatusResponse {
  hasApplication: boolean;
  canSubmit: boolean;
  profileApprovalStatus: ApprovalStatus | null;
  applicationId: number | null;
  latestVersionNumber: number | null;
  submittedAt: string | null;
  reviewedAt: string | null;
  vehicleTypeId: number | null;
  vehicleTypeName: string | null;
  licensePlate: string | null;
  maxLoadWeightKg: number | null;
  citizenIdNumber: string | null;
  driverLicenseNumber: string | null;
  documentUrls: string[];
  rejectionReasons: string[] | null;
  /** Mục bị từ chối theo khoá cố định của BE (xem RejectedItemKey) */
  rejectedItems: RejectedApplicationItem[] | null;
}
/** Khoá mục hồ sơ tài xế dùng khi từ chối và nộp lại */
export type RejectedItemKey =
  | 'LicenseFront'
  | 'LicenseBack'
  | 'VehicleRegistration'
  | 'VehicleInspection'
  | 'VehiclePhoto'
  | 'CitizenIdFront'
  | 'CitizenIdBack'
  | 'Portrait'
  | 'VehicleInfo'
  | 'PersonalInfo';
export interface RejectedApplicationItem {
  key: RejectedItemKey | string;
  reason: string;
}
export interface SubmitDriverApplicationRequest {
  vehicleTypeId: number;
  licensePlate: string;
  maxLoadWeightKg: number;
  /** Đúng 7 phần tử: [bằng lái trước, bằng lái sau, đăng ký xe, đăng kiểm, ảnh xe, CCCD trước, CCCD sau] */
  documentUrls: string[];
}
/** Nộp lại chỉ phần bị từ chối (POST /driver/onboarding/resubmit) */
export interface ResubmitDriverApplicationRequest {
  items?: { key: RejectedItemKey | string; url: string }[];
  vehicle?: { vehicleTypeId?: number; licensePlate?: string; maxLoadWeightKg?: number };
}
export interface NearbyOrderDto {
  orderId: number;
  orderCode: string;
  pickupAddress: string;
  pickupLatitude: number;
  pickupLongitude: number;
  dropoffAddress: string;
  dropoffLatitude: number;
  dropoffLongitude: number;
  distanceToPickupKm: number;
  estimatedDistanceKm: number;
  estimatedDurationMin: number;
  totalFee: number;
  commissionAmount: number;
  driverEarning: number;
  paymentMethod: PaymentMethod;
  payerRole: PayerRole | null;
  hasLoadingService: boolean;
  cargoType: string;
  cargoTypeName: string | null;
  cargoQuantity: number;
  cargoWeightKg: number;
  cargoLengthCm: number;
  cargoWidthCm: number;
  cargoHeightCm: number;
  cargoPhotoUrls: string[];
  specialNotes: string | null;
  createdAt: string;
}

/* ============================================================ Dispatcher */
export interface DispatcherOrdersQuery {
  status?: OrderStatus;
  search?: string;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}
export interface DispatcherOrderListItemResponse {
  id: number;
  orderCode: string;
  orderStatus: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  totalFee: number;
  pickupAddress: string;
  dropoffAddress: string;
  customerName: string;
  customerPhone: string;
  driverProfileId: number | null;
  driverName: string | null;
  driverPhone: string | null;
  licensePlate: string | null;
  vehicleTypeName: string;
  matchingTimeoutSoon: boolean;
  awaitingPickupApproval: boolean;
  openIncidentId: number | null;
  createdAt: string;
  paidAt: string | null;
}
export interface DispatcherOrdersSummaryResponse {
  total: number;
  pending: number;
  accepted: number;
  arrived: number;
  pickedUp: number;
  inTransit: number;
  delivered: number;
  completed: number;
  cancelled: number;
}
export interface StaffStatusHistoryItem {
  id: number;
  fromStatus: OrderStatus | null;
  toStatus: OrderStatus;
  changedByRole: string;
  changedByUserId: number | null;
  changedByUserName: string | null;
  note: string | null;
  createdAt: string;
}
export interface StaffCargoDetails {
  cargoType: string;
  quantity: number;
  weightKg: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  photoUrls: string[];
  specialNotes: string | null;
  cargoTypeName: string | null;
}
export interface DispatcherOrderDetailResponse {
  id: number;
  orderCode: string;
  orderStatus: OrderStatus;
  vehicleTypeId: number;
  vehicleTypeName: string;
  pickupAddress: string;
  pickupLatitude: number;
  pickupLongitude: number;
  dropoffAddress: string;
  dropoffLatitude: number;
  dropoffLongitude: number;
  estimatedDistanceKm: number;
  estimatedDurationMin: number;
  hasLoadingService: boolean;
  distanceFee: number;
  serviceFee: number;
  discountAmount: number;
  totalFee: number;
  paymentMethod: PaymentMethod;
  payerRole: PayerRole | null;
  paymentStatus: PaymentStatus;
  cancellationReason: string | null;
  commissionRate: number | null;
  commissionAmount: number | null;
  createdAt: string;
  paidAt: string | null;
  acceptedAt: string | null;
  deliveredAt: string | null;
  completedAt: string | null;
  customer: { id: number; fullName: string; phoneNumber: string; email: string };
  receiver: { name: string; phoneNumber: string };
  driver: {
    driverProfileId: number;
    userId: number;
    fullName: string;
    phoneNumber: string;
    licensePlate: string | null;
    lastLatitude: number | null;
    lastLongitude: number | null;
    lastLocationAt: string | null;
  } | null;
  cargo: StaffCargoDetails | null;
  proof: {
    pickupPhotoUrls: string[];
    proofStatus: ProofStatus;
    pickupSubmissionCount: number;
    rejectionReason: string | null;
    deliveryPhotoUrl: string | null;
    deliveryCompletionTime: string | null;
  } | null;
  statusHistories: StaffStatusHistoryItem[];
  payments: {
    id: number;
    paymentMethod: PaymentMethod;
    payerRole: PayerRole | null;
    amount: number;
    payosOrderCode: number | null;
    transactionStatus: string;
    paidAt: string | null;
    createdAt: string;
  }[];
  incidents: {
    id: number;
    incidentType: IncidentType;
    description: string;
    resolutionStatus: IncidentResolutionStatus;
    resolutionDecision: IncidentDecision | null;
    resolutionNote: string | null;
    reporterName: string;
    handledByName: string | null;
    createdAt: string;
    resolvedAt: string | null;
  }[];
  refunds: {
    id: number;
    incidentId: number | null;
    sourceType: RefundSourceType;
    reason: string;
    requestedAmount: number;
    proposedAmount: number | null;
    refundStatus: RefundStatus;
    createdAt: string;
    decidedAt: string | null;
    processedAt: string | null;
  }[];
}
export interface OnlineDriverMapItemResponse {
  driverProfileId: number;
  userId: number;
  fullName: string;
  phoneNumber: string;
  licensePlate: string;
  vehicleTypeId: number;
  vehicleTypeName: string;
  latitude: number;
  longitude: number;
  lastLocationAt: string;
  activeOrderId: number | null;
  activeOrderCode: string | null;
  activeOrderStatus: OrderStatus | null;
}
export interface HandledCaseItemResponse {
  caseKind: string;
  caseId: number;
  orderId: number;
  orderCode: string;
  subType: string;
  status: string;
  decision: string | null;
  note: string | null;
  requestedAmount: number | null;
  proposedAmount: number | null;
  handledAt: string;
}
export interface IncidentsQuery {
  status?: IncidentResolutionStatus;
  incidentType?: IncidentType;
  search?: string;
  page?: number;
  pageSize?: number;
}
export interface IncidentListItemResponse {
  id: number;
  orderId: number;
  orderCode: string;
  orderStatus: OrderStatus;
  incidentType: IncidentType;
  description: string;
  reportedById: number;
  reporterName: string;
  reporterRole: string;
  resolutionStatus: IncidentResolutionStatus;
  handledById: number | null;
  handledByName: string | null;
  createdAt: string;
}
export interface IncidentDetailResponse {
  id: number;
  orderId: number;
  orderCode: string;
  orderStatus: OrderStatus;
  incidentType: IncidentType;
  description: string;
  photoUrls: string[];
  latitude: number | null;
  longitude: number | null;
  resolutionStatus: IncidentResolutionStatus;
  resolutionDecision: IncidentDecision | null;
  resolutionNote: string | null;
  reportedById: number;
  reporterName: string;
  reporterRole: string;
  handledById: number | null;
  handledByName: string | null;
  resolvedAt: string | null;
  createdAt: string;
  order: {
    id: number;
    orderCode: string;
    orderStatus: OrderStatus;
    pickupAddress: string;
    dropoffAddress: string;
    paymentMethod: PaymentMethod;
    paymentStatus: PaymentStatus;
    totalFee: number;
    deliveredAt: string | null;
    cargo: StaffCargoDetails | null;
  };
  customer: { id: number; fullName: string; phoneNumber: string };
  driver: { driverProfileId: number; userId: number; fullName: string; phoneNumber: string; licensePlate: string | null; vehicleTypeName: string | null } | null;
  proof: { pickupPhotoUrls: string[]; deliveryPhotoUrl: string | null; deliveryCompletionTime: string | null; proofStatus: ProofStatus } | null;
  statusHistories: StaffStatusHistoryItem[];
  refund: {
    id: number;
    sourceType: RefundSourceType;
    reason: string;
    evidenceUrls: string[];
    requestedAmount: number;
    proposedAmount: number | null;
    proposalReason: string | null;
    proposedById: number | null;
    infoRequestNote: string | null;
    customerReply: string | null;
    refundStatus: RefundStatus;
    createdAt: string;
  } | null;
}
export interface ReplacementDriverResponse {
  driverProfileId: number;
  userId: number;
  fullName: string;
  phoneNumber: string;
  licensePlate: string;
  vehicleTypeId: number;
  vehicleTypeName: string;
  latitude: number;
  longitude: number;
  lastLocationAt: string;
  distanceKm: number;
  depositBalance: number;
}
export interface ComplaintsQuery {
  stage?: ComplaintStage;
  search?: string;
  page?: number;
  pageSize?: number;
}
export interface ComplaintListItemResponse {
  id: number;
  orderId: number;
  orderCode: string;
  customerName: string;
  reason: string;
  requestedAmount: number;
  proposedAmount: number | null;
  stage: ComplaintStage;
  refundStatus: RefundStatus;
  deliveredAt: string | null;
  createdAt: string;
  reasonCode: string | null;
  reasonCodeName: string | null;
}
export interface ComplaintDetailResponse {
  id: number;
  orderId: number;
  orderCode: string;
  orderStatus: OrderStatus;
  reason: string;
  evidenceUrls: string[];
  requestedAmount: number;
  proposedAmount: number | null;
  proposalReason: string | null;
  proposedById: number | null;
  proposedByName: string | null;
  infoRequestNote: string | null;
  customerReply: string | null;
  stage: ComplaintStage;
  refundStatus: RefundStatus;
  bankReferenceCode: string | null;
  decidedAt: string | null;
  processedAt: string | null;
  createdAt: string;
  order: {
    id: number;
    orderCode: string;
    orderStatus: OrderStatus;
    pickupAddress: string;
    dropoffAddress: string;
    paymentMethod: PaymentMethod;
    paymentStatus: PaymentStatus;
    totalFee: number;
    deliveredAt: string | null;
    completedAt: string | null;
    cargo: StaffCargoDetails | null;
  };
  customer: { id: number; fullName: string; phoneNumber: string };
  driver: { driverProfileId: number; userId: number; fullName: string; phoneNumber: string; licensePlate: string | null; vehicleTypeName: string | null } | null;
  verificationEvidence: { pickupPhotoUrls: string[]; deliveryPhotoUrl: string | null; deliveryCompletionTime: string | null; proofStatus: ProofStatus } | null;
  rating: { ratingStars: number; reviewComment: string | null; createdAt: string } | null;
  incidents: { id: number; incidentType: IncidentType; description: string; resolutionStatus: IncidentResolutionStatus; resolutionDecision: IncidentDecision | null; createdAt: string }[];
  statusHistories: StaffStatusHistoryItem[];
  reasonCode: string | null;
  reasonCodeName: string | null;
}

/* ============================================================ Admin */
export interface UsersQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  role?: UserRole;
  status?: AccountStatus;
}
export interface UserDto {
  id: number;
  fullName: string;
  phoneNumber: string;
  email: string;
  role: UserRole;
  accountStatus: AccountStatus;
  emailVerified: boolean;
  createdAt: string;
}
export interface UserDetailResponse extends UserDto {
  updatedAt: string | null;
  driverApprovalStatus: ApprovalStatus | null;
  driverOnlineStatus: string | null;
  licensePlate: string | null;
  totalOrders: number;
  completedOrders: number;
  /** Q11: khoản hoàn còn mở (Requested/Approved/Failed) trên đơn của khách; vai trò khác = 0. */
  openRefundCount?: number;
}
export interface CreateDispatcherRequest {
  fullName: string;
  phoneNumber: string;
  email: string;
  password: string;
}
export interface PendingApplicationDto {
  applicationId: number;
  driverProfileId: number;
  fullName: string;
  phoneNumber: string;
  vehicleTypeName: string;
  licensePlate: string;
  versionNumber: number;
  submittedAt: string;
}
export interface ApplicationHistoryDto {
  applicationId: number;
  versionNumber: number;
  applicationStatus: ApprovalStatus;
  submittedAt: string;
  reviewedAt: string | null;
  rejectionReasons: string[] | null;
  rejectedItems?: RejectedApplicationItem[] | null;
}
export interface DriverApplicationDetailsResponse {
  applicationId: number;
  driverProfileId: number;
  userId: number;
  fullName: string;
  phoneNumber: string;
  email: string;
  citizenIdNumber: string | null;
  driverLicenseNumber: string | null;
  vehicleTypeId: number;
  vehicleTypeName: string;
  licensePlate: string;
  maxLoadWeightKg: number;
  versionNumber: number;
  applicationStatus: ApprovalStatus;
  submittedAt: string;
  reviewedBy: number | null;
  reviewedAt: string | null;
  documentUrls: string[];
  rejectionReasons: string[] | null;
  rejectedItems?: RejectedApplicationItem[] | null;
  history: ApplicationHistoryDto[];
}
export interface VehicleTypePricingResponse {
  id: number;
  name: string;
  maxLoadWeightKg: number;
  baseFare: number;
  pricePerKm: number;
  minimumFare: number;
  isActive: boolean;
}
export interface PlatformSettingsResponse {
  commissionRate: number;
  loadingFee: number;
  /** Tiền cọc tối thiểu để nhận đơn (BE đổi tên từ minCodDeposit) */
  requiredDeposit: number;
  matchingRadiusKm: number;
}
export interface PricingConfigurationResponse {
  vehicleTypes: VehicleTypePricingResponse[];
  settings: PlatformSettingsResponse;
}
export interface MasterDataItemDto {
  id: number;
  category: MasterDataCategory | string;
  code: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string | null;
}
export interface CouponDto {
  id: number;
  discountCode: string;
  discountValue: number;
  minimumOrderValue: number;
  validFrom: string;
  expiresAt: string;
  usageLimit: number | null;
  usedCount: number;
  isActive: boolean;
  createdAt: string;
}
export interface CreateCouponRequest {
  discountCode: string;
  discountValue: number;
  minimumOrderValue: number;
  validFrom: string;
  expiresAt: string;
  usageLimit?: number | null;
}
export interface AdminRefundsQuery {
  page?: number;
  pageSize?: number;
  status?: RefundStatus;
  sourceType?: RefundSourceType;
  search?: string;
}
export interface AdminRefundDto {
  id: number;
  orderId: number;
  orderCode: string;
  customerName: string;
  customerPhone: string;
  sourceType: RefundSourceType;
  refundStatus: RefundStatus;
  requestedAmount: number;
  proposedAmount: number | null;
  reasonCode: string | null;
  reason: string;
  proposalReason: string | null;
  proposedByName: string | null;
  decisionNote: string | null;
  bankReferenceCode: string | null;
  decidedAt: string | null;
  processedAt: string | null;
  createdAt: string;
  hasPayoutAccount: boolean;
  payoutFailureReason: string | null;
}
/** Tài khoản nhận hoàn tiền đầy đủ (Admin chuyển khoản tay, R-01). */
export interface AdminPayoutAccount {
  bankCode: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  infoUpdatedAt: string | null;
}
export interface AdminRefundDetailResponse {
  id: number;
  orderId: number;
  orderCode: string;
  orderStatus: OrderStatus;
  orderTotalFee: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  incidentId: number | null;
  sourceType: RefundSourceType;
  refundStatus: RefundStatus;
  reasonCode: string | null;
  reason: string;
  evidenceUrls: string[];
  requestedAmount: number;
  proposedAmount: number | null;
  proposalReason: string | null;
  proposedById: number | null;
  proposedByName: string | null;
  approvedById: number | null;
  approvedByName: string | null;
  decisionNote: string | null;
  infoRequestNote: string | null;
  customerReply: string | null;
  bankReferenceCode: string | null;
  decidedAt: string | null;
  processedAt: string | null;
  createdAt: string;
  customerId: number;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  driverProfileId: number | null;
  driverName: string | null;
  driverPhone: string | null;
  licensePlate: string | null;
  payoutAccount: AdminPayoutAccount | null;
  hasPayoutAccount: boolean;
  payoutFailureReason: string | null;
}
export interface AdminWithdrawalsQuery {
  page?: number;
  pageSize?: number;
  status?: WalletTransactionStatus;
  search?: string;
}
export interface AdminWithdrawalSummary {
  transactionId: number;
  walletId: number;
  driverProfileId: number;
  driverUserId: number;
  driverName: string;
  driverPhone: string;
  amount: number;
  /** Phần trừ từ ví thu nhập / ví tiền cọc khi rút (ưu tiên thu nhập trước) */
  earningsAmount: number;
  depositAmount: number;
  balanceAfter: number;
  transactionStatus: WalletTransactionStatus;
  bankName: string | null;
  bankAccountNumber: string | null;
  bankAccountHolder: string | null;
  referenceCode: string | null;
  processedBy: number | null;
  processedAt: string | null;
  createdAt: string;
}
export interface AdminWithdrawalDetailResponse extends AdminWithdrawalSummary {
  driverEmail: string;
  currentEarningsBalance: number;
  currentDepositBalance: number;
  walletStatus: string;
  processedByName: string | null;
}
export interface DailyRevenueDto {
  date: string;
  completedOrders: number;
  revenue: number;
  totalDeliveryFees: number;
  loadingFees: number;
  discountAmount: number;
  driverEarnings: number;
}
export interface CompletedOrderRevenueDto {
  orderId: number;
  orderCode: string;
  createdAt: string;
  completedAt: string;
  customerName: string;
  customerPhone: string;
  driverName: string | null;
  licensePlate: string | null;
  vehicleTypeName: string;
  estimatedDistanceKm: number;
  distanceFee: number;
  serviceFee: number;
  discountAmount: number;
  totalFee: number;
  commissionRate: number;
  commissionAmount: number;
  driverEarning: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
}
export interface RevenueReportResponse {
  fromDate: string | null;
  toDate: string | null;
  totalCompletedOrders: number;
  totalRevenue: number;
  totalDeliveryFees: number;
  totalLoadingFees: number;
  totalDiscountAmount: number;
  totalDriverEarnings: number;
  dailyStats: DailyRevenueDto[];
  orders: CompletedOrderRevenueDto[];
}
