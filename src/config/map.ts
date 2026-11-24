/**
 * Bản đồ MapVina: web KHÔNG giữ key MapVina. Style, sprite, font và tile đều đi qua BE (`/public/Map/*`),
 * BE thêm key ở phía máy chủ. Đường đi lấy từ BE (`/account/Route`, `/driver/Route`), không gọi MapVina trực tiếp.
 */
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5133/api').replace(/\/$/, '');

/** `google` = công tắc tắt MapVina, dùng bản đồ Google nhúng như trước. */
export const MAP_PROVIDER: 'mapvina' | 'google' = import.meta.env.VITE_MAP_PROVIDER === 'google' ? 'google' : 'mapvina';

export const MAP_STYLE_URL = `${API_BASE_URL}/public/Map/style`;

/** Tâm mặc định (Hà Nội, khu vực phục vụ) khi chưa có toạ độ nào. */
export const MAP_DEFAULT_CENTER: [number, number] = [105.8542, 21.0285];
