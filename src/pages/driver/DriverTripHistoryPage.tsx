import React, { useState } from 'react';
import {
  History,
  Search,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  MapPin,
  Package,
  DollarSign,
  ChevronRight,
  Eye,
  X,
  FileText,
  Star,
  Camera,
  Filter
} from 'lucide-react';
import { formatCurrency, formatDateTime, formatDistance } from '../../utils/format';
import { BUSINESS } from '../../config/business';
import { calculateDriverEarning } from '../../domain/pricing';
import { useAllOrders } from '../../hooks/useDomainData';
import { useDriverContext } from '../../hooks/useDriverContext';

interface CompletedTrip {
  id: string;
  code: string;
  completedAt: string;
  customerName: string;
  customerPhone: string;
  pickupAddress: string;
  dropoffAddress: string;
  cargoName: string;
  cargoWeightKg: number;
  totalDistanceKm: number;
  durationMins: number;
  totalFee: number;
  netEarnings: number;
  paymentMethod: 'PayOS' | 'Cash';
  status: 'Completed' | 'Cancelled';
  cancelReason?: string;
  rating?: number;
  customerFeedback?: string;
  podPhoto: string;
  signaturePhoto: string;
}


export const DriverTripHistoryPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'Completed' | 'Cancelled'>('ALL');
  const [selectedTrip, setSelectedTrip] = useState<(CompletedTrip & { commissionRate: number }) | null>(null);
  const [photoZoom, setPhotoZoom] = useState<string | null>(null);

  const { driverId } = useDriverContext();
  const orders = useAllOrders();
  /** Lịch sử chuyến của tài xế: đơn đã hoàn thành hoặc đã huỷ */
  const trips: (CompletedTrip & { commissionRate: number })[] = orders
    .filter((o) => o.assignedDriver?.id === driverId && (o.status === 'Completed' || o.status === 'Cancelled'))
    .map((o) => {
      const rate = o.commissionRate ?? BUSINESS.DEFAULT_COMMISSION_RATE;
      return {
        id: o.id,
        code: o.code,
        completedAt: formatDateTime(o.completedAt ?? o.cancelledAt),
        customerName: o.customerName,
        customerPhone: o.customerPhone,
        pickupAddress: o.pickup.address,
        dropoffAddress: o.dropoff.address,
        cargoName: o.cargo.description,
        cargoWeightKg: o.cargo.weightKg,
        totalDistanceKm: o.fare.distanceKm,
        durationMins: o.fare.durationMins,
        totalFee: o.fare.total,
        netEarnings: o.status === 'Completed' ? calculateDriverEarning(o.fare.total, rate) : 0,
        paymentMethod: o.paymentMethod,
        status: o.status as 'Completed' | 'Cancelled',
        cancelReason: o.cancellationReason,
        rating: o.rating?.stars,
        customerFeedback: o.rating?.comment,
        podPhoto: o.proof?.deliveryPhoto ?? '',
        signaturePhoto: o.proof?.pickupPhotos[0] ?? '',
        commissionRate: rate,
      };
    });

  const filteredTrips = trips.filter((trip) => {
    if (statusFilter !== 'ALL' && trip.status !== statusFilter) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      return (
        trip.code.toLowerCase().includes(q) ||
        trip.pickupAddress.toLowerCase().includes(q) ||
        trip.dropoffAddress.toLowerCase().includes(q) ||
        trip.customerName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const totalEarned = filteredTrips
    .filter((t) => t.status === 'Completed')
    .reduce((sum, t) => sum + t.netEarnings, 0);

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50/70 select-none overflow-y-auto font-sans min-w-0">
      {/* 1. Header Bar */}
      <div className="bg-white border-b border-slate-200/80 px-4 sm:px-6 py-4 sticky top-0 z-10 shadow-2xs">
        <div className="max-w-[1680px] mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-brand-500" />
              <h1 className="text-lg sm:text-xl font-black text-slate-900 leading-tight">
                Lịch Sử Chuyến Xe Đã Chạy
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-extrabold text-xs">
                {filteredTrips.length} chuyến
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              Tra cứu thông tin chi tiết các chuyến hàng đã hoàn tất, thù lao thực nhận và biên bản bàn giao
            </p>
          </div>

          <div className="bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-2xl flex items-center gap-3">
            <span className="text-[11px] font-bold text-emerald-800 uppercase">Tổng thù lao lọc được:</span>
            <span className="text-base font-black text-emerald-600">+{formatCurrency(totalEarned)}</span>
          </div>
        </div>
      </div>

      {/* 2. Main Content */}
      <div className="max-w-[1680px] mx-auto w-full p-4 sm:p-6 space-y-4">
        {/* Search & Filter Bar */}
        <div className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm theo mã đơn, địa chỉ lấy/giao hoặc tên khách hàng..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-600 w-full sm:w-auto justify-center">
            <button
              type="button"
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                statusFilter === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              Tất cả
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('Completed')}
              className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                statusFilter === 'Completed' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              Đã giao thành công
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('Cancelled')}
              className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                statusFilter === 'Cancelled' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              Đã hủy
            </button>
          </div>
        </div>

        {/* Trips Table / Cards */}
        {filteredTrips.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
              <History className="w-7 h-7" />
            </div>
            <h3 className="font-black text-slate-800 text-base">Chưa có chuyến xe nào phù hợp</h3>
            <p className="text-xs text-slate-500">Hãy thử thay đổi từ khóa hoặc bộ lọc trạng thái</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTrips.map((trip) => (
              <div
                key={trip.id}
                className="bg-white rounded-3xl border border-slate-200 hover:border-brand-300 hover:shadow-sm transition p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
              >
                {/* Left Info: Code, Time, Route */}
                <div className="space-y-2.5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono font-black text-xs text-slate-800 bg-slate-100 px-2.5 py-1 rounded-xl">
                      #{trip.code}
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {trip.completedAt}
                    </span>
                    {trip.status === 'Completed' ? (
                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Giao thành công
                      </span>
                    ) : (
                      <span className="bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                        <XCircle className="w-3 h-3" />
                        Đã hủy
                      </span>
                    )}
                    <span className="text-[10px] text-slate-500 font-bold bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-full">
                      {trip.paymentMethod === 'PayOS' ? 'Đã thanh toán thẻ' : 'Tiền mặt khi giao'}
                    </span>
                  </div>

                  {/* Route */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                    <div className="flex items-start gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 mt-1 flex-shrink-0" />
                      <div className="min-w-0">
                        <span className="text-[10px] text-slate-400 font-bold block uppercase">Lấy hàng:</span>
                        <span className="font-bold text-slate-800 line-clamp-1">{trip.pickupAddress}</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500 mt-1 flex-shrink-0" />
                      <div className="min-w-0">
                        <span className="text-[10px] text-slate-400 font-bold block uppercase">Giao hàng:</span>
                        <span className="font-bold text-slate-800 line-clamp-1">{trip.dropoffAddress}</span>
                      </div>
                    </div>
                  </div>

                  {/* Cargo summary */}
                  <div className="text-xs text-slate-500 flex items-center gap-3">
                    <span className="font-medium text-slate-700 truncate">{trip.cargoName}</span>
                    <span>•</span>
                    <span>{trip.cargoWeightKg} kg</span>
                    <span>•</span>
                    <span>{formatDistance(trip.totalDistanceKm)} ({trip.durationMins} phút)</span>
                  </div>
                </div>

                {/* Right Info: Earnings & Action */}
                <div className="flex sm:items-center justify-between lg:justify-end gap-5 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100 flex-shrink-0">
                  <div className="text-left lg:text-right">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">
                      {trip.status === 'Completed' ? 'Thù lao thực nhận:' : 'Trạng thái cước:'}
                    </span>
                    <span
                      className={`text-lg font-black block leading-tight ${
                        trip.status === 'Completed' ? 'text-emerald-600' : 'text-slate-400'
                      }`}
                    >
                      {trip.status === 'Completed' ? `+${formatCurrency(trip.netEarnings)}` : '0 đ'}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Khách trả: {formatCurrency(trip.totalFee)}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedTrip(trip)}
                    className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-black text-xs transition cursor-pointer flex items-center gap-1.5"
                  >
                    <Eye className="w-4 h-4 text-brand-500" />
                    <span>Xem biên bản</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. Modal Xem Chi Tiết Chuyến Xe & Biên Bản Bàn Giao */}
      {selectedTrip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200">
            <div className="bg-slate-900 border-b border-slate-800 p-4 sm:p-5 text-white flex items-center justify-between">
              <div>
                <h3 className="font-black text-base text-white">
                  Biên bản chuyến xe #{selectedTrip.code}
                </h3>
                <span className="text-[10px] text-slate-400 font-bold">
                  Hoàn tất lúc: {selectedTrip.completedAt}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTrip(null)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 max-h-[75vh] overflow-y-auto space-y-4 text-xs">
              {/* Thù lao & Khách hàng */}
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-emerald-800 uppercase block">Thù lao thực nhận:</span>
                  <span className="text-xl font-black text-emerald-600">+{formatCurrency(selectedTrip.netEarnings)}</span>
                  <div className="text-[10px] text-slate-500 mt-0.5">Hoa hồng sàn {Math.round(selectedTrip.commissionRate * 100)}%: -{formatCurrency(selectedTrip.totalFee - selectedTrip.netEarnings)}</div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Khách hàng:</span>
                  <span className="font-black text-slate-800 text-sm block">{selectedTrip.customerName}</span>
                  <span className="text-slate-500 text-[11px]">{selectedTrip.customerPhone}</span>
                </div>
              </div>

              {/* Đánh giá từ khách nếu có */}
              {selectedTrip.rating && (
                <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200 space-y-1">
                  <div className="flex items-center gap-1 text-amber-500">
                    {[...Array(selectedTrip.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-current" />
                    ))}
                    <span className="text-xs font-black text-amber-800 ml-1">5.0 / 5.0</span>
                  </div>
                  <p className="text-slate-700 italic text-[11px]">"{selectedTrip.customerFeedback}"</p>
                </div>
              )}

              {/* Lộ trình chi tiết */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Nơi lấy hàng:</span>
                  <span className="font-bold text-slate-800">{selectedTrip.pickupAddress}</span>
                </div>
                <div className="border-t border-slate-200 pt-2">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Nơi giao hàng:</span>
                  <span className="font-bold text-slate-800">{selectedTrip.dropoffAddress}</span>
                </div>
              </div>

              {/* Bằng chứng bàn giao hàng hóa */}
              {selectedTrip.status === 'Completed' && (
                <div className="space-y-2">
                  <div className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-brand-500" />
                    <span>Hình ảnh bàn giao & Chữ ký xác nhận người nhận</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div
                      onClick={() => setPhotoZoom(selectedTrip.podPhoto)}
                      className="rounded-2xl border border-slate-200 overflow-hidden bg-slate-100 aspect-video cursor-zoom-in relative group"
                    >
                      <img src={selectedTrip.podPhoto} alt="Ảnh bàn giao" className="w-full h-full object-cover group-hover:scale-105 transition" />
                      <span className="absolute bottom-1.5 left-1.5 bg-black/70 text-white text-[9px] font-bold px-2 py-0.5 rounded">Ảnh kiện hàng</span>
                    </div>
                    <div
                      onClick={() => setPhotoZoom(selectedTrip.signaturePhoto)}
                      className="rounded-2xl border border-slate-200 overflow-hidden bg-slate-100 aspect-video cursor-zoom-in relative group"
                    >
                      <img src={selectedTrip.signaturePhoto} alt="Chữ ký nhận" className="w-full h-full object-cover group-hover:scale-105 transition" />
                      <span className="absolute bottom-1.5 left-1.5 bg-black/70 text-white text-[9px] font-bold px-2 py-0.5 rounded">Biên bản / Chữ ký</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 text-right">
              <button
                type="button"
                onClick={() => setSelectedTrip(null)}
                className="py-2.5 px-5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-black transition cursor-pointer"
              >
                Đóng lại
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Zoom Photo */}
      {photoZoom && (
        <div
          onClick={() => setPhotoZoom(null)}
          className="fixed inset-0 z-60 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 cursor-zoom-out"
        >
          <img src={photoZoom} alt="Phóng to" className="max-w-2xl max-h-[85vh] rounded-2xl object-contain shadow-2xl" />
        </div>
      )}
    </div>
  );
};
