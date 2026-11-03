import { create } from 'zustand';
import { BookingDraft, CargoDetail, LocationPoint } from '../types/order.types';
import { readStore, writeStore } from '../services/mock/storage';

/**
 * Bản nháp đặt xe (UC-GST-06 → UC-GST-16).
 * GB-28: Guest được điền nháp; nháp được giữ lại tới khi đăng nhập/đăng ký.
 */
const KEY = 'bookingDraft';

const emptyPoint = (): LocationPoint => ({ address: '', lat: 0, lng: 0, contactName: '', contactPhone: '', note: '' });

export const createEmptyDraft = (): BookingDraft => ({
  pickup: emptyPoint(),
  dropoff: emptyPoint(),
  cargo: {
    type: 'Furniture',
    description: '',
    quantity: 1,
    weightKg: 0,
    largestItem: { lengthCm: 0, widthCm: 0, heightCm: 0 },
    photos: [],
    specialNotes: '',
  },
  vehicleTypeId: null,
  loadingService: false,
  couponCode: '',
  paymentMethod: 'PayOS',
  payerRole: 'Sender',
  agreedNoProhibitedCargo: false,
  agreedWarrantyPolicy: false,
});

interface DraftState {
  draft: BookingDraft;
  step: number;
  setStep: (step: number) => void;
  update: (patch: Partial<BookingDraft>) => void;
  setPickup: (p: Partial<LocationPoint>) => void;
  setDropoff: (p: Partial<LocationPoint>) => void;
  setCargo: (c: Partial<CargoDetail>) => void;
  reset: () => void;
}

const persisted = readStore<{ draft: BookingDraft; step: number }>(KEY, () => ({ draft: createEmptyDraft(), step: 1 }));

export const useBookingDraftStore = create<DraftState>((set) => ({
  draft: persisted.draft,
  step: persisted.step,
  setStep: (step) => set({ step }),
  update: (patch) => set((s) => ({ draft: { ...s.draft, ...patch } })),
  setPickup: (p) => set((s) => ({ draft: { ...s.draft, pickup: { ...s.draft.pickup, ...p } } })),
  setDropoff: (p) => set((s) => ({ draft: { ...s.draft, dropoff: { ...s.draft.dropoff, ...p } } })),
  setCargo: (c) => set((s) => ({ draft: { ...s.draft, cargo: { ...s.draft.cargo, ...c } } })),
  reset: () => set({ draft: createEmptyDraft(), step: 1 }),
}));

// Lưu nháp mỗi khi thay đổi (không phát sự kiện để tránh render thừa)
useBookingDraftStore.subscribe((s) => writeStore(KEY, { draft: s.draft, step: s.step }, false));
