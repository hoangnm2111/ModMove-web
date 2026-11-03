/**
 * Barrel cho service layer.
 * Import các service có side-effect (đăng ký handler hoàn tiền / quyết toán ví) ngay khi khởi động.
 */
export { apiClient } from './api';
export { authService } from './auth.service';
export { catalogService } from './catalog.service';
export { mapService } from './map.service';
export { orderService } from './order.service';
export { caseService } from './case.service';
export { walletService } from './wallet.service';
export { driverService } from './driver.service';
export { errorMessage, ServiceError } from './mock/storage';
