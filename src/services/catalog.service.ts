import { Coupon, VehicleType } from '../types/order.types';
import { apiClient, toServiceError } from './api';
import { readStore, ServiceError, writeStore } from './mock/storage';
import { PagedResult } from './pagination';

/** Catalog & cấu hình giá – api/public/vehicletypes, api/public/policies, api/public/serviceinfo, api/public/lookups/*, api/admin/pricing, api/admin/coupons. */
export interface PlatformSettings {
  commissionRate: number;
  loadingFee: number;
  requiredDeposit: number;
  matchingRadiusKm: number;
}

export interface LookupItem {
  code: string;
  name: string;
  description?: string;
}

export const CATALOG_KEYS = {
  vehicles: 'vehicleTypes',
  adminVehicles: 'adminVehicleTypes',
  coupons: 'coupons',
  settings: 'settings',
  policies: 'policies',
  serviceInfo: 'serviceInfo',
  cargoTypes: 'cargoTypes',
  complaintReasons: 'complaintReasons',
  cancellationReasons: 'cancellationReasons',
} as const;

export const CUSTOMER_COUPONS_KEY = 'customerCoupons';

const DEFAULT_SETTINGS: PlatformSettings = { commissionRate: 0.1, loadingFee: 100_000, requiredDeposit: 200_000, matchingRadiusKm: 5 };

const iconFor = (maxLoadKg: number): VehicleType['iconType'] => (maxLoadKg <= 600 ? 'pickup' : maxLoadKg <= 1200 ? 'truck' : 'heavy_truck');

interface VehicleTypeDto {
  id: number;
  name: string;
  maxLoadWeightKg: number;
  cargoBedLengthCm: number;
  cargoBedWidthCm: number;
  cargoBedHeightCm: number;
  baseFare: number;
  pricePerKm: number;
  minimumFare: number;
}

const toVehicleType = (v: VehicleTypeDto, isActive = true): VehicleType => ({
  id: String(v.id),
  name: v.name,
  description: '',
  baseFare: v.baseFare,
  pricePerKm: v.pricePerKm,
  minimumFare: v.minimumFare,
  maxLoadKg: v.maxLoadWeightKg,
  cargoBed: { lengthCm: v.cargoBedLengthCm, widthCm: v.cargoBedWidthCm, heightCm: v.cargoBedHeightCm },
  iconType: iconFor(v.maxLoadWeightKg),
  isActive,
});

interface CouponDto {
  id: number;
  discountCode: string;
  discountValue: number;
  minimumOrderValue: number;
  validFrom: string;
  expiresAt: string;
  usageLimit: number | null;
  usedCount: number;
  isActive: boolean;
}

const toCoupon = (c: CouponDto): Coupon => ({
  id: String(c.id),
  code: c.discountCode,
  discountValue: c.discountValue,
  minimumOrderValue: c.minimumOrderValue,
  validFrom: c.validFrom,
  validTo: c.expiresAt,
  usageLimit: c.usageLimit ?? 0,
  usedCount: c.usedCount,
  isActive: c.isActive,
});

export interface CustomerCoupon {
  code: string;
  discountValue: number;
  minimumOrderValue: number;
  expiresAt: string;
  remainingUses: number | null;
}

function toCustomerCoupon(c: { discountCode: string; discountValue: number; minimumOrderValue: number; expiresAt: string; remainingUses?: number | null }): CustomerCoupon {
  return { code: c.discountCode, discountValue: c.discountValue, minimumOrderValue: c.minimumOrderValue, expiresAt: c.expiresAt, remainingUses: c.remainingUses ?? null };
}

export const catalogService = {
  // ------------------------------------------------------- Khách (public)
  getVehicleTypesSync: (): VehicleType[] => readStore(CATALOG_KEYS.vehicles, () => []),
  async loadVehicleTypes(): Promise<void> {
    try {
      const { data } = await apiClient.get<VehicleTypeDto[]>('/public/VehicleTypes');
      writeStore(CATALOG_KEYS.vehicles, data.map((v) => toVehicleType(v, true)));
    } catch {
      /* giữ cache cũ nếu lỗi mạng */
    }
  },

  getSettingsSync: (): PlatformSettings => readStore(CATALOG_KEYS.settings, () => DEFAULT_SETTINGS),

  listPoliciesSync: (): LookupItem[] => readStore(CATALOG_KEYS.policies, () => []),
  async loadPolicies(): Promise<void> {
    try {
      const { data } = await apiClient.get<LookupItem[]>('/public/Policies');
      writeStore(CATALOG_KEYS.policies, data);
    } catch {
      /* ignore */
    }
  },

  listServiceInfoSync: (): LookupItem[] => readStore(CATALOG_KEYS.serviceInfo, () => []),
  async loadServiceInfo(): Promise<void> {
    try {
      const { data } = await apiClient.get<LookupItem[]>('/public/ServiceInfo');
      writeStore(CATALOG_KEYS.serviceInfo, data);
    } catch {
      /* ignore */
    }
  },

  listCargoTypesSync: (): LookupItem[] => readStore(CATALOG_KEYS.cargoTypes, () => []),
  listComplaintReasonsSync: (): LookupItem[] => readStore(CATALOG_KEYS.complaintReasons, () => []),
  listCancellationReasonsSync: (): LookupItem[] => readStore(CATALOG_KEYS.cancellationReasons, () => []),

  async loadLookups(): Promise<void> {
    try {
      const [cargo, complaint, cancellation] = await Promise.all([
        apiClient.get<LookupItem[]>('/public/Lookups/cargo-types'),
        apiClient.get<LookupItem[]>('/public/Lookups/complaint-reasons'),
        apiClient.get<LookupItem[]>('/public/Lookups/cancellation-reasons'),
      ]);
      writeStore(CATALOG_KEYS.cargoTypes, cargo.data);
      writeStore(CATALOG_KEYS.complaintReasons, complaint.data);
      writeStore(CATALOG_KEYS.cancellationReasons, cancellation.data);
    } catch {
      /* ignore */
    }
  },

  // -------------------------------------------------------------- Admin
  getAdminVehicleTypesSync: (): VehicleType[] => readStore(CATALOG_KEYS.adminVehicles, () => []),

  /** UC-ADM-10: GET /admin/pricing – mọi loại xe (kể cả đang tắt) + cấu hình nền tảng */
  async loadPricing(): Promise<void> {
    try {
      const { data } = await apiClient.get<{
        vehicleTypes: (VehicleTypeDto & { isActive: boolean })[];
        settings: PlatformSettings;
      }>('/admin/Pricing');
      writeStore(CATALOG_KEYS.adminVehicles, data.vehicleTypes.map((v) => toVehicleType(v, v.isActive)));
      writeStore(CATALOG_KEYS.settings, data.settings);
    } catch {
      /* ignore */
    }
  },

  /** UC-ADM-11 */
  async updateVehicleTypeFares(id: string, fares: { baseFare: number; pricePerKm: number; minimumFare: number }): Promise<void> {
    try {
      await apiClient.put(`/admin/Pricing/vehicletypes/${id}`, fares);
      await catalogService.loadPricing();
    } catch (e) {
      throw toServiceError(e);
    }
  },

  /** UC-ADM-11 */
  async setVehicleTypeActive(id: string, isActive: boolean): Promise<void> {
    try {
      await apiClient.patch(`/admin/Pricing/vehicletypes/${id}/status`, { isActive });
      await Promise.all([catalogService.loadPricing(), catalogService.loadVehicleTypes()]);
    } catch (e) {
      throw toServiceError(e);
    }
  },

  /** UC-ADM-13 / DECISIONS C8 */
  async saveSettings(settings: Partial<PlatformSettings>): Promise<void> {
    try {
      await apiClient.put('/admin/Pricing/settings', settings);
      await catalogService.loadPricing();
    } catch (e) {
      throw toServiceError(e);
    }
  },

  // ------------------------------------------------------------ Coupons
  listCouponsSync: (): Coupon[] => readStore(CATALOG_KEYS.coupons, () => []),

  /** UC-ADM-18: GET /admin/coupons */
  async loadCoupons(): Promise<void> {
    try {
      const { data } = await apiClient.get<PagedResult<CouponDto>>('/admin/Coupons', { params: { page: 1, pageSize: 50 } });
      writeStore(CATALOG_KEYS.coupons, data.items.map(toCoupon));
    } catch {
      /* ignore */
    }
  },

  findCouponSync: (code: string): Coupon | undefined => readStore<Coupon[]>(CATALOG_KEYS.coupons, () => []).find((c) => c.code.toUpperCase() === code.trim().toUpperCase()),

  /** UC-ADM-18 (GB-21): chỉ hỗ trợ tạo mới, backend chưa có API sửa coupon đã tạo */
  async createCoupon(input: Omit<Coupon, 'id' | 'usedCount'>): Promise<void> {
    const code = input.code.trim().toUpperCase();
    if (!code) throw new ServiceError('Mã giảm giá là bắt buộc.');
    try {
      await apiClient.post('/admin/Coupons', {
        discountCode: code,
        discountValue: input.discountValue,
        minimumOrderValue: input.minimumOrderValue,
        validFrom: input.validFrom,
        expiresAt: input.validTo,
        usageLimit: input.usageLimit || null,
      });
      await catalogService.loadCoupons();
    } catch (e) {
      throw toServiceError(e);
    }
  },

  async setCouponActive(id: string, isActive: boolean): Promise<void> {
    try {
      await apiClient.patch(`/admin/Coupons/${id}/status`, { isActive });
      await catalogService.loadCoupons();
    } catch (e) {
      throw toServiceError(e);
    }
  },

  // -------------------------------------------------- Customer Coupons
  listCustomerCouponsSync: (): CustomerCoupon[] => readStore(CUSTOMER_COUPONS_KEY, () => []),

  /** UC-GST-14: GET /customer/Coupons – mã giảm giá khả dụng cho đơn mới */
  async loadCustomerCoupons(): Promise<void> {
    try {
      const { data } = await apiClient.get<{ items: { discountCode: string; discountValue: number; minimumOrderValue: number; expiresAt: string; remainingUses?: number | null }[]; totalCount: number }>('/customer/Coupons', { params: { page: 1, pageSize: 20 } });
      writeStore(CUSTOMER_COUPONS_KEY, data.items.map(toCustomerCoupon));
    } catch {
      /* ignore – customer coupons là tính năng gợi ý, không block UI */
    }
  },
};
