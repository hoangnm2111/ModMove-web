/**
 * Giải mã polyline kiểu Google (BE trả 5 chữ số thập phân, cùng định dạng MapVina Directions).
 * Trả về mảng [lng, lat] đúng thứ tự của GeoJSON/MapLibre.
 */
export function decodePolyline(encoded: string, precision = 5): [number, number][] {
  const factor = 10 ** precision;
  const out: [number, number][] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  const readValue = (): number | null => {
    let result = 0;
    let shift = 0;
    let byte: number;
    do {
      if (index >= encoded.length) return null; // chuỗi bị cắt giữa chừng
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    return result & 1 ? ~(result >> 1) : result >> 1;
  };

  while (index < encoded.length) {
    const dLat = readValue();
    const dLng = dLat === null ? null : readValue();
    if (dLat === null || dLng === null) break;
    lat += dLat;
    lng += dLng;
    out.push([lng / factor, lat / factor]);
  }
  return out;
}
