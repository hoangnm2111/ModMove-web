import { create } from 'zustand';
import { BookingDraft, CargoDetail, LocationPoint } from '../types/order.types';
import { readStore, removeStore, writeStore } from '../services/mock/storage';

/**
 * Bản nháp đặt xe. Khách chưa đăng nhập vẫn điền được, nháp giữ lại tới khi đăng nhập để gửi.
 * Nháp chỉ nằm trong trình duyệt: quá 24 giờ thì bỏ, đăng xuất thì xoá.
 * Khi mở lại nháp cũ, mã giảm giá và các ô đồng ý chính sách được bỏ trống để khách xác nhận lại.
 */
const KEY = 'bookingDraft';
export const DRAFT_TTL_MS = 24 * 60 * 60 * 1000;

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

/** Khách đã nhập gì đó đáng giữ lại chưa */
export function hasDraftContent(d: BookingDraft): boolean {
  const point = (p: LocationPoint) => Boolean(p.address.trim() || p.contactName.trim() || p.contactPhone.trim() || p.note?.trim());
  const c = d.cargo;
  return point(d.pickup) || point(d.dropoff) || Boolean(c.description.trim() || c.specialNotes?.trim() || c.photos.length || c.weightKg) || Boolean(d.vehicleTypeId);
}

interface Saved {
  draft: BookingDraft;
  step: number;
  savedAt?: number;
}

/** Đọc nháp đã lưu: bỏ nếu quá hạn hoặc trống; bỏ mã giảm giá và cờ đồng ý chính sách */
function restore(now = Date.now()): Saved | null {
  const saved = readStore<Saved | null>(KEY, () => null);
  if (!saved?.draft || !saved.savedAt || now - saved.savedAt > DRAFT_TTL_MS || !hasDraftContent(saved.draft)) {
    removeStore(KEY);
    return null;
  }
  const empty = createEmptyDraft();
  const draft: BookingDraft = {
    ...empty,
    ...saved.draft,
    pickup: { ...empty.pickup, ...saved.draft.pickup },
    dropoff: { ...empty.dropoff, ...saved.draft.dropoff },
    cargo: { ...empty.cargo, ...saved.draft.cargo },
    couponCode: '',
    agreedNoProhibitedCargo: false,
    agreedWarrantyPolicy: false,
  };
  return { draft, step: saved.step || 1, savedAt: saved.savedAt };
}

interface DraftState {
  draft: BookingDraft;
  step: number;
  /** Có nháp cũ được mở lại khi tải trang: trang đặt xe hỏi "Tiếp tục / Bắt đầu lại" */
  restored: boolean;
  setStep: (step: number) => void;
  update: (patch: Partial<BookingDraft>) => void;
  setPickup: (p: Partial<LocationPoint>) => void;
  setDropoff: (p: Partial<LocationPoint>) => void;
  setCargo: (c: Partial<CargoDetail>) => void;
  /** Khách chọn tiếp tục nháp cũ */
  keepRestored: () => void;
  /** Bắt đầu lại, sau khi gửi đơn hoặc khi đăng xuất */
  reset: () => void;
}

const initial = restore();

export const useBookingDraftStore = create<DraftState>((set) => ({
  draft: initial?.draft ?? createEmptyDraft(),
  step: initial?.step ?? 1,
  restored: Boolean(initial),
  setStep: (step) => set({ step }),
  update: (patch) => set((s) => ({ draft: { ...s.draft, ...patch } })),
  setPickup: (p) => set((s) => ({ draft: { ...s.draft, pickup: { ...s.draft.pickup, ...p } } })),
  setDropoff: (p) => set((s) => ({ draft: { ...s.draft, dropoff: { ...s.draft.dropoff, ...p } } })),
  setCargo: (c) => set((s) => ({ draft: { ...s.draft, cargo: { ...s.draft.cargo, ...c } } })),
  keepRestored: () => set({ restored: false }),
  reset: () => set({ draft: createEmptyDraft(), step: 1, restored: false }),
}));

// Lưu nháp khi nội dung đổi (không phát sự kiện để tránh render thừa). Nháp trống thì xoá hẳn.
useBookingDraftStore.subscribe((s, prev) => {
  if (s.draft === prev.draft && s.step === prev.step) return;
  if (!hasDraftContent(s.draft)) {
    removeStore(KEY);
    return;
  }
  writeStore(KEY, { draft: s.draft, step: s.step, savedAt: Date.now() }, false);
});

/** Đăng xuất: bỏ nháp của phiên trước */
export function clearBookingDraft() {
  useBookingDraftStore.getState().reset();
  removeStore(KEY);
}
