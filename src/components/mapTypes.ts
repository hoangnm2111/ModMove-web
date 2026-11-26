export type LatLng = { lat: number; lng: number };

/** Cùng props với `MapEmbed` cũ để thay tại chỗ, không đổi nghiệp vụ ở các trang. */
export interface MapViewProps {
  /** Điểm xuất phát (xanh dương) */
  from?: LatLng | null;
  /** Điểm đến (xanh lá) */
  to?: LatLng | null;
  /** Một điểm riêng, VD vị trí tài xế (cam) */
  point?: LatLng | null;
  /** Địa chỉ chữ khi chưa có toạ độ (chỉ bản đồ Google dự phòng dùng được) */
  fromText?: string;
  toText?: string;
  /**
   * Đường đi đã có sẵn (polyline 5 chữ số, ví dụ từ báo giá): bản đồ dùng luôn, không hỏi BE nữa.
   * null = đã biết là không có hình dạng (vẽ đường thẳng). Bỏ trống = bản đồ tự hỏi đường đi.
   */
  routePolyline?: string | null;
  /** `from`/`point` là tài xế đang chạy: chỉ căn khung khi `to` đổi, tài xế ra khỏi khung thì dời tâm, giữ mức zoom của khách. */
  follow?: boolean;
  zoom?: number;
  className?: string;
  title?: string;
}

export const isValidPoint = (p?: LatLng | null): p is LatLng =>
  !!p && Number.isFinite(p.lat) && Number.isFinite(p.lng) && !(p.lat === 0 && p.lng === 0);
