import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCustomerLayout } from '../../layouts/CustomerLayout';
import {
  Menu,
  X,
  Truck,
  Package,
  Home,
  Clock,
  CreditCard,
  LogOut,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  MapPin,
  Calendar,
  Tag,
  DollarSign,
  Sparkles,
  Upload,
  Info,
  Check,
  Navigation,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Layers,
  ArrowRight,
  AlertCircle,
  ShieldCheck,
  User as UserIcon,
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useOrderStore } from '../../store/useOrderStore';
import { orderService } from '../../services/order.service';
import { DEFAULT_VEHICLES } from '../../constants';
import { formatCurrency } from '../../utils/format';
import { ShippingOrder, VehicleOption } from '../../types/order.types';

export const BookingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const {
    pickup,
    setPickup,
    dropoff,
    setDropoff,
    selectedVehicle,
    setVehicle,
    cargo,
    setCargo,
    services,
    toggleService,
    promoCode,
    setPromoCode,
    paymentMethod,
    setPaymentMethod,
    calculateFare,
    triggerAiAnalysis,
    isAiAnalyzing,
    resetBooking,
  } = useOrderStore();

  const location = useLocation();
  const { toggleSidebar } = useCustomerLayout();

  // Listen to ?service= URL search param from menu navigation
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const service = params.get('service');
    if (service === 'bike') {
      const bikeVeh = DEFAULT_VEHICLES.find((v) => v.id === 'veh_bike');
      if (bikeVeh) setVehicle(bikeVeh);
    } else if (service === 'truck') {
      const truckVeh = DEFAULT_VEHICLES.find((v) => v.id === 'veh_truck_1ton') || DEFAULT_VEHICLES[2];
      if (truckVeh) setVehicle(truckVeh);
    } else if (service === 'house') {
      const houseVeh = DEFAULT_VEHICLES.find((v) => v.id === 'veh_truck_2ton') || DEFAULT_VEHICLES[2];
      if (houseVeh) setVehicle(houseVeh);
    }
  }, [location.search, setVehicle]);

  // Map visibility toggle (Button "< Ẩn bản đồ" in Image 1 & 2)
  const [isMapVisible, setIsMapVisible] = useState(true);

  // Package details accordion toggle
  const [isPackageInfoOpen, setIsPackageInfoOpen] = useState(true);

  // Size pill selector: 'S' | 'M' | 'L' | 'XL' | '2XL' | '3XL'
  const [selectedSize, setSelectedSize] = useState<'S' | 'M' | 'L' | 'XL' | '2XL' | '3XL'>('S');

  // Service change modal
  const [showServiceModal, setShowServiceModal] = useState(false);

  // Time scheduler modal
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [deliveryTimeOption, setDeliveryTimeOption] = useState<'NOW' | 'SCHEDULED'>('NOW');
  const [scheduledDateTime, setScheduledDateTime] = useState('2026-10-27T08:00');

  // Promo voucher modal
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [tempVoucher, setTempVoucher] = useState('MODMOVE2026');

  // Payer / Payment modal
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [payerRole, setPayerRole] = useState<'SENDER' | 'RECEIVER'>('SENDER');

  // Submitting state
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fare = calculateFare();

  // Handle vehicle switch
  const handleSelectService = (veh: VehicleOption) => {
    setVehicle(veh);
    setShowServiceModal(false);
  };

  // Handle Order Booking Submit
  const handleOrderSubmit = async () => {
    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 600));

    const newOrder: ShippingOrder = {
      id: `ord_${Date.now()}`,
      code: `MM-${Math.floor(10000 + Math.random() * 90000)}`,
      customerName: pickup.contactName || user?.fullName || 'Khách hàng ModMove',
      customerPhone: pickup.contactPhone || user?.phoneNumber || '0338967316',
      pickup,
      dropoff,
      vehicle: selectedVehicle,
      cargo: {
        ...cargo,
        dimensions:
          selectedSize === 'S'
            ? '25 x 32 x 12 cm'
            : selectedSize === 'M'
            ? '40 x 35 x 30 cm'
            : selectedSize === 'L'
            ? '60 x 50 x 50 cm'
            : '1.2 x 1.0 x 1.0 m',
      },
      additionalServices: services.filter((s) => s.isSelected),
      totalDistanceKm: fare.distanceKm,
      estimatedDurationMins: Math.round(fare.distanceKm * 2.5),
      baseFee: fare.baseFee,
      distanceFee: fare.distanceFee,
      servicesFee: fare.servicesFee,
      discountFee: fare.discountFee,
      totalFee: fare.totalFee,
      status: 'PlaceOrder',
      paymentMethod,
      paymentStatus: paymentMethod === 'Cash' ? 'Unpaid' : 'Paid',
      createdAt: new Date().toISOString(),
    };

    orderService.saveOrder(newOrder);
    setIsSubmitting(false);
    resetBooking();
    navigate('/orders');
  };

  return (
    <div className="flex w-full h-full overflow-hidden font-sans select-none relative">

      {/* 3. MAIN BOOKING DRAWER PANEL (EXACTLY MATCHING IMAGE 1 & 2) */}
      {/* ========================================================================= */}
      <div className="w-full sm:w-[440px] md:w-[480px] bg-white h-full border-r border-slate-200 flex flex-col z-20 shadow-2xl flex-shrink-0 overflow-hidden relative">
        {/* Header: Service Title */}
        <div className="p-4 pb-2 border-b border-slate-100 flex items-center gap-3">
          <button
            onClick={toggleSidebar}
            className="p-1.5 -ml-1 text-slate-700 hover:bg-slate-100 rounded-lg transition"
          >
            <Menu className="w-5 h-5" />
          </button>
          <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
            {selectedVehicle.id === 'veh_bike'
              ? 'Giao hàng xe máy'
              : selectedVehicle.id === 'veh_pickup'
              ? 'Giao hàng xe bán tải 500kg'
              : 'Giao hàng xe tải'}
          </h1>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 pb-36">
          {/* Card: Selected Service Badge (Siêu Tốc - Tiết Kiệm - Image 1 & 2) */}
          <div className="bg-orange-50/70 border border-orange-100 rounded-2xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-brand-500 text-white flex items-center justify-center font-bold shadow-md shadow-orange-500/20">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs sm:text-sm font-extrabold text-slate-900 flex items-center gap-1">
                  <span>{selectedVehicle.name}</span>
                  <Info className="w-3.5 h-3.5 text-slate-400 cursor-pointer" />
                </div>
                <div className="text-[11px] text-slate-500 font-medium">{selectedVehicle.tag}</div>
              </div>
            </div>

            <button
              onClick={() => setShowServiceModal(true)}
              className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:border-brand-500 text-slate-800 hover:text-brand-600 text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
            >
              <span>🚀 Đổi dịch vụ</span>
            </button>
          </div>

          {/* Card: Address Selection (Pickup & Drop-off - Image 1 & 2) */}
          <div className="border border-slate-200 rounded-2xl p-3.5 bg-white space-y-3 shadow-xs">
            {/* Điểm nhận hàng */}
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full border-2 border-slate-900 flex-shrink-0" />
              <div className="flex-1 overflow-hidden">
                <input
                  type="text"
                  value={pickup.address}
                  onChange={(e) => setPickup({ address: e.target.value })}
                  placeholder="Điểm lấy hàng..."
                  className="w-full text-xs sm:text-sm font-bold text-slate-800 truncate outline-none bg-transparent hover:text-brand-600 focus:text-slate-900"
                />
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
            </div>

            {/* Dotted divider */}
            <div className="ml-1.5 pl-4 border-l-2 border-dashed border-slate-200 h-2" />

            {/* Điểm giao hàng */}
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-sm bg-brand-500 flex-shrink-0" />
              <div className="flex-1 overflow-hidden">
                <input
                  type="text"
                  value={dropoff.address}
                  onChange={(e) => setDropoff({ address: e.target.value })}
                  placeholder="Bạn muốn giao hàng đến đâu?"
                  className="w-full text-xs sm:text-sm font-medium text-slate-700 truncate outline-none bg-transparent hover:text-brand-600 focus:text-slate-900"
                />
              </div>
              <span className="text-slate-400 font-bold">⋮</span>
            </div>
          </div>

          {/* Card: Thông tin kiện hàng * (Accordion - Image 1 & 2) */}
          <div className="border border-slate-200 rounded-2xl p-4 bg-white shadow-xs space-y-3.5">
            {/* Accordion Title */}
            <div
              onClick={() => setIsPackageInfoOpen(!isPackageInfoOpen)}
              className="flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-2 text-xs sm:text-sm font-extrabold text-slate-900">
                <Package className="w-4 h-4 text-slate-700" />
                <span>Thông tin kiện hàng *</span>
                <Info className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <button className="text-slate-400 hover:text-slate-600">
                {isPackageInfoOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>

            {isPackageInfoOpen && (
              <div className="space-y-4 pt-1 animate-fadeIn">
                {/* Kích cỡ * (Pills S, M, L, XL, 2XL, 3XL - Exactly like image) */}
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-bold text-slate-800">Kích cỡ *</span>
                    <button
                      type="button"
                      onClick={() => alert('Quy chuẩn kích thước:\nS: 25x32x12 cm\nM: 40x35x30 cm\nL: 60x50x50 cm\nXL+: Xe tải')}
                      className="text-brand-600 font-bold hover:underline"
                    >
                      Xem hàng hóa
                    </button>
                  </div>
                  <div className="text-[11px] text-slate-400 mb-2">
                    {selectedSize === 'S'
                      ? 'Tối đa 25x32x12 cm'
                      : selectedSize === 'M'
                      ? 'Tối đa 40x35x30 cm'
                      : selectedSize === 'L'
                      ? 'Tối đa 60x50x50 cm'
                      : 'Hàng cồng kềnh chở bằng xe tải'}
                  </div>

                  <div className="grid grid-cols-6 gap-1.5">
                    {(['S', 'M', 'L', 'XL', '2XL', '3XL'] as const).map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => setSelectedSize(size)}
                        className={`h-9 rounded-xl font-bold text-xs transition border ${
                          selectedSize === size
                            ? 'border-brand-500 text-brand-600 bg-orange-50 font-black shadow-xs'
                            : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Khối lượng (kg) * (Input field like image) */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">Khối lượng (kg)*</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={cargo.weightKg}
                      onChange={(e) => setCargo({ weightKg: Number(e.target.value) || 0 })}
                      placeholder="Nhập khối lượng"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-brand-500 rounded-xl text-xs sm:text-sm font-bold text-slate-800 outline-none"
                    />
                    <span className="absolute right-3.5 top-2.5 text-xs text-slate-400 font-semibold">kg</span>
                  </div>
                </div>

                {/* Loại hàng hóa * */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">Loại hàng hóa *</label>
                  <select
                    value={cargo.type}
                    onChange={(e) => setCargo({ type: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 focus:border-brand-500 rounded-xl text-xs font-semibold text-slate-800 outline-none"
                  >
                    <option value="Đồ gia dụng & Bưu kiện">Đồ gia dụng & Bưu kiện</option>
                    <option value="Thùng carton & Đồ chuyển nhà">Thùng carton & Đồ chuyển nhà</option>
                    <option value="Nội thất (Giường, Tủ, Nệm, Bàn)">Nội thất (Giường, Tủ, Nệm, Bàn)</option>
                    <option value="Thiết bị điện tử / Máy giặt / Tủ lạnh">Thiết bị điện tử / Máy giặt / Tủ lạnh</option>
                    <option value="Giấy tờ / Bưu phẩm hỏa tốc">Giấy tờ / Bưu phẩm hỏa tốc</option>
                  </select>
                </div>

                {/* AI Cargo Analysis Feature (Cốt lõi theo tài liệu SRS) */}
                <div className="p-3 rounded-xl bg-orange-50/60 border border-orange-200/80 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-extrabold text-brand-700 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-spin" style={{ animationDuration: '6s' }} />
                      <span>AI phân tích hàng hóa</span>
                    </span>
                    <span className="text-[10px] text-brand-600 bg-white px-2 py-0.5 rounded-full border border-orange-200 font-bold">
                      Khuyến nghị chuẩn
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-snug">
                    Tải lên ảnh đồ đạc, AI sẽ tự động phân tích thể tích và đề xuất xe tải phù hợp nhất.
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      triggerAiAnalysis(
                        'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=400&q=80'
                      )
                    }
                    disabled={isAiAnalyzing}
                    className="w-full py-2 bg-white hover:bg-brand-500 hover:text-white text-brand-600 text-xs font-bold rounded-lg border border-orange-300 transition flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    {isAiAnalyzing ? (
                      <div className="w-3.5 h-3.5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Upload className="w-3.5 h-3.5" />
                        <span>Chụp ảnh & Quét AI ngay</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Dịch vụ bổ sung */}
                <div>
                  <div className="text-xs font-bold text-slate-800 mb-1.5">Dịch vụ bổ sung:</div>
                  <div className="space-y-1.5 text-xs">
                    {services.map((srv) => (
                      <label
                        key={srv.id}
                        className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100 hover:border-slate-300 cursor-pointer transition"
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={srv.isSelected}
                            onChange={() => toggleService(srv.id)}
                            className="rounded text-brand-500 focus:ring-brand-500"
                          />
                          <span className="font-semibold text-slate-700">{srv.name}</span>
                        </div>
                        <span className="text-brand-600 font-bold">+{formatCurrency(srv.price)}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* FIXED BOTTOM BOOKING BAR (EXACTLY MATCHING IMAGE 1 & 2) */}
        {/* ========================================================================= */}
        <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 shadow-2xl z-30 space-y-3">
          {/* Quick Action Pills: [Hẹn giờ] [Khuyến mãi] [Người gửi trả tiền] */}
          <div className="grid grid-cols-3 gap-2">
            {/* Hẹn giờ */}
            <button
              type="button"
              onClick={() => setShowTimeModal(true)}
              className="py-2 px-2.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50 text-[11px] font-bold text-slate-700 flex items-center justify-center gap-1.5 transition truncate"
            >
              <Calendar className="w-3.5 h-3.5 text-brand-500 flex-shrink-0" />
              <span className="truncate">{deliveryTimeOption === 'NOW' ? 'Hẹn giờ' : 'Đã hẹn'}</span>
            </button>

            {/* Khuyến mãi */}
            <button
              type="button"
              onClick={() => setShowPromoModal(true)}
              className="py-2 px-2.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50 text-[11px] font-bold text-slate-700 flex items-center justify-center gap-1.5 transition truncate"
            >
              <Tag className="w-3.5 h-3.5 text-orange-500 flex-shrink-0" />
              <span className="truncate">{promoCode ? 'Đã áp mã' : 'Khuyến mãi'}</span>
            </button>

            {/* Người gửi trả */}
            <button
              type="button"
              onClick={() => setShowPaymentModal(true)}
              className="py-2 px-2.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50 text-[11px] font-bold text-slate-700 flex items-center justify-center gap-1.5 transition truncate"
            >
              <DollarSign className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
              <span className="truncate">{payerRole === 'SENDER' ? 'Người gửi trả' : 'Người nhận trả'}</span>
            </button>
          </div>

          {/* Bottom Row: Tổng phí & Nút ĐẶT ĐƠN to nổi bật */}
          <div className="flex items-center justify-between gap-4 pt-1">
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase">Tổng phí</div>
              <div className="text-lg sm:text-xl font-black text-brand-600">
                {fare.totalFee > 0 ? formatCurrency(fare.totalFee) : '- đ'}
              </div>
            </div>

            <button
              type="button"
              onClick={handleOrderSubmit}
              disabled={isSubmitting}
              className="flex-1 py-3.5 px-6 rounded-2xl bg-brand-500 hover:bg-brand-600 active:scale-98 text-white font-black text-sm sm:text-base shadow-xl shadow-orange-500/30 hover:shadow-orange-500/50 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <span>Đặt đơn</span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. FULLSCREEN INTERACTIVE MAP (WITH "< Ẩn bản đồ" BUTTON - IMAGE 1 & 2) */}
      {/* ========================================================================= */}
      <div className={`flex-1 h-full relative transition-all duration-300 ${isMapVisible ? 'block' : 'hidden'}`}>
        {/* Toggle "< Ẩn bản đồ" Button (Top-left on map - Image 1 & 2) */}
        <div className="absolute top-4 left-4 z-30">
          <button
            onClick={() => setIsMapVisible(!isMapVisible)}
            className="flex items-center gap-1.5 px-3 py-2 bg-white/95 hover:bg-white text-slate-800 rounded-xl shadow-md border border-slate-200 text-xs font-bold transition hover:scale-102"
          >
            <span>‹</span>
            <span>Ẩn bản đồ</span>
          </button>
        </div>

        {/* Map Canvas Background Simulation */}
        <div className="w-full h-full bg-[#E5EBF2] relative overflow-hidden select-none">
          {/* Simulated Street Grid & Waterway */}
          <svg className="w-full h-full absolute inset-0 opacity-80" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="street-grid" width="60" height="60" patternUnits="userSpaceOnUse">
                <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#D1DBE5" strokeWidth="1.2" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="#E9EFF5" />
            <rect width="100%" height="100%" fill="url(#street-grid)" />

            {/* Lake / Park Area (Hồ Văn Quán / Sông Nhuệ simulation like screenshot) */}
            <path
              d="M 520,380 C 580,320 680,360 740,420 C 780,480 720,560 620,580 C 540,600 480,480 520,380 Z"
              fill="#99E6E6"
              opacity="0.85"
            />
            <path
              d="M 380,120 C 420,180 430,280 410,340 C 390,420 370,520 380,680"
              fill="none"
              stroke="#A8EDE6"
              strokeWidth="28"
              strokeLinecap="round"
            />

            {/* Major Arterial Roads (Đường Trần Phú - Nguyễn Trãi) */}
            <path d="M 100,580 L 800,120" fill="none" stroke="#FFFFFF" strokeWidth="16" />
            <path d="M 100,580 L 800,120" fill="none" stroke="#B8C5D3" strokeWidth="20" opacity="0.4" />

            <path d="M 280,100 L 520,680" fill="none" stroke="#FFFFFF" strokeWidth="12" />

            {/* Route Polyline connecting points */}
            <path
              d="M 440,350 L 580,240"
              fill="none"
              stroke="#FF5400"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray="8 6"
              className="animate-pulse"
            />
          </svg>

          {/* Pickup Marker (Black pin like image) */}
          <div
            className="absolute z-20 flex flex-col items-center -translate-x-1/2 -translate-y-full"
            style={{ left: '440px', top: '350px' }}
          >
            <div className="bg-slate-900 text-white text-[11px] font-bold px-2 py-0.5 rounded shadow whitespace-nowrap mb-1">
              Điểm lấy hàng
            </div>
            <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center border-2 border-white shadow-xl">
              <MapPin className="w-4 h-4 fill-current" />
            </div>
          </div>

          {/* Active Courier Moving on Map (With Orange Helmet - Image 1 & 2) */}
          <div
            className="absolute z-20 -translate-x-1/2 -translate-y-1/2 transition-all duration-1000 animate-pulse-subtle"
            style={{ left: '500px', top: '300px' }}
          >
            <div className="relative">
              <div className="w-9 h-9 rounded-full bg-brand-500 text-white flex items-center justify-center shadow-xl border-2 border-white ring-4 ring-orange-500/30">
                <Package className="w-4 h-4" />
              </div>
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
              </span>
            </div>
          </div>

          {/* Top-Right Map Controls (Fullscreen, Zoom +, Zoom -, Location) */}
          <div className="absolute top-4 right-4 z-20 flex flex-col gap-1.5 shadow-md">
            <button className="w-9 h-9 bg-white hover:bg-slate-50 text-slate-700 rounded-t-xl border border-slate-200 flex items-center justify-center transition">
              <Maximize2 className="w-4 h-4" />
            </button>
            <button className="w-9 h-9 bg-white hover:bg-slate-50 text-slate-700 border-x border-slate-200 flex items-center justify-center transition">
              <ZoomIn className="w-4 h-4" />
            </button>
            <button className="w-9 h-9 bg-white hover:bg-slate-50 text-slate-700 border-x border-b border-slate-200 flex items-center justify-center transition">
              <ZoomOut className="w-4 h-4" />
            </button>
            <button className="w-9 h-9 bg-white hover:bg-slate-50 text-brand-500 rounded-b-xl border border-slate-200 flex items-center justify-center transition">
              <Navigation className="w-4 h-4" />
            </button>
          </div>

          {/* Bottom Watermark (Ahamove / ModMove - Image 1 & 2) */}
          <div className="absolute bottom-2 left-3 z-20 flex items-center gap-1.5 text-xs font-black text-brand-600 bg-white/70 backdrop-blur-sm px-2 py-0.5 rounded border border-white/60">
            <Truck className="w-3.5 h-3.5" />
            <span>ModMove</span>
          </div>

          <div className="absolute bottom-2 right-3 z-20 text-[10px] text-slate-500 bg-white/80 backdrop-blur-sm px-2 py-0.5 rounded border border-slate-200/60">
            Powered by ModMove • Protomaps © OpenStreetMap
          </div>
        </div>
      </div>

      {/* Button to reopen map if hidden */}
      {!isMapVisible && (
        <button
          onClick={() => setIsMapVisible(true)}
          className="fixed top-4 right-4 z-40 px-3.5 py-2 bg-white text-slate-800 rounded-xl shadow-xl border font-bold text-xs flex items-center gap-1.5 hover:bg-orange-50 transition"
        >
          <span>›</span>
          <span>Hiện bản đồ</span>
        </button>
      )}

      {/* ========================================================================= */}
      {/* 5. MODALS: ĐỔI DỊCH VỤ, HẸN GIỜ, KHUYẾN MÃI, THANH TOÁN */}
      {/* ========================================================================= */}

      {/* MODAL 1: Đổi dịch vụ */}
      {showServiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-extrabold text-base text-slate-900">Chọn dịch vụ vận chuyển</h3>
              <button onClick={() => setShowServiceModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2.5">
              {DEFAULT_VEHICLES.map((veh) => (
                <div
                  key={veh.id}
                  onClick={() => handleSelectService(veh)}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition flex items-center justify-between ${
                    selectedVehicle.id === veh.id
                      ? 'border-brand-500 bg-orange-50/60 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-100 text-brand-600 flex items-center justify-center font-bold">
                      {veh.category === 'BIKE' ? <Package className="w-5 h-5" /> : <Truck className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="font-extrabold text-xs sm:text-sm text-slate-900">{veh.name}</div>
                      <div className="text-[11px] text-slate-500">{veh.capacityText} • {veh.dimensions}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold text-brand-600">Từ {formatCurrency(veh.baseFare)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Hẹn giờ lấy hàng */}
      {showTimeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-extrabold text-base text-slate-900">Thời gian lấy hàng</h3>
              <button onClick={() => setShowTimeModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <label
                onClick={() => setDeliveryTimeOption('NOW')}
                className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer ${
                  deliveryTimeOption === 'NOW' ? 'border-brand-500 bg-orange-50 font-bold' : 'border-slate-200'
                }`}
              >
                <div className="flex items-center gap-2 text-xs">
                  <Clock className="w-4 h-4 text-brand-500" />
                  <span>Giao ngay (Có tài xế sau 15-20p)</span>
                </div>
                {deliveryTimeOption === 'NOW' && <Check className="w-4 h-4 text-brand-600" />}
              </label>

              <label
                onClick={() => setDeliveryTimeOption('SCHEDULED')}
                className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer ${
                  deliveryTimeOption === 'SCHEDULED' ? 'border-brand-500 bg-orange-50 font-bold' : 'border-slate-200'
                }`}
              >
                <div className="flex items-center gap-2 text-xs">
                  <Calendar className="w-4 h-4 text-brand-500" />
                  <span>Hẹn giờ trước</span>
                </div>
                {deliveryTimeOption === 'SCHEDULED' && <Check className="w-4 h-4 text-brand-600" />}
              </label>

              {deliveryTimeOption === 'SCHEDULED' && (
                <input
                  type="datetime-local"
                  value={scheduledDateTime}
                  onChange={(e) => setScheduledDateTime(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border rounded-xl"
                />
              )}

              <button
                type="button"
                onClick={() => setShowTimeModal(false)}
                className="w-full py-2.5 bg-brand-500 text-white rounded-xl font-bold text-xs mt-2"
              >
                Xác nhận thời gian
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Khuyến mãi */}
      {showPromoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-extrabold text-base text-slate-900">Mã khuyến mãi</h3>
              <button onClick={() => setShowPromoModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={tempVoucher}
                  onChange={(e) => setTempVoucher(e.target.value.toUpperCase())}
                  placeholder="Nhập mã ưu đãi..."
                  className="flex-1 text-xs p-2.5 bg-slate-50 border rounded-xl uppercase font-bold"
                />
                <button
                  type="button"
                  onClick={() => {
                    setPromoCode(tempVoucher);
                    setShowPromoModal(false);
                  }}
                  className="px-4 py-2.5 bg-brand-500 text-white font-bold text-xs rounded-xl"
                >
                  Áp dụng
                </button>
              </div>

              <div className="p-3 rounded-xl bg-orange-50 border border-orange-200 text-xs">
                <div className="font-bold text-brand-600">MODMOVE2026</div>
                <div className="text-[11px] text-slate-600">Giảm 25% tối đa 50.000 đ cho khách hàng đặt cuốc</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Người trả cước & Phương thức */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-extrabold text-base text-slate-900">Phương thức thanh toán</h3>
              <button onClick={() => setShowPaymentModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Bên thanh toán cước:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPayerRole('SENDER')}
                    className={`p-2.5 rounded-xl border text-center font-bold ${
                      payerRole === 'SENDER' ? 'border-brand-500 bg-orange-50 text-brand-600' : 'border-slate-200'
                    }`}
                  >
                    Người gửi trả
                  </button>
                  <button
                    type="button"
                    onClick={() => setPayerRole('RECEIVER')}
                    className={`p-2.5 rounded-xl border text-center font-bold ${
                      payerRole === 'RECEIVER' ? 'border-brand-500 bg-orange-50 text-brand-600' : 'border-slate-200'
                    }`}
                  >
                    Người nhận trả (COD)
                  </button>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Hình thức thanh toán:</label>
                <div className="space-y-1.5">
                  {[
                    { id: 'Cash', label: 'Tiền mặt khi giao/nhận' },
                    { id: 'PayOS', label: 'Quét mã VietQR PayOS' },
                    { id: 'Wallet', label: 'Trừ số dư Ví ModMove' },
                  ].map((p) => (
                    <label
                      key={p.id}
                      onClick={() => setPaymentMethod(p.id as any)}
                      className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer ${
                        paymentMethod === p.id ? 'border-brand-500 bg-orange-50 font-bold' : 'border-slate-200'
                      }`}
                    >
                      <span>{p.label}</span>
                      {paymentMethod === p.id && <Check className="w-4 h-4 text-brand-600" />}
                    </label>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowPaymentModal(false)}
                className="w-full py-2.5 bg-brand-500 text-white rounded-xl font-bold text-xs mt-2"
              >
                Lưu cài đặt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
