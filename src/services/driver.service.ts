import { msg } from '../constants/messages';
import { DriverApplication } from '../types/user.types';
import { latency, readStore, ServiceError, subscribeStore, uid, writeStore } from './mock/storage';

/**
 * Driver onboarding – SRS DriverApplication: mỗi lần nộp tạo version mới,
 * một version đã quyết định thì không đổi; mỗi tài xế tối đa 1 version Pending.
 */
export interface DriverApplicationRecord extends DriverApplication {
  driverId: string;
}

export type ApplicationInput = Omit<DriverApplication, 'id' | 'version' | 'submittedAt' | 'status' | 'rejectionReason'>;

const KEY = 'driverApplications';
const ONLINE = 'driverOnline';

const photo = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1200&q=80`;
const seed = (): DriverApplicationRecord[] => [
  {
    id: 'app_drv88_v1',
    driverId: 'drv_88',
    version: 1,
    fullName: 'Nguyễn Văn Hùng',
    phoneNumber: '0912345678',
    email: 'driver@modmove.vn',
    nationalId: '001201004567',
    licenseNumber: 'B2-88219482',
    licensePhotoUrl: photo('photo-1589829545856-d10d557cf95f'),
    registrationPhotoUrl: photo('photo-1450133064473-71024230f91b'),
    inspectionPhotoUrl: photo('photo-1601584115197-04ecc0da31d7'),
    vehiclePhotoUrl: photo('photo-1519003722824-194d4455a60c'),
    vehicleCategory: 'vt_truck_1t',
    payloadCapacityKg: 950,
    boxDimensions: '2.2 x 1.4 x 1.5 m',
    licensePlate: '29C-874.12',
    submittedAt: '2026-10-20T08:00:00Z',
    status: 'Approved',
  },
  {
    id: 'app_thinh_v1',
    driverId: 'drv_51',
    version: 1,
    fullName: 'Vũ Đức Thịnh',
    phoneNumber: '0971234567',
    email: 'thinhvu@gmail.com',
    nationalId: '001201009988',
    licenseNumber: 'B2-99120482',
    licensePhotoUrl: photo('photo-1554224155-8d04cb21cd6c'),
    registrationPhotoUrl: photo('photo-1450133064473-71024230f91b'),
    inspectionPhotoUrl: photo('photo-1601584115197-04ecc0da31d7'),
    vehiclePhotoUrl: photo('photo-1519003722824-194d4455a60c'),
    vehicleCategory: 'vt_truck_2t',
    payloadCapacityKg: 1950,
    boxDimensions: '3.8 x 1.7 x 1.8 m',
    licensePlate: '29C-998.54',
    submittedAt: new Date(Date.now() - 86_400_000).toISOString(),
    status: 'Pending',
  },
  {
    id: 'app_nam_v1',
    driverId: 'drv_52',
    version: 1,
    fullName: 'Hoàng Hải Nam',
    phoneNumber: '0988112233',
    email: 'namhoang@gmail.com',
    nationalId: '001202008899',
    licenseNumber: 'C-10294812',
    licensePhotoUrl: photo('photo-1589829545856-d10d557cf95f'),
    registrationPhotoUrl: photo('photo-1554224155-8d04cb21cd6c'),
    inspectionPhotoUrl: photo('photo-1450133064473-71024230f91b'),
    vehiclePhotoUrl: photo('photo-1601584115197-04ecc0da31d7'),
    vehicleCategory: 'vt_pickup_500',
    payloadCapacityKg: 500,
    boxDimensions: '1.8 x 1.4 x 1.2 m',
    licensePlate: '30F-441.20',
    submittedAt: new Date(Date.now() - 3 * 86_400_000).toISOString(),
    status: 'Rejected',
    rejectionReason: 'Ảnh sổ đăng kiểm bị mờ góc tem kiểm định.',
  },
];

const apps = () => readStore(KEY, seed);

function latestOf(driverId: string): DriverApplicationRecord | undefined {
  return apps()
    .filter((a) => a.driverId === driverId)
    .sort((a, b) => b.version - a.version)[0];
}

function decide(appId: string, patch: Partial<DriverApplicationRecord>): DriverApplicationRecord {
  const list = apps();
  const app = list.find((a) => a.id === appId);
  if (!app || app.status !== 'Pending') throw new ServiceError(msg('MSG07')); // version đã quyết định là bất biến
  const next = { ...app, ...patch };
  writeStore(KEY, list.map((a) => (a.id === appId ? next : a)));
  return next;
}

export const driverService = {
  subscribe: (cb: () => void) => {
    const a = subscribeStore(KEY, cb);
    const b = subscribeStore(ONLINE, cb);
    return () => {
      a();
      b();
    };
  },

  /** UC-ADM-08: chỉ version mới nhất của mỗi tài xế */
  listLatestApplicationsSync: (): DriverApplicationRecord[] => {
    const byDriver = new Map<string, DriverApplicationRecord>();
    apps().forEach((a) => {
      const cur = byDriver.get(a.driverId);
      if (!cur || a.version > cur.version) byDriver.set(a.driverId, a);
    });
    return [...byDriver.values()].sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
  },

  listVersionsSync: (driverId: string) => apps().filter((a) => a.driverId === driverId).sort((a, b) => b.version - a.version),

  /** UC-DRV-04 */
  getLatestSync: (driverId: string) => latestOf(driverId),

  /** UC-DRV-03 / UC-DRV-05 / GB-04 */
  async submitApplication(driverId: string, input: ApplicationInput): Promise<DriverApplicationRecord> {
    await latency(600);
    const required: [keyof ApplicationInput, string][] = [
      ['nationalId', 'Số CCCD'],
      ['licenseNumber', 'Số GPLX'],
      ['licensePlate', 'Biển số xe'],
      ['licensePhotoUrl', 'Ảnh GPLX'],
      ['registrationPhotoUrl', 'Ảnh đăng ký xe'],
      ['inspectionPhotoUrl', 'Ảnh đăng kiểm'],
      ['vehiclePhotoUrl', 'Ảnh xe'],
    ];
    for (const [k, label] of required) {
      if (!String(input[k] ?? '').trim()) throw new ServiceError(msg('MSG44', { evidence_type: label }));
    }
    if (!/^\d{12}$/.test(input.nationalId)) throw new ServiceError(msg('MSG02', { field_name: 'số CCCD (12 chữ số)' }));
    const others = apps().filter((a) => a.driverId !== driverId);
    if (others.some((a) => a.nationalId === input.nationalId)) throw new ServiceError(msg('MSG18', { field_name: 'Số CCCD' }));
    if (others.some((a) => a.licenseNumber === input.licenseNumber)) throw new ServiceError(msg('MSG18', { field_name: 'Số GPLX' }));
    if (others.some((a) => a.licensePlate.toUpperCase() === input.licensePlate.toUpperCase())) throw new ServiceError(msg('MSG18', { field_name: 'Biển số xe' }));
    const latest = latestOf(driverId);
    if (latest?.status === 'Pending') throw new ServiceError('Hồ sơ đang chờ duyệt, không thể nộp thêm phiên bản mới.');
    const app: DriverApplicationRecord = {
      ...input,
      id: uid('app'),
      driverId,
      version: (latest?.version ?? 0) + 1,
      submittedAt: new Date().toISOString(),
      status: 'Pending',
    };
    writeStore(KEY, [...apps(), app]);
    // Hồ sơ mới chờ duyệt → không được Online
    this.setOnlineUnsafe(driverId, false);
    return app;
  },

  /** UC-ADM-09 */
  async approve(appId: string): Promise<DriverApplicationRecord> {
    await latency();
    return decide(appId, { status: 'Approved', rejectionReason: undefined });
  },

  async reject(appId: string, reason: string): Promise<DriverApplicationRecord> {
    await latency();
    if (!reason.trim()) throw new ServiceError(msg('MSG01', { field_name: 'Lý do từ chối' }));
    return decide(appId, { status: 'Rejected', rejectionReason: reason });
  },

  // --------------------------------------------------------- Online/Offline
  isOnlineSync: (driverId: string): boolean => Boolean(readStore<Record<string, boolean>>(ONLINE, () => ({ drv_88: false }))[driverId]),

  setOnlineUnsafe(driverId: string, online: boolean) {
    writeStore(ONLINE, { ...readStore<Record<string, boolean>>(ONLINE, () => ({})), [driverId]: online });
  },

  /** GB-03: chỉ Online khi hồ sơ Approved */
  async setOnline(driverId: string, online: boolean): Promise<boolean> {
    await latency(150);
    if (online && latestOf(driverId)?.status !== 'Approved') throw new ServiceError(msg('MSG25'));
    this.setOnlineUnsafe(driverId, online);
    return online;
  },
};
