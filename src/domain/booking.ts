import { CargoDetail } from '../types/order.types';

/** BE chỉ có một ô ghi chú cho hàng hoá: gộp mô tả và ghi chú bốc xếp (giống app mobile); trống thì gửi null */
export function cargoNotes(cargo: Pick<CargoDetail, 'description' | 'specialNotes'>): string | null {
  const text = [cargo.description.trim(), (cargo.specialNotes ?? '').trim()].filter(Boolean).join(' • ');
  return text || null;
}
