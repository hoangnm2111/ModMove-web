import React from 'react';
import { MapPin, Truck } from 'lucide-react';

interface RouteMapProps {
  /** 0 = tại điểm lấy, 1 = tại điểm giao; null = chưa có tài xế */
  progress: number | null;
  /** 'toPickup' = tài xế đang tới điểm lấy */
  phase?: 'toPickup' | 'toDropoff';
  className?: string;
}

/**
 * Bản đồ mô phỏng (chưa tích hợp Google Maps – API-MAP-03).
 * Thay bằng component Google Maps giữ nguyên props khi tích hợp.
 */
export const RouteMap: React.FC<RouteMapProps> = ({ progress, phase = 'toDropoff', className = '' }) => {
  const A = { x: 18, y: 72 };
  const B = { x: 82, y: 28 };
  const start = phase === 'toPickup' ? { x: 6, y: 92 } : A;
  const end = phase === 'toPickup' ? A : B;
  const t = Math.min(1, Math.max(0, progress ?? 0));
  const truck = { x: start.x + (end.x - start.x) * t, y: start.y + (end.y - start.y) * t };

  return (
    <div className={`relative w-full h-full min-h-[260px] bg-[#EAEFF5] overflow-hidden ${className}`}>
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
        <defs>
          <pattern id="rm-grid" width="8" height="8" patternUnits="userSpaceOnUse">
            <path d="M 8 0 L 0 0 0 8" fill="none" stroke="#D8DEE9" strokeWidth="0.3" />
          </pattern>
        </defs>
        <rect width="100" height="100" fill="url(#rm-grid)" />
        <line x1={A.x} y1={A.y} x2={B.x} y2={B.y} stroke="#2563eb" strokeWidth="1.2" strokeDasharray="2 1.5" vectorEffect="non-scaling-stroke" />
      </svg>
      <Pin x={A.x} y={A.y} color="text-blue-600" label="Điểm lấy" />
      <Pin x={B.x} y={B.y} color="text-emerald-600" label="Điểm giao" />
      {progress !== null && (
        <div className="absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-1000" style={{ left: `${truck.x}%`, top: `${truck.y}%` }}>
          <div className="w-9 h-9 rounded-full bg-slate-900 text-white flex items-center justify-center shadow-lg ring-4 ring-white">
            <Truck className="w-4 h-4" />
          </div>
        </div>
      )}
      <span className="absolute bottom-2 left-2 text-[10px] font-semibold text-slate-500 bg-white/80 px-2 py-0.5 rounded">Bản đồ mô phỏng</span>
    </div>
  );
};

const Pin: React.FC<{ x: number; y: number; color: string; label: string }> = ({ x, y, color, label }) => (
  <div className="absolute -translate-x-1/2 -translate-y-full flex flex-col items-center" style={{ left: `${x}%`, top: `${y}%` }}>
    <span className="text-[10px] font-bold bg-white px-1.5 py-0.5 rounded shadow mb-0.5 whitespace-nowrap">{label}</span>
    <MapPin className={`w-6 h-6 ${color} fill-white`} />
  </div>
);
