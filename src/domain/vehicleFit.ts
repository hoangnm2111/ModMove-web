import { CargoDetail, Dimensions, VehicleType } from '../types/order.types';

const sorted = (d: Dimensions) => [d.lengthCm, d.widthCm, d.heightCm].sort((a, b) => a - b);

/**
 * GB-10: Tổng khối lượng ≤ tải trọng tối đa; kiện lớn nhất phải lọt thùng xe
 * (3 cạnh kiện và 3 cạnh thùng sắp xếp tăng dần, so sánh từng cặp – kiện được xoay).
 */
export function canVehicleCarry(vehicle: Pick<VehicleType, 'maxLoadKg' | 'cargoBed'>, cargo: Pick<CargoDetail, 'weightKg' | 'largestItem'>): boolean {
  if (cargo.weightKg > vehicle.maxLoadKg) return false;
  const item = sorted(cargo.largestItem);
  const bed = sorted(vehicle.cargoBed);
  return item.every((side, i) => side <= bed[i]);
}
