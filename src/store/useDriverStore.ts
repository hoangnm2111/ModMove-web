import { create } from 'zustand';

/**
 * Trạng thái UI riêng của tài xế (không phải dữ liệu nghiệp vụ).
 * Dữ liệu đơn/ví/hồ sơ lấy qua useDriverContext → services.
 */
interface DriverUiState {
  /** Đơn đã từ chối trong phiên này (job alert không hiện lại) */
  dismissedJobIds: string[];
  dismissJob: (id: string) => void;
}

export const useDriverStore = create<DriverUiState>((set) => ({
  dismissedJobIds: [],
  dismissJob: (id) => set((s) => ({ dismissedJobIds: [...s.dismissedJobIds, id] })),
}));
