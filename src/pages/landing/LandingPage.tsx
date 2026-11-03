import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Truck,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Clock,
  MapPin,
  ArrowRight,
  Home,
  User,
  LogIn,
  LogOut,
  Package,
  Layers,
  CheckCircle2,
  X,
} from 'lucide-react';
import { useAuthStore, getRoleHomePath } from '../../store/useAuthStore';
import { useBookingDraftStore } from '../../store/useBookingDraftStore';
import { usePlatformSettings, useVehicleTypes } from '../../hooks/useDomainData';
import { AddressInput } from '../../features/booking/AddressInput';
import { GeoPoint, mapService } from '../../services/map.service';
import { calculateFare } from '../../domain/pricing';
import { toast } from '../../components/ui/feedback';
import { formatCurrency } from '../../utils/format';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, activeRole, user, logout } = useAuthStore();
  const { setPickup, setDropoff, update } = useBookingDraftStore();
  const vehicleTypes = useVehicleTypes().filter((v) => v.isActive);
  const { loadingFee } = usePlatformSettings();

  // Carousel Slide State
  const [currentSlide, setCurrentSlide] = useState(0);

  // Ước tính cước nhanh (UC-GST-13) – dữ liệu xe lấy từ catalog (cùng nguồn với Booking & Admin)
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);

  // Estimator inputs
  const [pickup, setPickupPlace] = useState<GeoPoint>({ address: '', lat: 0, lng: 0 });
  const [dropoff, setDropoffPlace] = useState<GeoPoint>({ address: '', lat: 0, lng: 0 });
  // Trạng thái mở dropdown menu Tài xế
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  // Carousel slides data
  const slides = [
    {
      id: 1,
      badge: 'DỊCH VỤ NỔI BẬT NĂM 2026 • ModMove®',
      highlightTitle: 'CHUYÊN GIA',
      mainTitle: 'Chuyển nhà',
      subtitle:
        'Thảnh thơi dọn về nhà mới • Khảo sát miễn phí • Đóng gói bọc lót kỹ càng • Cam kết đền bù 100% nếu xảy ra hư hại',
      tags: [
        'Bọc lót chống trầy xước',
        'Tháo lắp giường tủ/máy lạnh',
        'Đội ngũ bốc vác nhiệt tình',
      ],
      themeBg: 'from-[#0B1528] via-[#101E36] to-[#0A101D]',
    },
    {
      id: 2,
      badge: 'VẬN TẢI HỎA TỐC NỘI ĐÔ • ModMove®',
      highlightTitle: 'HẠM ĐỘI',
      mainTitle: 'Xe tải 1 - 2 Tấn',
      subtitle:
        'Tiếp cận điểm lấy hàng trong 15-30 phút • Xe van & xe tải thùng kín an toàn • Hỗ trợ bốc dỡ 2 đầu cẩn thận',
      tags: [
        'Không phụ phí giờ cao điểm',
        'Định vị GPS trực tiếp 24/7',
        'Hoá đơn điện tử sau thanh toán',
      ],
      themeBg: 'from-[#0E1E38] via-[#162744] to-[#0A1220]',
    },
    {
      id: 3,
      badge: 'GIẢI PHÁP TIẾT KIỆM • ModMove®',
      highlightTitle: 'LINH HOẠT',
      mainTitle: 'Xe bán tải 500kg',
      subtitle:
        'Chuyên chở đồ đạc phòng trọ, căn hộ nhỏ, hàng hóa vừa và nhỏ • Luồn lách hẻm sâu nhanh chóng',
      tags: [
        'Cước phí tối ưu từ 150.000 đ',
        'Có mặt sau 10 phút gọi',
        'Tài xế chuyên nghiệp thân thiện',
      ],
      themeBg: 'from-[#112340] via-[#1A3156] to-[#0B1424]',
    },
  ];

  // Auto-play carousel
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const handleNextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const handlePrevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const selectedVehicle = vehicleTypes.find((v) => v.id === selectedVehicleId) ?? vehicleTypes[0];
  /** GB-29: khi đã chọn đủ 2 điểm thì tính theo quãng đường, ngược lại hiển thị cước tối thiểu */
  const getEstimatedPrice = () => {
    if (!selectedVehicle) return 0;
    if (!pickup.lat || !dropoff.lat) return selectedVehicle.minimumFare;
    const route = mapService.estimateRouteSync(pickup, dropoff);
    return calculateFare({ vehicle: selectedVehicle, ...route, loadingService: false, loadingFee }).total;
  };

  // Navigate to Shipment Creation (/booking) with pre-filled inputs (SRS 1.1.1)
  const handleBookNow = () => {
    if (pickup.lat) setPickup(pickup);
    if (dropoff.lat) setDropoff(dropoff);
    if (selectedVehicleId) update({ vehicleTypeId: selectedVehicleId });
    navigate('/booking');
  };

  /** GB-45: tài xế đăng ký trên Driver App */
  const handleDriverRegister = () => toast.info('Tài xế vui lòng tải ứng dụng ModMove Driver để đăng ký và nộp hồ sơ.');

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex flex-col font-sans select-none antialiased">
      {/* ========================================================================= */}
      {/* 1. TOP HEADER / NAVBAR (CHUẨN THEO ĐẶC TẢ SRS 1.1.1 & ẢNH IMAGE6.PNG) */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200/80 shadow-xs">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8 h-20 flex items-center justify-between">
          {/* Left: Brand Logo & Subtitle */}
          <div
            onClick={() => navigate('/')}
            className="flex items-center gap-3 cursor-pointer group"
            title="ModMove - Trang chủ"
          >
            <div className="w-11 h-11 rounded-2xl bg-[#0F172A] flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform">
              <Truck className="w-5 h-5 text-sky-400 stroke-[2.2]" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-baseline">
                <span className="text-2xl font-black tracking-tight text-slate-900">Mod</span>
                <span className="text-2xl font-black tracking-tight text-blue-600">Move</span>
                <span className="text-[10px] text-slate-400 align-super ml-0.5 font-bold">®</span>
              </div>
              <span className="text-[9px] text-slate-500 font-extrabold tracking-wider uppercase -mt-0.5">
                VẬN TẢI XE TẢI CHUYÊN NGHIỆP
              </span>
            </div>
          </div>

          {/* Center: Navigation Menu with Dropdowns (SRS 1.1.1) */}
          <nav className="hidden lg:flex items-center gap-6 xl:gap-8 text-xs sm:text-sm font-bold text-slate-700">
            {/* Drivers menu – SRS III.1.1.1: chỉ mở đăng ký tài xế trên Driver App */}
            <div
              className="relative"
              onMouseEnter={() => setActiveDropdown('drivers')}
              onMouseLeave={() => setActiveDropdown(null)}
            >
              <button
                type="button"
                onClick={() => handleDriverRegister()}
                className="flex items-center gap-1 py-2 hover:text-blue-600 transition cursor-pointer"
              >
                <span>Tài xế</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>
              {activeDropdown === 'drivers' && (
                <div className="absolute top-full left-0 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 z-50 animate-fadeIn">
                  <div
                    onClick={() => handleDriverRegister()}
                    className="p-2.5 rounded-xl hover:bg-slate-50 cursor-pointer transition"
                  >
                    <div className="text-xs font-bold text-slate-900">Đăng ký làm đối tác tài xế</div>
                    <div className="text-[10px] text-slate-500">Thu nhập ổn định 18 - 25 triệu/tháng</div>
                  </div>
                </div>
              )}
            </div>
          </nav>

          {/* Right: Sign In Button & Deliver Now Button */}
          <div className="flex items-center gap-3">
            {isAuthenticated && user ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate(getRoleHomePath(activeRole))}
                  className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition border border-slate-200"
                >
                  <User className="w-3.5 h-3.5 text-blue-600" />
                  <span>{user.fullName}</span>
                </button>
                <button
                  onClick={logout}
                  title="Đăng xuất"
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              /* Sign In Button (Đăng nhập) with arrow icon as in image6 */
              <button
                onClick={() => navigate('/login')}
                className="flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-bold text-slate-700 hover:text-blue-600 transition cursor-pointer"
              >
                <LogIn className="w-4 h-4 text-slate-500" />
                <span>Đăng nhập</span>
              </button>
            )}

            {/* Deliver Now Button (Giao hàng ngay) - Blue rounded button */}
            <button
              id="deliver-now-btn"
              onClick={handleBookNow}
              className="bg-[#2563EB] hover:bg-blue-700 active:scale-95 text-white font-extrabold text-xs sm:text-sm px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Giao hàng ngay</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. HERO CAROUSEL BANNER (CHUẨN ẢNH IMAGE6.PNG) */}
      {/* ========================================================================= */}
      <section className="relative px-3 sm:px-8 pt-4 sm:pt-6 max-w-[1440px] mx-auto w-full">
        <div
          className={`relative rounded-[28px] overflow-hidden shadow-xl bg-gradient-to-br ${slides[currentSlide].themeBg} border border-slate-800 min-h-[420px] md:min-h-[460px] flex items-center justify-center text-center px-6 py-10 transition-all duration-700`}
        >
          {/* Subtle City Silhouette Overlay */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/30 via-slate-900/80 to-slate-950 z-0 pointer-events-none" />

          {/* Left Arrow Button (< circle button) */}
          <button
            type="button"
            onClick={handlePrevSlide}
            aria-label="Previous slide"
            className="absolute left-4 sm:left-6 z-20 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white/90 hover:bg-white text-slate-800 shadow-lg flex items-center justify-center transition hover:scale-105 active:scale-95 cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5 text-slate-800" />
          </button>

          {/* Right Arrow Button (> circle button) */}
          <button
            type="button"
            onClick={handleNextSlide}
            aria-label="Next slide"
            className="absolute right-4 sm:right-6 z-20 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white/90 hover:bg-white text-slate-800 shadow-lg flex items-center justify-center transition hover:scale-105 active:scale-95 cursor-pointer"
          >
            <ChevronRight className="w-5 h-5 text-slate-800" />
          </button>

          {/* Carousel Slide Content */}
          <div className="relative z-10 max-w-3xl mx-auto flex flex-col items-center space-y-4">
            {/* Highlight Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[11px] sm:text-xs font-bold text-amber-300">
              <div className="w-4 h-4 rounded-full bg-blue-600 flex items-center justify-center text-white">
                <Truck className="w-2.5 h-2.5" />
              </div>
              <span>{slides[currentSlide].badge}</span>
            </div>

            {/* Big Titles */}
            <div className="space-y-1">
              <div className="text-xl sm:text-2xl font-black text-[#FF7A00] tracking-wider uppercase">
                {slides[currentSlide].highlightTitle}
              </div>
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-100 via-orange-200 to-amber-300 tracking-tight drop-shadow-sm">
                {slides[currentSlide].mainTitle}
              </h1>
            </div>

            {/* Subtitle description */}
            <p className="text-slate-300 text-xs sm:text-sm font-medium leading-relaxed max-w-2xl px-4">
              {slides[currentSlide].subtitle}
            </p>

            {/* 3 Feature Tags */}
            <div className="flex flex-wrap items-center justify-center gap-2 pt-1 text-[11px] text-amber-200 font-semibold">
              {slides[currentSlide].tags.map((tag, i) => (
                <span
                  key={i}
                  className="px-3 py-1 rounded-full bg-black/30 border border-amber-400/30 backdrop-blur-xs flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>{tag}</span>
                </span>
              ))}
            </div>

            {/* Action Buttons on the Slide */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
              {/* Button: Đặt xe tải ngay -> */}
              <button
                type="button"
                onClick={handleBookNow}
                className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold text-xs sm:text-sm px-6 py-3 rounded-xl shadow-lg shadow-orange-500/30 flex items-center gap-2 transition hover:scale-102 cursor-pointer"
              >
                <span>Đặt xe tải ngay</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Pagination Indicators */}
            <div className="flex items-center justify-center gap-1.5 pt-3">
              {slides.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentSlide(idx)}
                  className={`transition-all rounded-full ${
                    currentSlide === idx
                      ? 'w-7 h-2 bg-blue-500 shadow-xs'
                      : 'w-2 h-2 bg-white/40 hover:bg-white/70'
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. FARE ESTIMATOR CARD (BỘ TÍNH CƯỚC MINH BẠCH - CHUẨN ẢNH IMAGE6.PNG) */}
      {/* ========================================================================= */}
      <section className="relative px-3 sm:px-8 py-5 sm:py-6 max-w-[1440px] mx-auto w-full">
        <div className="bg-white rounded-[24px] border border-slate-200/90 p-5 sm:p-7 shadow-sm space-y-4">
          {/* Top Row: Heading (Left) & 4 Service Tabs (Right) */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-2">
            {/* Heading */}
            <div>
              <div className="text-[11px] font-extrabold text-blue-600 uppercase tracking-wider flex items-center gap-1">
                <span>⚡</span>
                <span>ƯỚC TÍNH CƯỚC PHÍ MINH BẠCH</span>
              </div>
              <h2 className="text-base sm:text-xl font-extrabold text-slate-900 mt-0.5">
                Bạn muốn vận chuyển loại hàng nào hôm nay?
              </h2>
            </div>

            {/* 4 Service Tabs (Chuẩn theo đặc tả SRS 1.1.1):
                1. Xe bán tải 500kg
                2. Xe tải nhỏ 1 - 1.5 tấn
                3. Xe tải lớn 2 tấn thùng kín
                4. Chuyển nhà trọn gói */}
            <div className="flex flex-wrap items-center gap-2 p-1 bg-slate-100 rounded-2xl border border-slate-200/70">
              {vehicleTypes.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setSelectedVehicleId(v.id)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    selectedVehicle?.id === v.id ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Truck className="w-3.5 h-3.5" />
                  <span>{v.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Form Row: Điểm nhận hàng, Điểm giao hàng, Ước tính giá & Nút Đặt xe */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end pt-1">
            <div className="md:col-span-4">
              <AddressInput id="landing-pickup" label="Điểm nhận hàng" value={pickup.address} onType={(address) => setPickupPlace({ address, lat: 0, lng: 0 })} onSelect={setPickupPlace} />
            </div>
            <div className="md:col-span-4">
              <AddressInput id="landing-dropoff" label="Điểm giao hàng" value={dropoff.address} onType={(address) => setDropoffPlace({ address, lat: 0, lng: 0 })} onSelect={setDropoffPlace} />
            </div>

            {/* Box 3: Ước tính từ (Read-only price) */}
            <div className="md:col-span-2 bg-blue-50/60 border border-blue-100 rounded-xl h-12 px-3 flex flex-col justify-center text-center">
              <div className="text-[10px] font-bold text-slate-500 uppercase">ƯỚC TÍNH TỪ</div>
              <div className="text-base sm:text-lg font-black text-blue-600 leading-tight">
                {formatCurrency(getEstimatedPrice())}
              </div>
            </div>

            {/* Button 4: Đặt xe tải ngay */}
            <div className="md:col-span-2">
              <button
                type="button"
                onClick={handleBookNow}
                className="w-full h-12 rounded-xl bg-[#2563EB] hover:bg-blue-700 active:scale-95 text-white font-extrabold text-xs sm:text-sm shadow-md shadow-blue-500/20 transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Đặt xe tải ngay</span>
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
