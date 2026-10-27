export type OrderStatus =
  | 'PlaceOrder'
  | 'Pending'
  | 'Accepted'
  | 'Arrived'
  | 'PickedUp'
  | 'InTransit'
  | 'Delivered'
  | 'Completed'
  | 'Cancelled';


export type PaymentMethod = 'PayOS' | 'Cash' | 'Wallet';
export type PaymentStatus = 'Unpaid' | 'Paid';

export interface LocationPoint {
  address: string;
  lat: number;
  lng: number;
  contactName: string;
  contactPhone: string;
  note?: string;
}

export interface VehicleOption {
  id: string;
  name: string;
  category: 'BIKE' | 'VAN' | 'TRUCK_500KG' | 'TRUCK_1TON' | 'TRUCK_2TON';
  tag: string;
  capacityText: string;
  dimensions: string;
  baseFare: number;
  perKmRate: number;
  iconType: string;
  isAiRecommended?: boolean;
}

export interface CargoItem {
  name: string;
  weightKg: number;
  quantity: number;
  images: string[];
  dimensions?: string;
  type?: string;
  aiNotes?: string;
}

export interface ServiceOption {
  id: string;
  name: string;
  description: string;
  price: number;
  isSelected?: boolean;
}

export interface ShippingOrder {
  id: string;
  code: string;
  customerName: string;
  customerPhone: string;
  pickup: LocationPoint;
  dropoff: LocationPoint;
  waypoints?: LocationPoint[];
  vehicle: VehicleOption;
  cargo: CargoItem;
  additionalServices: ServiceOption[];
  totalDistanceKm: number;
  estimatedDurationMins: number;
  baseFee: number;
  distanceFee: number;
  servicesFee: number;
  discountFee: number;
  totalFee: number;
  codAmount?: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  assignedDriver?: {
    id: string;
    name: string;
    phone: string;
    avatar: string;
    rating: number;
    licensePlate: string;
    currentLat: number;
    currentLng: number;
    lastUpdated: string;
  };
  createdAt: string;
  pickedUpAt?: string;
  deliveredAt?: string;
}
