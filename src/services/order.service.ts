import { BUSINESS } from '../config/business';
import { msg } from '../constants/messages';
import { calculateCommission, calculateFare, validateCoupon } from '../domain/pricing';
import {
  canComplain,
  canConfirmReceipt,
  canCustomerCancel,
  canReviewPickupEvidence,
  canTransition,
  hasEnoughDeposit,
  isVisibleToDrivers,
  ratingRestriction,
  refundOnCancel,
} from '../domain/orderRules';
import { canVehicleCarry } from '../domain/vehicleFit';
import {
  ActorRole,
  AssignedDriver,
  BookingDraft,
  OrderStatus,
  Rating,
  ShippingOrder,
} from '../types/order.types';
import { User } from '../types/user.types';
import { catalogService } from './catalog.service';
import { GeoPoint, mapService, SAMPLE_PLACES } from './map.service';
import { latency, readStore, ServiceError, subscribeStore, writeStore } from './mock/storage';

/**
 * Order service – tương ứng API /orders của backend.
 * Mỗi hàm kiểm tra Business Rule (GB-xx) giống phía server để FE báo lỗi sớm.
 */
const KEY = 'orders';

const minutesAgo = (m: number) => new Date(Date.now() - m * 60_000).toISOString();

function seedOrders(): ShippingOrder[] {
  const vehicles = catalogService.getVehicleTypesSync();
  const snap = (i: number) => {
    const { id, name, baseFare, pricePerKm, minimumFare, maxLoadKg, cargoBed, iconType } = vehicles[i] ?? vehicles[0];
    return { id, name, baseFare, pricePerKm, minimumFare, maxLoadKg, cargoBed, iconType };
  };
  const settings = catalogService.getSettingsSync();
  const driver: AssignedDriver = {
    id: 'drv_88',
    name: 'Nguyễn Văn Hùng',
    phone: '0912345678',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    rating: 4.9,
    licensePlate: '29C-874.12',
    currentLat: 21.0115,
    currentLng: 105.65,
    lastLocationAt: new Date().toISOString(),
  };
  const base = (
    code: string,
    vIdx: number,
    from: GeoPoint,
    to: GeoPoint,
    extra: Partial<ShippingOrder>
  ): ShippingOrder => {
    const vehicle = snap(vIdx);
    const route = mapService.estimateRouteSync(from, to);
    const fare = calculateFare({ vehicle, ...route, loadingService: true, loadingFee: settings.loadingFee });
    return {
      id: `ord_${code}`,
      code,
      customerId: 'cust_01',
      customerName: 'Hoàng Nguyễn Mạnh',
      customerPhone: '0338967316',
      pickup: { ...from, contactName: 'Hoàng Mạnh', contactPhone: '0338967316' },
      dropoff: { ...to, contactName: 'Anh Mạnh', contactPhone: '0338967316' },
      vehicle,
      cargo: {
        type: 'Furniture',
        description: 'Tủ quần áo 2 cánh, đệm 1m6, 5 thùng carton',
        quantity: 7,
        weightKg: 280,
        largestItem: { lengthCm: 180, widthCm: 60, heightCm: 120 },
        photos: ['https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=600&q=80'],
      },
      loadingService: true,
      fare,
      paymentMethod: 'PayOS',
      paymentStatus: 'Paid',
      status: 'Pending',
      history: [],
      createdAt: minutesAgo(5),
      ...extra,
    };
  };
  const P = SAMPLE_PLACES;
  const all = (q: string) => SAMPLE_PLACES.find((p) => p.address.includes(q)) ?? SAMPLE_PLACES[0];
  return [
    base('MM-63211', 2, all('Keangnam'), all('Times City'), {
      status: 'Pending',
      paymentMethod: 'Cash',
      payerRole: 'Sender',
      paymentStatus: 'Unpaid',
      createdAt: minutesAgo(2),
    }),
    base('MM-78219', 1, all('FPT'), all('Matrix'), {
      status: 'PickedUp',
      commissionRate: settings.commissionRate,
      // Tài xế khác đang chạy đơn này, để tài xế demo (drv_88) còn rảnh nhận đơn mới (GB-09)
      assignedDriver: { ...driver, id: 'drv_33', name: 'Phạm Quốc Bảo', phone: '0983112233', licensePlate: '30F-992.45' },
      acceptedAt: minutesAgo(50),
      pickedUpAt: minutesAgo(5),
      proof: {
        pickupPhotos: [
          'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80',
          'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=600&q=80',
        ],
        pickupSubmissionCount: 1,
        pickupStatus: 'Pending',
      },
      createdAt: minutesAgo(60),
      paidAt: minutesAgo(59),
    }),
    base('MM-84721', 0, P[4], P[5], {
      status: 'Delivered',
      commissionRate: settings.commissionRate,
      assignedDriver: { ...driver, id: 'drv_33', name: 'Phạm Quốc Bảo', licensePlate: '30F-992.45' },
      proof: {
        pickupPhotos: ['https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=600&q=80'],
        pickupSubmissionCount: 1,
        pickupStatus: 'Verified',
        deliveryPhoto: 'https://images.unsplash.com/photo-1600518464441-9154a4dea21b?auto=format&fit=crop&w=600&q=80',
        deliveredAt: minutesAgo(90),
      },
      createdAt: minutesAgo(180),
      deliveredAt: minutesAgo(90),
    }),
    base('MM-90182', 1, P[2], P[1], {
      status: 'Completed',
      commissionRate: settings.commissionRate,
      assignedDriver: { ...driver, id: 'drv_02', name: 'Lê Hoàng Nam', licensePlate: '29D-562.91' },
      createdAt: minutesAgo(60 * 26),
      deliveredAt: minutesAgo(60 * 25),
      completedAt: minutesAgo(60 * 3),
    }),
    base('MM-26EG8', 0, P[8], P[7], {
      status: 'Cancelled',
      paymentMethod: 'Cash',
      payerRole: 'Receiver',
      paymentStatus: 'Unpaid',
      cancellationReason: 'Khách đổi lịch chuyển',
      createdAt: minutesAgo(60 * 48),
      cancelledAt: minutesAgo(60 * 47),
    }),
  ];
}

const load = (): ShippingOrder[] => readStore(KEY, seedOrders);
const save = (orders: ShippingOrder[]) => writeStore(KEY, orders);

function mutate(orderId: string, fn: (o: ShippingOrder) => ShippingOrder): ShippingOrder {
  const orders = load();
  const idx = orders.findIndex((o) => o.id === orderId);
  if (idx < 0) throw new ServiceError(msg('MSG38'));
  const next = fn(orders[idx]);
  orders[idx] = next;
  save(orders);
  return next;
}

function transition(o: ShippingOrder, to: OrderStatus, by: ActorRole, note?: string): ShippingOrder {
  if (!canTransition(o.status, to)) throw new ServiceError(msg('MSG38'));
  return { ...o, status: to, history: [...o.history, { from: o.status, to, changedBy: by, note, changedAt: new Date().toISOString() }] };
}

/**
 * Mô phỏng background jobs (JOB-MATCH-01, JOB-PAY-01, JOB-ORDER-01) – chạy mỗi lần đọc.
 * Trên backend đây là scheduled job; FE chỉ đọc kết quả.
 */
function runScheduledJobs(orders: ShippingOrder[]): { orders: ShippingOrder[]; changed: boolean } {
  const now = Date.now();
  let changed = false;
  const result = orders.map((o) => {
    const age = (iso?: string) => (iso ? (now - new Date(iso).getTime()) / 60_000 : 0);
    // GB-13: PayOS chưa thanh toán sau 30 phút → huỷ
    if (o.status === 'Pending' && o.paymentMethod === 'PayOS' && o.paymentStatus === 'Unpaid' && age(o.createdAt) > BUSINESS.UNPAID_ORDER_TIMEOUT_MIN) {
      changed = true;
      return { ...transition(o, 'Cancelled', 'System', 'Quá hạn thanh toán (GB-13)'), cancellationReason: 'Quá hạn thanh toán', cancelledAt: new Date().toISOString() };
    }
    // GB-24: Pending (đã hiển thị cho tài xế) quá 10 phút → huỷ
    const matchingStart = o.paymentMethod === 'PayOS' ? o.paidAt : o.createdAt;
    if (isVisibleToDrivers(o) && age(matchingStart) > BUSINESS.MATCHING_TIMEOUT_MIN) {
      changed = true;
      return { ...transition(o, 'Cancelled', 'System', msg('MSG35')), cancellationReason: 'Không có tài xế nhận đơn', cancelledAt: new Date().toISOString() };
    }
    // GB-23: Delivered quá 24h → tự hoàn thành
    if (o.status === 'Delivered' && age(o.deliveredAt) > BUSINESS.AUTO_COMPLETE_HOURS * 60) {
      changed = true;
      return { ...transition(o, 'Completed', 'System', 'Tự động hoàn thành (GB-23)'), completedAt: new Date().toISOString() };
    }
    return o;
  });
  return { orders: result, changed };
}

function loadWithJobs(): ShippingOrder[] {
  const { orders, changed } = runScheduledJobs(load());
  if (changed) save(orders);
  return orders;
}

/** Callback khi đơn bị huỷ có khoản hoàn (GB-41) – được case.service đăng ký để tránh import vòng */
let onCancellationRefund: ((o: ShippingOrder, amount: number) => void) | null = null;
export const registerCancellationRefundHandler = (fn: typeof onCancellationRefund) => {
  onCancellationRefund = fn;
};
/** Callback khi đơn Completed để quyết toán ví tài xế (GB-14/15) */
let onCompleted: ((o: ShippingOrder) => void) | null = null;
export const registerCompletionHandler = (fn: typeof onCompleted) => {
  onCompleted = fn;
};

const now = () => new Date().toISOString();

export const orderService = {
  subscribe: (cb: () => void) => subscribeStore(KEY, cb),

  // ------------------------------------------------------------------ Queries
  listAllSync: (): ShippingOrder[] => loadWithJobs(),

  /** GB-50: khách chỉ xem đơn của mình */
  listByCustomerSync: (customerId: string): ShippingOrder[] =>
    loadWithJobs()
      .filter((o) => o.customerId === customerId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),

  getByCodeSync: (code: string): ShippingOrder | undefined => loadWithJobs().find((o) => o.code === code || o.id === code),

  /** UC-DRV-08 / GB-31: đơn Pending đủ điều kiện hiển thị cho tài xế */
  listAvailableJobsSync: (): ShippingOrder[] => loadWithJobs().filter(isVisibleToDrivers),

  getActiveTripOfDriverSync: (driverId: string): ShippingOrder | undefined =>
    loadWithJobs().find((o) => o.assignedDriver?.id === driverId && ['Accepted', 'Arrived', 'PickedUp', 'InTransit'].includes(o.status)),

  // --------------------------------------------------------------- Customer
  /** UC-GST-13: ước tính cước cho bản nháp */
  estimate(draft: BookingDraft) {
    const vehicle = catalogService.getVehicleTypesSync().find((v) => v.id === draft.vehicleTypeId);
    if (!vehicle) return null;
    const route = mapService.estimateRouteSync(draft.pickup, draft.dropoff);
    const { loadingFee } = catalogService.getSettingsSync();
    const gross = calculateFare({ vehicle, ...route, loadingService: draft.loadingService, loadingFee });
    let couponError: string | null = null;
    let discount = 0;
    if (draft.couponCode.trim()) {
      const check = validateCoupon(catalogService.findCouponSync(draft.couponCode), gross.total);
      if (check.ok) discount = check.discount;
      else couponError = check.error;
    }
    return {
      vehicle,
      fare: calculateFare({ vehicle, ...route, loadingService: draft.loadingService, loadingFee, discount }),
      couponError,
    };
  },

  /** UC-GST-17: gửi yêu cầu vận chuyển */
  async createOrder(draft: BookingDraft, customer: User): Promise<ShippingOrder> {
    await latency(500);
    // GB-28 / GB-46
    if (customer.role !== 'Customer' || customer.status !== 'Active') throw new ServiceError(msg('MSG10'));
    if (!draft.agreedNoProhibitedCargo || !draft.agreedWarrantyPolicy) throw new ServiceError(msg('MSG32'));
    // GB-06
    if (draft.cargo.photos.length < BUSINESS.MIN_CARGO_PHOTOS || draft.cargo.photos.length > BUSINESS.MAX_CARGO_PHOTOS) {
      throw new ServiceError(msg('MSG03', { field_name: 'Ảnh hàng hoá', constraints: `${BUSINESS.MIN_CARGO_PHOTOS}–${BUSINESS.MAX_CARGO_PHOTOS} ảnh` }));
    }
    const est = this.estimate(draft);
    if (!est || !est.vehicle.isActive) throw new ServiceError(msg('MSG30'));
    // GB-10
    if (!canVehicleCarry(est.vehicle, draft.cargo)) throw new ServiceError(msg('MSG30'));
    if (est.couponError) throw new ServiceError(est.couponError);

    const { id, name, baseFare, pricePerKm, minimumFare, maxLoadKg, cargoBed, iconType } = est.vehicle;
    const createdAt = now();
    const order: ShippingOrder = {
      id: `ord_${Date.now().toString(36)}`,
      code: `MM-${Math.floor(10000 + Math.random() * 90000)}`,
      customerId: customer.id,
      customerName: customer.fullName,
      customerPhone: customer.phoneNumber,
      pickup: draft.pickup,
      dropoff: draft.dropoff,
      vehicle: { id, name, baseFare, pricePerKm, minimumFare, maxLoadKg, cargoBed, iconType },
      cargo: draft.cargo,
      loadingService: draft.loadingService,
      couponCode: est.fare.discount > 0 ? draft.couponCode.trim().toUpperCase() : undefined,
      fare: est.fare,
      paymentMethod: draft.paymentMethod,
      payerRole: draft.paymentMethod === 'Cash' ? draft.payerRole : undefined,
      paymentStatus: 'Unpaid',
      status: 'Pending',
      history: [{ from: null, to: 'Pending', changedBy: 'Customer', changedAt: createdAt }],
      createdAt,
    };
    if (order.couponCode) catalogService.consumeCoupon(order.couponCode); // GB-30
    save([order, ...load()]);
    return order;
  },

  /** UC-CUS-27 (mock webhook PayOS – API-PAY-01) */
  async confirmPayment(orderId: string): Promise<ShippingOrder> {
    await latency(800);
    return mutate(orderId, (o) => {
      if (o.status === 'Cancelled') {
        // GB-41: thanh toán đến sau khi huỷ → hoàn 100%
        onCancellationRefund?.(o, o.fare.total);
        throw new ServiceError(msg('MSG37', { order_id: o.code }));
      }
      if (o.paymentStatus === 'Paid') return o;
      return { ...o, paymentStatus: 'Paid', paidAt: now() };
    });
  },

  /** UC-CUS-29 / GB-22 */
  async cancelByCustomer(orderId: string, customerId: string, reason: string): Promise<ShippingOrder> {
    await latency();
    let refund = 0;
    const updated = mutate(orderId, (o) => {
      if (o.customerId !== customerId) throw new ServiceError(msg('MSG13'));
      if (!canCustomerCancel(o)) throw new ServiceError(msg('MSG38'));
      refund = refundOnCancel(o);
      return { ...transition(o, 'Cancelled', 'Customer', reason), cancellationReason: reason, cancelledAt: now() };
    });
    if (refund > 0) onCancellationRefund?.(updated, refund);
    return updated;
  },

  /** UC-CUS-12 / GB-26: duyệt ảnh kiểm hàng → InTransit */
  async approvePickupEvidence(orderId: string): Promise<ShippingOrder> {
    await latency();
    return mutate(orderId, (o) => {
      if (!canReviewPickupEvidence(o)) throw new ServiceError(msg('MSG38'));
      return { ...transition(o, 'InTransit', 'Customer', 'Khách duyệt ảnh kiểm hàng'), proof: { ...o.proof!, pickupStatus: 'Verified' } };
    });
  },

  /** UC-CUS-12 / GB-11: từ chối → tài xế chụp lại */
  async rejectPickupEvidence(orderId: string, reason: string): Promise<ShippingOrder> {
    await latency();
    if (!reason.trim()) throw new ServiceError(msg('MSG01', { field_name: 'Lý do từ chối' }));
    return mutate(orderId, (o) => {
      if (!canReviewPickupEvidence(o)) throw new ServiceError(msg('MSG38'));
      return { ...o, proof: { ...o.proof!, pickupStatus: 'Rejected', pickupRejectReason: reason } };
    });
  },

  /** UC-CUS-19: xác nhận đã nhận hàng → Completed */
  async confirmReceipt(orderId: string): Promise<ShippingOrder> {
    await latency();
    const updated = mutate(orderId, (o) => {
      if (!canConfirmReceipt(o)) throw new ServiceError(msg('MSG38'));
      return { ...transition(o, 'Completed', 'Customer'), completedAt: now() };
    });
    onCompleted?.(updated);
    return updated;
  },

  /** UC-CUS-25 / GB-20 */
  async rateOrder(orderId: string, rating: Omit<Rating, 'createdAt'>): Promise<ShippingOrder> {
    await latency();
    if (rating.stars < 1 || rating.stars > 5) throw new ServiceError(msg('MSG56'));
    return mutate(orderId, (o) => {
      const restriction = ratingRestriction(o);
      if (restriction) throw new ServiceError(msg('MSG58', { rating_restriction_message: restriction }));
      return { ...o, rating: { ...rating, createdAt: now() } };
    });
  },

  canComplain,

  // ----------------------------------------------------------------- Driver
  /** UC-DRV-10 / GB-08, GB-09, GB-16 */
  async acceptJob(orderId: string, driver: AssignedDriver, depositBalance: number): Promise<ShippingOrder> {
    await latency();
    if (this.getActiveTripOfDriverSync(driver.id)) throw new ServiceError('Bạn đang có một đơn đang thực hiện (GB-09).');
    const { commissionRate } = catalogService.getSettingsSync();
    return mutate(orderId, (o) => {
      if (!isVisibleToDrivers(o)) throw new ServiceError(msg('MSG40'));
      if (o.paymentMethod === 'Cash' && !hasEnoughDeposit(depositBalance, calculateCommission(o.fare.total, commissionRate))) {
        throw new ServiceError(msg('MSG26', { required_balance: BUSINESS.MIN_COD_DEPOSIT.toLocaleString('vi-VN') + ' đ' }));
      }
      return { ...transition(o, 'Accepted', 'Driver'), assignedDriver: driver, commissionRate, acceptedAt: now() };
    });
  },

  /** UC-DRV-12 */
  async markArrived(orderId: string): Promise<ShippingOrder> {
    await latency();
    return mutate(orderId, (o) => transition(o, 'Arrived', 'Driver'));
  },

  /** UC-DRV-13 / GB-11: nộp 2–5 ảnh, tối đa 5 lần */
  async submitPickupEvidence(orderId: string, photos: string[]): Promise<ShippingOrder> {
    await latency();
    if (photos.length < BUSINESS.MIN_PICKUP_PHOTOS || photos.length > BUSINESS.MAX_PICKUP_PHOTOS) {
      throw new ServiceError(msg('MSG44', { evidence_type: `${BUSINESS.MIN_PICKUP_PHOTOS}–${BUSINESS.MAX_PICKUP_PHOTOS} ảnh kiểm hàng` }));
    }
    return mutate(orderId, (o) => {
      const count = (o.proof?.pickupSubmissionCount ?? 0) + 1;
      if (count > BUSINESS.MAX_PICKUP_SUBMISSIONS) {
        throw new ServiceError('Đã quá 5 lần nộp ảnh. Vui lòng báo cáo sự cố cho điều phối viên (GB-11).');
      }
      const base = o.status === 'Arrived' ? transition(o, 'PickedUp', 'Driver') : o;
      if (base.status !== 'PickedUp') throw new ServiceError(msg('MSG38'));
      return {
        ...base,
        pickedUpAt: base.pickedUpAt ?? now(),
        proof: { pickupPhotos: photos, pickupSubmissionCount: count, pickupStatus: 'Pending' },
      };
    });
  },

  /** UC-DRV-16 / GB-12: cần ảnh giao hàng */
  async markDelivered(orderId: string, deliveryPhoto: string): Promise<ShippingOrder> {
    await latency();
    if (!deliveryPhoto) throw new ServiceError(msg('MSG44', { evidence_type: 'ảnh giao hàng (POD)' }));
    return mutate(orderId, (o) => {
      const t = now();
      return { ...transition(o, 'Delivered', 'Driver'), deliveredAt: t, proof: { ...o.proof!, deliveryPhoto, deliveredAt: t } };
    });
  },

  /** UC-DRV-17: ghi nhận thu tiền mặt */
  async confirmCashCollected(orderId: string): Promise<ShippingOrder> {
    await latency();
    return mutate(orderId, (o) => {
      if (o.paymentMethod !== 'Cash') throw new ServiceError(msg('MSG07'));
      return { ...o, paymentStatus: 'Paid', paidAt: now() };
    });
  },

  // ------------------------------------------------------------- Dispatcher
  /** UC-DIS-07 / GB-38 */
  async cancelByDispatcher(orderId: string, reason: string, refundable: boolean): Promise<ShippingOrder> {
    await latency();
    let refund = 0;
    const updated = mutate(orderId, (o) => {
      refund = refundable ? refundOnCancel(o) : 0;
      return { ...transition(o, 'Cancelled', 'Dispatcher', reason), cancellationReason: reason, cancelledAt: now() };
    });
    if (refund > 0) onCancellationRefund?.(updated, refund);
    return updated;
  },

  /** UC-DIS-06 / GB-37: đơn quay về Accepted, đếm lại ảnh kiểm hàng */
  async reassignDriver(orderId: string, driver: AssignedDriver): Promise<ShippingOrder> {
    await latency();
    const { commissionRate } = catalogService.getSettingsSync();
    return mutate(orderId, (o) => ({
      ...o,
      status: 'Accepted',
      assignedDriver: driver,
      commissionRate,
      proof: undefined,
      history: [...o.history, { from: o.status, to: 'Accepted', changedBy: 'Dispatcher', note: `Đổi tài xế: ${driver.name}`, changedAt: now() }],
    }));
  },
};
