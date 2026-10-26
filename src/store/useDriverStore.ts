import { create } from 'zustand';
import { ShippingOrder } from '../types/order.types';
import { orderService } from '../services/order.service';

export type DriverTripStage =
  | 'IDLE'
  | 'NAVIGATING_PICKUP'
  | 'CARGO_INSPECTION'
  | 'IN_TRANSIT'
  | 'POD_DELIVERY'
  | 'TRIP_COMPLETED';

interface DriverState {
  isOnline: boolean;
  jobAlert: ShippingOrder | null;
  jobCountdown: number;
  activeTrip: ShippingOrder | null;
  tripStage: DriverTripStage;
  inspectionPhotos: string[];
  podPhoto: string | null;
  receiverSignature: string | null;
  codCollected: number;
  walletBalance: number;
  depositBalance: number;
  todayEarnings: number;
  todayTripsCount: number;

  toggleOnline: () => void;
  triggerJobOffer: (order?: ShippingOrder) => void;
  acceptJobOffer: () => void;
  declineJobOffer: () => void;
  setTripStage: (stage: DriverTripStage) => void;
  addInspectionPhoto: (photoUrl: string) => void;
  setPodPhoto: (photoUrl: string) => void;
  confirmArrivalAtPickup: () => void;
  confirmCargoLoaded: () => void;
  completeTrip: () => void;
  resetTrip: () => void;
}

export const useDriverStore = create<DriverState>((set, get) => {
  const allOrders = orderService.getOrders();
  const sampleTrip = allOrders[0] || null;

  return {
    isOnline: true,
    jobAlert: null,
    jobCountdown: 30,
    activeTrip: sampleTrip,
    tripStage: 'IN_TRANSIT',
    inspectionPhotos: [
      'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=600&q=80',
    ],
    podPhoto: null,
    receiverSignature: null,
    codCollected: 0,
    walletBalance: 3850000,
    depositBalance: 1000000,
    todayEarnings: 865000 * 0.8, // Net 80% (deducted 20% commission)
    todayTripsCount: 3,

    toggleOnline: () => {
      const nextOnline = !get().isOnline;
      set({ isOnline: nextOnline });
      if (nextOnline && !get().activeTrip) {
        // Auto trigger a job offer demonstration after 2 seconds when going online
        setTimeout(() => {
          get().triggerJobOffer();
        }, 2000);
      }
    },

    triggerJobOffer: (customOrder) => {
      const order = customOrder || {
        id: `job_${Date.now()}`,
        code: `MM-${Math.floor(20000 + Math.random() * 80000)}`,
        customerName: 'Nguyễn Thu Hằng',
        customerPhone: '0987654321',
        pickup: {
          address: 'Tòa nhà Landmark 72, Phạm Hùng, Mễ Trì, Nam Từ Liêm, Hà Nội',
          lat: 21.0169,
          lng: 105.7836,
          contactName: 'Chị Hằng',
          contactPhone: '0987654321',
          note: 'Đồ văn phòng đóng thùng carton, tầng 12 sảnh hàng',
        },
        dropoff: {
          address: 'Khu Đô Thị Ecopark, Văn Giang, Hưng Yên',
          lat: 20.9634,
          lng: 105.9328,
          contactName: 'Anh Long',
          contactPhone: '0912345678',
          note: 'Chung cư Rừng Cọ',
        },
        vehicle: {
          id: 'veh_truck_1t',
          name: 'Xe Tải Nhỏ 1 Tấn',
          category: 'TRUCK_1TON',
          tag: 'Xe thùng bạt 3m',
          capacityText: 'Tối đa 1000kg',
          dimensions: '3.0 x 1.6 x 1.7 m',
          baseFare: 250000,
          perKmRate: 20000,
          iconType: 'truck',
        },
        cargo: {
          name: '6 Thùng tài liệu văn phòng, 2 ghế xoay và 1 máy in đa năng',
          weightKg: 220,
          quantity: 9,
          images: [],
        },
        additionalServices: [],
        totalDistanceKm: 22.4,
        estimatedDurationMins: 40,
        baseFee: 250000,
        distanceFee: 448000,
        servicesFee: 60000,
        discountFee: 0,
        totalFee: 758000,
        status: 'Accepted',
        paymentMethod: 'PayOS',
        paymentStatus: 'Paid',
        createdAt: new Date().toISOString(),
      };

      set({ jobAlert: order, jobCountdown: 30 });
    },

    acceptJobOffer: () => {
      const order = get().jobAlert;
      if (order) {
        set({
          activeTrip: order,
          tripStage: 'NAVIGATING_PICKUP',
          jobAlert: null,
        });
      }
    },

    declineJobOffer: () => {
      set({ jobAlert: null });
    },

    setTripStage: (stage) => set({ tripStage: stage }),

    addInspectionPhoto: (photoUrl) =>
      set((s) => ({ inspectionPhotos: [...s.inspectionPhotos, photoUrl] })),

    setPodPhoto: (photoUrl) => set({ podPhoto: photoUrl }),

    confirmArrivalAtPickup: () => {
      set({ tripStage: 'CARGO_INSPECTION' });
    },

    confirmCargoLoaded: () => {
      set({ tripStage: 'IN_TRANSIT' });
    },

    completeTrip: () => {
      const trip = get().activeTrip;
      const netEarnings = trip ? trip.totalFee * 0.8 : 0;
      set((s) => ({
        tripStage: 'TRIP_COMPLETED',
        walletBalance: s.walletBalance + netEarnings,
        todayEarnings: s.todayEarnings + netEarnings,
        todayTripsCount: s.todayTripsCount + 1,
      }));
    },

    resetTrip: () => {
      set({
        activeTrip: null,
        tripStage: 'IDLE',
        inspectionPhotos: [],
        podPhoto: null,
        receiverSignature: null,
      });
    },
  };
});
