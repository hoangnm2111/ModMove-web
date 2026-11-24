import React, { Suspense, lazy, useState } from 'react';
import { MapPinOff } from 'lucide-react';
import { MAP_PROVIDER } from '../config/map';
import { MapEmbed } from './MapEmbed';
import { isValidPoint, type MapViewProps } from './mapTypes';

// maplibre-gl nặng: chỉ tải khi một trang thật sự cần bản đồ
const MapVinaMap = lazy(() => import('./MapVinaMap'));

const hasWebGL = (): boolean => {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
};

/**
 * Bản đồ dùng chung của web: MapVina GL; nếu tắt bằng `VITE_MAP_PROVIDER=google`, trình duyệt không có WebGL,
 * hoặc style MapVina không tải được thì tự dùng bản đồ Google nhúng như trước (không trang nào bị hỏng).
 */
export const MapView: React.FC<MapViewProps> = (props) => {
  const [failed, setFailed] = useState(false);
  const { className = 'h-64', from, to, point } = props;

  const hasCoords = isValidPoint(from) || isValidPoint(to) || isValidPoint(point);
  // Dự phòng Google chỉ khi tắt MapVina, không có WebGL hoặc MapVina lỗi. Địa chỉ chữ chưa có toạ độ thì chờ khách chọn gợi ý
  // (BE tự tìm toạ độ khi báo giá/tạo đơn); không đẩy sang Google chỉ để xem trước.
  if (MAP_PROVIDER === 'google' || failed || !hasWebGL()) return <MapEmbed {...props} />;

  if (!hasCoords)
    return (
      <div className={`${className} w-full rounded-2xl bg-slate-100 border border-slate-200 flex flex-col items-center justify-center text-xs text-slate-400 gap-1`}>
        <MapPinOff className="w-5 h-5" /> Chưa có toạ độ để hiển thị
      </div>
    );

  return (
    <Suspense fallback={<div className={`${className} w-full rounded-2xl bg-slate-100 border border-slate-200 animate-pulse`} />}>
      <MapVinaMap {...props} onFail={() => setFailed(true)} />
    </Suspense>
  );
};
