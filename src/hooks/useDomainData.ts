import { caseService } from '../services/case.service';
import { catalogService } from '../services/catalog.service';
import { subscribeStore } from '../services/mock/storage';
import { CATALOG_KEYS } from '../services/catalog.service';
import { orderService } from '../services/order.service';
import { walletService } from '../services/wallet.service';
import { authService } from '../services/auth.service';
import { useLiveData } from './useLiveData';

const subscribeCatalog = (cb: () => void) => {
  const subs = Object.values(CATALOG_KEYS).map((k) => subscribeStore(k, cb));
  return () => subs.forEach((u) => u());
};

export const useCustomerOrders = (customerId?: string) =>
  useLiveData(() => (customerId ? orderService.listByCustomerSync(customerId) : []), orderService.subscribe, [customerId])[0];

export const useAllOrders = () => useLiveData(orderService.listAllSync, orderService.subscribe)[0];

export const useOrder = (code?: string | null) =>
  useLiveData(() => (code ? orderService.getByCodeSync(code) : undefined), orderService.subscribe, [code])[0];

export const useAvailableJobs = () => useLiveData(orderService.listAvailableJobsSync, orderService.subscribe)[0];

export const useDriverActiveTrip = (driverId?: string) =>
  useLiveData(() => (driverId ? orderService.getActiveTripOfDriverSync(driverId) : undefined), orderService.subscribe, [driverId])[0];

export const useVehicleTypes = () => useLiveData(catalogService.getVehicleTypesSync, subscribeCatalog)[0];
export const usePlatformSettings = () => useLiveData(catalogService.getSettingsSync, subscribeCatalog)[0];
export const useCoupons = () => useLiveData(catalogService.listCouponsSync, subscribeCatalog)[0];

export const useIncidents = () => useLiveData(caseService.listIncidentsSync, caseService.subscribe)[0];
export const useRefunds = () => useLiveData(caseService.listRefundsSync, caseService.subscribe)[0];

export const useDriverWallet = (driverId?: string) =>
  useLiveData(() => walletService.getWalletSync(driverId ?? ''), walletService.subscribe, [driverId])[0];
export const useWithdrawals = () => useLiveData(walletService.listWithdrawalsSync, walletService.subscribe)[0];

export const useUsers = () => useLiveData(authService.listUsersSync, authService.subscribeUsers)[0];
