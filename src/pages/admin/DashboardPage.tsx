import React, { useState } from 'react';
import {
  DollarSign,
  TrendingUp,
  Users,
  Truck,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Download,
  Calendar,
  Layers,
  ArrowUpRight,
  X,
  FileText,
  Clock,
  Check,
} from 'lucide-react';
import { formatCurrency } from '../../utils/format';

export const DashboardPage: React.FC = () => {
  const [period, setPeriod] = useState<'DAY' | 'WEEK' | 'MONTH'>('MONTH');

  // Export report modal states per UC-ADM-23
  const [showExportModal, setShowExportModal] = useState(false);
  const [reportType, setReportType] = useState<'REVENUE' | 'INCIDENTS'>('REVENUE');
  const [fromDate, setFromDate] = useState('2026-10-01');
  const [toDate, setToDate] = useState('2026-10-29');
  const [fileFormat, setFileFormat] = useState<'XLSX' | 'CSV'>('XLSX');
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccessNotice, setExportSuccessNotice] = useState(false);

  const stats = {
    grossRevenue: period === 'DAY' ? 12850000 : period === 'WEEK' ? 84200000 : 348500000,
    commissionRevenue: period === 'DAY' ? 2570000 : period === 'WEEK' ? 16840000 : 69700000,
    completedTrips: period === 'DAY' ? 42 : period === 'WEEK' ? 268 : 1150,
    activeDrivers: 28,
  };

  const handleConfirmExport = () => {
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      setShowExportModal(false);
      setExportSuccessNotice(true);
      setTimeout(() => setExportSuccessNotice(false), 4000);

      // Trigger actual download of the configured report
      const extension = fileFormat === 'XLSX' ? 'xlsx' : 'csv';
      const csvHeader =
        reportType === 'REVENUE'
          ? 'MaChuyen,NgayHoanThanh,KhachHang,TaiXe,BienSoXe,LoaiXe,QuangDuongKm,GiaMoCua,PhiBocXep,TongCuocPhi,HoaHong20,ThucNhanTaiXe,PhuongThuc\n'
          : 'MaSuCo,MaDon,ThoiGian,LoaiSuCo,TaiXe,BienSo,TrangThaiXuLy,QuyetDinhDieuPhoi\n';
      const sampleRow =
        reportType === 'REVENUE'
          ? `MM20261029001,29/10/2026 14:15,Hoàng Mạnh,Nguyễn Hùng,29C-874.12,Xe Tải 1T,8.5,150000,80000,320000,64000,256000,PayOS\n`
          : `INC881,MM-90182,29/10/2026 14:15,Hỏng xe nổ lốp,Nguyễn Hùng,29C-874.12,DaXuLy,TiepTucChuyenDi\n`;

      const content = 'data:text/csv;charset=utf-8,\uFEFF' + csvHeader + sampleRow;
      const encodedUri = encodeURI(content);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `ModMove_${reportType}_${fromDate}_den_${toDate}.${extension}`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }, 1000);
  };

  return (
    <div className="flex-1 h-full overflow-y-auto p-4 sm:p-6 space-y-6 bg-slate-50 select-none">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Export Success Notification Banner */}
        {exportSuccessNotice && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-emerald-800 text-xs font-bold animate-fadeIn shadow-xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Báo cáo kiểm toán đã được khởi tạo và tải về máy thành công!</span>
            </div>
            <button
              onClick={() => setExportSuccessNotice(false)}
              className="text-emerald-700 hover:text-emerald-950 font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {/* Top Header & Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-amber-500" />
              <span>Bảng điều khiển & Doanh thu Nền tảng (Admin KPI)</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Theo dõi thời gian thực tổng sản lượng vận chuyển, hoa hồng 20% và đội xe trực tuyến
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Unified Export Button per Plan 1 */}
            <button
              type="button"
              onClick={() => setShowExportModal(true)}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs flex items-center gap-1.5 transition shadow-md shadow-amber-500/20 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Xuất báo cáo (Excel / CSV)</span>
            </button>

            {/* Timeframe Filter Buttons */}
            <div className="flex items-center gap-1 p-1 bg-white border border-slate-200 rounded-xl shadow-xs text-xs font-semibold">
              {[
                { id: 'DAY', label: 'Hôm nay' },
                { id: 'WEEK', label: 'Tuần này' },
                { id: 'MONTH', label: 'Tháng này' },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setPeriod(item.id as any)}
                  className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                    period === item.id
                      ? 'bg-slate-900 text-white font-black shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* KPI Cards Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-[11px] font-extrabold uppercase tracking-wider">Tổng doanh thu gộp</span>
              <div className="w-8 h-8 rounded-xl bg-orange-100 text-brand-600 flex items-center justify-center font-bold">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900">{formatCurrency(stats.grossRevenue)}</div>
            <div className="text-[11px] text-emerald-600 font-bold mt-1 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" /> +14.8% so với kỳ trước
            </div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-[11px] font-extrabold uppercase tracking-wider">Hoa hồng nền tảng (20%)</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-emerald-600">{formatCurrency(stats.commissionRevenue)}</div>
            <div className="text-[11px] text-slate-400 mt-1">Lợi nhuận ròng thu về ví hệ thống</div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-[11px] font-extrabold uppercase tracking-wider">Chuyến hoàn thành</span>
              <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900">{stats.completedTrips} chuyến</div>
            <div className="text-[11px] text-slate-400 mt-1">Tỷ lệ giao hàng thành công: 98.2%</div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-[11px] font-extrabold uppercase tracking-wider">Đội xe đối tác</span>
              <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center font-bold">
                <Truck className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900">{stats.activeDrivers} phương tiện</div>
            <div className="text-[11px] text-emerald-600 font-bold mt-1">19 xe đang sẵn sàng trực tuyến</div>
          </div>
        </div>

        {/* Revenue Breakdown Chart */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-black text-slate-900">Biểu đồ cơ cấu doanh thu theo loại phương tiện</h2>
              <p className="text-xs text-slate-400">Doanh số cuốc xe phân bổ theo từng trọng tải</p>
            </div>
            <span className="text-xs font-mono font-bold text-slate-400">Đơn vị: Triệu VNĐ</span>
          </div>

          <div className="h-64 flex items-end gap-6 pt-8 pb-2 px-4 border-b border-slate-100">
            {[
              { label: 'Xe bán tải 500kg', height: '40%', val: '45.2 tr', color: 'bg-slate-300' },
              { label: 'Xe tải nhỏ 1 Tấn', height: '65%', val: '98.5 tr', color: 'bg-slate-500' },
              { label: 'Xe tải 1.5 Tấn', height: '95%', val: '142.8 tr', color: 'bg-brand-500' },
              { label: 'Xe tải lớn 2 Tấn', height: '55%', val: '62.0 tr', color: 'bg-slate-800' },
            ].map((bar, i) => (
              <div key={i} className="flex-1 flex flex-col items-center h-full justify-end group">
                <span className="text-[11px] font-black text-slate-700 mb-1 opacity-0 group-hover:opacity-100 transition">
                  {bar.val}
                </span>
                <div
                  className={`w-full ${bar.color} rounded-t-2xl transition-all duration-500 group-hover:brightness-110 shadow-xs`}
                  style={{ height: bar.height }}
                />
                <span className="text-xs font-bold text-slate-600 mt-2 text-center">{bar.label}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-center gap-6 pt-2 text-xs font-semibold text-slate-500">
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-brand-500" />
              <span>Xe tải nhỏ 1 Tấn (Chiếm 41%)</span>
            </span>
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-400" />
              <span>Xe bán tải (28%)</span>
            </span>
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-slate-800" />
              <span>Xe tải lớn 2 Tấn (18%)</span>
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* EXPORT REPORT CONFIGURATION MODAL (UC-ADM-23 SPECIFICATION) */}
      {/* ========================================================================= */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Xuất báo cáo vận hành & Tài chính</h3>
                  <p className="text-[11px] text-slate-400">Trích xuất dữ liệu để kiểm toán và báo cáo thuế</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowExportModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 1. Report Classification */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">Loại báo cáo trích xuất:</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setReportType('REVENUE')}
                  className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                    reportType === 'REVENUE'
                      ? 'border-amber-500 bg-amber-50/50 text-slate-900 font-bold'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs">Doanh thu & Chuyến đi</span>
                    {reportType === 'REVENUE' && <Check className="w-4 h-4 text-amber-600" />}
                  </div>
                  <span className="text-[10px] text-slate-400 font-normal block mt-1">
                    Cước phí, hoa hồng 20%, thu nhập tài xế
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setReportType('INCIDENTS')}
                  className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                    reportType === 'INCIDENTS'
                      ? 'border-amber-500 bg-amber-50/50 text-slate-900 font-bold'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs">Nhật ký sự cố vận hành</span>
                    {reportType === 'INCIDENTS' && <Check className="w-4 h-4 text-amber-600" />}
                  </div>
                  <span className="text-[10px] text-slate-400 font-normal block mt-1">
                    Hỏng xe, tai nạn, điều phối lại, bồi thường
                  </span>
                </button>
              </div>
            </div>

            {/* 2. Date Range Filter */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">Khoảng thời gian (Tối đa 12 tháng):</label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block mb-1">TỪ NGÀY:</span>
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block mb-1">ĐẾN NGÀY:</span>
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>
              </div>
            </div>

            {/* 3. File Format */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">Định dạng tệp tải về:</label>
              <div className="flex items-center gap-3">
                {[
                  { id: 'XLSX', label: 'Microsoft Excel (.xlsx)' },
                  { id: 'CSV', label: 'Tệp phân cách dấu phẩy (.csv)' },
                ].map((fmt) => (
                  <label
                    key={fmt.id}
                    onClick={() => setFileFormat(fmt.id as any)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold cursor-pointer transition ${
                      fileFormat === fmt.id
                        ? 'border-amber-500 bg-amber-50 text-slate-900'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="fileFormat"
                      checked={fileFormat === fmt.id}
                      onChange={() => {}}
                      className="text-amber-500 focus:ring-amber-500"
                    />
                    <span>{fmt.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowExportModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmExport}
                disabled={isExporting}
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs flex items-center gap-1.5 transition cursor-pointer shadow-md shadow-amber-500/20"
              >
                <Download className="w-4 h-4" />
                <span>{isExporting ? 'Đang trích xuất...' : 'Xác nhận xuất & Tải về'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
