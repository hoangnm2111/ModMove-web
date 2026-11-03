import React from 'react';
import { FareBreakdown, VehicleType } from '../../types/order.types';
import { formatCurrency } from '../../utils/format';

/** UC-GST-13 – Ước tính cước theo GB-29 (không VAT, không phụ phí) */
export const FareSummary: React.FC<{ fare: FareBreakdown | null; vehicle?: VehicleType; couponCode?: string }> = ({ fare, vehicle, couponCode }) => (
  <aside className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 text-sm">
    <h3 className="font-extrabold text-slate-900">Ước tính cước phí</h3>
    {!fare || !vehicle ? (
      <p className="text-xs text-slate-500">Hoàn thành lộ trình và chọn loại xe để xem cước dự kiến.</p>
    ) : (
      <>
        <div className="text-xs text-slate-500">
          {vehicle.name} • {fare.distanceKm} km • ~{fare.durationMins} phút
        </div>
        <dl className="space-y-1.5 text-xs">
          <div className="flex justify-between">
            <dt className="text-slate-500">
              Cước quãng đường
              <span className="block text-[10px]">
                max({formatCurrency(vehicle.minimumFare)}, {formatCurrency(vehicle.baseFare)} + {formatCurrency(vehicle.pricePerKm)} × {fare.distanceKm} km)
              </span>
            </dt>
            <dd className="font-bold">{formatCurrency(fare.distanceFare)}</dd>
          </div>
          {fare.loadingFee > 0 && (
            <div className="flex justify-between">
              <dt className="text-slate-500">Phí bốc xếp</dt>
              <dd className="font-bold">{formatCurrency(fare.loadingFee)}</dd>
            </div>
          )}
          {fare.discount > 0 && (
            <div className="flex justify-between text-emerald-700">
              <dt>Giảm giá {couponCode}</dt>
              <dd className="font-bold">-{formatCurrency(fare.discount)}</dd>
            </div>
          )}
        </dl>
        <div className="flex justify-between items-end pt-2 border-t border-slate-100">
          <span className="text-xs font-bold text-slate-600">Tổng thanh toán</span>
          <span className="text-xl font-black text-slate-900">{formatCurrency(fare.total)}</span>
        </div>
        <p className="text-[10px] text-slate-400">Giá cố định tại thời điểm gửi đơn, không tính lại theo lộ trình thực tế (GB-29).</p>
      </>
    )}
  </aside>
);
