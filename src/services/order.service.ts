import { msg } from '../constants/messages';
import {
  AssignedDriver,
  BookingDraft,
  CargoDetail,
  FareBreakdown,
  FareEstimateResult,
  OrderStatus,
  OrderStatusHistory,
  Rating,
  ShippingOrder,
  VehicleSnapshot,
} from '../types/order.types';
import { User } from '../types/user.types';
import { cargoNotes } from '../domain/booking';
import { normalizePhone } from '../domain/validators';
import { formatCurrency } from '../utils/format';
import { apiClient, toServiceError } from './api';
import { readStore, ServiceError, subscribeStore, writeStore } from './mock/storage';
import { PagedResult } from './pagination';

/**
 * Order service – api/customer/orders, api/customer/ratings, api/customer/coupons,
 * api/driver/matching, api/dispatcher/orders, api/dispatcher/incidents (huỷ/đổi tài xế).
 * Danh sách được cache cục bộ (localStorage) để các hook useLiveData đọc đồng bộ; mỗi
 * hàm `loadX()` nạp dữ liệu thật từ backend vào cache đó.
 */
const MY_ORDERS = 'orders';
const AVAILABLE_JOBS = 'availableJobs';
const ALL_ORDERS = 'dispatcherOrders';
const ONLINE_DRIVERS = 'onlineDrivers';
const DISPATCHER_SUMMARY = 'dispatcherSummary';
const HANDLED_CASES = 'handledCases';

const emptyVehicle = (name = ''): VehicleSnapshot => ({
  id: '',
  name,
  baseFare: 0,
  pricePerKm: 0,
  minimumFare: 0,
  maxLoadKg: 0,
  cargoBed: { lengthCm: 0, widthCm: 0, heightCm: 0 },
  iconType: 'truck',
});

const emptyCargo = (): CargoDetail => ({
  type: '',
  description: '',
  quantity: 0,
  weightKg: 0,
  largestItem: { lengthCm: 0, widthCm: 0, heightCm: 0 },
  photos: [],
});

const emptyFare = (total = 0): FareBreakdown => ({ distanceKm: 0, durationMins: 0, distanceFare: total, loadingFee: 0, discount: 0, total });

// ---------------------------------------------------------------- DTO -> FE
interface OnlineDriverDto {
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
  activeOrderId?: number | null;
  activeOrderCode?: string | null;
  activeOrderStatus?: string | null;
}

export interface OnlineDriverItem {
  id: string;
  driverName: string;
  driverPhone: string;
  vehicleType: string;
  licensePlate: string;
  lat: number;
  lng: number;
  lastLocationAt: string;
  activeOrderId?: string;
  activeOrderCode?: string;
  activeOrderStatus?: string;
}

export interface DispatcherSummary {
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

export interface HandledCaseItem {
  caseKind: string;
  caseId: number;
  orderId: number;
  orderCode: string;
  subType: string;
  status: string;
  decision?: string;
  note?: string;
  requestedAmount?: number;
  proposedAmount?: number;
  handledAt: string;
}

export interface OrderTracking {
  orderId: number;
  orderStatus: string;
  driverLat?: number;
  driverLng?: number;
  driverAt?: string;
  driverIsStale?: boolean;
  etaMinutes?: number;
  etaTarget?: string;
}

interface OrderSummaryDto {
  id: number;
  orderCode: string;
  orderStatus: OrderStatus;
  pickupAddress: string;
  dropoffAddress: string;
  vehicleTypeName: string;
  totalFee: number;
  paymentMethod: ShippingOrder['paymentMethod'];
  paymentStatus: ShippingOrder['paymentStatus'];
  createdAt: string;
  receiverName: string;
  receiverPhone: string;
}

function summaryToOrder(d: OrderSummaryDto, customer: Pick<User, 'id' | 'fullName' | 'phoneNumber'>): ShippingOrder {
  return {
    id: String(d.id),
    code: d.orderCode,
    customerId: customer.id,
    customerName: customer.fullName,
    customerPhone: customer.phoneNumber,
    pickup: { address: d.pickupAddress, lat: 0, lng: 0, contactName: customer.fullName, contactPhone: customer.phoneNumber },
    dropoff: { address: d.dropoffAddress, lat: 0, lng: 0, contactName: d.receiverName, contactPhone: d.receiverPhone },
    vehicle: emptyVehicle(d.vehicleTypeName),
    cargo: emptyCargo(),
    loadingService: false,
    fare: emptyFare(d.totalFee),
    paymentMethod: d.paymentMethod,
    paymentStatus: d.paymentStatus,
    status: d.orderStatus,
    history: [],
    createdAt: d.createdAt,
  };
}

interface OrderDetailDto {
  id: number;
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
  paymentMethod: ShippingOrder['paymentMethod'];
  payerRole?: ShippingOrder['payerRole'];
  paymentStatus: ShippingOrder['paymentStatus'];
  createdAt: string;
  cargo: { cargoType: string; quantity: number; weightKg: number; lengthCm: number; widthCm: number; heightCm: number; photoUrls: string[]; specialNotes?: string; cargoTypeName?: string };
  driver: { fullName: string; phoneNumber: string; licensePlate?: string } | null;
  proof: { pickupPhotoUrls: string[]; proofStatus: 'Pending' | 'Verified' | 'Rejected'; pickupSubmissionCount: number; rejectionReason?: string; deliveryPhotoUrl?: string; deliveredAt?: string } | null;
  history: { fromStatus: OrderStatus | null; toStatus: OrderStatus; changedByRole: string; note?: string; changedAt: string }[];
  couponCode?: string;
  payment: { transactionStatus: string; checkoutUrl?: string; expiresAt?: string; paidAt?: string; isExpired: boolean } | null;
  senderName?: string | null;
  senderPhone?: string | null;
  pickupNote?: string | null;
  dropoffNote?: string | null;
}

function detailToOrder(d: OrderDetailDto, customer: Pick<User, 'id' | 'fullName' | 'phoneNumber'>): ShippingOrder {
  const history: OrderStatusHistory[] = d.history.map((h) => ({ from: h.fromStatus, to: h.toStatus, changedBy: h.changedByRole as OrderStatusHistory['changedBy'], note: h.note, changedAt: h.changedAt }));
  const assignedDriver: AssignedDriver | undefined = d.driver
    ? { id: '', name: d.driver.fullName, phone: d.driver.phoneNumber, avatar: '', rating: 0, licensePlate: d.driver.licensePlate ?? '', currentLat: 0, currentLng: 0, lastLocationAt: '' }
    : undefined;
  return {
    id: String(d.id),
    code: d.orderCode,
    customerId: customer.id,
    customerName: customer.fullName,
    customerPhone: customer.phoneNumber,
    pickup: {
      address: d.pickupAddress,
      lat: 0,
      lng: 0,
      contactName: d.senderName || customer.fullName,
      contactPhone: d.senderPhone || customer.phoneNumber,
      note: d.pickupNote ?? undefined,
    },
    dropoff: { address: d.dropoffAddress, lat: 0, lng: 0, contactName: d.receiverName, contactPhone: d.receiverPhone, note: d.dropoffNote ?? undefined },
    vehicle: emptyVehicle(d.vehicleTypeName),
    cargo: {
      type: d.cargo.cargoType,
      description: d.cargo.specialNotes ?? d.cargo.cargoTypeName ?? d.cargo.cargoType,
      quantity: d.cargo.quantity,
      weightKg: d.cargo.weightKg,
      largestItem: { lengthCm: d.cargo.lengthCm, widthCm: d.cargo.widthCm, heightCm: d.cargo.heightCm },
      photos: d.cargo.photoUrls,
      specialNotes: d.cargo.specialNotes,
    },
    loadingService: d.hasLoadingService,
    couponCode: d.couponCode,
    fare: { distanceKm: d.estimatedDistanceKm, durationMins: d.estimatedDurationMin, distanceFare: d.distanceFee, loadingFee: d.serviceFee, discount: d.discountAmount, total: d.totalFee },
    paymentMethod: d.paymentMethod,
    payerRole: d.payerRole,
    paymentStatus: d.paymentStatus,
    status: d.orderStatus,
    assignedDriver,
    proof: d.proof
      ? {
          pickupPhotos: d.proof.pickupPhotoUrls,
          pickupSubmissionCount: d.proof.pickupSubmissionCount,
          pickupRejectReason: d.proof.rejectionReason,
          pickupStatus: d.proof.proofStatus,
          deliveryPhoto: d.proof.deliveryPhotoUrl,
          deliveredAt: d.proof.deliveredAt,
        }
      : undefined,
    history,
    createdAt: d.createdAt,
    paidAt: d.payment?.paidAt,
    deliveredAt: d.proof?.deliveredAt,
  };
}

async function currentCustomer(): Promise<Pick<User, 'id' | 'fullName' | 'phoneNumber'>> {
  const { authService } = await import('./auth.service');
  const session = authService.restoreSession();
  return session?.user ?? { id: '', fullName: '', phoneNumber: '' };
}

export const orderService = {
  subscribe: (cb: () => void) => {
    const a = subscribeStore(MY_ORDERS, cb);
    const b = subscribeStore(AVAILABLE_JOBS, cb);
    const c = subscribeStore(ALL_ORDERS, cb);
    return () => {
      a();
      b();
      c();
    };
  },

  // ------------------------------------------------------------------ Customer
  listByCustomerSync: (_customerId: string): ShippingOrder[] => readStore<ShippingOrder[]>(MY_ORDERS, () => []),

  /** UC-CUS-08/09/20: GET /customer/orders */
  async loadMyOrders(): Promise<void> {
    try {
      const customer = await currentCustomer();
      const { data } = await apiClient.get<PagedResult<OrderSummaryDto>>('/customer/Orders', { params: { page: 1, pageSize: 50, view: 'All' } });
      writeStore(MY_ORDERS, data.items.map((d) => summaryToOrder(d, customer)));
    } catch {
      /* giữ cache cũ nếu lỗi mạng */
    }
  },

  getByCodeSync: (code: string): ShippingOrder | undefined =>
    readStore<ShippingOrder[]>(MY_ORDERS, () => []).find((o) => o.code === code || o.id === code) ??
    readStore<ShippingOrder[]>(ALL_ORDERS, () => []).find((o) => o.code === code || o.id === code),

  /** Nạp chi tiết đầy đủ 1 đơn (thay ô rút gọn trong danh sách bằng bản chi tiết) */
  async loadOrderDetail(orderId: string): Promise<ShippingOrder> {
    try {
      const customer = await currentCustomer();
      const { data } = await apiClient.get<OrderDetailDto>(`/customer/Orders/${orderId}`);
      const order = detailToOrder(data, customer);
      const list = readStore<ShippingOrder[]>(MY_ORDERS, () => []);
      const idx = list.findIndex((o) => o.id === order.id);
      if (idx >= 0) list[idx] = order;
      else list.unshift(order);
      writeStore(MY_ORDERS, list);
      return order;
    } catch (e) {
      throw toServiceError(e);
    }
  },

  /** POST /public/FareEstimate: giá cước, toạ độ hai điểm và đường đi để vẽ bản đồ */
  async estimate(draft: BookingDraft): Promise<FareEstimateResult | null> {
    if (!draft.vehicleTypeId || !draft.pickup.address || !draft.dropoff.address) return null;
    const call = async (couponCode: string | null) => {
      const { data } = await apiClient.post<{
        distanceKm: number;
        durationMinutes: number;
        distanceFee: number;
        serviceFee: number;
        discountAmount: number;
        totalFee: number;
        pickup?: { latitude: number; longitude: number } | null;
        dropoff?: { latitude: number; longitude: number } | null;
        polyline?: string | null;
      }>(
        '/public/FareEstimate',
        {
          vehicleTypeId: Number(draft.vehicleTypeId),
          pickupAddress: draft.pickup.address,
          dropoffAddress: draft.dropoff.address,
          weightKg: draft.cargo.weightKg,
          lengthCm: draft.cargo.largestItem.lengthCm,
          widthCm: draft.cargo.largestItem.widthCm,
          heightCm: draft.cargo.largestItem.heightCm,
          hasLoadingService: draft.loadingService,
          couponCode,
        }
      );
      const { catalogService } = await import('./catalog.service');
      const vehicle = catalogService.getVehicleTypesSync().find((v) => v.id === draft.vehicleTypeId) ?? emptyVehicle();
      return {
        vehicle,
        fare: { distanceKm: data.distanceKm, durationMins: data.durationMinutes, distanceFare: data.distanceFee, loadingFee: data.serviceFee, discount: data.discountAmount, total: data.totalFee },
        route: {
          from: data.pickup ? { lat: Number(data.pickup.latitude), lng: Number(data.pickup.longitude) } : null,
          to: data.dropoff ? { lat: Number(data.dropoff.latitude), lng: Number(data.dropoff.longitude) } : null,
          polyline: data.polyline ?? null,
        },
      };
    };
    const coupon = draft.couponCode.trim();
    try {
      return { ...(await call(coupon || null)), couponError: null };
    } catch (e) {
      const err = toServiceError(e);
      // Mã lỗi coupon → hiển thị cạnh ô mã giảm giá thay vì banner chung
      const isCouponError = /COUPON_|đã hết hạn|chưa tới hạn|không tồn tại|đang tắt|hết lượt|tối thiểu/i.test(err.message) && coupon;
      if (!isCouponError) throw err;
      // Mã không dùng được (ví dụ chưa đủ giá trị tối thiểu): vẫn báo giá KHÔNG có mã để khách thấy số tiền và hiểu vì sao
      // chưa đủ điều kiện, thay vì hiện 0 ₫. Nút gửi đơn vẫn bị khoá cho tới khi bỏ hoặc đổi mã.
      try {
        return { ...(await call(null)), couponError: err.message };
      } catch {
        return { vehicle: emptyVehicle(), fare: emptyFare(), route: null, couponError: err.message };
      }
    }
  },

  /**
   * POST /customer/Orders. Báo giá lại ngay trước khi gửi: giá đổi so với số khách đang thấy thì dừng lại để khách xem giá mới.
   * `shownTotal` = tổng tiền đang hiển thị trên màn hình.
   */
  async createOrder(draft: BookingDraft, _customer: User, shownTotal?: number): Promise<ShippingOrder & { expectedTotalFee?: number }> {
    try {
      const est = await this.estimate(draft);
      if (est?.couponError) throw new ServiceError(est.couponError, 'COUPON_INVALID');
      if (!est) throw new ServiceError('Không tính được giá cước. Vui lòng thử lại.', 'FARE_UNAVAILABLE');
      if (shownTotal !== undefined && est.fare.total !== shownTotal) {
        throw new ServiceError(`Giá cước vừa thay đổi thành ${formatCurrency(est.fare.total)}. Vui lòng xem lại trước khi đặt.`, 'FARE_CHANGED');
      }
      const { data } = await apiClient.post<{ orderId: number; orderCode: string; totalFee: number }>('/customer/Orders', {
        vehicleTypeId: Number(draft.vehicleTypeId),
        pickupAddress: draft.pickup.address,
        dropoffAddress: draft.dropoff.address,
        receiverName: draft.dropoff.contactName.trim(),
        receiverPhone: normalizePhone(draft.dropoff.contactPhone),
        senderName: draft.pickup.contactName.trim(),
        senderPhone: normalizePhone(draft.pickup.contactPhone),
        pickupNote: draft.pickup.note?.trim() || null,
        dropoffNote: draft.dropoff.note?.trim() || null,
        cargo: {
          cargoType: draft.cargo.type,
          quantity: draft.cargo.quantity,
          weightKg: draft.cargo.weightKg,
          lengthCm: draft.cargo.largestItem.lengthCm,
          widthCm: draft.cargo.largestItem.widthCm,
          heightCm: draft.cargo.largestItem.heightCm,
          photoUrls: draft.cargo.photos,
          specialNotes: cargoNotes(draft.cargo),
        },
        hasLoadingService: draft.loadingService,
        couponCode: draft.couponCode.trim() || null,
        paymentMethod: draft.paymentMethod,
        payerRole: draft.paymentMethod === 'Cash' ? draft.payerRole : null,
        prohibitedGoodsCommitment: draft.agreedNoProhibitedCargo,
        expectedTotalFee: est?.fare.total,
      });
      const order = await this.loadOrderDetail(String(data.orderId));
      return order;
    } catch (e) {
      throw toServiceError(e);
    }
  },

  /** UC-CUS-27: POST /customer/orders/{id}/payment */
  async createPayment(orderId: string, platform: 'Web' | 'App' = 'Web'): Promise<{ transactionId: number; checkoutUrl: string; qrCode?: string; amount: number; expiresAt: string }> {
    try {
      const { data } = await apiClient.post(`/customer/Orders/${orderId}/payment`, { platform });
      return data;
    } catch (e) {
      throw toServiceError(e);
    }
  },

  /** Kiểm tra trạng thái thanh toán hiện tại (chỉ webhook PayOS mới chuyển đơn sang Paid) */
  async confirmPayment(orderId: string): Promise<ShippingOrder> {
    const order = await this.loadOrderDetail(orderId);
    if (order.status === 'Cancelled') throw new ServiceError(msg('MSG37', { order_id: order.code }));
    if (order.paymentStatus !== 'Paid') throw new ServiceError('Chưa nhận được thanh toán. Vui lòng thử lại sau khi chuyển khoản qua PayOS.');
    return order;
  },

  /** UC-CUS-29: POST /customer/orders/{id}/cancel */
  async cancelByCustomer(orderId: string, _customerId: string, reasonCode: string, reason?: string): Promise<ShippingOrder> {
    try {
      await apiClient.post(`/customer/Orders/${orderId}/cancel`, { reasonCode, reason: reason || null });
      return await this.loadOrderDetail(orderId);
    } catch (e) {
      throw toServiceError(e);
    }
  },

  /** UC-CUS-12: POST /customer/orders/{id}/pickup-evidence */
  async approvePickupEvidence(orderId: string): Promise<ShippingOrder> {
    try {
      await apiClient.post(`/customer/Orders/${orderId}/pickup-evidence`, { approve: true });
      return await this.loadOrderDetail(orderId);
    } catch (e) {
      throw toServiceError(e);
    }
  },

  async rejectPickupEvidence(orderId: string, reason: string): Promise<ShippingOrder> {
    try {
      await apiClient.post(`/customer/Orders/${orderId}/pickup-evidence`, { approve: false, reason });
      return await this.loadOrderDetail(orderId);
    } catch (e) {
      throw toServiceError(e);
    }
  },

  /** UC-CUS-19: POST /customer/orders/{id}/confirm-receipt */
  async confirmReceipt(orderId: string): Promise<ShippingOrder> {
    try {
      await apiClient.post(`/customer/Orders/${orderId}/confirm-receipt`);
      return await this.loadOrderDetail(orderId);
    } catch (e) {
      throw toServiceError(e);
    }
  },

  /** UC-CUS-25: POST /customer/ratings */
  async rateOrder(orderId: string, rating: Omit<Rating, 'createdAt'>): Promise<ShippingOrder> {
    try {
      await apiClient.post('/customer/Ratings', { orderId: Number(orderId), stars: rating.stars, comment: rating.comment || null });
      const order = await this.loadOrderDetail(orderId);
      return { ...order, rating: { ...rating, createdAt: new Date().toISOString() } };
    } catch (e) {
      throw toServiceError(e);
    }
  },

  canComplain: (o: ShippingOrder) => o.status === 'Delivered',

  // ------------------------------------------------------------- Driver
  listAvailableJobsSync: (): ShippingOrder[] => readStore<ShippingOrder[]>(AVAILABLE_JOBS, () => []),

  /** UC-DRV-08: GET /driver/matching/orders */
  async loadAvailableJobs(): Promise<void> {
    try {
      const { data } = await apiClient.get<
        {
          orderId: number;
          orderCode: string;
          pickupAddress: string;
          pickupLatitude: number;
          pickupLongitude: number;
          dropoffAddress: string;
          dropoffLatitude: number;
          dropoffLongitude: number;
          estimatedDistanceKm: number;
          estimatedDurationMin: number;
          totalFee: number;
          paymentMethod: ShippingOrder['paymentMethod'];
          payerRole?: ShippingOrder['payerRole'];
          hasLoadingService: boolean;
          cargoType: string;
          cargoTypeName?: string;
          cargoQuantity: number;
          cargoWeightKg: number;
          cargoLengthCm: number;
          cargoWidthCm: number;
          cargoHeightCm: number;
          cargoPhotoUrls: string[];
          specialNotes?: string;
          createdAt: string;
        }[]
      >('/driver/Matching/orders');
      writeStore(
        AVAILABLE_JOBS,
        data.map(
          (j): ShippingOrder => ({
            id: String(j.orderId),
            code: j.orderCode,
            customerId: '',
            customerName: '',
            customerPhone: '',
            pickup: { address: j.pickupAddress, lat: j.pickupLatitude, lng: j.pickupLongitude, contactName: '', contactPhone: '' },
            dropoff: { address: j.dropoffAddress, lat: j.dropoffLatitude, lng: j.dropoffLongitude, contactName: '', contactPhone: '' },
            vehicle: emptyVehicle(),
            cargo: {
              type: j.cargoType,
              description: j.specialNotes ?? j.cargoTypeName ?? j.cargoType,
              quantity: j.cargoQuantity,
              weightKg: j.cargoWeightKg,
              largestItem: { lengthCm: j.cargoLengthCm, widthCm: j.cargoWidthCm, heightCm: j.cargoHeightCm },
              photos: j.cargoPhotoUrls,
              specialNotes: j.specialNotes,
            },
            loadingService: j.hasLoadingService,
            fare: { distanceKm: j.estimatedDistanceKm, durationMins: j.estimatedDurationMin, distanceFare: j.totalFee, loadingFee: 0, discount: 0, total: j.totalFee },
            paymentMethod: j.paymentMethod,
            payerRole: j.payerRole,
            paymentStatus: 'Unpaid',
            status: 'Pending',
            history: [],
            createdAt: j.createdAt,
          })
        )
      );
    } catch {
      /* ignore */
    }
  },

  getActiveTripOfDriverSync: (_driverId: string): ShippingOrder | undefined => undefined,

  /** UC-DRV-10: POST /driver/matching/orders/{id}/accept */
  async acceptJob(orderId: string, driver: AssignedDriver, _depositBalance: number): Promise<ShippingOrder> {
    try {
      await apiClient.post(`/driver/Matching/orders/${orderId}/accept`);
    } catch (e) {
      throw toServiceError(e);
    }
    const list = readStore<ShippingOrder[]>(AVAILABLE_JOBS, () => []);
    const job = list.find((o) => o.id === orderId);
    writeStore(AVAILABLE_JOBS, list.filter((o) => o.id !== orderId));
    return job ? { ...job, status: 'Accepted', assignedDriver: driver } : ({ id: orderId, code: orderId, status: 'Accepted' } as ShippingOrder);
  },

  async markArrived(_orderId: string): Promise<ShippingOrder> {
    throw new ServiceError('Chưa có API backend cho thao tác này trên web (dành cho app di động).');
  },
  async submitPickupEvidence(_orderId: string, _photos: string[]): Promise<ShippingOrder> {
    throw new ServiceError('Chưa có API tải ảnh cho tài xế trên web. Tài xế hãy dùng app di động.');
  },
  async markDelivered(_orderId: string, _deliveryPhoto: string): Promise<ShippingOrder> {
    throw new ServiceError('Chưa có API tải ảnh cho tài xế trên web. Tài xế hãy dùng app di động.');
  },
  async confirmCashCollected(_orderId: string): Promise<ShippingOrder> {
    throw new ServiceError('Backend chưa có endpoint xác nhận thu tiền mặt riêng cho web.');
  },

  // ----------------------------------------------------------- Dispatcher
  listAllSync: (): ShippingOrder[] => readStore<ShippingOrder[]>(ALL_ORDERS, () => []),

  /** UC-DIS-01: GET /dispatcher/orders */
  async loadAllOrders(params: { status?: OrderStatus; search?: string; page?: number; pageSize?: number } = {}): Promise<void> {
    try {
      const { data } = await apiClient.get<
        PagedResult<{
          id: number;
          orderCode: string;
          orderStatus: OrderStatus;
          paymentMethod: ShippingOrder['paymentMethod'];
          paymentStatus: ShippingOrder['paymentStatus'];
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
          createdAt: string;
        }>
      >('/dispatcher/Orders', { params: { page: 1, pageSize: 50, ...params } });
      writeStore(
        ALL_ORDERS,
        data.items.map(
          (d): ShippingOrder => ({
            id: String(d.id),
            code: d.orderCode,
            customerId: '',
            customerName: d.customerName,
            customerPhone: d.customerPhone,
            pickup: { address: d.pickupAddress, lat: 0, lng: 0, contactName: d.customerName, contactPhone: d.customerPhone },
            dropoff: { address: d.dropoffAddress, lat: 0, lng: 0, contactName: '', contactPhone: '' },
            vehicle: emptyVehicle(d.vehicleTypeName),
            cargo: emptyCargo(),
            loadingService: false,
            fare: emptyFare(d.totalFee),
            paymentMethod: d.paymentMethod,
            paymentStatus: d.paymentStatus,
            status: d.orderStatus,
            assignedDriver: d.driverName
              ? { id: String(d.driverProfileId ?? ''), name: d.driverName, phone: d.driverPhone ?? '', avatar: '', rating: 0, licensePlate: d.licensePlate ?? '', currentLat: 0, currentLng: 0, lastLocationAt: '' }
              : undefined,
            history: [],
            createdAt: d.createdAt,
          })
        )
      );
    } catch {
      /* ignore */
    }
  },

  /** UC-DIS-07: POST /dispatcher/incidents/{incidentId}/cancel-order – cần incidentId mở của đơn, không huỷ trực tiếp theo orderId */
  async cancelByDispatcher(_orderId: string, _reason: string, _refundable: boolean): Promise<ShippingOrder> {
    throw new ServiceError('Huỷ đơn từ Dispatcher thực hiện qua màn hình Sự cố (cần mở sự cố trước).');
  },

  async reassignDriver(_orderId: string, _driver: AssignedDriver): Promise<ShippingOrder> {
    throw new ServiceError('Đổi tài xế thực hiện qua màn hình Sự cố (api/dispatcher/incidents/{id}/reassign).');
  },

  // ------------------------------------------------ Online Drivers (Dispatcher)
  listOnlineDriversSync: (): OnlineDriverItem[] => readStore<OnlineDriverItem[]>(ONLINE_DRIVERS, () => []),
  subscribeOnlineDrivers: (cb: () => void) => subscribeStore(ONLINE_DRIVERS, cb),

  async loadOnlineDrivers(): Promise<void> {
    try {
      const { data } = await apiClient.get<OnlineDriverDto[]>('/dispatcher/Drivers/online');
      writeStore(ONLINE_DRIVERS, data.map((d): OnlineDriverItem => ({
        id: String(d.driverProfileId),
        driverName: d.fullName,
        driverPhone: d.phoneNumber,
        vehicleType: d.vehicleTypeName,
        licensePlate: d.licensePlate,
        lat: d.latitude,
        lng: d.longitude,
        lastLocationAt: d.lastLocationAt,
        activeOrderId: d.activeOrderId != null ? String(d.activeOrderId) : undefined,
        activeOrderCode: d.activeOrderCode ?? undefined,
        activeOrderStatus: d.activeOrderStatus ?? undefined,
      })));
    } catch {
      /* ignore */
    }
  },

  // ---------------------------------------- Dispatcher Orders Summary
  getDispatcherSummarySync: (): DispatcherSummary | null => readStore<DispatcherSummary | null>(DISPATCHER_SUMMARY, () => null),
  subscribeDispatcherSummary: (cb: () => void) => subscribeStore(DISPATCHER_SUMMARY, cb),

  async loadDispatcherSummary(): Promise<void> {
    try {
      const { data } = await apiClient.get<DispatcherSummary>('/dispatcher/Orders/summary');
      writeStore(DISPATCHER_SUMMARY, data);
    } catch {
      /* ignore */
    }
  },

  // --------------------------------------------- Handled Cases (Dispatcher)
  listHandledCasesSync: (): HandledCaseItem[] => readStore<HandledCaseItem[]>(HANDLED_CASES, () => []),
  subscribeHandledCases: (cb: () => void) => subscribeStore(HANDLED_CASES, cb),

  async loadHandledCases(params: { type?: string; page?: number; pageSize?: number } = {}): Promise<void> {
    try {
      const { data } = await apiClient.get<{ items: HandledCaseItem[]; totalCount: number }>('/dispatcher/handled-cases', { params: { page: 1, pageSize: 50, ...params } });
      writeStore(HANDLED_CASES, data.items);
    } catch {
      /* ignore */
    }
  },

  // --------------------------------------------- Order Tracking (Customer)
  async loadOrderTracking(orderId: string): Promise<OrderTracking | null> {
    try {
      const { data } = await apiClient.get<{
        orderId: number;
        orderStatus: string;
        driver?: { latitude: number; longitude: number; at: string; isStale: boolean } | null;
        eta?: { target: string; durationMinutes: number } | null;
      }>(`/customer/Orders/${orderId}/tracking`);
      return {
        orderId: data.orderId,
        orderStatus: data.orderStatus,
        driverLat: data.driver?.latitude,
        driverLng: data.driver?.longitude,
        driverAt: data.driver?.at,
        driverIsStale: data.driver?.isStale,
        etaMinutes: data.eta?.durationMinutes,
        etaTarget: data.eta?.target,
      };
    } catch {
      return null;
    }
  },
};
