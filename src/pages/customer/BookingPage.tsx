import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrderStore } from '../../store/useOrderStore';
import { orderService } from '../../services/order.service';
import { DEFAULT_VEHICLES } from '../../constants';
import { formatCurrency } from '../../utils/format';
import { ShippingOrder } from '../../types/order.types';
import {
  Truck,
  MapPin,
  Clock,
  ShieldCheck,
  Check,
  Navigation,
  Sparkles,
  ChevronRight,
  ArrowRight,
  ArrowLeft,
  Tv,
  Utensils,
  Package,
  FileText,
  QrCode,
  Banknote,
  Copy,
  X,
  AlertCircle,
  RefreshCw,
  User,
  Phone,
  Upload,
  Image as ImageIcon,
  Trash2,
  Tag,
} from 'lucide-react';

export const BookingPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    pickup,
    setPickup,
    dropoff,
    setDropoff,
    selectedVehicle,
    setVehicle,
    services,
    toggleService,
    resetBooking,
  } = useOrderStore();

  // Multi-step state: 1, 2, 3, 4
  const [currentStep, setCurrentStep] = useState<number>(1);

  // 1. Cargo Category: 'ELECTRO' | 'FOOD' | 'BULKY' | 'DOCS'
  const [cargoCategory, setCargoCategory] = useState<'ELECTRO' | 'FOOD' | 'BULKY' | 'DOCS'>('ELECTRO');

  // 2. Cargo Quantity, Weight & Dimensions (SRS GB-06)
  const [cargoQuantity, setCargoQuantity] = useState<number>(1);
  const [estimatedWeight, setEstimatedWeight] = useState<number>(18.0);
  const [dimLength, setDimLength] = useState<number>(60);
  const [dimWidth, setDimWidth] = useState<number>(40);
  const [dimHeight, setDimHeight] = useState<number>(50);

  // 3. Cargo Photos (Max 5 photos - GB-06) & Special Loading Notes
  const [cargoPhotos, setCargoPhotos] = useState<string[]>([]);
  const [specialLoadingNotes, setSpecialLoadingNotes] = useState<string>('');

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      const remainingSlots = 5 - cargoPhotos.length;
      if (remainingSlots <= 0) return;

      const newPhotos: string[] = [];
      files.slice(0, remainingSlots).forEach((file) => {
        const reader = new FileReader();
        reader.onload = (uploadEvent) => {
          if (uploadEvent.target?.result) {
            setCargoPhotos((prev) => {
              if (prev.length >= 5) return prev;
              return [...prev, uploadEvent.target!.result as string];
            });
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removePhoto = (index: number) => {
    setCargoPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  // 3. Payment Method: 'TRANSFER' (VietQR PayOS) | 'CASH' (Tiền mặt COD)
  const [paymentType, setPaymentType] = useState<'TRANSFER' | 'CASH'>('TRANSFER');
  const [codPayer, setCodPayer] = useState<'SENDER' | 'RECEIVER'>('SENDER');

  // 4. Modal QR Payment state
  const [showQrModal, setShowQrModal] = useState<boolean>(false);
  const [qrCountdown, setQrCountdown] = useState<number>(900); // 15 mins (900 seconds)
  const [isVerifyingPayment, setIsVerifyingPayment] = useState<boolean>(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // 5. Submitting state
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 3. Coupon State
  const [couponCode, setCouponCode] = useState<string>('MODMOVE2026');
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>('MODMOVE2026');
  const [couponDiscount, setCouponDiscount] = useState<number>(30000);
  const [couponMessage, setCouponMessage] = useState<string | null>('Đã áp dụng mã giảm giá 30.000 đ');

  const handleApplyCoupon = () => {
    const code = couponCode.trim().toUpperCase();
    if (!code) {
      setAppliedCoupon(null);
      setCouponDiscount(0);
      setCouponMessage(null);
      return;
    }
    if (code === 'MODMOVE2026' || code === 'MODMOVE' || code === 'SALE30') {
      setAppliedCoupon(code);
      setCouponDiscount(30000);
      setCouponMessage('Áp dụng mã giảm 30.000 đ thành công!');
    } else if (code === 'VIP50' || code === 'MODMOVE50') {
      setAppliedCoupon(code);
      setCouponDiscount(50000);
      setCouponMessage('Áp dụng mã giảm 50.000 đ thành công!');
    } else {
      setAppliedCoupon(null);
      setCouponDiscount(0);
      setCouponMessage('Mã ưu đãi không hợp lệ hoặc đã hết lượt.');
    }
  };

  // Calculations
  const distanceKm = 5.4;
  const baseVehicleFare = selectedVehicle?.baseFare || 180000;
  const isLoadedServiceSelected = services.find((s) => s.id === 'srv_loading_full')?.isSelected ?? true;
  const loadingFee = isLoadedServiceSelected ? 50000 : 0;
  const subTotalBeforeDiscount = baseVehicleFare + loadingFee;
  const subTotal = Math.max(0, subTotalBeforeDiscount - couponDiscount);
  const vatAmount = Math.round(subTotal * 0.08); // 8% VAT
  const totalPayable = subTotal + vatAmount;

  // Step definitions
  const STEPS = [
    { num: 1, label: 'Tuyến trình', sub: 'Điểm đón - trả' },
    { num: 2, label: 'Hàng hóa & AI', sub: 'Nhận diện & đo kích thước' },
    { num: 3, label: 'Chọn xe tải', sub: 'Phương tiện thương mại' },
    { num: 4, label: 'Dịch vụ & Thanh toán', sub: 'Bốc xếp & hình thức' },
  ];

  // Timer for QR modal
  useEffect(() => {
    let timer: any;
    if (showQrModal && qrCountdown > 0) {
      timer = setInterval(() => setQrCountdown((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [showQrModal, qrCountdown]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Click "Xác nhận & Đặt xe"
  const handleConfirmOrder = () => {
    if (paymentType === 'TRANSFER') {
      // Show VietQR payment modal
      setShowQrModal(true);
      setQrCountdown(900);
    } else {
      // Cash payment -> directly submit and go find driver
      executeOrderSubmission('Unpaid');
    }
  };

  // Confirm transfer from QR modal
  const handleConfirmTransferPaid = async () => {
    setIsVerifyingPayment(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsVerifyingPayment(false);
    setShowQrModal(false);
    executeOrderSubmission('Paid');
  };

  // Submit order to store & navigate
  const executeOrderSubmission = async (paymentStatus: 'Paid' | 'Unpaid') => {
    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 600));

    const newOrder: ShippingOrder = {
      id: `ord_${Date.now()}`,
      code: `MM-${Math.floor(10000 + Math.random() * 90000)}`,
      customerName: pickup.contactName || 'Khách hàng ModMove',
      customerPhone: pickup.contactPhone || '0902441999',
      pickup: {
        ...pickup,
        address: pickup.address || '285 Cách Mạng Tháng 8, P.12, Q.10, TP. Hồ Chí Minh',
      },
      dropoff: {
        ...dropoff,
        address: dropoff.address || '142 Hai Bà Trưng, P. Bến Nghé, Q.1, TP. Hồ Chí Minh',
      },
      vehicle: selectedVehicle,
      cargo: {
        name:
          cargoCategory === 'ELECTRO'
            ? 'Thiết bị điện tử & Nội thất văn phòng'
            : cargoCategory === 'FOOD'
            ? 'Thực phẩm / Bách hóa tiêu dùng'
            : cargoCategory === 'BULKY'
            ? 'Hàng cồng kềnh quá khổ'
            : 'Tài liệu / Bưu phẩm',
        weightKg: estimatedWeight,
        quantity: cargoQuantity,
        dimensions: `${dimLength} × ${dimWidth} × ${dimHeight} cm`,
        images: cargoPhotos,
        aiNotes: specialLoadingNotes
          ? `Ghi chú bốc xếp: ${specialLoadingNotes}. Thùng carton 5 lớp gia cố.`
          : 'Thùng carton 5 lớp gia cố. Phù hợp xếp khoang thùng bán tải hoặc van.',
      },
      additionalServices: services.filter((s) => s.isSelected),
      totalDistanceKm: distanceKm,
      estimatedDurationMins: 18,
      baseFee: baseVehicleFare,
      distanceFee: 0,
      servicesFee: loadingFee,
      discountFee: 0,
      totalFee: totalPayable,
      codAmount: paymentType === 'CASH' ? totalPayable : 0,
      status: 'PlaceOrder', // Sẽ đi tìm tài xế
      paymentMethod: paymentType === 'TRANSFER' ? 'PayOS' : 'Cash',
      paymentStatus: paymentStatus,
      createdAt: new Date().toISOString(),
    };

    orderService.saveOrder(newOrder);
    setIsSubmitting(false);
    resetBooking();
    navigate('/orders');
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50/70 select-none overflow-y-auto font-sans min-w-0">
      {/* ========================================================================= */}
      {/* 1. HEADER BANNER */}
      {/* ========================================================================= */}
      <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between gap-4 flex-shrink-0 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-brand-500 text-white flex items-center justify-center shadow-xs flex-shrink-0">
            <Truck className="w-4 h-4" />
          </div>
          <h1 className="text-base font-extrabold text-slate-900 tracking-tight">
            Đặt xe Vận chuyển
          </h1>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. STEPPER PROGRESS TABS (1 -> 2 -> 3 -> 4) */}
      {/* ========================================================================= */}
      <div className="bg-white border-b border-slate-200 px-6 py-3 flex-shrink-0">
        <div className="max-w-[1680px] mx-auto grid grid-cols-2 sm:grid-cols-4 gap-2">
          {STEPS.map((s) => {
            const isActive = currentStep === s.num;
            const isCompleted = currentStep > s.num;

            return (
              <button
                key={s.num}
                type="button"
                onClick={() => setCurrentStep(s.num)}
                className={`flex items-center gap-2.5 p-2 sm:p-2.5 rounded-xl border text-left transition cursor-pointer ${
                  isActive
                    ? 'border-brand-500 bg-orange-50/40 text-slate-900 shadow-xs ring-1 ring-brand-500/20'
                    : isCompleted
                    ? 'border-slate-200 bg-slate-50/80 text-slate-700 hover:bg-slate-100'
                    : 'border-slate-200/70 bg-white text-slate-400 hover:bg-slate-50'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-lg flex items-center justify-center font-black text-xs flex-shrink-0 transition ${
                    isActive
                      ? 'bg-brand-500 text-white shadow-xs'
                      : isCompleted
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {isCompleted ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : s.num}
                </div>
                <div className="overflow-hidden min-w-0">
                  <div
                    className={`font-extrabold text-xs truncate ${
                      isActive ? 'text-brand-600' : isCompleted ? 'text-slate-800' : 'text-slate-600'
                    }`}
                  >
                    Bước {s.num}: {s.label}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate hidden sm:block">
                    {s.sub}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. MAIN CONTENT: STEP CONTENT (LEFT) + LIVE MAP & FARE (RIGHT) */}
      {/* ========================================================================= */}
      <div className="p-3 sm:p-5 max-w-[1720px] w-full mx-auto flex-1 min-w-0">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-5 items-start">
          {/* ===================================================================== */}
          {/* FORM COLUMN: Cân đối 5-6 cột, min-w-0 chống tràn */}
          {/* ===================================================================== */}
          <div className="lg:col-span-6 xl:col-span-5 space-y-4 min-w-0">
            {/* ------------------------------------------------------------------- */}
            {/* BƯỚC 01: Tuyến trình & Điểm đón - trả */}
            {/* ------------------------------------------------------------------- */}
            {currentStep === 1 && (
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4 animate-slideRight">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-md bg-brand-500 text-white font-black text-xs flex items-center justify-center">
                      01
                    </span>
                    <h2 className="font-extrabold text-sm sm:text-base text-slate-900">
                      Tuyến trình & Điểm đón - trả
                    </h2>
                  </div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    P2P DIRECT ROUTE
                  </span>
                </div>

                {/* Point A: Điểm lấy hàng */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 font-bold text-slate-800">
                      <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[11px] font-black flex items-center justify-center">
                        A
                      </span>
                      <span>Điểm lấy hàng (Pick-up)</span>
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono">Geocoded • Lat 10.7769</span>
                  </div>

                  {/* Địa chỉ lấy hàng */}
                  <div className="relative">
                    <input
                      type="text"
                      value={pickup.address}
                      onChange={(e) => setPickup({ address: e.target.value })}
                      placeholder="285 Cách Mạng Tháng 8, P.12, Q.10, TP.HCM..."
                      className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-slate-800 focus:bg-white focus:border-brand-500 outline-none transition"
                    />
                    <button
                      type="button"
                      title="Chọn địa chỉ trên bản đồ"
                      className="w-7 h-7 rounded-lg hover:bg-slate-200/70 flex items-center justify-center absolute right-2 top-1/2 -translate-y-1/2 text-brand-600 transition cursor-pointer"
                    >
                      <MapPin className="w-4 h-4 fill-brand-500/20 text-brand-600" />
                    </button>
                  </div>

                  {/* Ô nhập Tên người gửi & Số điện thoại người gửi */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="relative">
                      <input
                        type="text"
                        value={pickup.contactName || ''}
                        onChange={(e) => setPickup({ contactName: e.target.value })}
                        placeholder="Họ & tên người gửi (Kho Tân Bình)..."
                        className="w-full pl-8 pr-3 py-2 bg-slate-50/80 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:bg-white focus:border-brand-500 outline-none transition"
                      />
                      <User className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    </div>

                    <div className="relative">
                      <input
                        type="tel"
                        value={pickup.contactPhone || ''}
                        onChange={(e) => setPickup({ contactPhone: e.target.value })}
                        placeholder="Số điện thoại người gửi (0902441999)..."
                        className="w-full pl-8 pr-3 py-2 bg-slate-50/80 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:bg-white focus:border-brand-500 outline-none transition"
                      />
                      <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>

                  {/* Ghi chú điểm lấy */}
                  <div className="relative">
                    <input
                      type="text"
                      value={pickup.note || ''}
                      onChange={(e) => setPickup({ note: e.target.value })}
                      placeholder="Ghi chú lấy hàng: Cửa hầm B1, thang máy hàng..."
                      className="w-full px-3 py-1.5 bg-white border border-dashed border-slate-200 rounded-lg text-[11px] text-slate-600 focus:border-brand-500 outline-none transition placeholder:text-slate-400"
                    />
                  </div>
                </div>

                {/* Divider */}
                <div className="flex items-center justify-center gap-2 py-0.5 text-[11px] font-bold text-slate-400">
                  <span className="w-12 h-[1px] bg-slate-200" />
                  <span>• DIRECT NON-STOP PASSAGE [5.4 km] •</span>
                  <span className="w-12 h-[1px] bg-slate-200" />
                </div>

                {/* Point B: Điểm giao hàng */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 font-bold text-slate-800">
                      <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-[11px] font-black flex items-center justify-center">
                        B
                      </span>
                      <span>Điểm giao hàng (Drop-off)</span>
                    </div>
                    <span className="text-[11px] text-brand-600 font-bold">ETA: 18 phút</span>
                  </div>

                  {/* Địa chỉ giao hàng */}
                  <div className="relative">
                    <input
                      type="text"
                      value={dropoff.address}
                      onChange={(e) => setDropoff({ address: e.target.value })}
                      placeholder="Chung cư Vinhomes Smart City, Tây Mỗ, Nam Từ Liêm, Hà Nội..."
                      className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-slate-800 focus:bg-white focus:border-brand-500 outline-none transition"
                    />
                    <button
                      type="button"
                      title="Chọn địa chỉ trên bản đồ"
                      className="w-7 h-7 rounded-lg hover:bg-slate-200/70 flex items-center justify-center absolute right-2 top-1/2 -translate-y-1/2 text-blue-600 transition cursor-pointer"
                    >
                      <MapPin className="w-4 h-4 fill-blue-500/20 text-blue-600" />
                    </button>
                  </div>

                  {/* Ô nhập Tên người nhận & Số điện thoại người nhận */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="relative">
                      <input
                        type="text"
                        value={dropoff.contactName || ''}
                        onChange={(e) => setDropoff({ contactName: e.target.value })}
                        placeholder="Họ & tên người nhận (Công ty Mod)..."
                        className="w-full pl-8 pr-3 py-2 bg-slate-50/80 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:bg-white focus:border-brand-500 outline-none transition"
                      />
                      <User className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    </div>

                    <div className="relative">
                      <input
                        type="tel"
                        value={dropoff.contactPhone || ''}
                        onChange={(e) => setDropoff({ contactPhone: e.target.value })}
                        placeholder="Số điện thoại người nhận (0938119888)..."
                        className="w-full pl-8 pr-3 py-2 bg-slate-50/80 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:bg-white focus:border-brand-500 outline-none transition"
                      />
                      <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>

                  {/* Ghi chú điểm giao */}
                  <div className="relative">
                    <input
                      type="text"
                      value={dropoff.note || ''}
                      onChange={(e) => setDropoff({ note: e.target.value })}
                      placeholder="Ghi chú giao hàng: Gọi trước khi đến 15 phút, tòa S2..."
                      className="w-full px-3 py-1.5 bg-white border border-dashed border-slate-200 rounded-lg text-[11px] text-slate-600 focus:border-brand-500 outline-none transition placeholder:text-slate-400"
                    />
                  </div>
                </div>

                {/* Step 1 Actions */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs sm:text-sm flex items-center gap-2 transition cursor-pointer shadow-md shadow-slate-900/15"
                  >
                    <span>Tiếp</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------------- */}
            {/* BƯỚC 02: Thông tin hàng hóa & Nhận diện AI */}
            {/* ------------------------------------------------------------------- */}
            {currentStep === 2 && (
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4 animate-slideRight">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-md bg-brand-500 text-white font-black text-xs flex items-center justify-center">
                      02
                    </span>
                    <h2 className="font-extrabold text-sm sm:text-base text-slate-900">
                      Thông tin hàng hóa & Nhận diện AI
                    </h2>
                  </div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    SENSOR TELEMETRY
                  </span>
                </div>

                {/* 1. Loại hàng hóa (CargoType) */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-slate-700">
                      1. Loại hàng hóa (CargoType)
                    </label>
                    <span className="text-[10px] text-slate-400 font-medium">Bắt buộc</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {[
                      { id: 'ELECTRO', label: 'Điện tử & Nội thất', icon: Tv },
                      { id: 'FOOD', label: 'Thực phẩm / Bách hóa', icon: Utensils },
                      { id: 'BULKY', label: 'Hàng cồng kềnh', icon: Package },
                      { id: 'DOCS', label: 'Tài liệu / Bưu phẩm', icon: FileText },
                    ].map((cat) => {
                      const isSelected = cargoCategory === cat.id;
                      const IconComp = cat.icon;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setCargoCategory(cat.id as any)}
                          className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition text-center cursor-pointer ${
                            isSelected
                              ? 'bg-slate-950 text-white border-slate-950 shadow-md ring-1 ring-slate-900/20'
                              : 'bg-slate-50/80 hover:bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          <IconComp className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-slate-500'}`} />
                          <span className="text-[11px] font-bold leading-tight">{cat.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Số lượng, Trọng lượng & Kích thước hàng hóa (Quantity, CargoWeight, CargoDimensions) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                  {/* Số lượng (Quantity) */}
                  <div className="bg-slate-50/90 border border-slate-200 rounded-xl p-3 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">
                        2. Số lượng
                      </span>
                      <div className="flex items-baseline gap-1.5 mt-1">
                        <input
                          type="number"
                          min="1"
                          max="999"
                          value={cargoQuantity}
                          onChange={(e) => setCargoQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                          className="text-xl font-black text-slate-900 bg-transparent w-12 outline-none border-b border-dashed border-slate-300 focus:border-brand-500"
                        />
                        <span className="text-[11px] font-semibold text-slate-500">Kiện/Thùng</span>
                      </div>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1.5 font-medium">
                      Quy cách đóng gói
                    </div>
                  </div>

                  {/* Trọng lượng hàng (CargoWeight) */}
                  <div className="bg-slate-50/90 border border-slate-200 rounded-xl p-3 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">
                        3. Trọng lượng
                      </span>
                      <div className="flex items-baseline gap-1 mt-1">
                        <input
                          type="number"
                          min="0.5"
                          step="0.5"
                          value={estimatedWeight}
                          onChange={(e) => setEstimatedWeight(Number(e.target.value) || 0)}
                          className="text-xl font-black text-slate-900 bg-transparent w-14 outline-none border-b border-dashed border-slate-300 focus:border-brand-500"
                        />
                        <span className="text-[11px] font-semibold text-slate-500">Kilogram (kg)</span>
                      </div>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1.5 font-medium truncate">
                      Tối đa: 800 kg
                    </div>
                  </div>

                  {/* Kích thước hàng (CargoDimensions) */}
                  <div className="bg-slate-50/90 border border-slate-200 rounded-xl p-3 flex flex-col justify-between min-w-0">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">
                        4. Kích thước (D×R×C)
                      </span>
                      <div className="flex items-center gap-1 mt-1 flex-wrap">
                        <input
                          type="number"
                          value={dimLength}
                          onChange={(e) => setDimLength(Number(e.target.value) || 0)}
                          className="w-9 px-0.5 py-0.5 bg-white border border-slate-200 rounded text-center text-[11px] font-bold text-slate-900 outline-none focus:border-brand-500"
                          title="Dài (cm)"
                        />
                        <span className="text-[10px] text-slate-400">×</span>
                        <input
                          type="number"
                          value={dimWidth}
                          onChange={(e) => setDimWidth(Number(e.target.value) || 0)}
                          className="w-9 px-0.5 py-0.5 bg-white border border-slate-200 rounded text-center text-[11px] font-bold text-slate-900 outline-none focus:border-brand-500"
                          title="Rộng (cm)"
                        />
                        <span className="text-[10px] text-slate-400">×</span>
                        <input
                          type="number"
                          value={dimHeight}
                          onChange={(e) => setDimHeight(Number(e.target.value) || 0)}
                          className="w-9 px-0.5 py-0.5 bg-white border border-slate-200 rounded text-center text-[11px] font-bold text-slate-900 outline-none focus:border-brand-500"
                          title="Cao (cm)"
                        />
                        <span className="text-[10px] text-slate-500 font-bold">cm</span>
                      </div>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1.5 font-medium truncate">
                      Thể tích: {((dimLength * dimWidth * dimHeight) / 1000000).toFixed(3)} m³
                    </div>
                  </div>
                </div>

                {/* 5. Hình ảnh hàng hóa (CargoPhoto) - Tối đa 5 ảnh (GB-06) */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between text-xs">
                    <label className="font-bold text-slate-700 flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5 text-brand-600" />
                      <span>5. Hình ảnh hàng hóa (CargoPhoto)</span>
                    </label>
                    <span className="text-[11px] text-slate-500 font-medium">
                      Đã tải: <strong className="text-slate-800">{cargoPhotos.length}/5</strong> ảnh (GB-06)
                    </span>
                  </div>

                  {/* Photo grid & Upload trigger */}
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
                    {cargoPhotos.map((photoUrl, idx) => (
                      <div
                        key={idx}
                        className="relative group aspect-square rounded-xl overflow-hidden border border-slate-200 shadow-xs bg-slate-100"
                      >
                        <img
                          src={photoUrl}
                          alt={`Cargo ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removePhoto(idx)}
                          className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                        <span className="absolute bottom-1 left-1 bg-slate-900/80 text-[9px] font-bold text-white px-1 py-0.2 rounded">
                          #{idx + 1}
                        </span>
                      </div>
                    ))}

                    {/* Add Photo Button (If less than 5) */}
                    {cargoPhotos.length < 5 && (
                      <label className="aspect-square rounded-xl border-2 border-dashed border-slate-300 hover:border-brand-500 bg-slate-50/70 hover:bg-orange-50/30 flex flex-col items-center justify-center gap-1 text-slate-500 hover:text-brand-600 transition cursor-pointer">
                        <Upload className="w-4 h-4" />
                        <span className="text-[10px] font-bold">Thêm ảnh</span>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handlePhotoUpload}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 leading-tight">
                    * Định dạng JPG, PNG. Chụp rõ bao bì kiện hàng giúp tài xế và AI tính toán không gian khoang xe tối ưu.
                  </p>
                </div>

                {/* 6. Ghi chú bốc xếp đặc biệt (SpecialLoadingNotes) */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-xs">
                    <label className="font-bold text-slate-700">
                      6. Ghi chú bốc xếp đặc biệt (SpecialLoadingNotes)
                    </label>
                    <span className="text-[10px] text-slate-400">Tùy chọn</span>
                  </div>
                  <input
                    type="text"
                    value={specialLoadingNotes}
                    onChange={(e) => setSpecialLoadingNotes(e.target.value)}
                    placeholder="VD: Hàng dễ vỡ, không được lật úp, có thang máy hàng ở sảnh B..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-brand-500 outline-none transition"
                  />
                </div>

                {/* Step 2 Actions */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-2 transition cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Quay lại</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCurrentStep(3)}
                    className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs sm:text-sm flex items-center gap-2 transition cursor-pointer shadow-md shadow-slate-900/15"
                  >
                    <span>Tiếp</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------------- */}
            {/* BƯỚC 03: Phương tiện vận chuyển thương mại */}
            {/* ------------------------------------------------------------------- */}
            {currentStep === 3 && (
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4 animate-slideRight">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-md bg-brand-500 text-white font-black text-xs flex items-center justify-center">
                      03
                    </span>
                    <h2 className="font-extrabold text-sm sm:text-base text-slate-900">
                      Phương tiện vận chuyển thương mại
                    </h2>
                  </div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    TRUCK DISPATCH
                  </span>
                </div>

                {/* 2 Truck Radio Options */}
                <div className="space-y-3">
                  {DEFAULT_VEHICLES.map((veh) => {
                    const isSelected = selectedVehicle?.id === veh.id;
                    return (
                      <div
                        key={veh.id}
                        onClick={() => setVehicle(veh)}
                        className={`p-4 rounded-xl border-2 transition cursor-pointer flex items-center justify-between gap-3 ${
                          isSelected
                            ? 'border-brand-500 bg-orange-50/30 shadow-xs'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-3.5 flex-1 min-w-0">
                          <div
                            className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                              isSelected ? 'border-brand-500' : 'border-slate-300'
                            }`}
                          >
                            {isSelected && <div className="w-2 h-2 rounded-full bg-brand-500" />}
                          </div>

                          <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center flex-shrink-0">
                            <Truck className="w-5 h-5" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-extrabold text-xs sm:text-sm text-slate-900">
                                {veh.name}
                              </span>
                              {veh.isAiRecommended && (
                                <span className="bg-slate-900 text-white text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider">
                                  GỢI Ý AI TỐI ƯU
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 truncate mt-0.5">
                              {veh.tag}
                            </div>
                            <div className="text-[10px] text-slate-400 font-medium">
                              {veh.capacityText}
                            </div>
                          </div>
                        </div>

                        <div className="text-right flex-shrink-0">
                          <div className="text-sm sm:text-base font-black text-slate-900">
                            {formatCurrency(veh.baseFare)}
                          </div>
                          <div className="text-[10px] text-slate-400 font-medium">Cước cơ bản</div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Step 3 Actions */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-2 transition cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Quay lại</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCurrentStep(4)}
                    className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs sm:text-sm flex items-center gap-2 transition cursor-pointer shadow-md shadow-slate-900/15"
                  >
                    <span>Tiếp</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------------- */}
            {/* BƯỚC 04: Dịch vụ bổ sung & Hình thức thanh toán */}
            {/* ------------------------------------------------------------------- */}
            {currentStep === 4 && (
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-5 animate-slideRight">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-md bg-brand-500 text-white font-black text-xs flex items-center justify-center">
                      04
                    </span>
                    <h2 className="font-extrabold text-sm sm:text-base text-slate-900">
                      Dịch vụ bổ sung & Hình thức thanh toán
                    </h2>
                  </div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    PAYMENT & DISPATCH
                  </span>
                </div>

                {/* 1. Dịch vụ bốc xếp */}
                <div>
                  <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    1. Dịch vụ hỗ trợ khuân vác
                  </div>
                  <div
                    onClick={() => toggleService('srv_loading_full')}
                    className={`p-4 rounded-xl border-2 transition cursor-pointer flex items-start justify-between gap-3.5 ${
                      isLoadedServiceSelected
                        ? 'border-brand-500 bg-orange-50/20 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-5 h-5 rounded-md border mt-0.5 flex items-center justify-center flex-shrink-0 transition ${
                          isLoadedServiceSelected
                            ? 'bg-slate-950 border-slate-950 text-white'
                            : 'border-slate-300 bg-white'
                        }`}
                      >
                        {isLoadedServiceSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>

                      <div>
                        <div className="font-extrabold text-xs sm:text-sm text-slate-900">
                          Bốc xếp tận nơi (Loading / Unloading)
                        </div>
                        <div className="text-[11px] text-slate-500 leading-relaxed mt-0.5">
                          Tài xế và phụ xe hỗ trợ khuân vác, bốc dỡ hàng hóa cẩn thận tại 2 đầu (Điểm lấy và Điểm giao hàng).
                        </div>
                        <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-semibold">
                          <span>✓ Thang bộ ≤ Tầng 2 hoặc có thang máy hàng</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <div className="text-sm font-extrabold text-slate-900">+50.000 đ</div>
                      <div className="text-[10px] text-slate-400 font-medium">Trọn gói 2 đầu</div>
                    </div>
                  </div>
                </div>

                {/* 2. MÃ ƯU ĐÃI / KHUYẾN MÃI (COUPON) */}
                <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <label className="font-bold text-slate-700 flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-brand-600" />
                      <span>2. Mã ưu đãi / Khuyến mãi (Coupon)</span>
                    </label>
                    {appliedCoupon && (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        ĐÃ ÁP DỤNG: -{formatCurrency(couponDiscount)}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        placeholder="Nhập mã ưu đãi (MODMOVE2026, VIP50)..."
                        className="w-full pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold uppercase tracking-wider text-slate-800 placeholder:normal-case placeholder:font-normal placeholder:text-slate-400 focus:border-brand-500 outline-none transition"
                      />
                      <Tag className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    </div>

                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg transition cursor-pointer shadow-xs whitespace-nowrap"
                    >
                      Áp dụng
                    </button>
                  </div>

                  {couponMessage && (
                    <div
                      className={`text-[11px] font-medium flex items-center gap-1.5 ${
                        appliedCoupon ? 'text-emerald-700' : 'text-rose-600'
                      }`}
                    >
                      <span>{appliedCoupon ? '✓' : '⚠️'}</span>
                      <span>{couponMessage}</span>
                    </div>
                  )}
                </div>

                {/* 3. Lựa chọn phương thức thanh toán (Tiền mặt hay Chuyển khoản) */}
                <div>
                  <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    3. Lựa chọn phương thức thanh toán
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Option A: Chuyển khoản VietQR */}
                    <div
                      onClick={() => setPaymentType('TRANSFER')}
                      className={`p-4 rounded-xl border-2 transition cursor-pointer flex flex-col justify-between gap-3 ${
                        paymentType === 'TRANSFER'
                          ? 'border-brand-500 bg-orange-50/30 shadow-xs ring-1 ring-brand-500/20'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-orange-100 text-brand-600 flex items-center justify-center flex-shrink-0 font-bold">
                            <QrCode className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-extrabold text-xs sm:text-sm text-slate-900">
                              Chuyển khoản VietQR (PayOS)
                            </div>
                            <span className="text-[10px] text-brand-600 font-bold">
                              Hiện mã QR thanh toán ngay
                            </span>
                          </div>
                        </div>
                        <div
                          className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                            paymentType === 'TRANSFER' ? 'border-brand-500' : 'border-slate-300'
                          }`}
                        >
                          {paymentType === 'TRANSFER' && <div className="w-2 h-2 rounded-full bg-brand-500" />}
                        </div>
                      </div>

                      <div className="text-[11px] text-slate-500 leading-relaxed bg-white/80 p-2 rounded-lg border border-slate-100">
                        Quét mã QR qua app ngân hàng (MBBank, Vietcombank...). Sau khi xác nhận tiền sẽ tự động tìm tài xế.
                      </div>
                    </div>

                    {/* Option B: Tiền mặt COD */}
                    <div
                      onClick={() => setPaymentType('CASH')}
                      className={`p-4 rounded-xl border-2 transition cursor-pointer flex flex-col justify-between gap-3 ${
                        paymentType === 'CASH'
                          ? 'border-brand-500 bg-orange-50/30 shadow-xs ring-1 ring-brand-500/20'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0 font-bold">
                            <Banknote className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-extrabold text-xs sm:text-sm text-slate-900">
                              Thanh toán tiền mặt (COD)
                            </div>
                            <span className="text-[10px] text-emerald-700 font-bold">
                              Đi tìm tài xế ngay lập tức
                            </span>
                          </div>
                        </div>
                        <div
                          className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                            paymentType === 'CASH' ? 'border-brand-500' : 'border-slate-300'
                          }`}
                        >
                          {paymentType === 'CASH' && <div className="w-2 h-2 rounded-full bg-brand-500" />}
                        </div>
                      </div>

                      <div className="text-[11px] text-slate-500 leading-relaxed bg-white/80 p-2 rounded-lg border border-slate-100">
                        Thanh toán cước phí trực tiếp cho tài xế xe tải khi giao nhận hàng hóa.
                      </div>
                    </div>
                  </div>

                  {/* Sub-selector if COD: Người gửi hay Người nhận trả */}
                  {paymentType === 'CASH' && (
                    <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <span className="font-bold text-slate-700">Người thanh toán tiền mặt:</span>
                      <div className="flex items-center gap-2">
                        <label
                          onClick={() => setCodPayer('SENDER')}
                          className={`px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer transition ${
                            codPayer === 'SENDER'
                              ? 'bg-white border-brand-500 text-brand-600 font-bold shadow-xs'
                              : 'border-slate-200 bg-white/60 text-slate-600'
                          }`}
                        >
                          Người gửi trả (Điểm lấy hàng)
                        </label>
                        <label
                          onClick={() => setCodPayer('RECEIVER')}
                          className={`px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer transition ${
                            codPayer === 'RECEIVER'
                              ? 'bg-white border-brand-500 text-brand-600 font-bold shadow-xs'
                              : 'border-slate-200 bg-white/60 text-slate-600'
                          }`}
                        >
                          Người nhận trả (Điểm giao hàng)
                        </label>
                      </div>
                    </div>
                  )}
                </div>

                {/* 4. BẢNG KÊ CƯỚC PHÍ VẬN CHUYỂN (Hiển thị ngay phía dưới lựa chọn thanh toán) */}
                <div className="bg-gradient-to-b from-slate-50 to-orange-50/20 border-2 border-brand-500/30 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
                  <div className="flex items-center justify-between pb-2.5 border-b border-slate-200/80">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-brand-500 animate-pulse" />
                      <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
                        Bảng kê cước phí vận chuyển
                      </h3>
                    </div>
                    <span className="bg-brand-50 text-brand-700 text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-brand-200">
                      MOD-RATE-FINAL
                    </span>
                  </div>

                  {/* Breakdown Rows */}
                  <div className="space-y-2.5 text-xs">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-bold text-slate-800">Cước xe cơ bản</div>
                        <div className="text-[11px] text-slate-400">
                          {selectedVehicle.name} • 5.4 km
                        </div>
                      </div>
                      <span className="font-extrabold text-slate-900">
                        {formatCurrency(baseVehicleFare)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-bold text-slate-800">Phụ phí bốc xếp 2 đầu</div>
                        <div className="text-[11px] text-slate-400">
                          {isLoadedServiceSelected
                            ? 'Khuân vác tận nơi (Kho CMT8 - Hai Bà Trưng)'
                            : 'Không chọn bốc xếp'}
                        </div>
                      </div>
                      <span className="font-extrabold text-slate-900">
                        {formatCurrency(loadingFee)}
                      </span>
                    </div>

                    {appliedCoupon && couponDiscount > 0 && (
                      <div className="flex items-center justify-between text-emerald-700 bg-emerald-50/80 px-2 py-1.5 rounded-lg border border-emerald-200/80">
                        <div className="flex items-center gap-1.5">
                          <Tag className="w-3.5 h-3.5" />
                          <span className="font-bold">Ưu đãi giảm giá ({appliedCoupon})</span>
                        </div>
                        <span className="font-extrabold">
                          -{formatCurrency(couponDiscount)}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-slate-500">
                      <div className="text-[11px]">Thuế giá trị gia tăng (VAT 8%)</div>
                      <span className="font-semibold text-slate-700">
                        {formatCurrency(vatAmount)}
                      </span>
                    </div>

                    {/* Selected payment badge */}
                    <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">Phương thức thanh toán:</span>
                      <span className="font-bold text-brand-600 flex items-center gap-1.5">
                        {paymentType === 'TRANSFER' ? (
                          <>
                            <QrCode className="w-3.5 h-3.5" />
                            <span>Chuyển khoản VietQR (Hiện mã QR)</span>
                          </>
                        ) : (
                          <>
                            <Banknote className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-emerald-700">
                              Tiền mặt COD ({codPayer === 'SENDER' ? 'Người gửi trả' : 'Người nhận trả'})
                            </span>
                          </>
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Total Payable Box */}
                  <div className="pt-3 border-t border-slate-200 space-y-1">
                    <div className="flex items-baseline justify-between">
                      <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                        Tổng cước phí thanh toán
                      </span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl sm:text-3xl font-black text-slate-950">
                          {totalPayable.toLocaleString('vi-VN')}
                        </span>
                        <span className="text-xs font-bold text-slate-500">VNĐ</span>
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium">
                      Đã bao gồm thuế VAT • Không phát sinh phụ phí ẩn
                    </p>
                  </div>

                  {/* Action buttons with 'Đặt Đơn' */}
                  <div className="pt-2 flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(3)}
                      className="px-4 py-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-2 transition cursor-pointer"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Quay lại</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleConfirmOrder}
                      disabled={isSubmitting}
                      className="flex-1 py-3.5 px-6 rounded-xl bg-brand-500 hover:bg-brand-600 active:scale-98 text-white font-extrabold text-sm sm:text-base transition-all flex items-center justify-center gap-2 shadow-lg shadow-orange-500/25 cursor-pointer"
                    >
                      {isSubmitting ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <span className="tracking-wide">
                            {paymentType === 'TRANSFER'
                              ? 'Đặt Đơn & Hiện mã QR'
                              : 'Đặt Đơn (Tìm tài xế)'}
                          </span>
                          <ChevronRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>

                  {/* Operational hint */}
                  <div className="text-[10px] text-center text-slate-500 font-medium pt-1">
                    {paymentType === 'TRANSFER'
                      ? '✦ Sau khi ấn Đặt Đơn, màn hình quét mã QR sẽ hiện lên để bạn chuyển khoản.'
                      : '✦ Đơn hàng sẽ vào trạng thái Đang tìm tài xế (Pending) ngay lập tức.'}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ===================================================================== */}
          {/* MAP & RIGHT COLUMN: Mở rộng 6-7 COLS cho bản đồ toàn cảnh, không bị đè */}
          {/* ===================================================================== */}
          <div className="lg:col-span-6 xl:col-span-7 space-y-4 min-w-0">
            {/* ------------------------------------------------------------------- */}
            {/* CARD 1: Bản đồ lộ trình thực địa toàn cảnh (Expanded View) */}
            {/* ------------------------------------------------------------------- */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3 overflow-hidden">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2 font-extrabold text-xs sm:text-sm text-slate-900">
                  <span>🗺</span>
                  <span>Bản đồ lộ trình thực địa</span>
                </div>
                <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  <span>LIVE TRAFFIC: NORMAL</span>
                </span>
              </div>

              {/* Responsive Map Canvas (SVG with viewBox so it resizes fluidly on any screen width) */}
              <div className="w-full h-[320px] sm:h-[400px] bg-[#E9EFF5] rounded-xl relative overflow-hidden border border-slate-200 select-none shadow-inner">
                <svg
                  className="w-full h-full absolute inset-0"
                  viewBox="0 0 700 380"
                  preserveAspectRatio="xMidYMid slice"
                >
                  <defs>
                    <pattern id="city-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#D1DBE5" strokeWidth="1" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="#E9EFF5" />
                  <rect width="100%" height="100%" fill="url(#city-grid)" />

                  {/* Water canals / Lake simulation */}
                  <path
                    d="M 140,0 C 220,110 260,220 230,380"
                    fill="none"
                    stroke="#B4E5F0"
                    strokeWidth="32"
                    strokeLinecap="round"
                  />

                  {/* Major Avenue / Roads */}
                  <path d="M 0,260 L 700,90" fill="none" stroke="#FFFFFF" strokeWidth="16" />
                  <path d="M 0,260 L 700,90" fill="none" stroke="#CBD5E1" strokeWidth="20" opacity="0.4" />
                  <path d="M 200,0 L 520,380" fill="none" stroke="#FFFFFF" strokeWidth="14" />
                  <path d="M 60,380 L 620,0" fill="none" stroke="#FFFFFF" strokeWidth="10" />

                  {/* Active Route Path */}
                  <path
                    d="M 210,210 Q 330,170 500,130"
                    fill="none"
                    stroke="#FF5400"
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray="8 5"
                    className="animate-pulse"
                  />

                  {/* Marker A */}
                  <g transform="translate(210, 210)">
                    <circle r="14" fill="#0F172A" />
                    <text x="0" y="5" textAnchor="middle" fill="#FFFFFF" fontSize="11" fontWeight="bold">
                      A
                    </text>
                  </g>

                  {/* Marker B */}
                  <g transform="translate(500, 130)">
                    <circle r="14" fill="#FF5400" />
                    <text x="0" y="5" textAnchor="middle" fill="#FFFFFF" fontSize="11" fontWeight="bold">
                      B
                    </text>
                  </g>
                </svg>

                {/* Floating Labels over Map */}
                <div className="absolute top-3 left-3 bg-slate-900/90 backdrop-blur-xs text-white text-[11px] font-bold px-2.5 py-1 rounded-lg shadow flex items-center gap-1.5 border border-slate-700">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>A: Q.10 (Kho CMT8)</span>
                </div>
                <div className="absolute top-3 right-3 bg-brand-500 backdrop-blur-xs text-white text-[11px] font-bold px-2.5 py-1 rounded-lg shadow flex items-center gap-1.5 border border-brand-400">
                  <span className="w-2 h-2 rounded-full bg-white" />
                  <span>B: Q.1 (Hai Bà Trưng)</span>
                </div>

                {/* Route Stat Bubbles */}
                <div className="absolute bottom-3 left-3 flex items-center gap-2">
                  <div className="bg-white/95 backdrop-blur-xs px-3 py-1.5 rounded-xl shadow-md border border-slate-200 text-xs font-black text-slate-800">
                    5.4 KM
                  </div>
                  <div className="bg-white/95 backdrop-blur-xs px-3 py-1.5 rounded-xl shadow-md border border-slate-200 text-xs font-black text-brand-600">
                    ~18 PHÚT
                  </div>
                </div>

                <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded-lg text-[10px] font-bold text-slate-600 border border-slate-200">
                  Đang mở rộng toàn cảnh
                </div>
              </div>

              {/* Bottom Map Info Footer */}
              <div className="flex items-center justify-between text-[11px] text-slate-600 font-semibold px-1 pt-1">
                <span className="flex items-center gap-1">
                  <span>📍</span>
                  <span>Khoảng cách: 5.4 km (Tối ưu theo tuyến đường ngắn nhất)</span>
                </span>
                <span className="flex items-center gap-1">
                  <span>⏱</span>
                  <span>Ước tính giao: 14:45 Hôm nay</span>
                </span>
              </div>
            </div>

            {/* ------------------------------------------------------------------- */}
            {/* CARD 2: Thông số điều vận thực địa (Live Telemetry & Fleet Monitor) */}
            {/* ------------------------------------------------------------------- */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2 font-extrabold text-xs sm:text-sm text-slate-900">
                  <Truck className="w-4 h-4 text-brand-600" />
                  <span>Mạng lưới phương tiện nội thành</span>
                </div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  AUTO-MATCHING READY
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-center text-xs">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Xe tải gần bạn</div>
                  <div className="text-base font-black text-slate-900 mt-0.5">5 xe</div>
                  <div className="text-[10px] text-emerald-600 font-semibold">Bán kính 2km</div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Thời gian tiếp cận</div>
                  <div className="text-base font-black text-brand-600 mt-0.5">~6-8 phút</div>
                  <div className="text-[10px] text-slate-500 font-medium">Sau khi nhận đơn</div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 col-span-2 sm:col-span-1">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Tuyến đường AI</div>
                  <div className="text-base font-black text-slate-900 mt-0.5">5.4 km</div>
                  <div className="text-[10px] text-slate-500 font-medium">Tránh kẹt xe</div>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                <span>Phương tiện đang chọn: <strong className="text-slate-800">{selectedVehicle.name}</strong></span>
                <span className="font-semibold text-brand-600">{formatCurrency(totalPayable)} (Dự kiến)</span>
              </div>
            </div>

            {/* ------------------------------------------------------------------- */}
            {/* CARD 3: Vận hành bởi ModMove Architecture */}
            {/* ------------------------------------------------------------------- */}
            <div className="bg-slate-100/70 border border-slate-200/80 rounded-2xl p-4 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-brand-600 flex-shrink-0 mt-0.5" />
              <div className="text-[11px] text-slate-600 leading-relaxed">
                <span className="font-bold text-slate-800">Vận hành bởi ModMove Architecture: </span>
                Lộ trình được theo dõi GPS thời gian thực. Bàn giao xác thực chữ ký điện tử và ảnh chụp POD tức thời tại điểm giao.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. MODAL THANH TOÁN VIETQR PAYOS (Hiển thị khi chọn Chuyển khoản) */}
      {/* ========================================================================= */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            onClick={() => setShowQrModal(false)}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
          />

          {/* Modal Container: Chiều ngang rộng rãi cân đối (max-w-2xl ~ 680px), không bị vướng chiều cao */}
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl z-50 overflow-hidden border border-slate-100 animate-slideRight my-auto flex flex-col">
            {/* Modal Header */}
            <div className="bg-slate-900 border-b border-slate-800 text-white px-5 py-3 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shadow-xs">
                  <QrCode className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-sm sm:text-base leading-tight text-white">
                      Thanh toán VietQR PayOS
                    </h3>
                    <span className="text-[10px] bg-slate-800 border border-slate-700 font-bold px-2 py-0.5 rounded-full text-blue-400">
                      Tự động khớp lệnh 24/7
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-medium">
                    Mở ứng dụng ngân hàng bất kỳ để quét mã QR bên dưới
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowQrModal(false)}
                className="w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body: Thiết kế 2 cột cân xứng, rộng rãi, thoáng mắt */}
            <div className="p-5">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch">
                {/* QR Code Column (Bên trái) */}
                <div className="md:col-span-5 flex flex-col items-center justify-center bg-slate-50/90 p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
                  <div className="w-44 h-44 bg-white p-2.5 rounded-xl shadow-xs border border-slate-200 flex items-center justify-center">
                    <img
                      src={`https://api.vietqr.io/image/970422-090244199988-compact2.png?amount=${totalPayable}&addInfo=MM%20DATXE&accountName=MODMOVE%20VIETNAM`}
                      alt="VietQR PayOS"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  {/* Countdown */}
                  <div className="mt-2.5 flex items-center gap-1.5 text-slate-600 font-bold text-xs">
                    <Clock className="w-3.5 h-3.5 text-brand-600 animate-spin" />
                    <span>Mã hiệu lực:</span>
                    <span className="font-mono font-black text-brand-600 text-sm">
                      {formatTimer(qrCountdown)}
                    </span>
                  </div>
                </div>

                {/* Transfer Details Column (Bên phải) */}
                <div className="md:col-span-7 flex flex-col justify-between space-y-3">
                  <div className="bg-slate-50/90 rounded-2xl p-4 border border-slate-200 space-y-2.5 text-xs flex-1 flex flex-col justify-center">
                    <div className="flex items-center justify-between py-1 border-b border-slate-200/70">
                      <span className="text-slate-500 font-medium">Ngân hàng thụ hưởng:</span>
                      <span className="font-extrabold text-slate-900">MB Bank (Quân Đội)</span>
                    </div>

                    <div className="flex items-center justify-between py-1 border-b border-slate-200/70">
                      <span className="text-slate-500 font-medium">Chủ tài khoản:</span>
                      <span className="font-extrabold text-slate-900 uppercase">MODMOVE VIETNAM</span>
                    </div>

                    <div className="flex items-center justify-between py-1 border-b border-slate-200/70">
                      <span className="text-slate-500 font-medium">Số tài khoản:</span>
                      <div className="flex items-center gap-1.5 font-mono font-black text-slate-900 text-sm">
                        <span>090244199988</span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard('090244199988', 'STK')}
                          className="text-slate-400 hover:text-brand-600 p-1 hover:bg-slate-200/60 rounded transition cursor-pointer"
                          title="Sao chép số tài khoản"
                        >
                          {copiedField === 'STK' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between py-1 border-b border-slate-200/70">
                      <span className="text-slate-500 font-medium">Số tiền thanh toán:</span>
                      <div className="flex items-center gap-1.5 font-black text-brand-600 text-base">
                        <span>{formatCurrency(totalPayable)}</span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(String(totalPayable), 'AMOUNT')}
                          className="text-slate-400 hover:text-brand-600 p-1 hover:bg-slate-200/60 rounded transition cursor-pointer"
                          title="Sao chép số tiền"
                        >
                          {copiedField === 'AMOUNT' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between py-1">
                      <span className="text-slate-500 font-medium">Nội dung chuyển khoản:</span>
                      <div className="flex items-center gap-1.5 font-mono font-black text-blue-700 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-200/60 text-xs">
                        <span>MM DATXE</span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard('MM DATXE', 'CONTENT')}
                          className="text-blue-500 hover:text-blue-800 p-1 hover:bg-blue-100 rounded transition cursor-pointer"
                          title="Sao chép nội dung"
                        >
                          {copiedField === 'CONTENT' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Micro Live ping */}
                  <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-200/80 rounded-xl text-xs text-emerald-800 font-medium">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping flex-shrink-0" />
                    <span>Hệ thống tự động xác nhận ngay sau khi nhận được tiền.</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3 flex-shrink-0">
              <button
                type="button"
                onClick={() => setShowQrModal(false)}
                className="py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs sm:text-sm transition cursor-pointer"
              >
                Hủy / Đổi phương thức
              </button>

              <button
                type="button"
                onClick={handleConfirmTransferPaid}
                disabled={isVerifyingPayment}
                className="flex-1 max-w-sm py-2.5 px-5 rounded-xl bg-brand-500 hover:bg-brand-600 active:scale-98 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-orange-500/20 transition cursor-pointer"
              >
                {isVerifyingPayment ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Đang xác thực giao dịch...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>Tôi đã chuyển khoản thành công</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. SYSTEM FOOTER */}
      {/* ========================================================================= */}
      <footer className="mt-auto border-t border-slate-200/80 bg-white px-6 py-4 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500 flex-shrink-0">
        <div>
          <span className="font-extrabold text-slate-900">ModMove</span> © 2026 ModMove Logistics Architecture. Hệ thống Điều Vận & Khai Thác.
        </div>
        <div className="flex items-center gap-4 text-[11px] font-medium text-slate-600">
          <span>BLUEPRINT V2.4</span>
          <span>•</span>
          <span className="hover:text-brand-600 cursor-pointer">Hỗ trợ kỹ thuật</span>
          <span>•</span>
          <span className="hover:text-brand-600 cursor-pointer">Quy định vận tải</span>
        </div>
      </footer>
    </div>
  );
};
