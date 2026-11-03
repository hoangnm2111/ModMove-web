import React, { useState } from 'react';
import { MapPlaceholder } from '../../components/MapPlaceholder';
import { toast } from '../../components/ui/feedback';
import { msg } from '../../constants/messages';
import { useAllOrders } from '../../hooks/useDomainData';
import { formatDateTime } from '../../utils/format';
import {
  Radio,
  AlertTriangle,
  Search,
  CheckCircle2,
  Navigation,
  Phone,
  Clock,
  MapPin,
  Truck,
  User,
  ShieldAlert,
  ChevronRight,
  ExternalLink,
  Flame,
  Filter,
  X,
  Package,
  CreditCard,
  DollarSign,
} from 'lucide-react';
import { ORDER_STATUS_CONFIG } from '../../constants';
import { formatCurrency, formatDistance } from '../../utils/format';

interface ActiveFleetVehicle {
  id: string;
  driverName: string;
  driverPhone: string;
  vehicleType: string;
  licensePlate: string;
  status: 'ONLINE_IDLE' | 'IN_TRANSIT' | 'AT_PICKUP' | 'INCIDENT_STOP';
  currentSpeed: number; // km/h
  lastUpdated: string;
  currentAddress: string;
  activeOrderCode?: string;
}

const MOCK_FLEET: ActiveFleetVehicle[] = [
  {
    id: 'veh_01',
    driverName: 'Nguyễn Văn Hùng',
    driverPhone: '0912345678',
    vehicleType: 'Xe Tải Nhỏ 1 Tấn',
    licensePlate: '29C-874.12',
    status: 'IN_TRANSIT',
    currentSpeed: 38,
    lastUpdated: '10 giây trước',
    currentAddress: 'Đang di chuyển trên đường Vành đai 3 trên cao',
    activeOrderCode: 'MM-90182',
  },
  {
    id: 'veh_02',
    driverName: 'Vũ Đức Thịnh',
    driverPhone: '0971234567',
    vehicleType: 'Xe Tải 2 Tấn',
    licensePlate: '29C-998.54',
    status: 'AT_PICKUP',
    currentSpeed: 0,
    lastUpdated: 'Vừa xong',
    currentAddress: 'Đang bốc xếp tại Tòa Keangnam Landmark 72',
    activeOrderCode: 'MM-78219',
  },
  {
    id: 'veh_03',
    driverName: 'Hoàng Hải Nam',
    driverPhone: '0988112233',
    vehicleType: 'Xe Bán Tải 500kg',
    licensePlate: '30F-441.20',
    status: 'ONLINE_IDLE',
    currentSpeed: 0,
    lastUpdated: '1 phút trước',
    currentAddress: 'Sẵn sàng nhận đơn tại khu vực Cầu Giấy',
  },
  {
    id: 'veh_04',
    driverName: 'Lê Thanh Bình',
    driverPhone: '0977889900',
    vehicleType: 'Xe Tải 1.5 Tấn',
    licensePlate: '29H-102.39',
    status: 'INCIDENT_STOP',
    currentSpeed: 0,
    lastUpdated: '3 phút trước',
    currentAddress: 'Dừng bất thường tại đường gom Đại lộ Thăng Long',
    activeOrderCode: 'MM-78220',
  },
];

interface OrderDetailsView {
  code: string;
  status: string;
  createdAt: string;
  customerName: string;
  customerPhone: string;
  pickupAddress: string;
  pickupContact: string;
  pickupPhone: string;
  dropoffAddress: string;
  dropoffContact: string;
  dropoffPhone: string;
  cargoName: string;
  cargoWeight: number;
  cargoPhoto?: string;
  baseFee: number;
  distanceFee: number;
  servicesFee: number;
  totalFee: number;
  paymentMethod: string;
}

/** SCR-39 – Bản đồ giám sát đội xe (UC-DIS-01). Vị trí xe là dữ liệu mô phỏng cho đến khi có Driver App. */
export const LiveMapPage: React.FC = () => {
  const orders = useAllOrders();
  const [fleetList, setFleetList] = useState<ActiveFleetVehicle[]>(MOCK_FLEET);
  const [selectedVehicle, setSelectedVehicle] = useState<ActiveFleetVehicle>(MOCK_FLEET[0]);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'IN_TRANSIT' | 'ONLINE_IDLE' | 'INCIDENT_STOP'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [currentOrderDetails, setCurrentOrderDetails] = useState<OrderDetailsView | null>(null);

  const handleOpenOrderDetails = () => {
    if (!selectedVehicle.activeOrderCode) return;
    const found = orders.find((o) => o.code === selectedVehicle.activeOrderCode);

    if (!found) {
      toast.warning(msg('MSG38'));
      return;
    }
    const normalizedOrder = {
      code: found.code,
      status: found.status,
      createdAt: formatDateTime(found.createdAt),
      customerName: found.customerName,
      customerPhone: found.customerPhone,
      pickupAddress: found.pickup.address,
      pickupContact: found.pickup.contactName,
      pickupPhone: found.pickup.contactPhone,
      dropoffAddress: found.dropoff.address,
      dropoffContact: found.dropoff.contactName,
      dropoffPhone: found.dropoff.contactPhone,
      cargoName: found.cargo.description,
      cargoWeight: found.cargo.weightKg,
      cargoPhoto: found.cargo.photos[0],
      baseFee: found.fare.distanceFare,
      distanceFee: 0,
      servicesFee: found.fare.loadingFee,
      totalFee: found.fare.total,
      paymentMethod: found.paymentMethod,
    };

    setCurrentOrderDetails(normalizedOrder);
    setShowOrderModal(true);
  };

  const filteredFleet = fleetList.filter((v) => {
    const matchesFilter = statusFilter === 'ALL' || v.status === statusFilter;
    const matchesSearch =
      v.driverName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.licensePlate.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.driverPhone.includes(searchTerm) ||
      (v.activeOrderCode && v.activeOrderCode.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="flex h-full w-full overflow-hidden select-none bg-slate-100">
      {/* ========================================================================= */}
      {/* LEFT COLUMN: ACTIVE FLEET & ORDER MONITORING QUEUE */}
      {/* ========================================================================= */}
      <div className="w-80 sm:w-96 bg-white border-r border-slate-200 flex flex-col h-full shadow-lg z-10 flex-shrink-0">
        {/* Header with Title & Operational Stats */}
        <div className="p-4 border-b border-slate-200 bg-white">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center font-bold">
                <Radio className="w-4 h-4 animate-pulse" />
              </div>
              <div>
                <h2 className="text-sm font-black text-slate-800">Giám sát hạm đội xe</h2>
                <p className="text-[11px] text-slate-400">Định vị GPS & Vận tốc thực tế</p>
              </div>
            </div>
            <span className="text-[11px] bg-emerald-100 text-emerald-800 font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              <span>{fleetList.filter((f) => f.status !== 'ONLINE_IDLE').length} đang chạy</span>
            </span>
          </div>

          {/* Search Bar */}
          <div className="relative mb-3">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo biển số, tài xế, mã đơn..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition"
            />
          </div>

          {/* Status Filter Chips */}
          <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100 rounded-xl text-[10px] font-bold text-center">
            {[
              { id: 'ALL', label: 'Tất cả' },
              { id: 'IN_TRANSIT', label: 'Đang chạy' },
              { id: 'ONLINE_IDLE', label: 'Chờ cuốc' },
              { id: 'INCIDENT_STOP', label: 'Sự cố' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id as typeof statusFilter)}
                className={`py-1.5 rounded-lg transition cursor-pointer ${
                  statusFilter === tab.id
                    ? 'bg-white text-slate-900 shadow-xs font-black'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Operational Warning Alert if vehicle stopped suspiciously */}
        {fleetList.some((v) => v.status === 'INCIDENT_STOP') && (
          <div className="p-3 bg-rose-50 border-b border-rose-200 text-xs text-rose-900 flex items-center justify-between animate-fadeIn">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 animate-bounce" />
              <span>Phát hiện 1 xe dừng đột ngột quá 10 phút!</span>
            </div>
            <button
              onClick={() => {
                const stopped = fleetList.find((v) => v.status === 'INCIDENT_STOP');
                if (stopped) setSelectedVehicle(stopped);
              }}
              className="font-extrabold text-[10px] text-rose-700 bg-rose-200/60 px-2 py-0.5 rounded cursor-pointer hover:bg-rose-200"
            >
              Kiểm tra
            </button>
          </div>
        )}

        {/* Vehicles List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {filteredFleet.map((v) => {
            const isSelected = selectedVehicle.id === v.id;
            return (
              <div
                key={v.id}
                onClick={() => setSelectedVehicle(v)}
                className={`p-3.5 rounded-2xl border-2 cursor-pointer transition relative group ${
                  isSelected
                    ? 'border-sky-500 bg-sky-50/50 shadow-sm'
                    : 'border-slate-200/90 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-black text-xs text-slate-900">{v.driverName}</span>
                  <span
                    className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                      v.status === 'IN_TRANSIT'
                        ? 'bg-sky-100 text-sky-700'
                        : v.status === 'AT_PICKUP'
                        ? 'bg-amber-100 text-amber-700'
                        : v.status === 'INCIDENT_STOP'
                        ? 'bg-rose-100 text-rose-700 animate-pulse'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {v.status === 'IN_TRANSIT'
                      ? 'Đang vận chuyển'
                      : v.status === 'AT_PICKUP'
                      ? 'Đang bốc hàng'
                      : v.status === 'INCIDENT_STOP'
                      ? 'Dừng sự cố'
                      : 'Đang rảnh'}
                  </span>
                </div>

                <div className="text-xs text-slate-600 font-semibold flex items-center justify-between">
                  <span>{v.vehicleType}</span>
                  <span className="font-mono text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded text-[11px] font-bold">
                    {v.licensePlate}
                  </span>
                </div>

                <div className="text-[11px] text-slate-500 mt-2 flex items-center gap-1.5">
                  <MapPin className="w-3 h-3 text-slate-400 flex-shrink-0" />
                  <span className="truncate">{v.currentAddress}</span>
                </div>

                <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="font-semibold text-slate-700">Vận tốc: {v.currentSpeed} km/h</span>
                  <span>{v.lastUpdated}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* RIGHT WORKSPACE: SATELLITE MAP & DRIVER TELEMETRY COCKPIT */}
      {/* ========================================================================= */}
      <div className="flex-1 flex flex-col h-full relative overflow-hidden">
        {/* Full Interactive Map Canvas */}
        <div className="flex-1 relative w-full h-full">
          <MapPlaceholder
            pickup={{
              address: 'Tòa Keangnam Landmark 72, Nam Từ Liêm, Hà Nội',
              lat: 21.017,
              lng: 105.783,
              contactName: 'Hoàng Nguyễn Mạnh',
              contactPhone: '0338967316',
            }}
            dropoff={{
              address: 'Khu đô thị Vinhomes Smart City, Tây Mỗ, Hà Nội',
              lat: 21.002,
              lng: 105.748,
              contactName: 'Nguyễn Văn Hùng',
              contactPhone: '0912345678',
            }}
            showActiveDrivers={true}
          />

          {/* Floating Driver Telemetry Overlay Card */}
          <div className="absolute top-4 left-4 z-20 max-w-sm w-full bg-white/95 backdrop-blur-md rounded-3xl p-5 border border-slate-200/90 shadow-2xl space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 to-blue-600 text-white font-black flex items-center justify-center shadow-md">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-slate-900">{selectedVehicle.driverName}</h3>
                  <div className="text-[11px] text-slate-500 font-mono">{selectedVehicle.licensePlate} • {selectedVehicle.vehicleType}</div>
                </div>
              </div>

              <span className="px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-700 text-[11px] font-bold flex items-center gap-1 select-text">
                <Phone className="w-3.5 h-3.5" /> {selectedVehicle.driverPhone}
              </span>
            </div>

            {/* Live Telemetry Info */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 block font-bold uppercase">VẬN TỐC HIỆN TẠI</span>
                <span className="font-black text-slate-900 text-base">{selectedVehicle.currentSpeed} km/h</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 block font-bold uppercase">MÃ CUỐC ĐANG CHỞ</span>
                <span className="font-black text-sky-700 text-sm font-mono">
                  {selectedVehicle.activeOrderCode || 'Đang trống xe'}
                </span>
              </div>
            </div>

            <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-2xl border border-slate-100 flex items-start gap-2">
              <MapPin className="w-4 h-4 text-sky-600 flex-shrink-0 mt-0.5" />
              <span>{selectedVehicle.currentAddress}</span>
            </div>

            {/* Quick Actions */}
            {selectedVehicle.activeOrderCode && (
              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-slate-400">Đơn hàng liên kết</span>
                <button
                  type="button"
                  onClick={handleOpenOrderDetails}
                  className="text-xs font-black text-sky-600 hover:text-sky-800 flex items-center gap-1 cursor-pointer bg-sky-50 hover:bg-sky-100 px-3 py-1.5 rounded-xl transition"
                >
                  <span>Chi tiết vận đơn</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* DETAILED ORDER POP-UP MODAL (Chi tiết vận đơn) */}
      {/* ========================================================================= */}
      {showOrderModal && currentOrderDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-scaleUp max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center font-black">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black text-slate-900">Chi tiết vận đơn #{currentOrderDetails.code}</h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-sky-100 text-sky-700">
                      ĐANG VẬN CHUYỂN
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400">Khởi tạo lúc: {currentOrderDetails.createdAt}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowOrderModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Stakeholders Contact Box */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Customer */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">KHÁCH HÀNG ĐẶT ĐƠN</span>
                </div>
                <div className="font-black text-xs text-slate-900">{currentOrderDetails.customerName}</div>
                <div className="text-[11px] font-mono text-slate-500">{currentOrderDetails.customerPhone}</div>
              </div>

              {/* Driver */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">TÀI XẾ ĐANG VẬN CHUYỂN</span>
                </div>
                <div className="font-black text-xs text-slate-900">{selectedVehicle.driverName}</div>
                <div className="text-[11px] font-mono text-slate-500">
                  {selectedVehicle.driverPhone} • {selectedVehicle.licensePlate} ({selectedVehicle.vehicleType})
                </div>
              </div>
            </div>

            {/* Route Addresses */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3 text-xs">
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-[11px] flex-shrink-0 mt-0.5">
                  A
                </span>
                <div className="flex-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">ĐIỂM LẤY HÀNG</span>
                  <span className="font-semibold text-slate-800">{currentOrderDetails.pickupAddress}</span>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Người gửi: {currentOrderDetails.pickupContact} ({currentOrderDetails.pickupPhone})
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 pt-2 border-t border-slate-200/60">
                <span className="w-6 h-6 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-[11px] flex-shrink-0 mt-0.5">
                  B
                </span>
                <div className="flex-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">ĐIỂM GIAO HÀNG</span>
                  <span className="font-semibold text-slate-800">{currentOrderDetails.dropoffAddress}</span>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Người nhận: {currentOrderDetails.dropoffContact} ({currentOrderDetails.dropoffPhone})
                  </div>
                </div>
              </div>
            </div>

            {/* Cargo & Pricing Breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* Cargo Information */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">THÔNG TIN HÀNG HÓA</span>
                <div className="font-bold text-slate-900">{currentOrderDetails.cargoName}</div>
                <div className="text-[11px] text-slate-500">Khối lượng ước tính: ~{currentOrderDetails.cargoWeight} kg</div>
                {currentOrderDetails.cargoPhoto && (
                  <div className="mt-2 h-20 w-32 rounded-xl overflow-hidden border border-slate-200">
                    <img
                      src={currentOrderDetails.cargoPhoto}
                      alt="Ảnh hàng hóa"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>

              {/* Pricing & Fee */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">CƯỚC PHÍ & THANH TOÁN</span>
                <div className="flex items-center justify-between text-[11px] text-slate-600">
                  <span>Cước mở cửa & quãng đường:</span>
                  <span className="font-semibold">
                    {formatCurrency(currentOrderDetails.baseFee + currentOrderDetails.distanceFee)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-600">
                  <span>Dịch vụ bốc xếp trọn gói:</span>
                  <span className="font-semibold">{formatCurrency(currentOrderDetails.servicesFee)}</span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                  <span className="font-extrabold text-slate-900">Tổng cước phí:</span>
                  <span className="font-black text-sm text-brand-600">
                    {formatCurrency(currentOrderDetails.totalFee)}
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1">
                  <span>Phương thức: <strong>{currentOrderDetails.paymentMethod}</strong></span>
                  <span className="text-emerald-600 font-bold">Đã thanh toán</span>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowOrderModal(false)}
                className="px-5 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition cursor-pointer"
              >
                Đóng cửa sổ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
