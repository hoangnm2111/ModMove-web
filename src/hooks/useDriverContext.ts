import { useMemo } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { driverService } from '../services/driver.service';
import { useLiveData } from './useLiveData';
import { useDriverActiveTrip, useDriverWallet } from './useDomainData';
import { AssignedDriver } from '../types/order.types';
import { ApplicationStatus } from '../types/user.types';

/**
 * Gom dữ liệu của tài xế đang đăng nhập: hồ sơ, trạng thái Online, ví, chuyến đang chạy.
 */
export function useDriverContext() {
  const user = useAuthStore((s) => s.user);
  const driverId = user?.id ?? '';
  const [application] = useLiveData(() => driverService.getLatestSync(driverId), driverService.subscribe, [driverId]);
  const [isOnline] = useLiveData(() => driverService.isOnlineSync(driverId), driverService.subscribe, [driverId]);
  const wallet = useDriverWallet(driverId);
  const activeTrip = useDriverActiveTrip(driverId);

  /** Thông tin gắn vào đơn khi nhận (snapshot) */
  const asAssigned: AssignedDriver | null = useMemo(
    () =>
      user
        ? {
            id: user.id,
            name: user.fullName,
            phone: user.phoneNumber,
            avatar: user.avatarUrl ?? '',
            rating: 4.9,
            licensePlate: application?.licensePlate ?? '',
            currentLat: 21.0285,
            currentLng: 105.8542,
            lastLocationAt: new Date().toISOString(),
          }
        : null,
    [user, application]
  );

  return {
    user,
    driverId,
    application,
    approvalStatus: (application?.status ?? 'Draft') as ApplicationStatus | 'Draft',
    isApproved: application?.status === 'Approved',
    isOnline,
    wallet,
    activeTrip,
    asAssigned,
  };
}
