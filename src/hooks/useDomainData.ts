import { useAuthStore } from '../store/useAuthStore';
import { caseService } from '../services/case.service';
import { catalogService, CATALOG_KEYS, CUSTOMER_COUPONS_KEY } from '../services/catalog.service';
import { subscribeStore } from '../services/mock/storage';
import { orderService } from '../services/order.service';
import { driverService } from '../services/driver.service';
import { walletService } from '../services/wallet.service';
import { authService } from '../services/auth.service';
import { useLiveData } from './useLiveData';

const subscribeCatalog = (cb: () => void) => {
  const subs = Object.values(CATALOG_KEYS).map((k) => subscribeStore(k, cb));
  return () => subs.forEach((u) => u());
};

// ----------------------------------------------------------------- Orders
export const useCustomerOrders = (customerId?: string) =>
  useLiveData(() => (customerId ? orderService.listByCustomerSync(customerId) : []), orderService.subscribe, [customerId], () => orderService.loadMyOrders())[0];

/** Chỉ dùng cho Dispatcher (api/dispatcher/orders) */
export const useAllOrders = () => useLiveData(orderService.listAllSync, orderService.subscribe, [], () => orderService.loadAllOrders())[0];

export const useOrder = (code?: string | null) => useLiveData(() => (code ? orderService.getByCodeSync(code) : undefined), orderService.subscribe, [code])[0];

export const useAvailableJobs = () => useLiveData(orderService.listAvailableJobsSync, orderService.subscribe, [], () => orderService.loadAvailableJobs())[0];

// ---------------------------------------------------------------- Catalog
export const useVehicleTypes = () => useLiveData(catalogService.getVehicleTypesSync, subscribeCatalog, [], () => catalogService.loadVehicleTypes())[0];
export const useAdminVehicleTypes = () => useLiveData(catalogService.getAdminVehicleTypesSync, subscribeCatalog, [], () => catalogService.loadPricing())[0];
/** GET /admin/Pricing chỉ dành cho Administrator; role khác dùng giá trị cache/mặc định (phí thật lấy từ FareEstimate.serviceFee) */
export const usePlatformSettings = () =>
  useLiveData(catalogService.getSettingsSync, subscribeCatalog, [], () =>
    useAuthStore.getState().activeRole === 'Administrator' ? catalogService.loadPricing() : Promise.resolve()
  )[0];
export const useCoupons = () => useLiveData(catalogService.listCouponsSync, subscribeCatalog, [], () => catalogService.loadCoupons())[0];
export const usePolicies = () => useLiveData(catalogService.listPoliciesSync, subscribeCatalog, [], () => catalogService.loadPolicies())[0];
export const useServiceInfo = () => useLiveData(catalogService.listServiceInfoSync, subscribeCatalog, [], () => catalogService.loadServiceInfo())[0];
export const useCargoTypes = () => useLiveData(catalogService.listCargoTypesSync, subscribeCatalog, [], () => catalogService.loadLookups())[0];
export const useComplaintReasons = () => useLiveData(catalogService.listComplaintReasonsSync, subscribeCatalog, [], () => catalogService.loadLookups())[0];
export const useCancellationReasons = () => useLiveData(catalogService.listCancellationReasonsSync, subscribeCatalog, [], () => catalogService.loadLookups())[0];

// ------------------------------------------------------- Incidents / Refunds
/** Customer: sự cố trên đơn của mình */
export const useIncidents = () => useLiveData(caseService.listIncidentsSync, caseService.subscribe, [], () => caseService.loadMyIncidents())[0];
/** Customer: hoàn tiền trên đơn của mình */
export const useRefunds = () => useLiveData(caseService.listRefundsSync, caseService.subscribe, [], () => caseService.loadMyRefunds())[0];
/** Dispatcher: hàng đợi khiếu nại */
export const useDispatcherComplaints = () => useLiveData(caseService.listDispatcherComplaintsSync, caseService.subscribe, [], () => caseService.loadDispatcherComplaints())[0];
/** Dispatcher: hàng đợi sự cố */
export const useDispatcherIncidents = () => useLiveData(caseService.listIncidentsDispatcherSync, caseService.subscribe, [], () => caseService.loadDispatcherIncidents())[0];
/** Admin: hoàn tiền chờ duyệt / đã xử lý */
export const useAdminRefunds = () => useLiveData(caseService.listAdminRefundsSync, caseService.subscribe, [], () => caseService.loadAdminRefunds())[0];

// -------------------------------------------------------------------- Wallet
export const useWithdrawals = () => useLiveData(walletService.listWithdrawalsSync, walletService.subscribe, [], () => walletService.loadWithdrawals())[0];

// -------------------------------------------------------------------- Driver
export const useMyDriverStatus = () => useLiveData(driverService.getMyStatusSync, driverService.subscribe, [], () => driverService.loadMyStatus())[0];

// --------------------------------------------------------------------- Users
export const useUsers = () => useLiveData(authService.listUsersSync, authService.subscribeUsers, [], () => authService.loadUsers())[0];

// ---------------------------------------------------------------- Customer Coupons
export const useCustomerCoupons = () =>
  useLiveData(catalogService.listCustomerCouponsSync, (cb) => subscribeStore(CUSTOMER_COUPONS_KEY, cb), [], () => catalogService.loadCustomerCoupons())[0];

// ---------------------------------------------------------------- Online Drivers
export const useOnlineDrivers = () =>
  useLiveData(orderService.listOnlineDriversSync, orderService.subscribeOnlineDrivers, [], () => orderService.loadOnlineDrivers())[0];

// ------------------------------------------------------------- Dispatcher Summary
export const useDispatcherSummary = () =>
  useLiveData(orderService.getDispatcherSummarySync, orderService.subscribeDispatcherSummary, [], () => orderService.loadDispatcherSummary())[0];

// --------------------------------------------------------------- Handled Cases
export const useHandledCases = () =>
  useLiveData(orderService.listHandledCasesSync, orderService.subscribeHandledCases, [], () => orderService.loadHandledCases())[0];
