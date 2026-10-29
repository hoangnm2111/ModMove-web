import React, { useState } from 'react';
import {
  Settings,
  Truck,
  Percent,
  Check,
  Save,
  RotateCcw,
  Plus,
  Trash2,
  DollarSign,
  Package,
  Layers,
  Info,
} from 'lucide-react';
import { formatCurrency } from '../../utils/format';

interface VehiclePricing {
  id: string;
  name: string;
  baseFare: number;
  baseKm: number;
  perKmRate: number;
  loadingFee: number;
  floorFee: number;
}

const INITIAL_PRICING: VehiclePricing[] = [
  {
    id: 'van_500kg',
    name: 'Xe Bán Tải 500kg (Đô thị)',
    baseFare: 110000,
    baseKm: 3,
    perKmRate: 14000,
    loadingFee: 50000,
    floorFee: 20000,
  },
  {
    id: 'truck_1t',
    name: 'Xe tải nhỏ 1 Tấn (990kg - Thùng kín)',
    baseFare: 150000,
    baseKm: 4,
    perKmRate: 18000,
    loadingFee: 80000,
    floorFee: 30000,
  },
  {
    id: 'truck_2t',
    name: 'Xe tải lớn 2 Tấn (1950kg)',
    baseFare: 280000,
    baseKm: 4,
    perKmRate: 24000,
    loadingFee: 150000,
    floorFee: 50000,
  },
];

export const AdminPricingPage: React.FC = () => {
  const [commissionRate, setCommissionRate] = useState<number>(20);
  const [vehiclePricings, setVehiclePricings] = useState<VehiclePricing[]>(INITIAL_PRICING);
  const [isSaved, setIsSaved] = useState(false);

  const handlePriceChange = (
    id: string,
    field: keyof VehiclePricing,
    value: number
  ) => {
    setVehiclePricings((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
    setIsSaved(false);
  };

  const handleSave = () => {
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="flex-1 h-full overflow-y-auto p-4 sm:p-6 space-y-6 bg-slate-50 select-none">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <Settings className="w-5 h-5 text-amber-500" />
              <span>Cấu hình bảng cước vận chuyển & Chiết khấu hoa hồng</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Thiết lập giá mở cửa, cước mỗi km, phụ phí bốc xếp và tỷ lệ phần trăm hoa hồng nền tảng
            </p>
          </div>

          <button
            type="button"
            onClick={handleSave}
            className={`px-5 py-2.5 rounded-2xl font-black text-xs flex items-center gap-2 transition shadow-md cursor-pointer ${
              isSaved
                ? 'bg-emerald-600 text-white shadow-emerald-600/20'
                : 'bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-amber-500/20'
            }`}
          >
            {isSaved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            <span>{isSaved ? 'Đã lưu cấu hình mới' : 'Lưu thay đổi cước'}</span>
          </button>
        </div>

        {/* Commission Rate Card */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
                <Percent className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-sm text-slate-900">Tỷ lệ hoa hồng nền tảng (Platform Commission)</h3>
                <p className="text-xs text-slate-500">Phần trăm cước vận chuyển trừ trực tiếp vào ví đối tác tài xế</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                max={50}
                value={commissionRate}
                onChange={(e) => {
                  setCommissionRate(Number(e.target.value));
                  setIsSaved(false);
                }}
                className="w-20 text-center font-black text-lg p-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              />
              <span className="font-black text-base text-slate-700">%</span>
            </div>
          </div>
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-[11px] text-slate-500 flex items-center gap-2">
            <Info className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <span>
              Lưu ý: Mức hoa hồng mới sẽ chỉ áp dụng cho các chuyến xe được tạo sau thời điểm lưu thay đổi.
            </span>
          </div>
        </div>

        {/* Vehicle Pricing Table */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-black text-sm text-slate-900">Bảng giá cước vận chuyển theo loại phương tiện</h3>
              <p className="text-xs text-slate-500">Giá cơ sở áp dụng khi tính toán chi phí vận chuyển tự động</p>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {vehiclePricings.map((vp) => (
              <div key={vp.id} className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Truck className="w-5 h-5 text-brand-600" />
                    <span className="font-black text-sm text-slate-900">{vp.name}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Giá mở cửa (VNĐ)
                    </label>
                    <input
                      type="number"
                      step={5000}
                      value={vp.baseFare}
                      onChange={(e) => handlePriceChange(vp.id, 'baseFare', Number(e.target.value))}
                      className="w-full text-xs font-bold p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Km cơ sở đầu tiên
                    </label>
                    <input
                      type="number"
                      value={vp.baseKm}
                      onChange={(e) => handlePriceChange(vp.id, 'baseKm', Number(e.target.value))}
                      className="w-full text-xs font-bold p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Cước mỗi km kế tiếp (VNĐ)
                    </label>
                    <input
                      type="number"
                      step={1000}
                      value={vp.perKmRate}
                      onChange={(e) => handlePriceChange(vp.id, 'perKmRate', Number(e.target.value))}
                      className="w-full text-xs font-bold p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Phí bốc xếp cơ bản (VNĐ)
                    </label>
                    <input
                      type="number"
                      step={10000}
                      value={vp.loadingFee}
                      onChange={(e) => handlePriceChange(vp.id, 'loadingFee', Number(e.target.value))}
                      className="w-full text-xs font-bold p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Phụ phí lên lầu (VNĐ/tầng)
                    </label>
                    <input
                      type="number"
                      step={5000}
                      value={vp.floorFee}
                      onChange={(e) => handlePriceChange(vp.id, 'floorFee', Number(e.target.value))}
                      className="w-full text-xs font-bold p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
