import { catalogService, CATALOG_KEYS } from '../services/catalog.service';
import { subscribeStore } from '../services/mock/storage';
import { useLiveData } from './useLiveData';

const subscribeCatalog = (cb: () => void) => {
  const subs = Object.values(CATALOG_KEYS).map((k) => subscribeStore(k, cb));
  return () => subs.forEach((u) => u());
};

// Danh mục dùng chung (landing, đặt xe): đọc từ cache dịch vụ và tự tải lại khi danh mục đổi.
export const useVehicleTypes = () => useLiveData(catalogService.getVehicleTypesSync, subscribeCatalog, [], () => catalogService.loadVehicleTypes())[0];
/** GET /admin/Pricing chỉ dành cho Administrator; role khác dùng giá trị cache/mặc định (phí thật lấy từ FareEstimate.serviceFee) */
export const usePolicies = () => useLiveData(catalogService.listPoliciesSync, subscribeCatalog, [], () => catalogService.loadPolicies())[0];
export const useServiceInfo = () => useLiveData(catalogService.listServiceInfoSync, subscribeCatalog, [], () => catalogService.loadServiceInfo())[0];
export const useCargoTypes = () => useLiveData(catalogService.listCargoTypesSync, subscribeCatalog, [], () => catalogService.loadLookups())[0];
