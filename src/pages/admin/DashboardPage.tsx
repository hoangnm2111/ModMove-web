import React, { useState } from 'react';
import { DollarSign, TrendingUp, Users, Truck, CheckCircle2, AlertCircle } from 'lucide-react';
import { formatCurrency } from '../../utils/format';

export const DashboardPage: React.FC = () => {
  const [period, setPeriod] = useState<'DAY' | 'WEEK' | 'MONTH'>('MONTH');

  const stats = {
    grossRevenue: period === 'DAY' ? 12850000 : period === 'WEEK' ? 84200000 : 348500000,
    commissionRevenue: period === 'DAY' ? 2570000 : period === 'WEEK' ? 16840000 : 69700000,
    completedTrips: period === 'DAY' ? 42 : period === 'WEEK' ? 268 : 1150,
    activeDrivers: 28,
  };

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6 bg-slate-50">
      {/* Top Header & Filter */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-800">Bảng điều khiển & Doanh thu Nền tảng (Admin KPI)</h1>
          <p className="text-xs text-slate-500 mt-0.5">Theo dõi thời gian thực doanh thu, hoa hồng và sản lượng chuyến xe</p>
        </div>

        <div className="flex items-center gap-1 p-1 bg-white border border-slate-200 rounded-xl shadow-sm text-xs font-semibold">
          {[
            { id: 'DAY', label: 'Hôm nay' },
            { id: 'WEEK', label: 'Tuần này' },
            { id: 'MONTH', label: 'Tháng này' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setPeriod(item.id as any)}
              className={`px-3 py-1.5 rounded-lg transition ${
                period === item.id ? 'bg-brand-500 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Tổng doanh thu gộp</span>
            <div className="w-8 h-8 rounded-lg bg-orange-100 text-brand-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">{formatCurrency(stats.grossRevenue)}</div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> +14.8% so với kỳ trước
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Hoa hồng nền tảng (20%)</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600">{formatCurrency(stats.commissionRevenue)}</div>
          <div className="text-[11px] text-slate-400 mt-1">Lợi nhuận ròng thu về ví hệ thống</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Chuyến hoàn thành</span>
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">{stats.completedTrips}</div>
          <div className="text-[11px] text-slate-400 mt-1">Tỷ lệ hoàn thành đơn: 98.2%</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Tài xế đối tác</span>
            <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">{stats.activeDrivers} xe</div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-1">19 xe đang sẵn sàng online</div>
        </div>
      </div>

      {/* Revenue Breakdown Chart Placeholder */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-800">Biểu đồ tăng trưởng doanh thu theo loại xe</h2>
          <span className="text-xs text-slate-400">Đơn vị: VNĐ</span>
        </div>

        <div className="h-64 flex items-end gap-6 pt-8 pb-2 px-4 border-b border-slate-100">
          {[
            { label: 'Xe máy', height: '40%', val: '45.2 tr', color: 'bg-slate-300' },
            { label: 'Bán tải 500kg', height: '65%', val: '98.5 tr', color: 'bg-amber-400' },
            { label: 'Xe tải nhỏ 1T', height: '95%', val: '142.8 tr', color: 'bg-brand-500' },
            { label: 'Xe tải lớn 2T', height: '55%', val: '62.0 tr', color: 'bg-slate-700' },
          ].map((bar, i) => (
            <div key={i} className="flex-1 flex flex-col items-center h-full justify-end group">
              <span className="text-[10px] font-bold text-slate-700 mb-1 opacity-0 group-hover:opacity-100 transition">
                {bar.val}
              </span>
              <div
                className={`w-full ${bar.color} rounded-t-xl transition-all duration-500 group-hover:brightness-110 shadow-sm`}
                style={{ height: bar.height }}
              ></div>
              <span className="text-xs font-medium text-slate-600 mt-2 text-center">{bar.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
