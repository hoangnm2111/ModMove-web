import React, { useEffect, useRef, useState } from 'react';
import { MapPinOff } from 'lucide-react';

type LatLng = { lat: number; lng: number };

/** Theo tài xế trên bản Google dự phòng: đổi iframe tối đa một lần mỗi khoảng này (bằng nhịp REST tracking) */
export const FOLLOW_REFRESH_MS = 60_000;

/**
 * Bản đồ Google nhúng (iframe, không cần API key) để hiển thị toạ độ thật từ backend.
 * - `route`: chỉ đường từ `from` tới `to`
 * - `point`: một điểm (vị trí tài xế…)
 */
export const MapEmbed: React.FC<{
  from?: LatLng | null;
  to?: LatLng | null;
  point?: LatLng | null;
  /** Địa chỉ dạng chữ (khi chưa có toạ độ, VD lúc khách đang đặt đơn) */
  fromText?: string;
  toText?: string;
  zoom?: number;
  className?: string;
  title?: string;
  /** Theo tài xế: `from`/`point` đổi liên tục, xem `FOLLOW_REFRESH_MS` */
  follow?: boolean;
}> = ({ from, to, point, fromText, toText, zoom = 14, className = 'h-64', title = 'Bản đồ', follow }) => {
  const ok = (p?: LatLng | null): p is LatLng => !!p && Number.isFinite(p.lat) && Number.isFinite(p.lng) && !(p.lat === 0 && p.lng === 0);
  const enc = (s: string) => encodeURIComponent(s.trim());
  const ft = fromText?.trim();
  const tt = toText?.trim();
  let src: string | null = null;
  if (ok(from) && ok(to)) src = `https://maps.google.com/maps?saddr=${from.lat},${from.lng}&daddr=${to.lat},${to.lng}&output=embed`;
  else if (ft && tt) src = `https://maps.google.com/maps?saddr=${enc(ft)}&daddr=${enc(tt)}&output=embed`;
  else if (ft || tt) src = `https://maps.google.com/maps?q=${enc((ft || tt)!)}&z=${zoom}&output=embed`;
  else if (ok(point)) src = `https://maps.google.com/maps?q=${point.lat},${point.lng}&z=${zoom}&output=embed`;
  else if (ok(to)) src = `https://maps.google.com/maps?q=${to.lat},${to.lng}&z=${zoom}&output=embed`;

  // shortcut: Google dự phòng chỉ đổi iframe (tải lại cả bản đồ) tối đa 60 giây/lần khi theo tài xế; cần mượt hơn thì dùng MapVina GL.
  const toKey = ok(to) ? `${to.lat},${to.lng}` : '';
  const [shown, setShown] = useState(src);
  const lastAt = useRef(Date.now());
  const lastTo = useRef(toKey);
  useEffect(() => {
    if (src === shown) return;
    const show = () => {
      setShown(src);
      lastAt.current = Date.now();
      lastTo.current = toKey;
    };
    const wait = follow && toKey === lastTo.current ? lastAt.current + FOLLOW_REFRESH_MS - Date.now() : 0;
    if (wait <= 0) return show();
    const timer = window.setTimeout(show, wait);
    return () => window.clearTimeout(timer);
  }, [src, shown, follow, toKey]);

  if (!shown)
    return (
      <div className={`${className} w-full rounded-2xl bg-slate-100 border border-slate-200 flex flex-col items-center justify-center text-xs text-slate-400 gap-1`}>
        <MapPinOff className="w-5 h-5" /> Chưa có toạ độ để hiển thị
      </div>
    );
  return <iframe title={title} src={shown} className={`${className} w-full rounded-2xl border border-slate-200`} loading="lazy" referrerPolicy="no-referrer-when-downgrade" />;
};

/** Link mở Google Maps ngoài tab mới */
export const mapsLink = (lat: number, lng: number) => `https://www.google.com/maps?q=${lat},${lng}`;
