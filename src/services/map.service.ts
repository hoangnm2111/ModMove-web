import { haversineKm } from '../domain/geo';

/**
 * Gợi ý địa chỉ (API-MAP-01) cho ô nhập địa chỉ.
 *
 * Backend chưa có endpoint gợi ý địa chỉ (IMapService chỉ có Geocode + Route, dùng MapVina khi báo giá/tạo đơn).
 * Gọi MapVina trực tiếp từ trình duyệt sẽ lộ key có hạn mức của BE, nên FE dùng Photon (OpenStreetMap, miễn phí,
 * không cần key, cho phép CORS) chỉ để GỢI Ý. Toạ độ/quãng đường tính giá vẫn do backend (MapVina) quyết định.
 */
export interface GeoPoint {
  address: string;
  lat: number;
  lng: number;
}

const PHOTON_URL = 'https://photon.komoot.io/api/';
/** Khung lãnh thổ Việt Nam: minLon,minLat,maxLon,maxLat */
const VN_BBOX = '102.1,8.2,109.5,23.4';

interface PhotonFeature {
  geometry: { coordinates: [number, number] };
  properties: Record<string, string | undefined>;
}

/**
 * Ghép nhãn địa chỉ kiểu Việt Nam: tên địa điểm, số nhà + đường, phường, quận/thành phố, tỉnh.
 * Không đưa `locality` (VD "Khu công nghệ cao …") vì backend geocode lại chuỗi này bằng MapVina và cụm đó
 * làm MapVina khớp nhầm điểm khác (đã đo: lệch TB 0,62 km → 0,26 km khi bỏ).
 */
const labelOf = (p: PhotonFeature['properties']) => {
  const street = p.housenumber && p.street ? `${p.housenumber} ${p.street}` : p.street;
  const parts = [p.name && p.name !== p.street ? p.name : undefined, street, p.district, p.city ?? p.county, p.state];
  return [...new Set(parts.filter(Boolean) as string[])].join(', ');
};

let bias: { lat: number; lng: number } | null = null;
/** Ưu tiên gợi ý gần vị trí người dùng (nếu trình duyệt cho phép) – gọi một lần, không chặn UI */
export const primeLocationBias = () => {
  if (bias || !navigator.geolocation) return;
  navigator.geolocation.getCurrentPosition(
    (p) => (bias = { lat: p.coords.latitude, lng: p.coords.longitude }),
    () => undefined,
    { timeout: 4000, maximumAge: 600_000 }
  );
};

export const mapService = {
  /** Gợi ý địa chỉ thật (Photon/OSM) trong lãnh thổ Việt Nam */
  async searchPlaces(query: string, signal?: AbortSignal): Promise<GeoPoint[]> {
    const q = query.trim();
    if (q.length < 3) return [];
    // lang=default: trả tên gốc tiếng Việt (nếu không, trình duyệt gửi Accept-Language en-US → tên tiếng Anh)
    const params = new URLSearchParams({ q, limit: '6', bbox: VN_BBOX, lang: 'default' });
    if (bias) {
      params.set('lat', String(bias.lat));
      params.set('lon', String(bias.lng));
    }
    const res = await fetch(`${PHOTON_URL}?${params}`, { signal });
    if (!res.ok) throw new Error(`Photon ${res.status}`);
    const data = (await res.json()) as { features: PhotonFeature[] };
    const seen = new Set<string>();
    return data.features
      .map((f) => ({ address: labelOf(f.properties), lng: f.geometry.coordinates[0], lat: f.geometry.coordinates[1] }))
      .filter((p) => p.address && !seen.has(p.address) && seen.add(p.address));
  },

  /** Ước lượng nhanh (chim bay × hệ số đô thị) – chỉ dùng hiển thị tham khảo, không dùng tính giá */
  estimateRouteSync(from: { lat: number; lng: number }, to: { lat: number; lng: number }) {
    const distanceKm = Math.max(1, Math.round(haversineKm(from, to) * 1.35 * 10) / 10);
    const durationMins = Math.max(5, Math.round((distanceKm / 25) * 60));
    return { distanceKm, durationMins };
  },
};
