import { ApplicationStatus } from '../types/user.types';
import { apiClient, toServiceError } from './api';
import { readStore, ServiceError, subscribeStore, writeStore } from './mock/storage';
import { PagedResult } from './pagination';

/**
 * Driver onboarding & online status – api/driver/onboarding, api/driver/status,
 * api/driver/online-status, api/admin/driver-applications.
 */
export interface DriverApplicationRecord {
  id: string;
  driverId: string;
  version: number;
  fullName: string;
  phoneNumber: string;
  email: string;
  nationalId: string;
  licenseNumber: string;
  licensePhotoUrl: string;
  registrationPhotoUrl: string;
  inspectionPhotoUrl: string;
  vehiclePhotoUrl: string;
  vehicleCategory: string;
  payloadCapacityKg: number;
  boxDimensions: string;
  licensePlate: string;
  submittedAt: string;
  status: ApplicationStatus;
  rejectionReason?: string;
}

export type ApplicationInput = {
  vehicleCategory: string;
  licensePlate: string;
  payloadCapacityKg: number;
  nationalId: string;
  licenseNumber: string;
  licensePhotoUrl: string;
  registrationPhotoUrl: string;
  inspectionPhotoUrl: string;
  vehiclePhotoUrl: string;
};

const MY_STATUS = 'driverOnboardingStatus';
const ADMIN_APPLICATIONS = 'adminDriverApplications';
const DRIVER_STATUS = 'driverStatus';

interface MyStatusDto {
  hasApplication: boolean;
  canSubmit: boolean;
  profileApprovalStatus?: ApplicationStatus;
  applicationId?: number;
  latestVersionNumber?: number;
  submittedAt?: string;
  vehicleTypeId?: number;
  vehicleTypeName?: string;
  licensePlate?: string;
  maxLoadWeightKg?: number;
  citizenIdNumber?: string;
  driverLicenseNumber?: string;
  documentUrls: string[];
  rejectionReasons?: string[];
}

function myStatusToRecord(d: MyStatusDto): DriverApplicationRecord | undefined {
  if (!d.hasApplication) return undefined;
  const [licensePhotoUrl = '', , registrationPhotoUrl = '', inspectionPhotoUrl = '', vehiclePhotoUrl = ''] = d.documentUrls;
  return {
    id: String(d.applicationId ?? ''),
    driverId: '',
    version: d.latestVersionNumber ?? 1,
    fullName: '',
    phoneNumber: '',
    email: '',
    nationalId: d.citizenIdNumber ?? '',
    licenseNumber: d.driverLicenseNumber ?? '',
    licensePhotoUrl,
    registrationPhotoUrl,
    inspectionPhotoUrl,
    vehiclePhotoUrl,
    vehicleCategory: d.vehicleTypeId != null ? String(d.vehicleTypeId) : '',
    payloadCapacityKg: d.maxLoadWeightKg ?? 0,
    boxDimensions: '',
    licensePlate: d.licensePlate ?? '',
    submittedAt: d.submittedAt ?? '',
    status: d.profileApprovalStatus ?? 'Pending',
    rejectionReason: d.rejectionReasons?.join('; '),
  };
}

export interface DriverStatusInfo {
  hasProfile: boolean;
  approvalStatus?: ApplicationStatus;
  isOnline: boolean;
  depositBalance: number;
  earningsBalance: number;
  activeOrderId: string | null;
  canReceiveOrders: boolean;
}

export const driverService = {
  subscribe: (cb: () => void) => {
    const a = subscribeStore(MY_STATUS, cb);
    const b = subscribeStore(ADMIN_APPLICATIONS, cb);
    const c = subscribeStore(DRIVER_STATUS, cb);
    return () => {
      a();
      b();
      c();
    };
  },

  // ----------------------------------------------------------- Tài xế (của tôi)
  getMyStatusSync: (): DriverStatusInfo => readStore(DRIVER_STATUS, () => ({ hasProfile: false, isOnline: false, depositBalance: 0, earningsBalance: 0, activeOrderId: null, canReceiveOrders: false })),

  /** UC-DRV-08: GET /driver/status */
  async loadMyStatus(): Promise<void> {
    try {
      const { data } = await apiClient.get<{
        hasProfile: boolean;
        approvalStatus?: ApplicationStatus;
        isOnline: boolean;
        depositBalance: number;
        earningsBalance: number;
        activeOrderId?: number;
        canReceiveOrders: boolean;
      }>('/driver/status');
      writeStore(DRIVER_STATUS, {
        hasProfile: data.hasProfile,
        approvalStatus: data.approvalStatus,
        isOnline: data.isOnline,
        depositBalance: data.depositBalance,
        earningsBalance: data.earningsBalance,
        activeOrderId: data.activeOrderId != null ? String(data.activeOrderId) : null,
        canReceiveOrders: data.canReceiveOrders,
      });
    } catch {
      /* ignore */
    }
  },

  getLatestSync: (_driverId: string): DriverApplicationRecord | undefined => readStore<DriverApplicationRecord | undefined>(MY_STATUS, () => undefined),
  listVersionsSync: (driverId: string) => {
    const latest = driverService.getLatestSync(driverId);
    return latest ? [latest] : [];
  },

  /** UC-DRV-04: GET /driver/onboarding/status */
  async loadMyApplicationStatus(): Promise<void> {
    try {
      const { data } = await apiClient.get<MyStatusDto>('/driver/Onboarding/status');
      writeStore(MY_STATUS, myStatusToRecord(data));
    } catch {
      /* ignore */
    }
  },

  /** UC-DRV-03/05: POST /driver/onboarding */
  async submitApplication(_driverId: string, input: ApplicationInput): Promise<void> {
    try {
      await apiClient.post('/driver/Onboarding', {
        vehicleTypeId: Number(input.vehicleCategory),
        citizenIdNumber: input.nationalId,
        driverLicenseNumber: input.licenseNumber,
        licensePlate: input.licensePlate,
        maxLoadWeightKg: input.payloadCapacityKg,
        documentUrls: [input.licensePhotoUrl, input.licensePhotoUrl, input.registrationPhotoUrl, input.inspectionPhotoUrl, input.vehiclePhotoUrl],
      });
      await driverService.loadMyApplicationStatus();
    } catch (e) {
      throw toServiceError(e);
    }
  },

  // ----------------------------------------------------------------- Online/Offline
  isOnlineSync: (_driverId: string): boolean => driverService.getMyStatusSync().isOnline,

  /** GB-03: PATCH /driver/online-status */
  async setOnline(_driverId: string, online: boolean): Promise<boolean> {
    try {
      await apiClient.patch('/driver/online-status', { isOnline: online });
      await driverService.loadMyStatus();
      return online;
    } catch (e) {
      throw toServiceError(e);
    }
  },

  // ------------------------------------------------------------------- Admin
  listLatestApplicationsSync: (): DriverApplicationRecord[] => readStore(ADMIN_APPLICATIONS, () => []),

  /** UC-ADM-08: GET /admin/driver-applications/pending */
  async loadPendingApplications(): Promise<void> {
    try {
      const { data } = await apiClient.get<PagedResult<{ applicationId: number; driverProfileId: number; fullName: string; phoneNumber: string; vehicleTypeName: string; licensePlate: string; versionNumber: number; submittedAt: string }>>(
        '/admin/driver-applications/pending',
        { params: { page: 1, pageSize: 50 } }
      );
      const existing = readStore<DriverApplicationRecord[]>(ADMIN_APPLICATIONS, () => []);
      writeStore(
        ADMIN_APPLICATIONS,
        data.items.map((d): DriverApplicationRecord => {
          const prev = existing.find((e) => e.id === String(d.applicationId));
          return {
            ...(prev ?? {
              nationalId: '',
              licenseNumber: '',
              licensePhotoUrl: '',
              registrationPhotoUrl: '',
              inspectionPhotoUrl: '',
              vehiclePhotoUrl: '',
              email: '',
              boxDimensions: '',
              payloadCapacityKg: 0,
            }),
            id: String(d.applicationId),
            driverId: String(d.driverProfileId),
            version: d.versionNumber,
            fullName: d.fullName,
            phoneNumber: d.phoneNumber,
            vehicleCategory: d.vehicleTypeName,
            licensePlate: d.licensePlate,
            submittedAt: d.submittedAt,
            status: 'Pending',
          };
        })
      );
    } catch {
      /* ignore */
    }
  },

  /** UC-ADM-09: GET /admin/driver-applications/{id} – nạp đầy đủ ảnh/kích thước thùng xe khi xem chi tiết */
  async loadApplicationDetail(applicationId: string): Promise<void> {
    try {
      const { data } = await apiClient.get<{
        applicationId: number;
        fullName: string;
        phoneNumber: string;
        email: string;
        citizenIdNumber: string;
        driverLicenseNumber: string;
        vehicleTypeId: number;
        licensePlate: string;
        maxLoadWeightKg: number;
        applicationStatus: ApplicationStatus;
        submittedAt: string;
        documentUrls: string[];
        rejectionReasons?: string[];
      }>(`/admin/driver-applications/${applicationId}`);
      const [licensePhotoUrl = '', , registrationPhotoUrl = '', inspectionPhotoUrl = '', vehiclePhotoUrl = ''] = data.documentUrls;
      const list = readStore<DriverApplicationRecord[]>(ADMIN_APPLICATIONS, () => []);
      const idx = list.findIndex((a) => a.id === applicationId);
      const merged: DriverApplicationRecord = {
        id: String(data.applicationId),
        driverId: idx >= 0 ? list[idx].driverId : '',
        version: idx >= 0 ? list[idx].version : 1,
        fullName: data.fullName,
        phoneNumber: data.phoneNumber,
        email: data.email,
        nationalId: data.citizenIdNumber,
        licenseNumber: data.driverLicenseNumber,
        licensePhotoUrl,
        registrationPhotoUrl,
        inspectionPhotoUrl,
        vehiclePhotoUrl,
        vehicleCategory: String(data.vehicleTypeId),
        payloadCapacityKg: data.maxLoadWeightKg,
        boxDimensions: '',
        licensePlate: data.licensePlate,
        submittedAt: data.submittedAt,
        status: data.applicationStatus,
        rejectionReason: data.rejectionReasons?.join('; '),
      };
      if (idx >= 0) list[idx] = merged;
      else list.push(merged);
      writeStore(ADMIN_APPLICATIONS, list);
    } catch {
      /* ignore */
    }
  },

  /** UC-ADM-09 */
  async approve(appId: string): Promise<void> {
    try {
      await apiClient.post(`/admin/driver-applications/${appId}/approve`);
      await driverService.loadPendingApplications();
    } catch (e) {
      throw toServiceError(e);
    }
  },

  async reject(appId: string, reason: string): Promise<void> {
    if (!reason.trim()) throw new ServiceError('Vui lòng nhập lý do từ chối.');
    try {
      await apiClient.post(`/admin/driver-applications/${appId}/reject`, { reasons: [reason] });
      await driverService.loadPendingApplications();
    } catch (e) {
      throw toServiceError(e);
    }
  },
};
