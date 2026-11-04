/**
 * Domain types bám theo SRS – mục I.3.2 Entity Descriptions.
 * Order lifecycle: Pending → Accepted → Arrived → PickedUp → InTransit → Delivered → Completed | Cancelled
 */
export type OrderStatus =
  | 'Pending'
  | 'Accepted'
  | 'Arrived'
  | 'PickedUp'
  | 'InTransit'
  | 'Delivered'
  | 'Completed'
  | 'Cancelled';

/** SRS: PaymentMethod (PayOS / Cash). Không có ví khách hàng. */
export type PaymentMethod = 'PayOS' | 'Cash';
export type PaymentStatus = 'Unpaid' | 'Paid';
/** PaymentTransaction.PayerRole */
export type PayerRole = 'Sender' | 'Receiver';

/** Mã loại hàng – lấy từ api/public/lookups/cargo-types (master data, Admin cấu hình) */
export type CargoType = string;

export type ActorRole = 'Customer' | 'Driver' | 'Dispatcher' | 'Admin' | 'System';

export interface LocationPoint {
  address: string;
  lat: number;
  lng: number;
  contactName: string;
  contactPhone: string;
  note?: string;
}

/** Kích thước tính bằng cm */
export interface Dimensions {
  lengthCm: number;
  widthCm: number;
  heightCm: number;
}

/** Entity VehicleType (Admin cấu hình – UC-ADM-11, UC-ADM-15/16) */
export interface VehicleType {
  id: string;
  name: string;
  description: string;
  baseFare: number;
  pricePerKm: number;
  minimumFare: number;
  maxLoadKg: number;
  cargoBed: Dimensions;
  iconType: 'pickup' | 'truck' | 'heavy_truck';
  isActive: boolean;
}

/** Ảnh chụp cấu hình xe tại thời điểm đặt đơn (giá chốt khi submit – GB-33) */
export type VehicleSnapshot = Pick<
  VehicleType,
  'id' | 'name' | 'baseFare' | 'pricePerKm' | 'minimumFare' | 'maxLoadKg' | 'cargoBed' | 'iconType'
>;

/** Entity CargoDetail */
export interface CargoDetail {
  type: CargoType;
  description: string;
  quantity: number;
  weightKg: number;
  /** Kích thước kiện lớn nhất (GB-10) */
  largestItem: Dimensions;
  photos: string[];
  specialNotes?: string;
}

/** Entity Coupon */
export interface Coupon {
  id: string;
  code: string;
  discountValue: number;
  minimumOrderValue: number;
  validFrom: string;
  validTo: string;
  usageLimit: number;
  usedCount: number;
  isActive: boolean;
}

export interface FareBreakdown {
  distanceKm: number;
  durationMins: number;
  /** max(MinimumFare, BaseFare + PricePerKm × km) */
  distanceFare: number;
  loadingFee: number;
  discount: number;
  /** GB-29 */
  total: number;
}

export interface AssignedDriver {
  id: string;
  name: string;
  phone: string;
  avatar: string;
  rating: number;
  licensePlate: string;
  currentLat: number;
  currentLng: number;
  lastLocationAt: string;
}

/** Entity OrderStatusHistory (append-only) */
export interface OrderStatusHistory {
  from: OrderStatus | null;
  to: OrderStatus;
  changedBy: ActorRole;
  note?: string;
  changedAt: string;
}

/** Entity ProofOfDelivery */
export interface ProofOfDelivery {
  pickupPhotos: string[];
  /** Số lần nộp ảnh lấy hàng (GB-11: tối đa 5) */
  pickupSubmissionCount: number;
  pickupRejectReason?: string;
  pickupStatus: 'Pending' | 'Verified' | 'Rejected';
  deliveryPhoto?: string;
  deliveredAt?: string;
}

/** Entity Rating */
export interface Rating {
  stars: number;
  comment: string;
  tags: string[];
  createdAt: string;
}

/** Entity ShippingOrder */
export interface ShippingOrder {
  id: string;
  code: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  pickup: LocationPoint;
  dropoff: LocationPoint;
  vehicle: VehicleSnapshot;
  cargo: CargoDetail;
  loadingService: boolean;
  couponCode?: string;
  fare: FareBreakdown;
  paymentMethod: PaymentMethod;
  /** Chỉ áp dụng với Cash */
  payerRole?: PayerRole;
  paymentStatus: PaymentStatus;
  status: OrderStatus;
  /** Tỷ lệ hoa hồng chốt khi Accepted (GB-14) */
  commissionRate?: number;
  assignedDriver?: AssignedDriver;
  proof?: ProofOfDelivery;
  rating?: Rating;
  cancellationReason?: string;
  history: OrderStatusHistory[];
  createdAt: string;
  paidAt?: string;
  acceptedAt?: string;
  pickedUpAt?: string;
  deliveredAt?: string;
  completedAt?: string;
  cancelledAt?: string;
}

/** Bản nháp đơn khi đang đặt (GB-28: Guest được lưu nháp) */
export interface BookingDraft {
  pickup: LocationPoint;
  dropoff: LocationPoint;
  cargo: CargoDetail;
  vehicleTypeId: string | null;
  loadingService: boolean;
  couponCode: string;
  paymentMethod: PaymentMethod;
  payerRole: PayerRole;
  agreedNoProhibitedCargo: boolean;
  agreedWarrantyPolicy: boolean;
}
