import React from 'react';
import { FareBreakdown, VehicleType } from '../../types/order.types';
import { formatCurrency, formatCurrencyCeil1000, formatDistanceCeil } from '../../utils/format';

/** UC-GST-13 – Ước tính cước theo GB-29 (không VAT, không phụ phí) */
export const FareSummary: React.FC<{ fare: FareBreakdown | null; vehicle?: VehicleType; couponCode?: string }> = ({ fare, vehicle, couponCode }) => (
  <aside className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 text-sm">
    <h3 className="font-extrabold text-slate-900">Ước tính cước phí</h3>
    {!fare || !vehicle ? (
      <p className="text-xs text-slate-500">Hoàn thành lộ trình và chọn loại xe để xem cước dự kiến.</p>
    ) : (
      <>
        <div className="text-xs text-slate-500">
          {vehicle.name} • {formatDistanceCeil(fare.distanceKm)} • ~{fare.durationMins} phút
        </div>
        <dl className="space-y-1.5 text-xs">
          <div className="flex justify-between">
            <dt className="text-slate-500">
              Phí vận chuyển
              <span className="block text-[10px]">
                max({formatCurrency(vehicle.minimumFare)}, {formatCurrency(vehicle.baseFare)} + {formatCurrency(vehicle.pricePerKm)} × {formatDistanceCeil(fare.distanceKm)})
              </span>
            </dt>
            <dd className="font-bold">{formatCurrencyCeil1000(fare.distanceFare)}</dd>
          </div>
          {fare.loadingFee > 0 && (
            <div className="flex justify-between">
              <dt className="text-slate-500">Phí bốc xếp</dt>
              <dd className="font-bold">{formatCurrencyCeil1000(fare.loadingFee)}</dd>
            </div>
          )}
          {fare.discount > 0 && (
            <div className="flex justify-between text-emerald-700">
              <dt>Giảm giá {couponCode}</dt>
              <dd className="font-bold">-{formatCurrencyCeil1000(fare.discount)}</dd>
            </div>
          )}
        </dl>
        <div className="flex justify-between items-end pt-2 border-t border-slate-100">
          <span className="text-xs font-bold text-slate-600">Tổng thanh toán</span>
          <span className="text-xl font-black text-slate-900">{formatCurrencyCeil1000(fare.total)}</span>
        </div>
      </>
    )}
  </aside>
);
