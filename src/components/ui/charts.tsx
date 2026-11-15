/**
 * Biểu đồ nhẹ bằng SVG/HTML (không thêm thư viện). Theo dataviz skill:
 * một series = một màu (brand blue), không trục kép, mark mảnh bo 4px ở đầu dữ liệu,
 * lưới mờ, tooltip khi hover, nhãn chữ dùng màu chữ (không dùng màu series).
 */
import React, { useState } from 'react';

const BAR = '#2563eb';
const BAR_HOVER = '#1d4ed8';

export interface Datum {
  label: string;
  value: number;
  /** Nội dung tooltip đầy đủ */
  tip?: React.ReactNode;
}

const niceMax = (v: number) => {
  if (v <= 0) return 1;
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  const n = v / p;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p;
};

/** Cột dọc theo thời gian – một series */
export const ColumnChart: React.FC<{ data: Datum[]; height?: number; format?: (v: number) => string; emptyText?: string }> = ({
  data,
  height = 200,
  format = (v) => v.toLocaleString('vi-VN'),
  emptyText = 'Chưa có dữ liệu trong kỳ',
}) => {
  const [hover, setHover] = useState<number | null>(null);
  if (data.length === 0 || data.every((d) => d.value === 0))
    return <div className="flex items-center justify-center text-xs text-slate-400" style={{ height }}>{emptyText}</div>;
  const max = niceMax(Math.max(...data.map((d) => d.value)));
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => t * max);
  const labelEvery = Math.ceil(data.length / 10);
  return (
    <div className="relative">
      <div className="flex" style={{ height }}>
        {/* trục y */}
        <div className="flex flex-col-reverse justify-between pr-2 text-[10px] text-slate-400 text-right w-14 flex-shrink-0">
          {ticks.map((t) => (
            <span key={t} className="leading-none">
              {format(t)}
            </span>
          ))}
        </div>
        <div className="relative flex-1">
          {ticks.map((t) => (
            <div key={t} className="absolute left-0 right-0 border-t border-slate-100" style={{ bottom: `${(t / max) * 100}%` }} />
          ))}
          <div className="absolute inset-0 flex items-end" style={{ gap: 2 }}>
            {data.map((d, i) => (
              <div
                key={i}
                className="relative flex-1 h-full flex items-end cursor-default"
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
              >
                <div
                  className="w-full transition-colors"
                  style={{ height: `${Math.max(d.value > 0 ? 1 : 0, (d.value / max) * 100)}%`, background: hover === i ? BAR_HOVER : BAR, borderRadius: '4px 4px 0 0', maxWidth: 40, margin: '0 auto' }}
                />
                {hover === i && (
                  <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 z-10 whitespace-nowrap rounded-lg bg-slate-900 text-white text-[11px] px-2.5 py-1.5 shadow-lg pointer-events-none">
                    <div className="font-bold">{d.label}</div>
                    <div>{d.tip ?? format(d.value)}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="flex ml-14 mt-1" style={{ gap: 2 }}>
        {data.map((d, i) => (
          <span key={i} className="flex-1 text-center text-[10px] text-slate-400 truncate">
            {i % labelEvery === 0 ? d.label : ''}
          </span>
        ))}
      </div>
    </div>
  );
};

/** Thanh ngang xếp hạng – một series, nhãn trực tiếp */
export const BarList: React.FC<{ data: Datum[]; format?: (v: number) => string; emptyText?: string }> = ({ data, format = (v) => v.toLocaleString('vi-VN'), emptyText = 'Chưa có dữ liệu' }) => {
  if (data.length === 0) return <p className="text-xs text-slate-400 py-6 text-center">{emptyText}</p>;
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <ul className="space-y-2.5">
      {data.map((d) => (
        <li key={d.label} className="text-xs" title={typeof d.tip === 'string' ? d.tip : undefined}>
          <div className="flex justify-between gap-2 mb-1">
            <span className="font-semibold text-slate-700 truncate">{d.label}</span>
            <span className="font-black text-slate-900">{format(d.value)}</span>
          </div>
          <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
            <div className="h-full" style={{ width: `${(d.value / max) * 100}%`, background: BAR, borderRadius: 4 }} />
          </div>
          {d.tip && typeof d.tip !== 'string' && <div className="text-[10px] text-slate-400 mt-0.5">{d.tip}</div>}
        </li>
      ))}
    </ul>
  );
};
