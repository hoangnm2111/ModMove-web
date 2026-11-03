import { Coupon, FareBreakdown, VehicleType } from '../types/order.types';
import { msg } from '../constants/messages';

export interface FareInput {
  vehicle: Pick<VehicleType, 'baseFare' | 'pricePerKm' | 'minimumFare'>;
  distanceKm: number;
  durationMins: number;
  loadingService: boolean;
  loadingFee: number;
  discount?: number;
}

/**
 * GB-29: Total = max(MinimumFare, BaseFare + PricePerKm × km) + LOADING_FEE (nếu chọn) − coupon, không âm.
 * Không có phụ phí giờ cao điểm / hàng cồng kềnh, không có VAT.
 */
export function calculateFare(input: FareInput): FareBreakdown {
  const { vehicle, distanceKm, durationMins, loadingService, loadingFee } = input;
  const distanceFare = Math.max(vehicle.minimumFare, Math.round(vehicle.baseFare + vehicle.pricePerKm * distanceKm));
  const loading = loadingService ? loadingFee : 0;
  const gross = distanceFare + loading;
  // GB-21: giảm giá không vượt quá cước
  const discount = Math.min(input.discount ?? 0, gross);
  return {
    distanceKm,
    durationMins,
    distanceFare,
    loadingFee: loading,
    discount,
    total: Math.max(0, gross - discount),
  };
}

/** GB-14: Hoa hồng = rate × tổng cước sau coupon, làm tròn đến đồng */
export function calculateCommission(totalAfterCoupon: number, rate: number): number {
  return Math.round(totalAfterCoupon * rate);
}

export function calculateDriverEarning(totalAfterCoupon: number, rate: number): number {
  return totalAfterCoupon - calculateCommission(totalAfterCoupon, rate);
}

export type CouponCheck = { ok: true; discount: number } | { ok: false; error: string };

/** GB-21: còn hạn, đạt giá trị tối thiểu, còn lượt dùng; giảm không vượt quá cước */
export function validateCoupon(coupon: Coupon | undefined, orderValue: number, now = new Date()): CouponCheck {
  const fail = (reason: string): CouponCheck => ({ ok: false, error: msg('MSG31', { reason }) });
  if (!coupon || !coupon.isActive) return fail('mã không tồn tại hoặc đã ngừng áp dụng');
  if (now < new Date(coupon.validFrom) || now > new Date(coupon.validTo)) return fail('mã đã hết hạn hoặc chưa đến thời gian áp dụng');
  if (coupon.usedCount >= coupon.usageLimit) return fail('mã đã hết lượt sử dụng');
  if (orderValue < coupon.minimumOrderValue) {
    return fail(`đơn tối thiểu ${coupon.minimumOrderValue.toLocaleString('vi-VN')} đ`);
  }
  return { ok: true, discount: Math.min(coupon.discountValue, orderValue) };
}
