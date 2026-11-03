import { BUSINESS } from '../config/business';
import { Coupon, VehicleType } from '../types/order.types';
import { latency, readStore, ServiceError, uid, writeStore } from './mock/storage';

/**
 * Master data & cấu hình giá – nguồn dữ liệu DUY NHẤT cho Landing, Booking, Admin.
 * API tương lai: GET/PUT /vehicle-types, /coupons, /settings
 */
export interface PlatformSettings {
  commissionRate: number;
  loadingFee: number;
}

const SEED_VEHICLES: VehicleType[] = [
  {
    id: 'vt_pickup_500',
    name: 'Xe bán tải 500kg',
    description: 'Đồ sinh viên, phòng trọ nhỏ, hàng lẻ',
    baseFare: 120_000,
    pricePerKm: 12_000,
    minimumFare: 150_000,
    maxLoadKg: 500,
    cargoBed: { lengthCm: 180, widthCm: 140, heightCm: 120 },
    iconType: 'pickup',
    isActive: true,
  },
  {
    id: 'vt_truck_1t',
    name: 'Xe tải dưới 1 tấn',
    description: 'Chuyển phòng trọ, căn hộ nhỏ, nội thất cơ bản',
    baseFare: 150_000,
    pricePerKm: 16_000,
    minimumFare: 180_000,
    maxLoadKg: 950,
    cargoBed: { lengthCm: 220, widthCm: 140, heightCm: 150 },
    iconType: 'truck',
    isActive: true,
  },
  {
    id: 'vt_truck_2t',
    name: 'Xe tải 1 - 2 tấn',
    description: 'Dọn nhà trọn gói, hàng văn phòng, hàng cồng kềnh',
    baseFare: 250_000,
    pricePerKm: 22_000,
    minimumFare: 280_000,
    maxLoadKg: 2000,
    cargoBed: { lengthCm: 380, widthCm: 170, heightCm: 180 },
    iconType: 'heavy_truck',
    isActive: true,
  },
];

const year = new Date().getFullYear();
const SEED_COUPONS: Coupon[] = [
  {
    id: 'cp_welcome',
    code: 'MODMOVE30',
    discountValue: 30_000,
    minimumOrderValue: 150_000,
    validFrom: `${year}-01-01T00:00:00Z`,
    validTo: `${year + 1}-12-31T23:59:59Z`,
    usageLimit: 1000,
    usedCount: 12,
    isActive: true,
  },
  {
    id: 'cp_vip',
    code: 'VIP50',
    discountValue: 50_000,
    minimumOrderValue: 300_000,
    validFrom: `${year}-01-01T00:00:00Z`,
    validTo: `${year + 1}-12-31T23:59:59Z`,
    usageLimit: 200,
    usedCount: 199,
    isActive: true,
  },
];

const SEED_SETTINGS: PlatformSettings = {
  commissionRate: BUSINESS.DEFAULT_COMMISSION_RATE,
  loadingFee: BUSINESS.DEFAULT_LOADING_FEE,
};

export const CATALOG_KEYS = { vehicles: 'vehicleTypes', coupons: 'coupons', settings: 'settings' } as const;

const vehicles = () => readStore(CATALOG_KEYS.vehicles, () => SEED_VEHICLES);
const coupons = () => readStore(CATALOG_KEYS.coupons, () => SEED_COUPONS);

export const catalogService = {
  /** Đọc đồng bộ – dùng cho render ban đầu */
  getVehicleTypesSync: (): VehicleType[] => vehicles(),
  getSettingsSync: (): PlatformSettings => readStore(CATALOG_KEYS.settings, () => SEED_SETTINGS),
  listCouponsSync: (): Coupon[] => coupons(),

  async listVehicleTypes(activeOnly = false): Promise<VehicleType[]> {
    await latency(100);
    return activeOnly ? vehicles().filter((v) => v.isActive) : vehicles();
  },

  /** UC-ADM-11 / UC-ADM-15 */
  async saveVehicleType(input: Omit<VehicleType, 'id'> & { id?: string }): Promise<VehicleType> {
    await latency();
    const list = vehicles();
    const name = input.name.trim();
    if (!name) throw new ServiceError('Tên loại xe là bắt buộc.');
    if (list.some((v) => v.name.toLowerCase() === name.toLowerCase() && v.id !== input.id)) {
      throw new ServiceError('Tên loại xe này đã được đăng ký.');
    }
    if (input.baseFare < 0 || input.pricePerKm < 0 || input.minimumFare < 0 || input.maxLoadKg <= 0) {
      throw new ServiceError('Giá cước và tải trọng phải là số dương.');
    }
    const saved: VehicleType = { ...input, name, id: input.id ?? uid('vt') };
    writeStore(CATALOG_KEYS.vehicles, input.id ? list.map((v) => (v.id === input.id ? saved : v)) : [...list, saved]);
    return saved;
  },

  /** UC-ADM-16 */
  async setVehicleTypeActive(id: string, isActive: boolean): Promise<void> {
    await latency();
    writeStore(CATALOG_KEYS.vehicles, vehicles().map((v) => (v.id === id ? { ...v, isActive } : v)));
  },

  async listCoupons(): Promise<Coupon[]> {
    await latency(100);
    return coupons();
  },

  findCouponSync: (code: string): Coupon | undefined =>
    coupons().find((c) => c.code.toUpperCase() === code.trim().toUpperCase()),

  async saveCoupon(input: Omit<Coupon, 'id' | 'usedCount'> & { id?: string }): Promise<Coupon> {
    await latency();
    const list = coupons();
    const code = input.code.trim().toUpperCase();
    if (!code) throw new ServiceError('Mã giảm giá là bắt buộc.');
    if (list.some((c) => c.code === code && c.id !== input.id)) throw new ServiceError('Mã giảm giá này đã được đăng ký.');
    if (new Date(input.validTo) <= new Date(input.validFrom)) throw new ServiceError('Ngày kết thúc phải sau ngày bắt đầu.');
    const existing = list.find((c) => c.id === input.id);
    const saved: Coupon = { ...input, code, id: input.id ?? uid('cp'), usedCount: existing?.usedCount ?? 0 };
    writeStore(CATALOG_KEYS.coupons, existing ? list.map((c) => (c.id === saved.id ? saved : c)) : [...list, saved]);
    return saved;
  },

  async setCouponActive(id: string, isActive: boolean): Promise<void> {
    await latency();
    writeStore(CATALOG_KEYS.coupons, coupons().map((c) => (c.id === id ? { ...c, isActive } : c)));
  },

  /** GB-30: tăng lượt dùng khi tạo đơn, không hoàn khi huỷ */
  consumeCoupon(code: string): void {
    writeStore(
      CATALOG_KEYS.coupons,
      coupons().map((c) => (c.code === code.toUpperCase() ? { ...c, usedCount: c.usedCount + 1 } : c))
    );
  },

  /** UC-ADM-13 / GB-33: áp dụng cho đơn nhận sau thời điểm đổi */
  async saveSettings(settings: PlatformSettings): Promise<PlatformSettings> {
    await latency();
    if (settings.commissionRate < 0 || settings.commissionRate > 0.5) {
      throw new ServiceError('Tỷ lệ hoa hồng phải trong khoảng 0% – 50%.');
    }
    if (settings.loadingFee < 0) throw new ServiceError('Phí bốc xếp không được âm.');
    writeStore(CATALOG_KEYS.settings, settings);
    return settings;
  },
};
