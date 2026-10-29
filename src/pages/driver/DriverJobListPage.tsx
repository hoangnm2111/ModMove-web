import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  MapPin,
  Clock,
  Package,
  Truck,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Eye,
  RefreshCw,
  Navigation,
  DollarSign,
  ChevronRight,
  X,
  Phone,
  User,
  Info
} from 'lucide-react';
import { useDriverStore } from '../../store/useDriverStore';
import { ShippingOrder } from '../../types/order.types';
import { formatCurrency, formatDistance } from '../../utils/format';

// Mock list of eligible pending orders in the driver's vicinity
const MOCK_AVAILABLE_ORDERS: ShippingOrder[] = [
  {
    id: 'req_job_01',
    code: 'MM-88421',
    customerName: 'Trần Minh Tuấn',
    customerPhone: '0988 123 456',
    pickup: {
      address: 'Kho hàng Tổng Hà Nội, 158 Nguyễn Xiển, Thanh Xuân, Hà Nội',
      lat: 20.9856,
      lng: 105.8043,
      contactName: 'Anh Tuấn Kho',
      contactPhone: '0988 123 456',
      note: 'Vào cổng số 2, liên hệ bảo vệ nhận thẻ bốc hàng',
    },
    dropoff: {
      address: 'Tòa nhà FPT Tower, 10 Phạm Văn Bạch, Cầu Giấy, Hà Nội',
      lat: 21.0289,
      lng: 105.7891,
      contactName: 'Chị Mai Thu Thảo',
      contactPhone: '0912 888 999',
      note: 'Tầng 8, giao giờ hành chính',
    },
    vehicle: {
      id: 'veh_truck_1t',
      name: 'Xe Tải Nhỏ 1 Tấn',
      category: 'TRUCK_1TON',
      tag: 'Xe thùng bạt tiêu chuẩn',
      capacityText: 'Tối đa 1000kg',
      dimensions: '3.0 x 1.6 x 1.7 m',
      baseFare: 250000,
      perKmRate: 20000,
      iconType: 'truck',
    },
    cargo: {
      name: '12 Thùng thiết bị mạng & 4 màn hình máy tính công sở',
      weightKg: 280,
      quantity: 16,
      images: [
        'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80',
      ],
    },
    additionalServices: [
      { id: 'svc_1', name: 'Bốc xếp 1 đầu nhận', description: 'Hỗ trợ bốc xếp sảnh', price: 50000 },
      { id: 'svc_2', name: 'Giao tận cửa tầng cao', description: 'Đi thang máy lên tận phòng', price: 30000 },
    ],
    totalDistanceKm: 7.8,
    estimatedDurationMins: 25,
    baseFee: 250000,
    distanceFee: 156000,
    servicesFee: 80000,
    discountFee: 0,
    totalFee: 486000,
    codAmount: 0,
    status: 'Pending',
    paymentMethod: 'PayOS',
    paymentStatus: 'Paid',
    createdAt: '2026-10-29T10:15:00Z',
  },
  {
    id: 'req_job_02',
    code: 'MM-73910',
    customerName: 'Công ty TNHH Nội Thất Bắc Âu',
    customerPhone: '0904 555 777',
    pickup: {
      address: 'Showroom Nội Thất, 482 Quang Trung, Hà Đông, Hà Nội',
      lat: 20.9632,
      lng: 105.7681,
      contactName: 'Thủ kho Nam',
      contactPhone: '0904 555 777',
      note: 'Hàng gỗ đã quấn màng co và chèn xốp bóng khí',
    },
    dropoff: {
      address: 'Biệt thự Hoa Sữa 04, Vinhomes Riverside, Long Biên, Hà Nội',
      lat: 21.0456,
      lng: 105.9082,
      contactName: 'Bác Hưng',
      contactPhone: '0977 333 222',
      note: 'Nhà riêng, đường rộng xe tải đỗ tận cổng',
    },
    vehicle: {
      id: 'veh_truck_1t',
      name: 'Xe Tải Nhỏ 1 Tấn',
      category: 'TRUCK_1TON',
      tag: 'Xe thùng kín / bạt',
      capacityText: 'Tối đa 1000kg',
      dimensions: '3.0 x 1.6 x 1.7 m',
      baseFare: 250000,
      perKmRate: 20000,
      iconType: 'truck',
    },
    cargo: {
      name: '1 Bộ bàn trà gỗ sồi, 2 ghế đôn & gương decor bọc kính',
      weightKg: 195,
      quantity: 4,
      images: [
        'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=600&q=80',
      ],
    },
    additionalServices: [
      { id: 'svc_fragile', name: 'Hàng cồng kềnh dễ trầy xước', description: 'Chèn lót xốp & cố định đai ràng', price: 100000 },
    ],
    totalDistanceKm: 21.5,
    estimatedDurationMins: 48,
    baseFee: 250000,
    distanceFee: 430000,
    servicesFee: 100000,
    discountFee: 0,
    totalFee: 780000,
    codAmount: 1500000,
    status: 'Pending',
    paymentMethod: 'Cash',
    paymentStatus: 'Unpaid',
    createdAt: '2026-10-29T10:28:00Z',
  },
  {
    id: 'req_job_03',
    code: 'MM-91045',
    customerName: 'Vũ Thị Thanh Hà',
    customerPhone: '0936 999 112',
    pickup: {
      address: 'Chung cư Vinhomes Smart City, Tây Mỗ, Nam Từ Liêm, Hà Nội',
      lat: 21.0045,
      lng: 105.7483,
      contactName: 'Chị Hà',
      contactPhone: '0936 999 112',
      note: 'Sảnh tòa S2.05, có hầm nhận hàng xe tải cao 2.2m',
    },
    dropoff: {
      address: 'Times City Park Hill, 458 Minh Khai, Hai Bà Trưng, Hà Nội',
      lat: 20.9951,
      lng: 105.8687,
      contactName: 'Em Nam',
      contactPhone: '0981 222 333',
      note: 'Giao sảnh lễ tân Park 3',
    },
    vehicle: {
      id: 'veh_truck_1t',
      name: 'Xe Tải Nhỏ 1 Tấn',
      category: 'TRUCK_1TON',
      tag: 'Xe thùng bạt tiêu chuẩn',
      capacityText: 'Tối đa 1000kg',
      dimensions: '3.0 x 1.6 x 1.7 m',
      baseFare: 250000,
      perKmRate: 20000,
      iconType: 'truck',
    },
    cargo: {
      name: 'Đồ dọn chuyển phòng trọ: 8 thùng carton, 1 vali và 1 đệm gấp',
      weightKg: 140,
      quantity: 10,
      images: [],
    },
    additionalServices: [
      { id: 'svc_student', name: 'Chuyển đồ trọn gói sinh viên', description: 'Hỗ trợ bưng vác đồ đạc', price: 50000 },
    ],
    totalDistanceKm: 14.2,
    estimatedDurationMins: 35,
    baseFee: 250000,
    distanceFee: 284000,
    servicesFee: 50000,
    discountFee: 0,
    totalFee: 584000,
    codAmount: 0,
    status: 'Pending',
    paymentMethod: 'PayOS',
    paymentStatus: 'Paid',
    createdAt: '2026-10-29T10:32:00Z',
  },
];

export const DriverJobListPage: React.FC = () => {
  const navigate = useNavigate();
  const { isOnline, toggleOnline, activeTrip, acceptSpecificOrder } = useDriverStore();

  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedRadius, setSelectedRadius] = useState<'ALL' | '5KM' | '10KM'>('ALL');
  const [selectedPaymentType, setSelectedPaymentType] = useState<'ALL' | 'PayOS' | 'Cash'>('ALL');
  const [selectedJobForDetail, setSelectedJobForDetail] = useState<ShippingOrder | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // State lưu thời gian đếm ngược còn lại cho mỗi thẻ đơn hàng ngoài danh sách (mặc định 30s)
  const [orderCountdowns, setOrderCountdowns] = useState<Record<string, number>>({
    req_job_01: 28,
    req_job_02: 24,
    req_job_03: 30,
  });

  // State xác nhận nhận cuốc (không cần đếm ngược 30s)
  const [orderToConfirm, setOrderToConfirm] = useState<ShippingOrder | null>(null);

  // Bộ đếm thời gian thực cho các thẻ đơn hàng ngoài danh sách
  React.useEffect(() => {
    const timer = setInterval(() => {
      setOrderCountdowns((prev) => {
        const next: Record<string, number> = {};
        Object.entries(prev).forEach(([key, val]) => {
          // Khi đếm về 1s sẽ tự reset chu kỳ mới mô phỏng đơn hàng mới push liên tục
          next[key] = val <= 1 ? 30 : val - 1;
        });
        return next;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setOrderCountdowns({
        req_job_01: 30,
        req_job_02: 28,
        req_job_03: 25,
      });
      setIsRefreshing(false);
    }, 600);
  };

  // Mở popup xác nhận nhận cuốc (không đếm ngược)
  const handleOpenConfirmPopup = (order: ShippingOrder) => {
    setSelectedJobForDetail(null);
    setOrderToConfirm(order);
  };

  // Tài xế bấm chốt "XÁC NHẬN NHẬN CUỐC"
  const handleFinalConfirmAccept = () => {
    if (!orderToConfirm) return;
    acceptSpecificOrder(orderToConfirm);
    setOrderToConfirm(null);
    navigate('/driver/trip');
  };

  // Filter orders
  const filteredOrders = MOCK_AVAILABLE_ORDERS.filter((order) => {
    if (searchKeyword.trim()) {
      const q = searchKeyword.toLowerCase();
      const matchAddress =
        order.pickup.address.toLowerCase().includes(q) ||
        order.dropoff.address.toLowerCase().includes(q) ||
        order.code.toLowerCase().includes(q) ||
        order.cargo.name.toLowerCase().includes(q);
      if (!matchAddress) return false;
    }
    if (selectedPaymentType !== 'ALL' && order.paymentMethod !== selectedPaymentType) {
      return false;
    }
    if (selectedRadius === '5KM' && order.totalDistanceKm > 8) return false;
    if (selectedRadius === '10KM' && order.totalDistanceKm > 15) return false;
    return true;
  });

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50/70 select-none overflow-y-auto font-sans min-w-0">
      {/* 1. Header Bar */}
      <div className="bg-white border-b border-slate-200/80 px-4 sm:px-6 py-4 sticky top-0 z-10 shadow-2xs">
        <div className="max-w-[1680px] mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h1 className="text-lg sm:text-xl font-black text-slate-900 leading-tight">
                Danh Sách Đơn Hàng Chờ Nhận
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-orange-100 text-brand-700 font-extrabold text-xs">
                {filteredOrders.length} đơn gần bạn
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              Hệ thống lọc các đơn hàng khớp với tải trọng xe 1 tấn của bạn và bán kính gần nhất
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRefresh}
              className={`p-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 transition cursor-pointer flex items-center gap-1.5 text-xs font-bold ${
                isRefreshing ? 'opacity-50' : ''
              }`}
              title="Làm mới danh sách"
            >
              <RefreshCw className={`w-4 h-4 text-brand-500 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Làm mới</span>
            </button>

            {/* Offline/Online Quick Status */}
            {!isOnline ? (
              <button
                type="button"
                onClick={toggleOnline}
                className="py-2 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-extrabold text-xs transition cursor-pointer flex items-center gap-1.5"
              >
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span>Bật xe để nhận đơn</span>
              </button>
            ) : (
              <div className="py-2 px-3.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-extrabold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span>Đang sẵn sàng nhận cuốc</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. Main Content Area */}
      <div className="max-w-[1680px] mx-auto w-full p-4 sm:p-6 space-y-4">
        {/* Banner if Driver already has an Active Order */}
        {activeTrip && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 text-white shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-blue-600/20 text-blue-400 flex items-center justify-center flex-shrink-0 border border-blue-500/30">
                <Navigation className="w-6 h-6 animate-bounce" />
              </div>
              <div>
                <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700 font-bold text-[10px] uppercase">
                  Đang có chuyến chạy dở: #{activeTrip.code}
                </span>
                <h3 className="text-base font-black text-white mt-0.5">
                  Bạn đang thực hiện cuốc xe giao hàng
                </h3>
                <p className="text-xs text-slate-400 line-clamp-1">
                  Đích đến: {activeTrip.dropoff.address}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate('/driver/trip')}
              className="py-2.5 px-5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5 shadow-xs flex-shrink-0"
            >
              <span>Xem tiến trình chuyến đang chạy</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Filter & Search Toolbar */}
        <div className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="Tìm theo khu vực lấy hàng, nơi giao hoặc tên hàng..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
            {/* Filter by distance */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-600">
              <button
                type="button"
                onClick={() => setSelectedRadius('ALL')}
                className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                  selectedRadius === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
                }`}
              >
                Tất cả bán kính
              </button>
              <button
                type="button"
                onClick={() => setSelectedRadius('5KM')}
                className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                  selectedRadius === '5KM' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
                }`}
              >
                Dưới 8km
              </button>
              <button
                type="button"
                onClick={() => setSelectedRadius('10KM')}
                className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                  selectedRadius === '10KM' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
                }`}
              >
                Dưới 15km
              </button>
            </div>

            {/* Filter payment method */}
            <select
              value={selectedPaymentType}
              onChange={(e) => setSelectedPaymentType(e.target.value as any)}
              className="py-1.5 px-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-700 cursor-pointer focus:outline-none"
            >
              <option value="ALL">Mọi hình thức TT</option>
              <option value="PayOS">Đã trả trước qua thẻ</option>
              <option value="Cash">Tiền mặt / Thu COD</option>
            </select>
          </div>
        </div>

        {/* 3. Job Cards Grid */}
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-orange-50 text-brand-500 mx-auto flex items-center justify-center">
              <Package className="w-7 h-7" />
            </div>
            <h3 className="font-black text-slate-800 text-base">Hiện không có đơn hàng phù hợp</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Không tìm thấy đơn hàng nào quanh khu vực của bạn hoặc các đơn đã được tài xế khác nhận. Hãy bật xe và chờ thông báo tiếp theo!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredOrders.map((order) => {
              const netEarnings = Math.round(order.totalFee * 0.8);
              return (
                <div
                  key={order.id}
                  className="bg-white rounded-3xl border border-slate-200 hover:border-brand-300 hover:shadow-md transition duration-200 p-5 flex flex-col justify-between space-y-4 group"
                >
                  {/* Top card info */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-xs text-slate-700 bg-slate-100 px-2.5 py-1 rounded-xl">
                          #{order.code}
                        </span>
                        {/* Huy hiệu đếm ngược 30s trực quan ngoài danh sách */}
                        <div className="flex items-center gap-1 bg-rose-50 border border-rose-200 text-rose-600 px-2 py-0.5 rounded-full text-[10px] font-mono font-black">
                          <Clock className="w-3 h-3 text-rose-500 animate-spin" />
                          <span>{orderCountdowns[order.id] || 30}s</span>
                        </div>
                      </div>
                      <span
                        className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                          order.paymentMethod === 'PayOS'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {order.paymentMethod === 'PayOS' ? 'Đã thanh toán Online' : 'Tiền mặt khi giao'}
                      </span>
                    </div>

                    {/* Net Earnings Highlight */}
                    <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-200 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-emerald-800 uppercase block tracking-wider">
                          Thù lao thực nhận (Net):
                        </span>
                        <span className="text-xl font-black text-emerald-600 block leading-tight">
                          +{formatCurrency(netEarnings)}
                        </span>
                      </div>
                      <div className="text-right text-[11px] text-slate-500 font-bold">
                        <div>~{formatDistance(order.totalDistanceKm)}</div>
                        <div className="text-[10px] text-slate-400 font-normal">
                          {order.estimatedDurationMins} phút chạy
                        </div>
                      </div>
                    </div>

                    {/* Route Addresses */}
                    <div className="space-y-2 text-xs pt-1">
                      <div className="flex items-start gap-2.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 mt-1 flex-shrink-0" />
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 block uppercase">
                            ĐIỂM LẤY HÀNG:
                          </span>
                          <span className="font-bold text-slate-800 line-clamp-1">
                            {order.pickup.address}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-start gap-2.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500 mt-1 flex-shrink-0" />
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 block uppercase">
                            ĐIỂM GIAO HÀNG:
                          </span>
                          <span className="font-bold text-slate-800 line-clamp-1">
                            {order.dropoff.address}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Cargo Preview */}
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                      <div className="flex items-center gap-1.5 text-slate-700 font-bold line-clamp-1">
                        <Package className="w-3.5 h-3.5 text-brand-500 flex-shrink-0" />
                        <span>{order.cargo.name}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Tải trọng: {order.cargo.weightKg} kg • Số lượng: {order.cargo.quantity} kiện
                      </div>
                    </div>
                  </div>

                  {/* Action CTA Buttons */}
                  <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedJobForDetail(order)}
                      className="flex-1 py-2.5 px-3 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-extrabold text-xs transition cursor-pointer flex items-center justify-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5 text-slate-500" />
                      <span>Xem chi tiết</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenConfirmPopup(order)}
                      className="flex-1 py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition cursor-pointer flex items-center justify-center gap-1"
                    >
                      <span>Nhận cuốc</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. MODAL CHI TIẾT ĐƠN HÀNG (View Detail Request Job) */}
      {selectedJobForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-slate-900 border-b border-slate-800 p-4 sm:p-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-bold">
                  <Package className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="font-black text-base text-white">
                    Chi tiết đơn hàng #{selectedJobForDetail.code}
                  </h3>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    Thông tin đầy đủ trước khi nhận cuốc
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedJobForDetail(null)}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 max-h-[70vh] overflow-y-auto space-y-4 text-xs">
              {/* Net Payout Banner */}
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-center space-y-0.5">
                <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">
                  Thù lao thực nhận của tài xế (Đã trừ 20% hoa hồng sàn)
                </span>
                <span className="text-2xl font-black text-emerald-600 block">
                  +{formatCurrency(Math.round(selectedJobForDetail.totalFee * 0.8))}
                </span>
                <div className="text-[11px] text-slate-500 font-medium">
                  Tổng cước khách trả: {formatCurrency(selectedJobForDetail.totalFee)} • Lộ trình: {formatDistance(selectedJobForDetail.totalDistanceKm)}
                </div>
              </div>

              {/* Route Detailed */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-start gap-3">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 mt-1 flex-shrink-0" />
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">
                      ĐỊA ĐIỂM LẤY HÀNG:
                    </span>
                    <span className="font-extrabold text-slate-800 text-xs sm:text-sm block">
                      {selectedJobForDetail.pickup.address}
                    </span>
                    <div className="text-slate-500 text-[11px]">
                      Người gửi: <span className="font-bold text-slate-700">{selectedJobForDetail.pickup.contactName}</span> ({selectedJobForDetail.pickup.contactPhone})
                    </div>
                    {selectedJobForDetail.pickup.note && (
                      <div className="text-[11px] text-amber-700 bg-amber-50 p-2 rounded-xl mt-1 border border-amber-200/60 font-medium">
                        Ghi chú lấy hàng: {selectedJobForDetail.pickup.note}
                      </div>
                    )}
                  </div>
                </div>

                <div className="border-t border-slate-200 pt-3 flex items-start gap-3">
                  <span className="w-3 h-3 rounded-full bg-rose-500 mt-1 flex-shrink-0" />
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">
                      ĐỊA ĐIỂM GIAO HÀNG:
                    </span>
                    <span className="font-extrabold text-slate-800 text-xs sm:text-sm block">
                      {selectedJobForDetail.dropoff.address}
                    </span>
                    <div className="text-slate-500 text-[11px]">
                      Người nhận: <span className="font-bold text-slate-700">{selectedJobForDetail.dropoff.contactName}</span> ({selectedJobForDetail.dropoff.contactPhone})
                    </div>
                    {selectedJobForDetail.dropoff.note && (
                      <div className="text-[11px] text-amber-700 bg-amber-50 p-2 rounded-xl mt-1 border border-amber-200/60 font-medium">
                        Ghi chú giao hàng: {selectedJobForDetail.dropoff.note}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Cargo Specs */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                <div className="text-[10px] font-bold text-slate-400 uppercase">
                  Thông số hàng hóa & Yêu cầu xe:
                </div>
                <div className="font-bold text-slate-800 text-sm">
                  {selectedJobForDetail.cargo.name}
                </div>
                <div className="grid grid-cols-2 gap-2 text-slate-600 text-xs pt-1">
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                    <span className="text-[10px] text-slate-400 block font-bold">KHỐI LƯỢNG:</span>
                    <span className="font-black text-slate-900">{selectedJobForDetail.cargo.weightKg} kg</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                    <span className="text-[10px] text-slate-400 block font-bold">SỐ LƯỢNG:</span>
                    <span className="font-black text-slate-900">{selectedJobForDetail.cargo.quantity} kiện</span>
                  </div>
                </div>

                {selectedJobForDetail.additionalServices && selectedJobForDetail.additionalServices.length > 0 && (
                  <div className="pt-2">
                    <span className="text-[10px] text-slate-400 block font-bold mb-1">DỊCH VỤ THÊM:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedJobForDetail.additionalServices.map((svc, i) => (
                        <span
                          key={i}
                          className="px-2.5 py-1 rounded-lg bg-orange-50 text-brand-700 border border-orange-200 text-[11px] font-extrabold"
                        >
                          + {svc.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Payment & COD Notice */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">
                    Phương thức thanh toán:
                  </span>
                  <span className="font-extrabold text-slate-800">
                    {selectedJobForDetail.paymentMethod === 'PayOS' ? 'Thanh toán trực tuyến PayOS' : 'Tiền mặt khi giao hàng'}
                  </span>
                </div>
                {selectedJobForDetail.codAmount ? (
                  <div className="text-right">
                    <span className="text-[10px] text-rose-500 font-bold block uppercase">
                      Tiền thu hộ COD:
                    </span>
                    <span className="font-black text-rose-600 text-sm">
                      {formatCurrency(selectedJobForDetail.codAmount)}
                    </span>
                  </div>
                ) : null}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex gap-3">
              <button
                type="button"
                onClick={() => setSelectedJobForDetail(null)}
                className="flex-1 py-3 px-4 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-extrabold text-xs transition cursor-pointer"
              >
                Đóng lại
              </button>
              <button
                type="button"
                onClick={() => handleOpenConfirmPopup(selectedJobForDetail)}
                className="flex-1 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>XÁC NHẬN NHẬN CUỐC NÀY</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. POPUP XÁC NHẬN NHẬN CUỐC (Xác nhận nhanh không có đếm ngược) */}
      {orderToConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200">
            {/* Header xác nhận đơn giản, hiện đại */}
            <div className="bg-slate-900 border-b border-slate-800 p-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-bold">
                  <Truck className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="font-black text-base text-white">Xác nhận nhận chuyến xe</h3>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    Đơn hàng #{orderToConfirm.code}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setOrderToConfirm(null)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4 text-xs">
              {/* Thù lao nổi bật */}
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-center space-y-1">
                <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                  Thu nhập thực nhận của bạn:
                </span>
                <span className="text-2xl font-black text-emerald-600 block">
                  +{formatCurrency(Math.round(orderToConfirm.totalFee * 0.8))}
                </span>
                <span className="text-[10px] text-slate-500 block">
                  Lộ trình di chuyển: {formatDistance(orderToConfirm.totalDistanceKm)} (~{orderToConfirm.estimatedDurationMins} phút)
                </span>
              </div>

              {/* Lộ trình vắn tắt */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2.5">
                <div className="flex items-start gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 mt-1 flex-shrink-0" />
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">
                      ĐIỂM LẤY HÀNG:
                    </span>
                    <span className="font-bold text-slate-800 line-clamp-1 text-xs">
                      {orderToConfirm.pickup.address}
                    </span>
                    <div className="text-slate-500 text-[11px] mt-0.5">
                      {orderToConfirm.pickup.contactName} ({orderToConfirm.pickup.contactPhone})
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-200/80 pt-2 flex items-start gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 mt-1 flex-shrink-0" />
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">
                      ĐIỂM GIAO HÀNG:
                    </span>
                    <span className="font-bold text-slate-800 line-clamp-1 text-xs">
                      {orderToConfirm.dropoff.address}
                    </span>
                    <div className="text-slate-500 text-[11px] mt-0.5">
                      {orderToConfirm.dropoff.contactName} ({orderToConfirm.dropoff.contactPhone})
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-blue-50 rounded-xl border border-blue-200/80 flex items-center gap-2 text-blue-800 text-[11px] font-medium">
                <Info className="w-4 h-4 text-blue-600 flex-shrink-0" />
                <span>
                  Sau khi bấm xác nhận, hệ thống sẽ gán đơn ngay cho bạn và mở bản đồ điều hướng tới điểm lấy hàng.
                </span>
              </div>
            </div>

            {/* Buttons */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex gap-3">
              <button
                type="button"
                onClick={() => setOrderToConfirm(null)}
                className="flex-1 py-3 px-4 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-black text-xs transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <X className="w-4 h-4 text-slate-400" />
                <span>Hủy bỏ</span>
              </button>

              <button
                type="button"
                onClick={handleFinalConfirmAccept}
                className="flex-1 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4 text-white" />
                <span>XÁC NHẬN NHẬN CUỐC</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
