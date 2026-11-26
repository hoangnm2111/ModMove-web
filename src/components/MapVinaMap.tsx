import React, { useEffect, useMemo, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { MAP_DEFAULT_CENTER, MAP_STYLE_URL } from '../config/map';
import { useRoadRoute } from '../hooks/useRoadRoute';
import { decodePolyline } from '../utils/polyline';
import { isValidPoint, type MapViewProps } from './mapTypes';

const COLORS = { from: '#2563eb', to: '#059669', point: '#ea580c' } as const;
const ROUTE_SOURCE = 'modmove-route';
const ROUTE_LAYER = 'modmove-route-line';
/** Quá thời gian này mà style chưa tải xong thì coi là lỗi và dùng bản đồ dự phòng */
const STYLE_TIMEOUT_MS = 10000;
/** Khách vừa tự kéo/phóng to bản đồ: chờ chừng này mới dời tâm về tài xế (`follow`) */
const USER_MOVE_GRACE_MS = 15_000;

const makeMarker = (color: string, label: string): HTMLDivElement => {
  const el = document.createElement('div');
  el.setAttribute('aria-label', label);
  el.style.cssText = `width:18px;height:18px;border-radius:9999px;background:${color};border:3px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.45);`;
  return el;
};

/**
 * Bản đồ MapVina (MapLibre GL). Style/tile/font lấy qua BE nên web không giữ key MapVina.
 * Đường đi thật lấy từ BE; chưa có hoặc lỗi → đường thẳng nét đứt. Lỗi tải style → gọi `onFail` để trang dùng bản dự phòng.
 */
const MapVinaMap: React.FC<MapViewProps & { onFail: () => void }> = ({ from, to, point, routePolyline, follow, zoom = 14, className = 'h-64', title = 'Bản đồ', onFail }) => {
  const box = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const readyRef = useRef(false);
  const markers = useRef<{ from?: maplibregl.Marker; to?: maplibregl.Marker; point?: maplibregl.Marker }>({});
  const lastFitKey = useRef('');
  /** Lúc khách tự kéo/phóng to lần cuối: trong USER_MOVE_GRACE_MS không dời tâm về tài xế */
  const userMovedAt = useRef(0);
  const failRef = useRef(onFail);
  failRef.current = onFail;

  const hasFrom = isValidPoint(from);
  const hasTo = isValidPoint(to);
  const hasPoint = isValidPoint(point);
  const given = routePolyline !== undefined;
  const road = useRoadRoute(given ? null : from, given ? null : to);
  const line = useMemo(() => {
    if (!given) return road.line;
    const decoded = routePolyline ? decodePolyline(routePolyline) : [];
    return decoded.length > 1 ? decoded : null;
  }, [given, routePolyline, road.line]);

  /** Vẽ lại marker, đường đi và khung nhìn theo props hiện tại */
  const apply = useRef(() => {});
  apply.current = () => {
    const map = mapRef.current;
    if (!map || !readyRef.current) return;

    const put = (slot: 'from' | 'to' | 'point', p: { lat: number; lng: number } | null | undefined, color: string, label: string) => {
      const m = markers.current[slot];
      if (!isValidPoint(p)) {
        m?.remove();
        markers.current[slot] = undefined;
        return;
      }
      if (m) m.setLngLat([p.lng, p.lat]);
      else markers.current[slot] = new maplibregl.Marker({ element: makeMarker(color, label) }).setLngLat([p.lng, p.lat]).addTo(map);
    };
    put('from', from, COLORS.from, 'Điểm xuất phát');
    put('to', to, COLORS.to, 'Điểm đến');
    put('point', point, COLORS.point, 'Vị trí');

    // Đường đi: thật nếu có, nếu không thì đường thẳng nét đứt giữa hai điểm
    const coords: [number, number][] = line ?? (hasFrom && hasTo ? [[from!.lng, from!.lat], [to!.lng, to!.lat]] : []);
    const source = map.getSource(ROUTE_SOURCE) as maplibregl.GeoJSONSource | undefined;
    source?.setData({ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: coords } });
    if (map.getLayer(ROUTE_LAYER)) map.setPaintProperty(ROUTE_LAYER, 'line-dasharray', line ? [1, 0] : [2, 2]);

    // Khung nhìn: chỉ căn lại khi tập điểm cố định đổi. `follow`: from/point là tài xế, chỉ `to` là cố định;
    // tài xế ra khỏi khung thì dời tâm theo, giữ mức zoom khách đang xem.
    const pairKey = `${hasFrom ? `${from!.lat},${from!.lng}` : ''}|${hasTo ? `${to!.lat},${to!.lng}` : ''}`;
    const stableKey = follow
      ? `follow|${hasTo ? `${to!.lat},${to!.lng}` : ''}`
      : hasFrom || hasTo
        ? pairKey
        : `only:${hasPoint ? `${point!.lat},${point!.lng}` : ''}`;
    if (stableKey === lastFitKey.current) {
      const moving = follow ? (hasFrom ? from : hasPoint ? point : null) : null;
      if (moving && Date.now() - userMovedAt.current >= USER_MOVE_GRACE_MS && !map.getBounds().contains([moving.lng, moving.lat])) map.easeTo({ center: [moving.lng, moving.lat], duration: 400 });
      return;
    }
    lastFitKey.current = stableKey;

    const pts = [hasFrom ? from : null, hasTo ? to : null, hasPoint ? point : null].filter(isValidPoint);
    if (pts.length === 0) return;
    if (pts.length === 1) {
      map.easeTo({ center: [pts[0].lng, pts[0].lat], zoom, duration: 400 });
      return;
    }
    const b = new maplibregl.LngLatBounds();
    pts.forEach((p) => b.extend([p.lng, p.lat]));
    map.fitBounds(b, { padding: 48, maxZoom: 16, duration: 400 });
  };

  // Tạo bản đồ một lần
  useEffect(() => {
    if (!box.current) return;
    const first = [from, to, point].find(isValidPoint);
    let failed = false;
    const fail = () => {
      if (failed) return;
      failed = true;
      failRef.current();
    };

    let map: maplibregl.Map;
    try {
      map = new maplibregl.Map({
        container: box.current,
        style: MAP_STYLE_URL,
        center: first ? [first.lng, first.lat] : MAP_DEFAULT_CENTER,
        zoom,
        attributionControl: { compact: true },
      });
    } catch {
      fail();
      return;
    }
    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');

    const timer = window.setTimeout(() => {
      if (!readyRef.current) fail();
    }, STYLE_TIMEOUT_MS);

    map.on('load', () => {
      window.clearTimeout(timer);
      readyRef.current = true;
      map.addSource(ROUTE_SOURCE, { type: 'geojson', data: { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: [] } } });
      map.addLayer({
        id: ROUTE_LAYER,
        type: 'line',
        source: ROUTE_SOURCE,
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: { 'line-color': '#2563eb', 'line-width': 5, 'line-opacity': 0.85, 'line-dasharray': [2, 2] },
      });
      apply.current();
    });
    // Chỉ thao tác của khách mới có originalEvent; easeTo/fitBounds của code thì không
    map.on('movestart', (e: { originalEvent?: unknown }) => {
      if (e.originalEvent) userMovedAt.current = Date.now();
    });
    // Lỗi trước khi tải xong style (key sai, BE tắt, mất mạng) → dự phòng. Lỗi tile lẻ sau đó thì bỏ qua.
    map.on('error', () => {
      if (!readyRef.current) fail();
    });

    // Khung chứa đổi kích thước (ngăn kéo mở, đổi cỡ màn hình)
    const ro = new ResizeObserver(() => map.resize());
    ro.observe(box.current);

    return () => {
      window.clearTimeout(timer);
      ro.disconnect();
      Object.values(markers.current).forEach((m) => m?.remove());
      markers.current = {};
      readyRef.current = false;
      lastFitKey.current = '';
      map.remove();
      mapRef.current = null;
    };
    // chỉ tạo một lần; props sau đó cập nhật qua apply()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    apply.current();
  }, [from?.lat, from?.lng, to?.lat, to?.lng, point?.lat, point?.lng, line, follow]);

  return <div ref={box} role="img" aria-label={title} className={`${className} w-full rounded-2xl border border-slate-200 overflow-hidden bg-slate-100`} />;
};

export default MapVinaMap;
