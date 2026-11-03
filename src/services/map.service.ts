import { haversineKm } from '../domain/geo';
import { latency } from './mock/storage';

/**
 * Adapter bản đồ. Khi tích hợp Google Maps (API-MAP-01/02) chỉ cần thay thân hàm,
 * giữ nguyên chữ ký.
 */
export interface GeoPoint {
  address: string;
  lat: number;
  lng: number;
}

/** Danh sách địa điểm mẫu trong Hà Nội (LI-01) dùng cho gợi ý địa chỉ khi chưa có Places API */
export const SAMPLE_PLACES: GeoPoint[] = [
  { address: 'Số 19 Lê Thanh Nghị, Hai Bà Trưng, Hà Nội', lat: 21.0041, lng: 105.8455 },
  { address: 'Vinhomes Smart City, Tây Mỗ, Nam Từ Liêm, Hà Nội', lat: 20.9998, lng: 105.7346 },
  { address: 'Keangnam Landmark 72, Phạm Hùng, Nam Từ Liêm, Hà Nội', lat: 21.0168, lng: 105.7838 },
  { address: 'Đại học FPT, Khu CNC Hòa Lạc, Thạch Thất, Hà Nội', lat: 21.0131, lng: 105.5268 },
  { address: 'Times City, 458 Minh Khai, Hai Bà Trưng, Hà Nội', lat: 20.9947, lng: 105.8681 },
  { address: 'Ngõ 165 Cầu Giấy, Dịch Vọng, Cầu Giấy, Hà Nội', lat: 21.0333, lng: 105.795 },
  { address: 'Số 88 Nguyễn Trãi, Thanh Xuân, Hà Nội', lat: 21.0025, lng: 105.8155 },
  { address: 'The Matrix One, Lê Quang Đạo, Nam Từ Liêm, Hà Nội', lat: 21.0102, lng: 105.7725 },
  { address: '131 Trần Phú, Hà Đông, Hà Nội', lat: 20.9781, lng: 105.7865 },
  { address: 'Royal City, 72 Nguyễn Trãi, Thanh Xuân, Hà Nội', lat: 21.0024, lng: 105.8152 },
  { address: 'Hồ Hoàn Kiếm, Hàng Trống, Hoàn Kiếm, Hà Nội', lat: 21.0287, lng: 105.8523 },
  { address: 'Ecopark, Văn Giang, Hưng Yên (giáp Hà Nội)', lat: 20.9634, lng: 105.9328 },
];

/** Hệ số quy đổi đường chim bay → đường bộ trong đô thị */
const ROAD_FACTOR = 1.35;
const AVG_SPEED_KMH = 25;

export const mapService = {
  /** API-MAP-01 (mock): gợi ý địa chỉ */
  searchPlaces(query: string): GeoPoint[] {
    const q = query.trim().toLowerCase();
    if (!q) return SAMPLE_PLACES.slice(0, 6);
    return SAMPLE_PLACES.filter((p) => p.address.toLowerCase().includes(q)).slice(0, 6);
  },

  /** API-MAP-02 (mock): quãng đường và thời gian ước tính */
  async estimateRoute(from: GeoPoint, to: GeoPoint): Promise<{ distanceKm: number; durationMins: number }> {
    await latency(150);
    return this.estimateRouteSync(from, to);
  },

  estimateRouteSync(from: { lat: number; lng: number }, to: { lat: number; lng: number }) {
    const distanceKm = Math.max(1, Math.round(haversineKm(from, to) * ROAD_FACTOR * 10) / 10);
    const durationMins = Math.max(5, Math.round((distanceKm / AVG_SPEED_KMH) * 60));
    return { distanceKm, durationMins };
  },
};
