import React from 'react';
import { ShieldCheck, Truck, Star, Phone, Mail, Award, CheckCircle2 } from 'lucide-react';
import { Button } from '../../components/Button';

export const DriverProfilePage: React.FC = () => {
  return (
    <div className="h-full overflow-y-auto p-6 space-y-6 bg-slate-50">
      <div>
        <h1 className="text-xl font-black text-slate-800">Hồ Sơ Đối Tác Tài Xế & Phương Tiện</h1>
        <p className="text-xs text-slate-500 mt-0.5">Thông tin giấy phép, phân hạng phương tiện và đánh giá từ khách hàng</p>
      </div>

      <div className="max-w-3xl space-y-4">
        {/* Profile Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80"
              alt="Avatar"
              className="w-16 h-16 rounded-full border-2 border-brand-500 object-cover"
            />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-slate-800">Nguyễn Văn Hùng</h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" /> Đã xác thực
                </span>
              </div>
              <div className="text-xs text-slate-500 mt-0.5">Mã tài xế: DRV-88219 • Đối tác từ: 08/2026</div>
              <div className="flex items-center gap-3 text-xs text-slate-600 mt-2">
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-brand-500" /> 0912345678
                </span>
                <span className="flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 text-amber-500 fill-current" /> 4.9/5.0 (248 đánh giá)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Registered Vehicle Specifications */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Truck className="w-4 h-4 text-brand-500" />
              Thông tin phương tiện đăng ký
            </h3>
            <span className="text-xs font-mono font-bold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-lg border">
              29C-874.12
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="text-slate-400 text-[10px] block">CHỦNG LOẠI XE:</span>
              <span className="font-bold text-slate-800 text-sm">Xe Tải Nhỏ 1 Tấn</span>
              <span className="text-slate-500 text-[11px] block mt-0.5">Thùng mui bạt tiêu chuẩn</span>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="text-slate-400 text-[10px] block">TẢI TRỌNG CHO PHÉP:</span>
              <span className="font-bold text-slate-800 text-sm">990 kg</span>
              <span className="text-slate-500 text-[11px] block mt-0.5">Không bị cấm đường vành đai</span>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="text-slate-400 text-[10px] block">KÍCH THƯỚC THÙNG (D x R x C):</span>
              <span className="font-bold text-slate-800 text-sm">3.0 x 1.6 x 1.7 m</span>
              <span className="text-slate-500 text-[11px] block mt-0.5">Thể tích ~ 8.1 m³</span>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="text-slate-400 text-[10px] block">HẠN KIỂM ĐỊNH & BẢO HIỂM:</span>
              <span className="font-bold text-emerald-600 text-sm">Còn hiệu lực (12/2027)</span>
              <span className="text-slate-500 text-[11px] block mt-0.5">Bảo hiểm TNDS bắt buộc</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
