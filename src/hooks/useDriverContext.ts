import { useMemo } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useLiveData } from './useLiveData';
import { useMyDriverStatus } from './useDomainData';
import { driverService } from '../services/driver.service';
import { AssignedDriver, ShippingOrder } from '../types/order.types';
import { ApplicationStatus } from '../types/user.types';
import { WalletTransaction } from '../types/case.types';

/**
 * Gom dữ liệu của tài xế đang đăng nhập: hồ sơ (api/driver/onboarding/status),
 * trạng thái Online/ví (api/driver/status).
 */
export function useDriverContext() {
  const user = useAuthStore((s) => s.user);
  const driverId = user?.id ?? '';
  const [application] = useLiveData(() => driverService.getLatestSync(driverId), driverService.subscribe, [driverId], () => driverService.loadMyApplicationStatus());
  const status = useMyDriverStatus();
  const wallet = { driverId, depositBalance: status.depositBalance, earningsBalance: status.earningsBalance, bankName: undefined as string | undefined, bankAccount: undefined as string | undefined, transactions: [] as WalletTransaction[] };

  /** Thông tin gắn vào đơn khi nhận (snapshot) */
  const asAssigned: AssignedDriver | null = useMemo(
    () =>
      user
        ? {
            id: user.id,
            name: user.fullName,
            phone: user.phoneNumber,
            avatar: user.avatarUrl ?? '',
            rating: 0,
            licensePlate: application?.licensePlate ?? '',
            currentLat: 0,
            currentLng: 0,
            lastLocationAt: new Date().toISOString(),
          }
        : null,
    [user, application]
  );

  return {
    user,
    driverId,
    application,
    approvalStatus: (status.approvalStatus ?? (status.hasProfile ? 'Pending' : 'Draft')) as ApplicationStatus | 'Draft',
    isApproved: status.approvalStatus === 'Approved',
    isOnline: status.isOnline,
    wallet,
    activeTrip: undefined as ShippingOrder | undefined,
    asAssigned,
  };
}
