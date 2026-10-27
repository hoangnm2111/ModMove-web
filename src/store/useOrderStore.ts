import { create } from 'zustand';
import { LocationPoint, VehicleOption, ServiceOption, CargoItem } from '../types/order.types';
import { DEFAULT_VEHICLES, DEFAULT_SERVICES } from '../constants';

interface OrderState {
  step: number; // 1: Addresses, 2: Vehicle & Cargo, 3: Services & AI, 4: Review & Payment
  pickup: LocationPoint;
  dropoff: LocationPoint;
  selectedVehicle: VehicleOption;
  cargo: CargoItem;
  services: ServiceOption[];
  promoCode: string;
  discountAmount: number;
  paymentMethod: 'PayOS' | 'Cash' | 'Wallet';
  isAiAnalyzing: boolean;

  setStep: (step: number) => void;
  setPickup: (p: Partial<LocationPoint>) => void;
  setDropoff: (d: Partial<LocationPoint>) => void;
  setVehicle: (v: VehicleOption) => void;
  setCargo: (c: Partial<CargoItem>) => void;
  toggleService: (serviceId: string) => void;
  setPromoCode: (code: string) => void;
  setPaymentMethod: (method: 'PayOS' | 'Cash' | 'Wallet') => void;
  calculateFare: () => {
    distanceKm: number;
    baseFee: number;
    distanceFee: number;
    servicesFee: number;
    discountFee: number;
    totalFee: number;
  };
  triggerAiAnalysis: (imageUrl: string) => Promise<void>;
  resetBooking: () => void;
}

const DEFAULT_PICKUP: LocationPoint = {
  address: 'Số 19 Lê Thanh Nghị, Hai Bà Trưng, Hà Nội',
  lat: 21.0041,
  lng: 105.8455,
  contactName: 'Hoàng Nguyễn Mạnh',
  contactPhone: '0338967316',
  note: 'Tầng 1 dễ lấy đồ, xe tải đỗ được cửa',
};

const DEFAULT_DROPOFF: LocationPoint = {
  address: 'Chung cư Vinhomes Smart City, Tây Mỗ, Nam Từ Liêm, Hà Nội',
  lat: 20.9998,
  lng: 105.7346,
  contactName: 'Mạnh Hoàng',
  contactPhone: '0338967316',
  note: 'Tòa S2.05, sảnh hàng',
};

export const useOrderStore = create<OrderState>((set, get) => ({
  step: 1,
  pickup: DEFAULT_PICKUP,
  dropoff: DEFAULT_DROPOFF,
  selectedVehicle: DEFAULT_VEHICLES[0], // Xe tải dưới 1 tấn
  cargo: {
    name: 'Đồ chuyển trọ: 1 tủ quần áo gỗ 2 cánh, 1 đệm 1m6, 5 thùng đồ cá nhân',
    weightKg: 280,
    quantity: 7,
    images: [],
    aiNotes: '',
  },
  services: DEFAULT_SERVICES,
  promoCode: 'MODMOVE2026',
  discountAmount: 50000,
  paymentMethod: 'PayOS',
  isAiAnalyzing: false,

  setStep: (step) => set({ step }),
  setPickup: (p) => set((s) => ({ pickup: { ...s.pickup, ...p } })),
  setDropoff: (d) => set((s) => ({ dropoff: { ...s.dropoff, ...d } })),
  setVehicle: (v) => set({ selectedVehicle: v }),
  setCargo: (c) => set((s) => ({ cargo: { ...s.cargo, ...c } })),

  toggleService: (serviceId) =>
    set((s) => ({
      services: s.services.map((srv) =>
        srv.id === serviceId ? { ...srv, isSelected: !srv.isSelected } : srv
      ),
    })),

  setPromoCode: (code) => {
    const discount = code.trim().toUpperCase() === 'MODMOVE2026' ? 50000 : 0;
    set({ promoCode: code, discountAmount: discount });
  },

  setPaymentMethod: (paymentMethod) => set({ paymentMethod }),

  calculateFare: () => {
    const s = get();
    // Giả định khoảng cách ước lượng giữa 2 điểm (14.2 km)
    const distanceKm = 14.2;
    const baseFee = s.selectedVehicle.baseFare;
    const distanceFee = Math.round(distanceKm * s.selectedVehicle.perKmRate);
    const servicesFee = s.services
      .filter((srv) => srv.isSelected)
      .reduce((sum, srv) => sum + srv.price, 0);
    const discountFee = s.discountAmount;
    const totalFee = Math.max(0, baseFee + distanceFee + servicesFee - discountFee);

    return { distanceKm, baseFee, distanceFee, servicesFee, discountFee, totalFee };
  },

  triggerAiAnalysis: async (imageUrl: string) => {
    set({ isAiAnalyzing: true });
    // Simulate AI Image Cargo Vision Analysis
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // AI identifies cargo and suggests appropriate vehicle
    const recommendedVehicle = DEFAULT_VEHICLES.find((v) => v.category === 'TRUCK_1TON') || DEFAULT_VEHICLES[2];

    set((state) => ({
      isAiAnalyzing: false,
      selectedVehicle: recommendedVehicle,
      cargo: {
        ...state.cargo,
        images: [...state.cargo.images, imageUrl],
        aiNotes: '✨ AI Nhận diện: Kiện hàng cồng kềnh gồm tủ gỗ và đệm. Khuyến nghị loại xe: Xe tải 1 tấn (Thùng bạt 3m) để tránh va đập và che mưa nắng.',
      },
    }));
  },

  resetBooking: () =>
    set({
      step: 1,
      pickup: DEFAULT_PICKUP,
      dropoff: DEFAULT_DROPOFF,
      selectedVehicle: DEFAULT_VEHICLES[2],
      services: DEFAULT_SERVICES,
      promoCode: '',
      discountAmount: 0,
    }),
}));
