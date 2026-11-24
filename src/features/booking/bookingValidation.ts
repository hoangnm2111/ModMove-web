import { BUSINESS } from '../../config/business';
import { msg } from '../../constants/messages';
import { phone, required, validate } from '../../domain/validators';
import { canVehicleCarry } from '../../domain/vehicleFit';
import { cargoNotes } from '../../domain/booking';
import { BookingDraft, LocationPoint, VehicleType } from '../../types/order.types';

export type StepErrors = Record<string, string>;

const tooLong = (field: string) => msg('MSG03', { field_name: field, constraints: `tối đa ${BUSINESS.MAX_NOTE_LENGTH} ký tự` });

function validatePoint(p: LocationPoint, prefix: 'pickup' | 'dropoff', label: string): StepErrors {
  const e: StepErrors = {};
  // Toạ độ không bắt buộc: backend tự tìm toạ độ bằng MapVina từ chuỗi địa chỉ khi báo giá/tạo đơn
  if (p.address.trim().length < 5) e[`${prefix}.address`] = msg('MSG28', { location_type: label });
  const n = validate(p.contactName, required(prefix === 'pickup' ? 'Tên người gửi' : 'Tên người nhận'));
  if (n) e[`${prefix}.contactName`] = n;
  const ph = phone(prefix === 'pickup' ? 'Số điện thoại người gửi' : 'Số điện thoại người nhận')(p.contactPhone);
  if (ph) e[`${prefix}.contactPhone`] = ph;
  if ((p.note ?? '').trim().length > BUSINESS.MAX_NOTE_LENGTH) e[`${prefix}.note`] = tooLong('Ghi chú');
  return e;
}

/** Bước 1: lộ trình */
export function validateRoute(d: BookingDraft): StepErrors {
  const e = { ...validatePoint(d.pickup, 'pickup', 'điểm lấy hàng'), ...validatePoint(d.dropoff, 'dropoff', 'điểm giao hàng') };
  if (!e['pickup.address'] && !e['dropoff.address'] && d.pickup.address.trim().toLowerCase() === d.dropoff.address.trim().toLowerCase()) {
    e['dropoff.address'] = 'Điểm giao hàng phải khác điểm lấy hàng.';
  }
  return e;
}

/** Bước 2: hàng hoá */
export function validateCargo(d: BookingDraft): StepErrors {
  const e: StepErrors = {};
  const c = d.cargo;
  if (!c.description.trim()) e['cargo.description'] = msg('MSG01', { field_name: 'Mô tả hàng hoá' });
  if (!(c.quantity >= 1)) e['cargo.quantity'] = msg('MSG03', { field_name: 'Số lượng', constraints: 'tối thiểu 1' });
  if (!(c.weightKg > 0)) e['cargo.weightKg'] = msg('MSG03', { field_name: 'Khối lượng', constraints: 'lớn hơn 0 kg' });
  const { lengthCm, widthCm, heightCm } = c.largestItem;
  if (!(lengthCm > 0 && widthCm > 0 && heightCm > 0)) {
    e['cargo.largestItem'] = msg('MSG03', { field_name: 'Kích thước kiện lớn nhất', constraints: 'dài, rộng, cao lớn hơn 0 cm' });
  }
  if ((cargoNotes(c) ?? '').length > BUSINESS.MAX_NOTE_LENGTH) {
    e['cargo.specialNotes'] = msg('MSG03', { field_name: 'Mô tả và ghi chú bốc xếp', constraints: `tổng cộng tối đa ${BUSINESS.MAX_NOTE_LENGTH} ký tự` });
  }
  if (c.photos.length < BUSINESS.MIN_CARGO_PHOTOS) e['cargo.photos'] = msg('MSG44', { evidence_type: 'ít nhất 1 ảnh hàng hoá' });
  if (!d.agreedNoProhibitedCargo) e.agreedNoProhibitedCargo = 'Vui lòng xác nhận cam kết không gửi hàng cấm.';
  return e;
}

/** Bước 3: loại xe */
export function validateVehicle(d: BookingDraft, vehicles: VehicleType[]): StepErrors {
  const v = vehicles.find((x) => x.id === d.vehicleTypeId && x.isActive);
  if (!v) return { vehicle: msg('MSG01', { field_name: 'Loại xe' }) };
  if (!canVehicleCarry(v, d.cargo)) return { vehicle: msg('MSG30') };
  return {};
}

/** Bước 4: xác nhận chính sách */
export function validateConfirm(d: BookingDraft): StepErrors {
  return d.agreedNoProhibitedCargo && d.agreedWarrantyPolicy ? {} : { policy: msg('MSG32') };
}
