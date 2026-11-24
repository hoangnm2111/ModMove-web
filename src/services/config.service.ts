import { create } from 'zustand';
import { applyPublicConfig, PublicConfig } from '../config/business';
import { apiClient } from './api';

/**
 * Số liệu thật từ BE (`GET /public/Config`): phí bốc xếp, tiền cọc tài xế, bán kính ghép đơn và các giới hạn nghiệp vụ.
 * Chưa tải được thì `config` là null: giao diện KHÔNG hiện số tiền thay vì hiện một số tự đoán.
 */
interface ConfigState {
  config: PublicConfig | null;
  loadConfig: () => Promise<void>;
}

export const usePublicConfigStore = create<ConfigState>((set) => ({
  config: null,
  loadConfig: async () => {
    try {
      const { data } = await apiClient.get<PublicConfig>('/public/Config');
      applyPublicConfig(data);
      set({ config: data });
    } catch {
      /* giữ giới hạn dự phòng; thử lại ở lần tải trang sau */
    }
  },
}));

export const usePublicConfig = () => usePublicConfigStore((s) => s.config);
