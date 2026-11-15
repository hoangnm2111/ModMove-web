/**
 * Một hàm cho mỗi endpoint của ModMove.WebApi (Controllers/*). Path theo RoleConvention: api/{role}/{Controller}.
 * Lỗi luôn được chuẩn hoá thành ServiceError (có `code`) qua toServiceError.
 */
import { apiClient, toServiceError } from '../services/api';
import type * as T from './types';

async function call<R>(fn: () => Promise<{ data: R }>): Promise<R> {
  try {
    return (await fn()).data;
  } catch (e) {
    throw toServiceError(e);
  }
}
/** Bỏ các tham số rỗng để query string sạch */
const q = <P extends object>(p?: P) =>
  p ? Object.fromEntries(Object.entries(p).filter(([, v]) => v !== undefined && v !== null && v !== '')) : undefined;

/* ================================================================ PUBLIC */
export const publicApi = {
  login: (email: string, password: string) => call(() => apiClient.post<T.LoginResponse>('/public/Auth/login', { email, password })),
  register: (body: T.RegisterRequest) => call(() => apiClient.post<T.RegisterResponse>('/public/Auth/register', body)),
  verifyEmail: (email: string, code: string, password: string) => call(() => apiClient.post<void>('/public/Auth/verify-email', { email, code, password })),
  resendOtp: (email: string, purpose: T.OtpPurpose) => call(() => apiClient.post<void>('/public/Auth/otp/resend', { email, purpose })),
  forgotPassword: (email: string) => call(() => apiClient.post<void>('/public/Auth/forgot-password', { email })),
  resetPassword: (email: string, code: string, newPassword: string) => call(() => apiClient.post<void>('/public/Auth/reset-password', { email, code, newPassword })),

  vehicleTypes: () => call(() => apiClient.get<T.VehicleTypeResponse[]>('/public/VehicleTypes')),
  policies: () => call(() => apiClient.get<T.ContentResponse[]>('/public/Policies')),
  serviceInfo: () => call(() => apiClient.get<T.ContentResponse[]>('/public/ServiceInfo')),
  cargoTypes: () => call(() => apiClient.get<T.ContentResponse[]>('/public/Lookups/cargo-types')),
  complaintReasons: () => call(() => apiClient.get<T.ContentResponse[]>('/public/Lookups/complaint-reasons')),
  cancellationReasons: () => call(() => apiClient.get<T.ContentResponse[]>('/public/Lookups/cancellation-reasons')),
  /** Ngân hàng nhận hoàn tiền: `code` là mã BIN 6 số, gửi làm payoutAccount.bankCode */
  banks: () => call(() => apiClient.get<T.ContentResponse[]>('/public/Lookups/banks')),
  supportRequest: (body: T.SupportRequestBody) => call(() => apiClient.post<void>('/public/SupportRequests', body)),
  fareEstimate: (body: T.FareEstimateRequest) => call(() => apiClient.post<T.FareEstimateResponse>('/public/FareEstimate', body)),
};

/* ================================================================ ACCOUNT (mọi role) */
export const accountApi = {
  profile: () => call(() => apiClient.get<T.ProfileResponse>('/account/Profile')),
  updateProfile: (fullName: string, phoneNumber: string) => call(() => apiClient.put<void>('/account/Profile', { fullName, phoneNumber })),
  changePassword: (currentPassword: string, newPassword: string) => call(() => apiClient.post<void>('/account/Password', { currentPassword, newPassword })),
  logout: () => call(() => apiClient.post<void>('/account/Logout')),
};

/* ================================================================ CUSTOMER */
export const customerApi = {
  deleteAccount: () => call(() => apiClient.delete<void>('/customer/Account')),
  upload: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return call(() => apiClient.post<{ url: string }>('/customer/Uploads', form, { headers: { 'Content-Type': 'multipart/form-data' } })).then((r) => r.url);
  },

  orders: (p: T.MyOrdersQuery = {}) => call(() => apiClient.get<T.PagedResult<T.OrderSummaryResponse>>('/customer/Orders', { params: q({ page: 1, pageSize: 20, ...p }) })),
  order: (id: number) => call(() => apiClient.get<T.OrderDetailResponse>(`/customer/Orders/${id}`)),
  tracking: (id: number) => call(() => apiClient.get<T.OrderTrackingResponse>(`/customer/Orders/${id}/tracking`)),
  createOrder: (body: T.CreateOrderRequest) => call(() => apiClient.post<T.CreateOrderResponse>('/customer/Orders', body)),
  cancelOrder: (id: number, reasonCode: string, reason?: string | null) => call(() => apiClient.post<void>(`/customer/Orders/${id}/cancel`, { reasonCode, reason: reason || null })),
  createPayment: (id: number) => call(() => apiClient.post<T.CreateOrderPaymentResponse>(`/customer/Orders/${id}/payment`, { platform: 'Web' as T.PaymentPlatform })),
  reviewPickup: (id: number, approve: boolean, reason?: string) => call(() => apiClient.post<void>(`/customer/Orders/${id}/pickup-evidence`, { approve, reason: approve ? null : reason })),
  confirmReceipt: (id: number) => call(() => apiClient.post<void>(`/customer/Orders/${id}/confirm-receipt`)),

  coupons: (page = 1, pageSize = 50) => call(() => apiClient.get<T.PagedResult<T.AvailableCouponResponse>>('/customer/Coupons', { params: { page, pageSize } })),

  rate: (orderId: number, stars: number, comment?: string) => call(() => apiClient.post<{ ratingId: number }>('/customer/Ratings', { orderId, stars, comment: comment || null })),
  ratings: (page = 1, pageSize = 20) => call(() => apiClient.get<T.PagedResult<T.MyRatingResponse>>('/customer/Ratings', { params: { page, pageSize } })),

  incidents: (page = 1, pageSize = 50, orderId?: number, status?: T.IncidentResolutionStatus) =>
    call(() => apiClient.get<T.PagedResult<T.MyIncidentResponse>>('/customer/Incidents', { params: q({ page, pageSize, orderId, status }) })),
  reportIncident: (body: T.ReportIncidentRequest) => call(() => apiClient.post<{ incidentId: number }>('/customer/Incidents', body)),

  refunds: (page = 1, pageSize = 50) => call(() => apiClient.get<T.PagedResult<T.MyRefundSummaryResponse>>('/customer/Refunds', { params: { page, pageSize } })),
  refund: (id: number) => call(() => apiClient.get<T.MyRefundDetailResponse>(`/customer/Refunds/${id}`)),
  submitComplaint: (body: T.SubmitComplaintRequest) => call(() => apiClient.post<{ refundId: number }>('/customer/Refunds/complaints', body)),
  requestIncidentRefund: (body: T.RequestIncidentRefundRequest) => call(() => apiClient.post<{ refundId: number }>('/customer/Refunds/incidents', body)),
  /** Khai hoặc sửa tài khoản nhận hoàn tiền khi khoản hoàn còn Requested/Approved/Failed */
  setRefundPayoutAccount: (id: number, body: T.PayoutAccountInput) => call(() => apiClient.put<void>(`/customer/Refunds/${id}/payout-account`, body)),
  replyRefund: (id: number, reply: string, photoUrls?: string[]) => call(() => apiClient.post<void>(`/customer/Refunds/${id}/reply`, { reply, photoUrls })),
  withdrawRefund: (id: number) => call(() => apiClient.post<void>(`/customer/Refunds/${id}/withdraw`)),
};

/* ================================================================ DRIVER */
export const driverApi = {
  status: () => call(() => apiClient.get<T.DriverStatusResponse>('/driver/status')),
  setOnline: (isOnline: boolean) => call(() => apiClient.patch<void>('/driver/online-status', { isOnline })),
  sendLocation: (latitude: number, longitude: number) => call(() => apiClient.post<void>('/driver/location', { latitude, longitude })),
  onboardingStatus: () => call(() => apiClient.get<T.DriverOnboardingStatusResponse>('/driver/Onboarding/status')),
  submitOnboarding: (body: T.SubmitDriverApplicationRequest) => call(() => apiClient.post<{ id: number }>('/driver/Onboarding', body)),
  nearbyOrders: () => call(() => apiClient.get<T.NearbyOrderDto[]>('/driver/Matching/orders')),
  acceptOrder: (id: number) => call(() => apiClient.post<void>(`/driver/Matching/orders/${id}/accept`)),
  /** Chuyến đang chạy (Accepted…InTransit); đang rảnh thì BE trả 204 → null. */
  activeTrip: async (): Promise<T.DriverTripDetailResponse | null> => (await call(() => apiClient.get<T.DriverTripDetailResponse | ''>('/driver/Trips/active'))) || null,
  incidents: (p: T.DriverIncidentsQuery = {}) => call(() => apiClient.get<T.PagedResult<T.DriverIncidentResponse>>('/driver/Incidents', { params: q({ page: 1, pageSize: 20, ...p }) })),
  incident: (id: number) => call(() => apiClient.get<T.DriverIncidentResponse>(`/driver/Incidents/${id}`)),
  wallet: () => call(() => apiClient.get<T.DriverWalletResponse>('/driver/Wallet')),
  walletTransactions: (page = 1, pageSize = 20) =>
    call(() => apiClient.get<T.PagedResult<T.DriverWalletTransactionDto>>('/driver/Wallet/transactions', { params: { page, pageSize } })),
  /** Ảnh giấy tờ hồ sơ, ảnh lấy hàng, POD, sự cố (JPG/PNG ≤ 5 MB) → URL Cloudinary của hệ thống. */
  upload: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return call(() => apiClient.post<{ url: string }>('/driver/Uploads', form, { headers: { 'Content-Type': 'multipart/form-data' } }));
  },
  /** Q12: xoá (vô hiệu hoá) tài khoản tài xế. 422 ACCOUNT_HAS_OPEN_ORDERS / ACCOUNT_HAS_PENDING_WITHDRAWAL / ACCOUNT_HAS_WALLET_BALANCE. */
  deleteAccount: () => call(() => apiClient.delete<void>('/driver/Account')),
};

/* ================================================================ DISPATCHER */
export const dispatcherApi = {
  orders: (p: T.DispatcherOrdersQuery = {}) => call(() => apiClient.get<T.PagedResult<T.DispatcherOrderListItemResponse>>('/dispatcher/Orders', { params: q({ page: 1, pageSize: 20, ...p }) })),
  ordersSummary: () => call(() => apiClient.get<T.DispatcherOrdersSummaryResponse>('/dispatcher/Orders/summary')),
  order: (id: number) => call(() => apiClient.get<T.DispatcherOrderDetailResponse>(`/dispatcher/Orders/${id}`)),
  onlineDrivers: () => call(() => apiClient.get<T.OnlineDriverMapItemResponse[]>('/dispatcher/Drivers/online')),
  handledCases: (type?: T.HandledCaseType, page = 1, pageSize = 20) =>
    call(() => apiClient.get<T.PagedResult<T.HandledCaseItemResponse>>('/dispatcher/handled-cases', { params: q({ type, page, pageSize }) })),

  incidents: (p: T.IncidentsQuery = {}) => call(() => apiClient.get<T.PagedResult<T.IncidentListItemResponse>>('/dispatcher/Incidents', { params: q({ page: 1, pageSize: 20, ...p }) })),
  incident: (id: number) => call(() => apiClient.get<T.IncidentDetailResponse>(`/dispatcher/Incidents/${id}`)),
  startIncident: (id: number) => call(() => apiClient.post<void>(`/dispatcher/Incidents/${id}/start`)),
  /** Q10: trả lại sự cố đang giữ (InProgress → Open), ví dụ khi hết ca. */
  releaseIncident: (id: number) => call(() => apiClient.post<void>(`/dispatcher/Incidents/${id}/release`)),
  /** Q6b: Dispatcher tự mở sự cố trên đơn Accepted…InTransit; sự cố về tay người mở, không chặn chuyến, mô tả là ghi chú nội bộ. */
  reportOrderIncident: (orderId: number, incidentType: T.IncidentType, description: string) =>
    call(() => apiClient.post<{ incidentId: number }>(`/dispatcher/Orders/${orderId}/incidents`, { incidentType, description })),
  continueTrip: (id: number, reason: string) => call(() => apiClient.post<void>(`/dispatcher/Incidents/${id}/resolve`, { reason })),
  replacementDrivers: (id: number) => call(() => apiClient.get<T.ReplacementDriverResponse[]>(`/dispatcher/Incidents/${id}/replacement-drivers`)),
  reassign: (id: number, newDriverProfileId: number, reason: string) => call(() => apiClient.post<void>(`/dispatcher/Incidents/${id}/reassign`, { newDriverProfileId, reason })),
  cancelOrder: (id: number, reason: string, refund: boolean, cargoDisposition?: T.CargoDisposition | null) =>
    call(() => apiClient.post<void>(`/dispatcher/Incidents/${id}/cancel-order`, { reason, refund, cargoDisposition: cargoDisposition ?? null })),
  cancelIncident: (id: number, reason: string) => call(() => apiClient.post<void>(`/dispatcher/Incidents/${id}/cancel`, { reason })),
  incidentRefundRequestInfo: (id: number, note: string) => call(() => apiClient.post<void>(`/dispatcher/Incidents/${id}/refund/request-info`, { note })),
  incidentRefundProposal: (id: number, amount: number, reason: string) => call(() => apiClient.post<void>(`/dispatcher/Incidents/${id}/refund/proposal`, { amount, reason })),

  complaints: (p: T.ComplaintsQuery = {}) => call(() => apiClient.get<T.PagedResult<T.ComplaintListItemResponse>>('/dispatcher/Complaints', { params: q({ page: 1, pageSize: 20, ...p }) })),
  complaint: (id: number) => call(() => apiClient.get<T.ComplaintDetailResponse>(`/dispatcher/Complaints/${id}`)),
  complaintRequestInfo: (id: number, note: string) => call(() => apiClient.post<void>(`/dispatcher/Complaints/${id}/request-info`, { note })),
  complaintProposal: (id: number, amount: number, reason: string) => call(() => apiClient.post<void>(`/dispatcher/Complaints/${id}/proposal`, { amount, reason })),
};

/* ================================================================ ADMIN */
export const adminApi = {
  users: (p: T.UsersQuery = {}) => call(() => apiClient.get<T.PagedResult<T.UserDto>>('/admin/Users', { params: q({ page: 1, pageSize: 20, ...p }) })),
  user: (id: number) => call(() => apiClient.get<T.UserDetailResponse>(`/admin/Users/${id}`)),
  setUserStatus: (id: number, status: T.AccountStatus, reason: string) => call(() => apiClient.patch<void>(`/admin/Users/${id}/status`, { status, reason })),
  createDispatcher: (body: T.CreateDispatcherRequest) => call(() => apiClient.post<{ id: number }>('/admin/Users/dispatchers', body)),

  pendingApplications: (page = 1, pageSize = 20) => call(() => apiClient.get<T.PagedResult<T.PendingApplicationDto>>('/admin/driver-applications/pending', { params: { page, pageSize } })),
  application: (id: number) => call(() => apiClient.get<T.DriverApplicationDetailsResponse>(`/admin/driver-applications/${id}`)),
  approveApplication: (id: number) => call(() => apiClient.post<void>(`/admin/driver-applications/${id}/approve`)),
  rejectApplication: (id: number, reasons: string[]) => call(() => apiClient.post<void>(`/admin/driver-applications/${id}/reject`, { reasons })),

  pricing: () => call(() => apiClient.get<T.PricingConfigurationResponse>('/admin/Pricing')),
  updateFares: (id: number, baseFare: number, pricePerKm: number, minimumFare: number) =>
    call(() => apiClient.put<void>(`/admin/Pricing/vehicletypes/${id}`, { baseFare, pricePerKm, minimumFare })),
  setVehicleTypeActive: (id: number, isActive: boolean) => call(() => apiClient.patch<void>(`/admin/Pricing/vehicletypes/${id}/status`, { isActive })),
  updateSettings: (s: Partial<T.PlatformSettingsResponse>) => call(() => apiClient.put<void>('/admin/Pricing/settings', s)),

  masterData: (category?: string) => call(() => apiClient.get<T.MasterDataItemDto[]>('/admin/MasterData', { params: q({ category }) })),
  createMasterData: (category: string, code: string, name: string, description?: string | null) =>
    call(() => apiClient.post<{ id: number }>('/admin/MasterData', { category, code, name, description: description || null })),
  updateMasterData: (id: number, name: string, description?: string | null) => call(() => apiClient.put<void>(`/admin/MasterData/${id}`, { name, description: description || null })),
  setMasterDataActive: (id: number, isActive: boolean) => call(() => apiClient.patch<void>(`/admin/MasterData/${id}/status`, { isActive })),

  coupons: (page = 1, pageSize = 50, isActive?: boolean) => call(() => apiClient.get<T.PagedResult<T.CouponDto>>('/admin/Coupons', { params: q({ page, pageSize, isActive }) })),
  createCoupon: (body: T.CreateCouponRequest) => call(() => apiClient.post<{ id: number }>('/admin/Coupons', body)),
  setCouponActive: (id: number, isActive: boolean) => call(() => apiClient.patch<void>(`/admin/Coupons/${id}/status`, { isActive })),

  refunds: (p: T.AdminRefundsQuery = {}) => call(() => apiClient.get<T.PagedResult<T.AdminRefundDto>>('/admin/Refunds', { params: q({ page: 1, pageSize: 20, ...p }) })),
  refund: (id: number) => call(() => apiClient.get<T.AdminRefundDetailResponse>(`/admin/Refunds/${id}`)),
  approveRefund: (id: number, note?: string) => call(() => apiClient.post<void>(`/admin/Refunds/${id}/approve`, { note: note || null })),
  rejectRefund: (id: number, note?: string) => call(() => apiClient.post<void>(`/admin/Refunds/${id}/reject`, { note: note || null })),
  payoutRefund: (id: number, bankReferenceCode: string) => call(() => apiClient.post<void>(`/admin/Refunds/${id}/payout`, { bankReferenceCode })),
  /** UC-ADM-18 5a (R-01): chuyển khoản tay thất bại → Failed, khách khai lại tài khoản nhận. */
  refundPayoutFailed: (id: number, reason: string) => call(() => apiClient.post<void>(`/admin/Refunds/${id}/payout-failed`, { reason })),

  withdrawals: (p: T.AdminWithdrawalsQuery = {}) => call(() => apiClient.get<T.PagedResult<T.AdminWithdrawalSummary>>('/admin/Withdrawals', { params: q({ page: 1, pageSize: 20, ...p }) })),
  withdrawal: (id: number) => call(() => apiClient.get<T.AdminWithdrawalDetailResponse>(`/admin/Withdrawals/${id}`)),
  approveWithdrawal: (id: number, bankReferenceCode: string) => call(() => apiClient.post<void>(`/admin/Withdrawals/${id}/approve`, { bankReferenceCode })),
  rejectWithdrawal: (id: number, reason?: string) => call(() => apiClient.post<void>(`/admin/Withdrawals/${id}/reject`, { reason: reason || null })),

  revenue: (fromDate: string, toDate: string) => call(() => apiClient.get<T.RevenueReportResponse>('/admin/Reports/revenue', { params: { fromDate, toDate } })),
  exportRevenue: async (fromDate: string, toDate: string) => {
    const blob = await call(() => apiClient.get<Blob>('/admin/Reports/revenue/export', { params: { fromDate, toDate }, responseType: 'blob' }));
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ModMove_DoanhThu_${fromDate}_${toDate}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  },
};
