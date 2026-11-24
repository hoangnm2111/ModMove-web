import { createEmptyDraft } from '../store/useBookingDraftStore';
import { BookingDraft, VehicleType } from '../types/order.types';

/** Xe van 500 kg, thùng 170 × 120 × 120 cm (dài × rộng × cao) */
export const van: VehicleType = {
  id: '1',
  name: 'Xe van 500kg',
  description: '',
  baseFare: 50_000,
  pricePerKm: 10_000,
  minimumFare: 80_000,
  maxLoadKg: 500,
  cargoBed: { lengthCm: 170, widthCm: 120, heightCm: 120 },
  iconType: 'pickup',
  isActive: true,
};

/** Bản nháp đã điền đủ và hợp lệ ở cả 4 bước */
export function filledDraft(patch: Partial<BookingDraft> = {}): BookingDraft {
  const d = createEmptyDraft();
  return {
    ...d,
    pickup: { address: '12 Nguyễn Huệ, Hoàn Kiếm', lat: 0, lng: 0, contactName: 'Chị Hoa', contactPhone: '0987654321', note: 'Cửa hầm B1' },
    dropoff: { address: '45 Cầu Giấy, Hà Nội', lat: 0, lng: 0, contactName: 'Anh Nam', contactPhone: '+84 912 345 678', note: '' },
    cargo: {
      ...d.cargo,
      description: 'Tủ lạnh',
      specialNotes: 'Dễ vỡ',
      quantity: 1,
      weightKg: 20,
      largestItem: { lengthCm: 40, widthCm: 30, heightCm: 30 },
      photos: ['https://res.cloudinary.com/demo/a.jpg'],
    },
    vehicleTypeId: '1',
    agreedNoProhibitedCargo: true,
    agreedWarrantyPolicy: true,
    paymentMethod: 'Cash',
    payerRole: 'Sender',
    ...patch,
  };
}
