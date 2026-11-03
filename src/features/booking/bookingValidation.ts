import { BUSINESS } from '../../config/business';
import { msg } from '../../constants/messages';
import { phone, required, validate } from '../../domain/validators';
import { canVehicleCarry } from '../../domain/vehicleFit';
import { BookingDraft, LocationPoint, VehicleType } from '../../types/order.types';

export type StepErrors = Record<string, string>;

function validatePoint(p: LocationPoint, prefix: 'pickup' | 'dropoff', label: string): StepErrors {
  const e: StepErrors = {};
  if (!p.address.trim() || !p.lat || !p.lng) e[`${prefix}.address`] = msg('MSG28', { location_type: label });
  const n = validate(p.contactName, required(prefix === 'pickup' ? 'Tên người gửi' : 'Tên người nhận'));
  if (n) e[`${prefix}.contactName`] = n;
  const ph = phone(prefix === 'pickup' ? 'Số điện thoại người gửi' : 'Số điện thoại người nhận')(p.contactPhone);
  if (ph) e[`${prefix}.contactPhone`] = ph;
  return e;
}

/** Bước 1 – UC-GST-07/08/09, GB-05 */
export function validateRoute(d: BookingDraft): StepErrors {
  const e = { ...validatePoint(d.pickup, 'pickup', 'điểm lấy hàng'), ...validatePoint(d.dropoff, 'dropoff', 'điểm giao hàng') };
  if (!e['pickup.address'] && !e['dropoff.address'] && d.pickup.address.trim() === d.dropoff.address.trim()) {
    e['dropoff.address'] = 'Điểm giao phải khác điểm lấy hàng.';
  }
  return e;
}

/** Bước 2 – UC-GST-10, GB-06, GB-07 */
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
  if (c.photos.length < BUSINESS.MIN_CARGO_PHOTOS) e['cargo.photos'] = msg('MSG44', { evidence_type: 'ít nhất 1 ảnh hàng hoá' });
  if (!d.agreedNoProhibitedCargo) e.agreedNoProhibitedCargo = 'Vui lòng xác nhận cam kết không gửi hàng cấm (GB-07).';
  return e;
}

/** Bước 3 – UC-GST-11, GB-10 */
export function validateVehicle(d: BookingDraft, vehicles: VehicleType[]): StepErrors {
  const v = vehicles.find((x) => x.id === d.vehicleTypeId && x.isActive);
  if (!v) return { vehicle: msg('MSG01', { field_name: 'Loại xe' }) };
  if (!canVehicleCarry(v, d.cargo)) return { vehicle: msg('MSG30') };
  return {};
}

/** Bước 4 – UC-GST-16 */
export function validateConfirm(d: BookingDraft): StepErrors {
  return d.agreedNoProhibitedCargo && d.agreedWarrantyPolicy ? {} : { policy: msg('MSG32') };
}
