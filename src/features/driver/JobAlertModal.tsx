import React, { useEffect } from 'react';
import { useDriverStore } from '../../store/useDriverStore';
import { Truck, MapPin, DollarSign, Clock, Check, X, AlertCircle } from 'lucide-react';
import { formatCurrency, formatDistance } from '../../utils/format';
import { Button } from '../../components/Button';

export const JobAlertModal: React.FC = () => {
  const { jobAlert, jobCountdown, acceptJobOffer, declineJobOffer } = useDriverStore();

  useEffect(() => {
    if (!jobAlert) return;
    const timer = setInterval(() => {
      useDriverStore.setState((s) => {
        if (s.jobCountdown <= 1) {
          clearInterval(timer);
          return { jobAlert: null, jobCountdown: 30 };
        }
        return { jobCountdown: s.jobCountdown - 1 };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [jobAlert]);

  if (!jobAlert) return null;

  const netEarnings = Math.round(jobAlert.totalFee * 0.8);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border-2 border-brand-500 animate-in zoom-in-95 duration-200">
        {/* Top Priority Header */}
        <div className="bg-gradient-to-r from-brand-500 to-orange-600 p-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center animate-bounce">
              <Truck className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-orange-100">Đơn Điều Phối Mới</div>
              <div className="text-sm font-black">Có cuốc xe phù hợp xung quanh!</div>
            </div>
          </div>

          {/* 30s Countdown Ring */}
          <div className="flex items-center gap-1 bg-white/20 px-2.5 py-1 rounded-full text-xs font-mono font-bold">
            <Clock className="w-3.5 h-3.5 text-white animate-spin" />
            <span>{jobCountdown}s</span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4">
          {/* Net Earnings Highlight */}
          <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-center">
            <div className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
              Thu nhập thực nhận (Sau khấu trừ 20% hoa hồng)
            </div>
            <div className="text-2xl font-black text-emerald-600 mt-0.5">
              +{formatCurrency(netEarnings)}
            </div>
            <div className="text-[10px] text-slate-500 mt-1">
              Tổng cước: {formatCurrency(jobAlert.totalFee)} • Khoảng cách: {formatDistance(jobAlert.totalDistanceKm)}
            </div>
          </div>

          {/* Route details */}
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2 text-xs">
            <div className="flex items-start gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0"></span>
              <div>
                <span className="text-[10px] text-slate-400 block font-semibold">ĐIỂM LẤY HÀNG:</span>
                <span className="font-semibold text-slate-800 line-clamp-1">{jobAlert.pickup.address}</span>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500 mt-1.5 flex-shrink-0"></span>
              <div>
                <span className="text-[10px] text-slate-400 block font-semibold">ĐIỂM GIAO HÀNG:</span>
                <span className="font-semibold text-slate-800 line-clamp-1">{jobAlert.dropoff.address}</span>
              </div>
            </div>
          </div>

          {/* Cargo info */}
          <div className="text-xs bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
            <div className="text-slate-400 text-[10px] font-bold uppercase">Hàng hóa:</div>
            <div className="text-slate-700 font-medium">{jobAlert.cargo.name}</div>
            <div className="text-slate-500 text-[11px]">Trọng lượng: {jobAlert.cargo.weightKg} kg • Số lượng: {jobAlert.cargo.quantity} kiện</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex gap-3">
          <Button variant="outline" size="lg" onClick={declineJobOffer} className="flex-1">
            <X className="w-4 h-4 mr-1 text-slate-400" /> Bỏ qua
          </Button>
          <Button
            variant="primary"
            size="lg"
            onClick={acceptJobOffer}
            className="flex-1 bg-brand-500 hover:bg-brand-600 shadow-md shadow-orange-500/30"
          >
            <Check className="w-5 h-5 mr-1" /> NHẬN ĐƠN NGAY
          </Button>
        </div>
      </div>
    </div>
  );
};
