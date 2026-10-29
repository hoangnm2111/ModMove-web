import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Truck,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Clock,
  Sparkles,
  MapPin,
  ArrowRight,
  Phone,
  CheckCircle2,
  DollarSign,
  Package,
  Home,
  User as UserIcon,
  LogIn,
  LogOut,
  Star,
  Smartphone,
  Award,
  Layers,
} from 'lucide-react';
import { useAuthStore, getRoleHomePath } from '../../store/useAuthStore';
import { formatCurrency } from '../../utils/format';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, activeRole, user, logout } = useAuthStore();

  // Carousel state
  const [currentSlide, setCurrentSlide] = useState(0);
  const [activeTab, setActiveTab] = useState<'van' | 'pickup' | 'truck' | 'house'>('house');

  // Quick booking quote inputs
  const [pickupAddr, setPickupAddr] = useState('72 Lê Thánh Tôn, Bến Nghé, Quận 1, TP.HCM');
  const [dropoffAddr, setDropoffAddr] = useState('Vinhomes Grand Park, Phước Thiện, Quận 9, TP.HCM');

  // Dropdown states for navbar
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const slides = [
    {
      id: 1,
      badge: 'DỊCH VỤ NỔI BẬT NĂM 2026',
      brand: 'ModMove',
      highlightTitle: 'CHUYÊN GIA',
      mainTitle: 'Chuyển nhà',
      subtitle: 'Thảnh thơi dọn về nhà mới • Khảo sát miễn phí • Đóng gói bọc lót kỹ càng • Cam kết đền bù 100% nếu xảy ra hư hại',
      tags: ['Bọc lót chống trầy xước', 'Tháo lắp giường tủ/máy lạnh', 'Đội ngũ bốc vác nhiệt tình'],
      primaryCta: 'Đặt xe tải ngay',
      secondaryCta: 'Xem bảng giá dịch vụ',
      themeGradient: 'from-slate-800 via-slate-700 to-slate-900',
      bgType: 'moving',
    },
    {
      id: 2,
      badge: 'VẬN CHUYỂN NHANH CHÓNG NỘI ĐÔ',
      brand: 'ModMove',
      highlightTitle: 'XE TẢI & BÁN TẢI',
      mainTitle: 'Hạm đội xe tải chuyên nghiệp',
      subtitle: 'Đội ngũ xe tải phủ khắp các quận huyện • Tiếp cận điểm nhận sau 15 phút gọi • Vận chuyển hàng hóa cồng kềnh an toàn',
      tags: ['Tải trọng 500kg - 2 tấn', 'Lưu thông giờ cao điểm', 'Theo dõi lộ trình GPS trực tiếp'],
      primaryCta: 'Đặt xe tải ngay',
      secondaryCta: 'Tra cước xe tải',
      themeGradient: 'from-blue-900 via-slate-800 to-slate-900',
      bgType: 'express',
    },
    {
      id: 3,
      badge: 'GIẢI PHÁP LOGISTICS DOANH NGHIỆP',
      brand: 'ModMove',
      highlightTitle: 'VẬN TẢI HÀNG HÓA',
      mainTitle: 'Tối ưu chi phí và thời gian',
      subtitle: 'Quản lý chuỗi giao nhận tập trung • Hóa đơn VAT điện tử • Đội ngũ bốc xếp chuyên nghiệp • Đối soát định kỳ',
      tags: ['Chiết khấu doanh nghiệp', 'Báo cáo lộ trình realtime', 'Hỗ trợ sự cố 24/7'],
      primaryCta: 'Đặt xe tải ngay',
      secondaryCta: 'Tư vấn doanh nghiệp',
      themeGradient: 'from-slate-900 via-blue-950 to-slate-900',
      bgType: 'enterprise',
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

  // Main action: "Giao hàng ngay"
  const handleGiaoHangNgay = () => {
    if (isAuthenticated && activeRole) {
      if (activeRole === 'Customer') {
        navigate('/booking');
      } else {
        navigate(getRoleHomePath(activeRole));
      }
    } else {
      // Navigate to login / register as requested
      navigate('/login');
    }
  };

  const vehicles = [
    {
      id: 'pickup',
      name: 'Xe bán tải 500kg',
      capacity: 'Dưới 500kg',
      price: 'Từ 150.000 đ',
      desc: 'Đồ gia dụng, máy giặt, tủ lạnh nhỏ, bàn ghế',
      icon: Truck,
    },
    {
      id: 'truck',
      name: 'Xe tải nhỏ 1 - 1.5 tấn',
      capacity: '1000 - 1500kg',
      price: 'Từ 250.000 đ',
      desc: 'Hàng cồng kềnh, chuyển trọ sinh viên, văn phòng',
      icon: Truck,
    },
    {
      id: 'heavy_truck',
      name: 'Xe tải lớn 2 tấn thùng kín',
      capacity: '1500 - 2000kg',
      price: 'Từ 380.000 đ',
      desc: 'Hàng kho bãi, nội thất lớn, vận chuyển đường dài',
      icon: Truck,
    },
    {
      id: 'house',
      name: 'Chuyển nhà trọn gói',
      capacity: 'Trọn gói phòng/nhà',
      price: 'Khảo sát & Báo giá',
      desc: 'Bao bọc màng PE, bốc vác, tháo lắp trọn gói',
      icon: Home,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans select-none">
      {/* 1. TOP ANNOUNCEMENT BAR */}
      <div className="bg-slate-800 text-slate-200 text-[11px] sm:text-xs py-1.5 px-4 text-center font-medium flex items-center justify-center gap-2 border-b border-slate-700">
        <Sparkles className="w-3.5 h-3.5 text-blue-400" />
        <span>Hệ thống dịch vụ xe tải & chuyển nhà trọn gói ModMove • Hỗ trợ vận chuyển 24/7</span>
      </div>

      {/* 2. HEADER / NAVBAR */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 sm:h-20 flex items-center justify-between">
          {/* Left: Brand Logo & Mascot */}
          <div className="flex items-center gap-8">
            <div
              onClick={() => navigate('/')}
              className="flex items-center gap-2.5 cursor-pointer group"
            >
              {/* Mascot / Logo icon */}
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-xs">
                <Truck className="w-5 h-5 text-blue-400" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center">
                  <span className="text-2xl sm:text-[26px] font-black tracking-tight text-slate-900">
                    Mod<span className="text-blue-600">Move</span>
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 align-super ml-0.5">®</span>
                </div>
                <span className="text-[10px] text-slate-500 font-semibold tracking-wider uppercase -mt-1 hidden sm:block">
                  Vận tải xe tải chuyên nghiệp
                </span>
              </div>
            </div>

            {/* Desktop Navigation Links (with dropdown arrows like image) */}
            <nav className="hidden lg:flex items-center gap-1 xl:gap-2 text-sm font-bold text-slate-700">
              {/* Dịch vụ */}
              <div
                className="relative"
                onMouseEnter={() => setActiveDropdown('services')}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg hover:text-brand-600 hover:bg-orange-50/60 transition">
                  <span>Dịch vụ</span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${activeDropdown === 'services' ? 'rotate-180 text-brand-500' : ''}`} />
                </button>
                {activeDropdown === 'services' && (
                  <div className="absolute top-full left-0 w-72 bg-white rounded-2xl shadow-xl border border-slate-100 p-3 py-2 z-50 animate-fadeIn">
                    <div
                      onClick={handleGiaoHangNgay}
                      className="p-2.5 rounded-xl hover:bg-orange-50 cursor-pointer transition flex items-center gap-3 group"
                    >
                      <div className="w-9 h-9 rounded-lg bg-orange-100 text-brand-600 flex items-center justify-center group-hover:bg-brand-500 group-hover:text-white transition">
                        <Home className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900 group-hover:text-brand-600">Chuyển nhà trọn gói</div>
                        <div className="text-[11px] text-slate-500">Bọc lót, tháo lắp và dọn phòng/nhà</div>
                      </div>
                    </div>
                    <div
                      onClick={handleGiaoHangNgay}
                      className="p-2.5 rounded-xl hover:bg-orange-50 cursor-pointer transition flex items-center gap-3 group"
                    >
                      <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center group-hover:bg-amber-500 group-hover:text-white transition">
                        <Truck className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900 group-hover:text-brand-600">Xe bán tải & Xe tải</div>
                        <div className="text-[11px] text-slate-500">500kg, 1 tấn, 2 tấn nội thành</div>
                      </div>
                    </div>
                    <div
                      onClick={handleGiaoHangNgay}
                      className="p-2.5 rounded-xl hover:bg-slate-100 cursor-pointer transition flex items-center gap-3 group"
                    >
                      <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition">
                        <Package className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900 group-hover:text-brand-600">Bốc xếp & Khuân vác</div>
                        <div className="text-[11px] text-slate-500">Tài xế và phụ xe hỗ trợ 2 đầu</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Khách hàng */}
              <div
                className="relative"
                onMouseEnter={() => setActiveDropdown('customers')}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg hover:text-brand-600 hover:bg-orange-50/60 transition">
                  <span>Khách hàng</span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${activeDropdown === 'customers' ? 'rotate-180 text-brand-500' : ''}`} />
                </button>
                {activeDropdown === 'customers' && (
                  <div className="absolute top-full left-0 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 z-50">
                    <div onClick={handleGiaoHangNgay} className="p-2.5 rounded-xl hover:bg-orange-50 cursor-pointer transition">
                      <div className="text-xs font-bold text-slate-800">Khách hàng cá nhân</div>
                      <div className="text-[11px] text-slate-500">Đặt xe tức thì, nạp ví VietQR</div>
                    </div>
                    <div onClick={handleGiaoHangNgay} className="p-2.5 rounded-xl hover:bg-orange-50 cursor-pointer transition">
                      <div className="text-xs font-bold text-slate-800">Doanh nghiệp & Chuỗi cửa hàng</div>
                      <div className="text-[11px] text-slate-500">Hợp đồng tháng, xuất hóa đơn VAT</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Tài xế */}
              <div
                className="relative"
                onMouseEnter={() => setActiveDropdown('driver')}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg hover:text-brand-600 hover:bg-orange-50/60 transition">
                  <span>Tài xế</span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${activeDropdown === 'driver' ? 'rotate-180 text-brand-500' : ''}`} />
                </button>
                {activeDropdown === 'driver' && (
                  <div className="absolute top-full left-0 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 z-50">
                    <div onClick={() => navigate('/login')} className="p-2.5 rounded-xl hover:bg-orange-50 cursor-pointer transition">
                      <div className="text-xs font-bold text-slate-800">Đăng ký làm đối tác tài xế</div>
                      <div className="text-[11px] text-slate-500">Thu nhập tới 20 triệu/tháng</div>
                    </div>
                    <div onClick={() => navigate('/login')} className="p-2.5 rounded-xl hover:bg-orange-50 cursor-pointer transition">
                      <div className="text-xs font-bold text-slate-800">Cổng tài xế nhận cuốc</div>
                      <div className="text-[11px] text-slate-500">Bàn làm việc và rút tiền ví</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Tuyển dụng */}
              <a href="#tuyendung" className="px-3 py-2 rounded-lg hover:text-brand-600 hover:bg-orange-50/60 transition">
                Tuyển dụng
              </a>

              {/* Tin tức */}
              <div
                className="relative"
                onMouseEnter={() => setActiveDropdown('news')}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg hover:text-brand-600 hover:bg-orange-50/60 transition">
                  <span>Tin tức</span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${activeDropdown === 'news' ? 'rotate-180 text-brand-500' : ''}`} />
                </button>
                {activeDropdown === 'news' && (
                  <div className="absolute top-full left-0 w-60 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 z-50">
                    <div className="p-2.5 rounded-xl hover:bg-orange-50 cursor-pointer transition text-xs font-bold text-slate-800">
                      Khuyến mãi tháng 2026
                    </div>
                    <div className="p-2.5 rounded-xl hover:bg-orange-50 cursor-pointer transition text-xs font-bold text-slate-800">
                      Cẩm nang chuyển nhà an toàn
                    </div>
                    <div className="p-2.5 rounded-xl hover:bg-orange-50 cursor-pointer transition text-xs font-bold text-slate-800">
                      Bản tin công nghệ ModMove
                    </div>
                  </div>
                )}
              </div>
            </nav>
          </div>

          {/* Right: Auth Status & NÚT GIAO HÀNG NGAY NỔI BẬT */}
          <div className="flex items-center gap-3">
            {isAuthenticated && user ? (
              // User is already logged in
              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => navigate(getRoleHomePath(activeRole))}
                  className="hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition border border-slate-200"
                >
                  <UserIcon className="w-3.5 h-3.5 text-brand-600" />
                  <span>{user.fullName} ({activeRole})</span>
                </button>
                <button
                  onClick={logout}
                  title="Đăng xuất"
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              // Guest user
              <button
                onClick={() => navigate('/login')}
                className="hidden sm:flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-700 hover:text-brand-600 hover:bg-slate-100 transition"
              >
                <LogIn className="w-4 h-4" />
                <span>Đăng nhập</span>
              </button>
            )}

            {/* THE ICONIC ORANGE BUTTON "GIAO HÀNG NGAY" - EXACTLY LIKE SCREENSHOT */}
            <button
              id="btn-giao-hang-ngay"
              onClick={handleGiaoHangNgay}
              className="relative group overflow-hidden bg-brand-500 hover:bg-brand-600 active:scale-95 text-white font-extrabold text-sm sm:text-base px-6 sm:px-7 py-2.5 sm:py-3 rounded-xl sm:rounded-xl shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 transition-all duration-200 flex items-center gap-2 cursor-pointer"
            >
              <span className="relative z-10 flex items-center gap-2">
                <span>Giao hàng ngay</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-orange-500 via-amber-400 to-orange-600 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          </div>
        </div>
      </header>

      {/* 3. HERO BANNER CAROUSEL (CHUẨN FORM BO GÓC NHƯ TRONG ẢNH AHAMOVE) */}
      <section className="relative px-3 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-6 max-w-7xl mx-auto w-full">
        {/* Main Banner Card with rounded-3xl corners and shadow */}
        <div className="relative rounded-[24px] sm:rounded-[32px] overflow-hidden shadow-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-orange-950 border border-slate-700/50 min-h-[460px] md:min-h-[520px] lg:min-h-[560px] flex items-center">
          {/* Background image & gradient overlay */}
          <div className="absolute inset-0 z-0">
            {/* Background graphic elements */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-500/20 via-slate-900/80 to-slate-950 z-10" />

            {/* Cityscape and sky representation matching the Ahamove visual vibe */}
            <div
              className="w-full h-full bg-cover bg-center opacity-40 transition-all duration-700 transform scale-105"
              style={{
                backgroundImage:
                  currentSlide === 0
                    ? `url('https://images.unsplash.com/photo-1582407947304-fd86f028f716?auto=format&fit=crop&w=1920&q=80')`
                    : currentSlide === 1
                    ? `url('https://images.unsplash.com/photo-1519003722824-194d4455a60c?auto=format&fit=crop&w=1920&q=80')`
                    : `url('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1920&q=80')`,
              }}
            />

            {/* Floating glowing orbs */}
            <div className="absolute top-10 left-1/4 w-96 h-96 bg-brand-500/30 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-10 right-10 w-96 h-96 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
          </div>

          {/* Left Arrow Button (Circle white button from screenshot) */}
          <button
            onClick={handlePrevSlide}
            aria-label="Previous slide"
            className="absolute left-3 sm:left-6 z-30 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/90 hover:bg-white text-slate-800 shadow-xl backdrop-blur-sm flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 group"
          >
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 group-hover:-translate-x-0.5 transition-transform" />
          </button>

          {/* Right Arrow Button (Circle white button from screenshot) */}
          <button
            onClick={handleNextSlide}
            aria-label="Next slide"
            className="absolute right-3 sm:right-6 z-30 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/90 hover:bg-white text-slate-800 shadow-xl backdrop-blur-sm flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 group"
          >
            <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 group-hover:translate-x-0.5 transition-transform" />
          </button>

          {/* Slide Content */}
          <div className="relative z-20 w-full px-8 sm:px-16 md:px-20 lg:px-24 py-12 flex flex-col justify-center items-center text-center">
            {/* Top Brand Logo Banner / Badge */}
            <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-xs font-bold mb-4 shadow-lg">
              <div className="w-6 h-6 rounded-lg bg-brand-500 flex items-center justify-center text-white">
                <Truck className="w-3.5 h-3.5" />
              </div>
              <span className="tracking-wide">{slides[currentSlide].badge}</span>
              <span className="text-amber-300">•</span>
              <span className="text-amber-300 font-extrabold">{slides[currentSlide].brand}®</span>
            </div>

            {/* BIG 3D GOLDEN-ORANGE CALLIGRAPHY STYLE TITLE (GIỐNG HỆT POSTER AHAMOVE) */}
            <div className="space-y-1 sm:space-y-2 max-w-4xl">
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black uppercase tracking-wider text-amber-400 drop-shadow-[0_4px_12px_rgba(245,158,11,0.5)]">
                {slides[currentSlide].highlightTitle}
              </h2>

              <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black italic tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-orange-400 to-amber-100 drop-shadow-[0_10px_25px_rgba(255,84,0,0.6)] py-1">
                {slides[currentSlide].mainTitle}
              </h1>
            </div>

            {/* Subtitle */}
            <p className="mt-4 text-sm sm:text-base md:text-lg text-slate-200 max-w-2xl font-medium leading-relaxed drop-shadow">
              {slides[currentSlide].subtitle}
            </p>

            {/* Key feature pills */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
              {slides[currentSlide].tags.map((tag, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/70 border border-amber-500/40 text-amber-200 text-xs font-bold backdrop-blur-md"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>{tag}</span>
                </div>
              ))}
            </div>

            {/* Action Buttons on Banner */}
            <div className="mt-8 flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
              <button
                onClick={handleGiaoHangNgay}
                className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-brand-500 to-orange-600 hover:from-brand-600 hover:to-orange-700 text-white font-black text-base shadow-xl shadow-orange-500/40 hover:shadow-orange-500/60 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <span>{slides[currentSlide].primaryCta}</span>
                <ArrowRight className="w-5 h-5" />
              </button>

              <button
                onClick={() => {
                  const el = document.getElementById('bang-gia-uoc-tinh');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm backdrop-blur-md border border-white/20 transition-all"
              >
                {slides[currentSlide].secondaryCta}
              </button>
            </div>
          </div>

          {/* Carousel Slide Indicators (Bottom Dots) */}
          <div className="absolute bottom-4 left-0 right-0 z-30 flex items-center justify-center gap-2">
            {slides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                aria-label={`Go to slide ${idx + 1}`}
                className={`transition-all duration-300 rounded-full ${
                  currentSlide === idx
                    ? 'w-8 h-2.5 bg-brand-500 shadow-md shadow-orange-500/50'
                    : 'w-2.5 h-2.5 bg-white/50 hover:bg-white/80'
                }`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* 4. FLOATING QUICK PRICE ESTIMATE & BOOKING WIDGET */}
      <section id="bang-gia-uoc-tinh" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 sm:-mt-10 relative z-30 mb-12">
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200/80 p-5 sm:p-7 backdrop-blur-md">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-100">
            <div>
              <div className="text-xs font-bold text-brand-600 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Ước tính cước phí minh bạch</span>
              </div>
              <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 mt-0.5">
                Bạn muốn vận chuyển loại hàng nào hôm nay?
              </h3>
            </div>

            {/* Vehicle Selection Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl">
              {vehicles.map((v) => {
                const Icon = v.icon;
                const isSelected = activeTab === v.id;
                return (
                  <button
                    key={v.id}
                    onClick={() => setActiveTab(v.id as any)}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                      isSelected
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{v.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Form inputs: Pickup, Dropoff & CTA */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mt-5 items-end">
            {/* Điểm nhận hàng */}
            <div className="md:col-span-4">
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span>Điểm nhận hàng (Địa chỉ bốc hàng)</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                </div>
                <input
                  type="text"
                  value={pickupAddr}
                  onChange={(e) => setPickupAddr(e.target.value)}
                  placeholder="Nhập địa chỉ nhận đồ..."
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 focus:outline-none focus:border-brand-500 focus:bg-white transition"
                />
              </div>
            </div>

            {/* Điểm giao hàng */}
            <div className="md:col-span-4">
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span>Điểm giao hàng (Địa chỉ chuyển đến)</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <MapPin className="w-4 h-4 text-rose-600" />
                </div>
                <input
                  type="text"
                  value={dropoffAddr}
                  onChange={(e) => setDropoffAddr(e.target.value)}
                  placeholder="Nhập địa chỉ giao đồ..."
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 focus:outline-none focus:border-brand-500 focus:bg-white transition"
                />
              </div>
            </div>

            {/* Giá ước tính & Nút Giao Hàng Ngay */}
            <div className="md:col-span-4 flex items-center gap-3">
              <div className="flex-1 bg-slate-100 border border-slate-200 p-2.5 rounded-xl text-center">
                <div className="text-[10px] font-bold text-slate-500 uppercase">Ước tính từ</div>
                <div className="text-base font-extrabold text-blue-600">
                  {activeTab === 'pickup'
                    ? '150.000 đ'
                    : activeTab === 'truck'
                    ? '280.000 đ'
                    : '1.200.000 đ'}
                </div>
              </div>

              <button
                onClick={handleGiaoHangNgay}
                className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Đặt xe tải ngay</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 5. DANH MỤC DỊCH VỤ MODMOVE TOÀN DIỆN */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 font-bold text-xs mb-2">
            <Award className="w-3.5 h-3.5 text-blue-600" />
            <span>DỊCH VỤ VẬN TẢI CHUYÊN NGHIỆP</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Giải pháp xe tải vận chuyển đa dạng mọi nhu cầu
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-2">
            Từ kiện hàng gia dụng đến chuyển nhà trọn gói, ModMove luôn có xe tải và đội ngũ bốc xếp chuyên nghiệp.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1: Chuyển nhà */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:border-slate-400 transition-all duration-200 flex flex-col justify-between group">
            <div className="p-6">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold mb-4">
                <Home className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-base font-bold text-slate-900 group-hover:text-brand-600 transition-colors">
                Chuyển nhà trọn gói
              </h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Khảo sát tận nơi, bao bọc màng PE chống xước, đóng thùng carton, tháo lắp nội thất và xếp dọn phòng mới.
              </p>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-600">
                <span>Cam kết:</span>
                <span className="text-emerald-600 font-bold">Bồi thường 100%</span>
              </div>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100">
              <button
                onClick={handleGiaoHangNgay}
                className="w-full py-2 bg-white hover:bg-brand-500 hover:text-white text-slate-800 text-xs font-bold rounded-xl border border-slate-200 hover:border-brand-500 transition"
              >
                Đặt dịch vụ chuyển nhà
              </button>
            </div>
          </div>

          {/* Card 2: Xe bán tải 500kg */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:border-slate-400 transition-all duration-200 flex flex-col justify-between group">
            <div className="p-6">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold mb-4">
                <Truck className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Xe bán tải 500kg
              </h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Di chuyển linh hoạt trong mọi hẻm phố, không bị cấm giờ cao điểm. Phù hợp chuyển trọ, tủ lạnh, máy giặt, sofa.
              </p>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-600">
                <span>Giá mở cửa:</span>
                <span className="text-blue-600 font-bold">150.000 đ</span>
              </div>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100">
              <button
                onClick={handleGiaoHangNgay}
                className="w-full py-2 bg-white hover:bg-slate-900 hover:text-white text-slate-800 text-xs font-bold rounded-xl border border-slate-200 transition"
              >
                Đặt xe bán tải
              </button>
            </div>
          </div>

          {/* Card 3: Xe tải 1 - 2 tấn */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:border-slate-400 transition-all duration-200 flex flex-col justify-between group">
            <div className="p-6">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold mb-4">
                <Layers className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Xe tải thùng kín 1 - 2 tấn
              </h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Thùng xe rộng rãi chống thấm nước, bảo vệ hàng hóa tuyệt đối. Thích hợp chuyển văn phòng, kho hàng, xưởng sản xuất.
              </p>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-600">
                <span>Giá mở cửa:</span>
                <span className="text-blue-600 font-bold">250.000 đ</span>
              </div>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100">
              <button
                onClick={handleGiaoHangNgay}
                className="w-full py-2 bg-white hover:bg-slate-900 hover:text-white text-slate-800 text-xs font-bold rounded-xl border border-slate-200 transition"
              >
                Đặt xe tải chở hàng
              </button>
            </div>
          </div>

          {/* Card 4: Dịch vụ bốc xếp */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:border-slate-400 transition-all duration-200 flex flex-col justify-between group">
            <div className="p-6">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold mb-4">
                <ShieldCheck className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Bốc xếp & Khuân vác 2 đầu
              </h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Khuân vác cầu thang bộ, chung cư cao tầng, hỗ trợ xe đẩy chuyên dụng. Tài xế và phụ xe hỗ trợ nhiệt tình từ A-Z.
              </p>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-600">
                <span>Hỗ trợ:</span>
                <span className="text-emerald-600 font-bold">Lên lầu, thang bộ</span>
              </div>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100">
              <button
                onClick={handleGiaoHangNgay}
                className="w-full py-2 bg-white hover:bg-slate-900 hover:text-white text-slate-800 text-xs font-bold rounded-xl border border-slate-200 transition"
              >
                Đặt bốc xếp đi kèm
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 6. TẠI SAO CHỌN MODMOVE (4 TRỤ CỘT NIỀM TIN) */}
      <section className="bg-white py-14 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Lý do hơn 1.500.000+ Khách hàng tin tưởng ModMove
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-2">
              Chúng tôi xây dựng nền tảng vận chuyển dựa trên sự minh bạch, an tâm tuyệt đối và công nghệ thời gian thực.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="flex flex-col items-center text-center p-4">
              <div className="w-14 h-14 rounded-2xl bg-orange-50 text-brand-500 flex items-center justify-center mb-4 shadow-sm border border-orange-100">
                <Clock className="w-7 h-7" />
              </div>
              <h4 className="font-extrabold text-base text-slate-900">Nhanh chóng trong 30s</h4>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Hệ thống tự động phát cuốc tới tài xế gần nhất qua định vị GPS. Có mặt ngay sau 15-20 phút.
              </p>
            </div>

            <div className="flex flex-col items-center text-center p-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 shadow-sm border border-emerald-100">
                <DollarSign className="w-7 h-7" />
              </div>
              <h4 className="font-extrabold text-base text-slate-900">Giá cước minh bạch</h4>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Báo giá chính xác trước khi bấm đặt xe. Tuyệt đối không phát sinh phụ phí ẩn ngoài hợp đồng.
              </p>
            </div>

            <div className="flex flex-col items-center text-center p-4">
              <div className="w-14 h-14 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center mb-4 shadow-sm border border-sky-100">
                <MapPin className="w-7 h-7" />
              </div>
              <h4 className="font-extrabold text-base text-slate-900">Theo dõi GPS thời gian thực</h4>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Xem trực tiếp xe đang chạy tới đâu trên bản đồ tương tác với công nghệ SignalR và Google Maps.
              </p>
            </div>

            <div className="flex flex-col items-center text-center p-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4 shadow-sm border border-amber-100">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <h4 className="font-extrabold text-base text-slate-900">Bảo hiểm hàng hóa 100%</h4>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Tất cả tài xế đều được thẩm định hồ sơ lý lịch, phương tiện. Đền bù 100% giá trị nếu xảy ra thất lạc.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. BANNER KÊU GỌI HỢP TÁC TÀI XẾ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-brand-900 p-8 sm:p-12 text-white relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8 shadow-xl">
          <div className="max-w-xl space-y-3 z-10">
            <span className="px-3 py-1 rounded-full bg-brand-500/30 text-amber-300 font-bold text-xs uppercase tracking-wider border border-brand-400/40">
              Gia nhập Hạm đội ModMove
            </span>
            <h3 className="text-2xl sm:text-3xl font-black text-white">
              Bạn có xe bán tải hoặc xe tải? Hãy tăng thu nhập cùng ModMove!
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Chiết khấu ưu đãi chỉ 20%, nhận tiền tức thì về tài khoản ngân hàng VietQR sau mỗi cuốc hoàn thành. Đăng ký online chỉ mất 5 phút.
            </p>
            <div className="flex items-center gap-6 pt-2 text-xs font-bold text-amber-200">
              <div>✓ Thu nhập 15 - 25tr/tháng</div>
              <div>✓ Chủ động nhận cuốc</div>
              <div>✓ Thưởng năng suất tuần</div>
            </div>
          </div>

          <div className="z-10 flex flex-col sm:flex-row items-center gap-3">
            <button
              onClick={() => navigate('/login')}
              className="px-6 py-3.5 bg-brand-500 hover:bg-brand-600 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-orange-500/30 transition hover:scale-105 active:scale-95"
            >
              Đăng ký làm tài xế ngay
            </button>
            <button
              onClick={() => navigate('/login')}
              className="px-6 py-3.5 bg-white/10 hover:bg-white/20 text-white font-bold text-sm rounded-xl border border-white/20 transition"
            >
              Cổng Tài xế (Driver Portal)
            </button>
          </div>

          {/* Decorative background circle */}
          <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-brand-500/20 rounded-full blur-3xl pointer-events-none" />
        </div>
      </section>

      {/* 8. FOOTER CHUYÊN NGHIỆP */}
      <footer className="bg-slate-900 text-slate-400 pt-14 pb-8 border-t border-slate-800 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 pb-10 border-b border-slate-800">
            {/* Col 1: Brand Info */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-brand-500 flex items-center justify-center text-white font-black text-xl shadow-md shadow-orange-500/30">
                  <Truck className="w-5 h-5" />
                </div>
                <div className="text-2xl font-black text-white">
                  Mod<span className="text-brand-500">Move</span>
                </div>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
                Nền tảng công nghệ đặt xe tải, xe bán tải và dịch vụ chuyển nhà theo yêu cầu hàng đầu. Kết nối khách hàng và hạm đội tài xế uy tín trong tích tắc.
              </p>
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-brand-400" />
                  <span>Tổng đài CSKH: <strong className="text-white">1900 636 688</strong> (7:00 - 22:00)</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-brand-400" />
                  <span>Trụ sở: Tòa nhà TechHub, Đường D1, Khu Công Nghệ Cao, TP. Thủ Đức, TP.HCM</span>
                </div>
              </div>
            </div>

            {/* Col 2: Dịch vụ */}
            <div className="space-y-3">
              <div className="text-xs font-bold text-white uppercase tracking-wider">Dịch vụ</div>
              <ul className="space-y-2 text-xs">
                <li><a onClick={handleGiaoHangNgay} className="hover:text-brand-400 cursor-pointer transition">Chuyển nhà trọn gói</a></li>
                <li><a onClick={handleGiaoHangNgay} className="hover:text-brand-400 cursor-pointer transition">Xe bán tải 500kg</a></li>
                <li><a onClick={handleGiaoHangNgay} className="hover:text-brand-400 cursor-pointer transition">Xe tải 1 - 2 tấn</a></li>
                <li><a onClick={handleGiaoHangNgay} className="hover:text-brand-400 cursor-pointer transition">Dịch vụ bốc xếp 2 đầu</a></li>
                <li><a onClick={handleGiaoHangNgay} className="hover:text-brand-400 cursor-pointer transition">Hợp đồng vận chuyển xe tải</a></li>
              </ul>
            </div>

            {/* Col 3: Khách hàng & Tài xế */}
            <div className="space-y-3">
              <div className="text-xs font-bold text-white uppercase tracking-wider">Đối tác & Hỗ trợ</div>
              <ul className="space-y-2 text-xs">
                <li><a onClick={() => navigate('/login')} className="hover:text-brand-400 cursor-pointer transition">Đăng ký làm tài xế</a></li>
                <li><a onClick={() => navigate('/login')} className="hover:text-brand-400 cursor-pointer transition">Bảng tính thu nhập</a></li>
                <li><a onClick={handleGiaoHangNgay} className="hover:text-brand-400 cursor-pointer transition">Khách hàng doanh nghiệp</a></li>
                <li><a onClick={() => navigate('/login')} className="hover:text-brand-400 cursor-pointer transition">Chính sách bảo hiểm</a></li>
                <li><a onClick={() => navigate('/login')} className="hover:text-brand-400 cursor-pointer transition">Cổng điều phối viên</a></li>
              </ul>
            </div>

            {/* Col 4: Tải app & Chứng nhận */}
            <div className="space-y-3">
              <div className="text-xs font-bold text-white uppercase tracking-wider">Tải ứng dụng</div>
              <p className="text-[11px] text-slate-400">Trải nghiệm đặt xe nhanh nhất trên điện thoại di động</p>
              <div className="space-y-2">
                <button
                  onClick={handleGiaoHangNgay}
                  className="w-full flex items-center gap-2.5 p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs border border-slate-700 transition"
                >
                  <Smartphone className="w-4 h-4 text-brand-400" />
                  <div className="text-left">
                    <div className="text-[9px] text-slate-400">Tải về trên</div>
                    <div className="font-bold text-[11px]">App Store & Google Play</div>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Copyright */}
          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-4">
            <div>
              © 2026 ModMove Technologies Inc. Toàn quyền bảo lưu. Đồ án Hệ thống Vận chuyển On-Demand.
            </div>
            <div className="flex items-center gap-4">
              <span className="hover:text-slate-400 cursor-pointer">Điều khoản dịch vụ</span>
              <span>•</span>
              <span className="hover:text-slate-400 cursor-pointer">Chính sách bảo mật</span>
              <span>•</span>
              <span className="hover:text-slate-400 cursor-pointer">Quy chế hoạt động</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
