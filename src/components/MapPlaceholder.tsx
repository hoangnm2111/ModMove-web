import React, { useState } from 'react';
import { Navigation, ZoomIn, ZoomOut, Layers, Truck, MapPin } from 'lucide-react';
import { LocationPoint } from '../types/order.types';

interface MapPlaceholderProps {
  pickup?: LocationPoint;
  dropoff?: LocationPoint;
  showActiveDrivers?: boolean;
  className?: string;
}

export const MapPlaceholder: React.FC<MapPlaceholderProps> = ({
  pickup,
  dropoff,
  showActiveDrivers = true,
  className = '',
}) => {
  const [zoom, setZoom] = useState(13);
  const [selectedDriver, setSelectedDriver] = useState<string | null>(null);

  const mockDrivers = [
    { id: 'd1', name: 'Nguyễn Văn Hùng', plate: '29C-874.12', type: 'Xe Tải 1T', x: '58%', y: '48%', status: 'InTransit' },
    { id: 'd2', name: 'Lê Thanh Bình', plate: '29H-512.90', type: 'Bán Tải', x: '42%', y: '35%', status: 'Online' },
    { id: 'd3', name: 'Trần Văn Toàn', plate: '30F-991.44', type: 'Xe Tải 2T', x: '70%', y: '60%', status: 'Arrived' },
  ];

  return (
    <div className={`relative w-full h-full bg-[#E5E9F0] overflow-hidden select-none ${className}`}>
      {/* Background Map Grid & Roads simulation */}
      <svg className="absolute inset-0 w-full h-full opacity-60" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#D8DEE9" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="#EAEFF5" />
        <rect width="100%" height="100%" fill="url(#grid)" />

        {/* Simulated Arterial Highways */}
        <path d="M-100,200 C300,220 500,450 1200,400" fill="none" stroke="#CBD5E1" strokeWidth="18" />
        <path d="M-100,200 C300,220 500,450 1200,400" fill="none" stroke="#FFFFFF" strokeWidth="14" />

        <path d="M400,-100 C450,300 650,600 800,1200" fill="none" stroke="#CBD5E1" strokeWidth="16" />
        <path d="M400,-100 C450,300 650,600 800,1200" fill="none" stroke="#FFFFFF" strokeWidth="12" />

        {/* Route Polyline connecting Pickup and Dropoff */}
        {pickup && dropoff && (
          <>
            <path
              d="M 320,380 C 420,300 520,310 680,240"
              fill="none"
              stroke="#FF5400"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray="8 6"
              className="animate-pulse"
            />
          </>
        )}
      </svg>

      {/* Pickup Location Marker */}
      {pickup && (
        <div
          className="absolute z-20 flex flex-col items-center -translate-x-1/2 -translate-y-full transition-all duration-300"
          style={{ left: '320px', top: '380px' }}
        >
          <div className="bg-emerald-600 text-white text-[11px] font-semibold px-2 py-0.5 rounded-md shadow-md whitespace-nowrap mb-1 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
            Điểm lấy hàng
          </div>
          <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg border-2 border-white ring-4 ring-emerald-500/20">
            <MapPin className="w-4 h-4 fill-current" />
          </div>
        </div>
      )}

      {/* Dropoff Location Marker */}
      {dropoff && (
        <div
          className="absolute z-20 flex flex-col items-center -translate-x-1/2 -translate-y-full transition-all duration-300"
          style={{ left: '680px', top: '240px' }}
        >
          <div className="bg-rose-600 text-white text-[11px] font-semibold px-2 py-0.5 rounded-md shadow-md whitespace-nowrap mb-1 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
            Điểm giao hàng
          </div>
          <div className="w-8 h-8 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-lg border-2 border-white ring-4 ring-rose-500/20">
            <MapPin className="w-4 h-4 fill-current" />
          </div>
        </div>
      )}

      {/* Active Driver Markers */}
      {showActiveDrivers &&
        mockDrivers.map((d) => (
          <div
            key={d.id}
            onClick={() => setSelectedDriver(selectedDriver === d.id ? null : d.id)}
            className="absolute z-30 cursor-pointer -translate-x-1/2 -translate-y-1/2 transition-transform hover:scale-110"
            style={{ left: d.x, top: d.y }}
          >
            <div className="relative">
              <div className="w-9 h-9 rounded-full bg-brand-500 text-white flex items-center justify-center shadow-xl border-2 border-white ring-4 ring-orange-500/30">
                <Truck className="w-4 h-4" />
              </div>
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
            </div>

            {/* Popup Card on click */}
            {selectedDriver === d.id && (
              <div className="absolute bottom-12 -left-20 w-48 bg-white p-2.5 rounded-xl shadow-2xl border border-slate-200 text-xs z-40">
                <div className="font-bold text-slate-800">{d.name}</div>
                <div className="text-slate-500 text-[11px]">{d.plate} • {d.type}</div>
                <div className="mt-1 flex items-center gap-1 text-emerald-600 font-medium text-[10px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Đang trực tuyến • GPS ổn định
                </div>
              </div>
            )}
          </div>
        ))}

      {/* Map Controls */}
      <div className="absolute right-4 bottom-6 z-20 flex flex-col gap-1.5">
        <button
          onClick={() => setZoom((z) => Math.min(z + 1, 18))}
          className="w-9 h-9 bg-white hover:bg-slate-50 text-slate-700 rounded-lg shadow-md border border-slate-200 flex items-center justify-center transition"
          title="Phóng to"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => setZoom((z) => Math.max(z - 1, 8))}
          className="w-9 h-9 bg-white hover:bg-slate-50 text-slate-700 rounded-lg shadow-md border border-slate-200 flex items-center justify-center transition"
          title="Thu nhỏ"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          className="w-9 h-9 bg-white hover:bg-slate-50 text-brand-500 rounded-lg shadow-md border border-slate-200 flex items-center justify-center transition"
          title="Vị trí hiện tại"
        >
          <Navigation className="w-4 h-4" />
        </button>
      </div>

      {/* Map Watermark & Attribution */}
      <div className="absolute left-4 bottom-3 z-10 bg-white/80 backdrop-blur-sm px-2 py-0.5 rounded text-[10px] text-slate-500 border border-slate-200/60 flex items-center gap-1.5">
        <Layers className="w-3 h-3 text-brand-500" />
        ModMove Live Map • Google Maps JS API Engine
      </div>
    </div>
  );
};
