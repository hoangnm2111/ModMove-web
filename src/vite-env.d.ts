/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_SIGNALR_HUB_URL: string;
  readonly VITE_GOOGLE_MAPS_API_KEY: string;
  /** `google` để tắt MapVina và dùng lại bản đồ Google nhúng; mặc định MapVina */
  readonly VITE_MAP_PROVIDER?: string;
  readonly VITE_APP_NAME: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
