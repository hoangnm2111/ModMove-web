import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Truck,
  ArrowLeft,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Clock,
  RotateCcw,
} from 'lucide-react';
import { useAuthStore, HARDCODED_ACCOUNTS } from '../../store/useAuthStore';
import { UserRole } from '../../types/user.types';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, loginWithRole, registerCustomer } = useAuthStore();

  // Active Tab: 'login' | 'register'
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  // Login form state
  const [loginPhone, setLoginPhone] = useState('');
  const [loginPassword, setLoginPassword] = useState('123456');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Register form state (from SRS Document UC-GST-01 & Image 2)
  const [regFullName, setRegFullName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('123456');
  const [regReferral, setRegReferral] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);

  // 4 Checkboxes from Image 2
  const [agreeTerms, setAgreeTerms] = useState(false); // Bắt buộc
  const [agreeDataProcessing, setAgreeDataProcessing] = useState(false); // Bắt buộc
  const [agreeMarketing, setAgreeMarketing] = useState(false); // Tùy chọn
  const [agreeThirdParty, setAgreeThirdParty] = useState(false); // Tùy chọn

  // OTP Modal state (SRS UC-GST-01 Step 5-8)
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpCode, setOtpCode] = useState(['1', '2', '3', '4', '5', '6']);
  const [otpCountdown, setOtpCountdown] = useState(300); // 5 phút (300 giây) theo SRS
  const [otpError, setOtpError] = useState('');
  const [otpSuccess, setOtpSuccess] = useState(false);

  // Quick Demo Account Accordion
  const [showDemoAccounts, setShowDemoAccounts] = useState(false);

  // OTP Countdown Timer
  useEffect(() => {
    let timer: any;
    if (showOtpModal && otpCountdown > 0) {
      timer = setInterval(() => {
        setOtpCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [showOtpModal, otpCountdown]);

  // Format MM:SS for OTP timer
  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Check if Login button is enabled
  const isLoginValid = loginPhone.trim().length >= 3;

  // Check if Register button is enabled
  const isRegisterValid =
    regFullName.trim().length >= 2 &&
    regPhone.trim().length >= 9 &&
    regEmail.trim().includes('@') &&
    agreeTerms &&
    agreeDataProcessing;

  // Handle Login Submit
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (!isLoginValid) {
      setLoginError('Vui lòng nhập số điện thoại hoặc tên tài khoản.');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      const res = login(loginPhone, loginPassword);
      setIsSubmitting(false);

      if (res.success && res.defaultPath) {
        navigate(res.defaultPath, { replace: true });
      } else {
        setLoginError(res.message || 'Đăng nhập không thành công. Mật khẩu mặc định là 123456.');
      }
    }, 250);
  };

  // Handle Register Submit -> Trigger OTP Verification Modal (SRS UC-GST-01)
  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (!agreeTerms || !agreeDataProcessing) {
      setLoginError('Vui lòng đồng ý với Chính sách & Điều khoản và Xử lý dữ liệu cá nhân.');
      return;
    }

    // Open OTP Verification Modal
    setShowOtpModal(true);
    setOtpCountdown(300);
    setOtpError('');
    setOtpSuccess(false);
  };

  // Confirm OTP (SRS UC-GST-01 Step 6 - Step 8)
  const handleVerifyOtp = () => {
    const fullCode = otpCode.join('');
    if (fullCode.length < 6) {
      setOtpError('Vui lòng nhập đủ 6 chữ số mã OTP.');
      return;
    }

    // In demo environment, 123456 or any 6 digits are accepted
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);

      // Register new user into store
      const regRes = registerCustomer({
        fullName: regFullName,
        phoneNumber: regPhone,
        email: regEmail,
        password: regPassword,
      });

      if (!regRes.success) {
        setOtpError(regRes.message || 'Đăng ký không thành công.');
        return;
      }

      setOtpSuccess(true);
      setTimeout(() => {
        // Automatically log in the new Customer
        const loginRes = login(regPhone, regPassword);
        setShowOtpModal(false);
        if (loginRes.success && loginRes.defaultPath) {
          navigate(loginRes.defaultPath, { replace: true });
        } else {
          setActiveTab('login');
          setLoginPhone(regPhone);
        }
      }, 1000);
    }, 400);
  };

  // Quick 1-click login for testing
  const handleQuickLogin = (role: UserRole) => {
    setIsSubmitting(true);
    setTimeout(() => {
      const targetPath = loginWithRole(role);
      setIsSubmitting(false);
      navigate(targetPath, { replace: true });
    }, 200);
  };

  return (
    <div className="min-h-screen w-full relative flex items-center justify-start overflow-hidden bg-slate-100 select-none">
      {/* 1. ELEGANT CALM WHITE / LIGHT NEUTRAL BACKGROUND (MÀU TRẦM TRẮNG DỄ NHÌN) */}
      <div className="absolute inset-0 z-0 bg-slate-100">
        {/* Soft subtle gradient layers */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-100 via-slate-50 to-orange-50/40" />

        {/* Soft, calm ambient glows - non-glaring */}
        <div className="absolute top-1/6 left-1/4 w-96 h-96 bg-orange-200/25 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-sky-100/40 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />
      </div>

      {/* 2. RIGHT-SIDE ILLUSTRATION / PHOTO OF COURIER & CUSTOMER (MATCHING USER SCREENSHOT) */}
      <div className="hidden lg:flex absolute right-0 top-0 bottom-0 w-7/12 items-end justify-center pointer-events-none z-10 overflow-hidden">
        {/* Authentic photography of courier & happy customer generated specifically for ModMove */}
        <img
          src="/images/auth-banner.jpg"
          alt="ModMove Driver and Customer"
          className="h-full w-full object-cover object-center max-h-screen filter drop-shadow-2xl"
          onError={(e) => {
            // Fallback to high quality unsplash if local image fails
            (e.target as HTMLImageElement).src =
              'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1600&q=80';
          }}
        />
      </div>

      {/* 3. MAIN FLOATING WHITE CARD (EXACTLY MATCHING USER SCREENSHOT 1 & 2) */}
      <div className="relative z-20 w-full max-w-xl mx-auto lg:mx-0 lg:ml-12 xl:ml-24 px-4 py-8">
        <div className="bg-white rounded-[28px] sm:rounded-[32px] shadow-2xl p-6 sm:p-10 border border-slate-100/80 backdrop-blur-md max-w-md w-full mx-auto">
          {/* Header: Logo and Return Home Button */}
          <div className="flex items-center justify-between mb-6">
            <div
              onClick={() => navigate('/')}
              className="flex items-center gap-2.5 cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-xl bg-brand-500 flex items-center justify-center text-white shadow-md shadow-orange-500/30 group-hover:scale-105 transition-transform">
                <Truck className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div className="text-2xl font-black text-slate-900 tracking-tight">
                Mod<span className="text-brand-500">Move</span>
                <span className="text-[10px] text-brand-500 align-super ml-0.5 font-bold">®</span>
              </div>
            </div>

            <button
              onClick={() => navigate('/')}
              className="text-xs font-semibold text-slate-400 hover:text-brand-600 flex items-center gap-1 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Trang chủ</span>
            </button>
          </div>

          {/* TWO TABS: ĐĂNG NHẬP | ĐĂNG KÝ (IDENTICAL TO SCREENSHOT) */}
          <div className="flex items-center gap-8 border-b border-slate-100 mb-6">
            <button
              onClick={() => {
                setActiveTab('login');
                setLoginError('');
              }}
              className={`pb-3 text-base sm:text-lg transition-all relative ${
                activeTab === 'login'
                  ? 'font-extrabold text-slate-900 border-b-2 border-brand-500'
                  : 'font-semibold text-slate-400 hover:text-slate-600'
              }`}
            >
              Đăng nhập
            </button>

            <button
              onClick={() => {
                setActiveTab('register');
                setLoginError('');
              }}
              className={`pb-3 text-base sm:text-lg transition-all relative ${
                activeTab === 'register'
                  ? 'font-extrabold text-slate-900 border-b-2 border-brand-500'
                  : 'font-semibold text-slate-400 hover:text-slate-600'
              }`}
            >
              Đăng ký
            </button>
          </div>

          {/* Error Message Alert */}
          {loginError && (
            <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs flex items-start gap-2.5 animate-fadeIn">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{loginError}</span>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 1: FORM ĐĂNG NHẬP (IMAGE 1) */}
          {/* ========================================================================= */}
          {activeTab === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              {/* Phone Input with Vietnam Flag +84 Box */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase">
                  Số điện thoại hoặc Tài khoản
                </label>
                <div className="flex items-center gap-2.5">
                  {/* Flag +84 Prefix Box */}
                  <div className="h-12 px-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center gap-2 flex-shrink-0 text-slate-700 font-bold text-xs sm:text-sm">
                    {/* Vietnam Flag representation */}
                    <span className="text-base" role="img" aria-label="Vietnam Flag">
                      🇻🇳
                    </span>
                    <span>+84</span>
                  </div>

                  {/* Phone input */}
                  <input
                    type="text"
                    value={loginPhone}
                    onChange={(e) => setLoginPhone(e.target.value)}
                    placeholder="Số điện thoại"
                    autoFocus
                    className="flex-1 h-12 px-4 bg-white border border-slate-200 hover:border-slate-300 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 rounded-xl text-slate-800 text-sm font-medium transition placeholder:text-slate-400 outline-none"
                  />
                </div>
              </div>

              {/* Password field with toggle */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Mật khẩu</label>
                  <button
                    type="button"
                    onClick={() => {
                      setLoginPhone('0338967316');
                      setLoginPassword('123456');
                    }}
                    className="text-[11px] text-brand-600 hover:underline font-semibold"
                  >
                    Quên mật khẩu?
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Mật khẩu (Mặc định: 123456)"
                    className="w-full h-12 px-4 pr-11 bg-white border border-slate-200 hover:border-slate-300 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 rounded-xl text-slate-800 text-sm font-medium transition placeholder:text-slate-400 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* TIẾP TỤC BUTTON (GRAY WHEN EMPTY, ORANGE WHEN FILLED) */}
              <button
                type="submit"
                disabled={!isLoginValid || isSubmitting}
                className={`w-full h-12 rounded-xl font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition-all duration-200 ${
                  isLoginValid
                    ? 'bg-brand-500 hover:bg-brand-600 text-white shadow-lg shadow-orange-500/30 cursor-pointer active:scale-98'
                    : 'bg-[#CBD5E1] text-slate-500 cursor-not-allowed'
                }`}
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <span>Tiếp tục</span>
                )}
              </button>

              {/* DIVIDER: "HOẶC" (EXACTLY AS IN IMAGE 1) */}
              <div className="relative my-5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-white px-3 text-slate-400 font-medium">Hoặc</span>
                </div>
              </div>

              {/* SOCIAL LOGIN BUTTONS (FACEBOOK & GOOGLE - EXACTLY AS IN IMAGE 1) */}
              <div className="space-y-2.5">
                {/* Facebook Login */}
                <button
                  type="button"
                  onClick={() => handleQuickLogin('Customer')}
                  className="w-full h-12 px-4 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs sm:text-sm flex items-center justify-center gap-3 transition"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#1877F2">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                  <span>Đăng nhập với Facebook</span>
                </button>

                {/* Google Login */}
                <button
                  type="button"
                  onClick={() => handleQuickLogin('Customer')}
                  className="w-full h-12 px-4 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs sm:text-sm flex items-center justify-center gap-3 transition"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Đăng nhập với Google</span>
                </button>
              </div>

              {/* DEMO ACCOUNTS HELPER (Tiện ích chuyển nhanh 4 vai trò cho chấm bài & kiểm thử) */}
              <div className="pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowDemoAccounts(!showDemoAccounts)}
                  className="w-full text-center text-[11px] font-bold text-slate-500 hover:text-brand-600 flex items-center justify-center gap-1 transition"
                >
                  <KeyRound className="w-3.5 h-3.5 text-amber-500" />
                  <span>{showDemoAccounts ? 'Ẩn tài khoản Demo' : 'Truy cập nhanh 4 vai trò (Admin / Driver / Dispatcher / Customer)'}</span>
                </button>

                {showDemoAccounts && (
                  <div className="mt-3 grid grid-cols-2 gap-2 p-2 bg-slate-50 rounded-xl border border-slate-200 text-[11px]">
                    {HARDCODED_ACCOUNTS.map((acc) => (
                      <button
                        key={acc.role}
                        type="button"
                        onClick={() => handleQuickLogin(acc.role)}
                        className="p-2 rounded-lg bg-white border border-slate-200 hover:border-brand-500 text-left transition hover:shadow-sm"
                      >
                        <div className="font-bold text-slate-800">{acc.label.split(' ')[0]}</div>
                        <div className="text-[10px] text-slate-500">TK: {acc.username}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </form>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: FORM ĐĂNG KÝ (IMAGE 2 & DOC SRS UC-GST-01) */}
          {/* ========================================================================= */}
          {activeTab === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              {/* Field 1: Tên đầy đủ */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Tên đầy đủ</label>
                <input
                  type="text"
                  value={regFullName}
                  onChange={(e) => setRegFullName(e.target.value)}
                  placeholder="Tên liên lạc của bạn khi sử dụng dịch vụ"
                  className="w-full h-11 px-3.5 bg-white border border-slate-200 hover:border-slate-300 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 rounded-xl text-slate-800 text-xs sm:text-sm font-medium transition placeholder:text-slate-400 outline-none"
                />
              </div>

              {/* Field 2: Số điện thoại */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Số điện thoại</label>
                <input
                  type="tel"
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  placeholder="Số điện thoại"
                  className="w-full h-11 px-3.5 bg-white border border-slate-200 hover:border-slate-300 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 rounded-xl text-slate-800 text-xs sm:text-sm font-medium transition placeholder:text-slate-400 outline-none"
                />
              </div>

              {/* Field 3: Email (nhận OTP xác thực theo SRS) */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Email</label>
                <input
                  type="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="Email"
                  className="w-full h-11 px-3.5 bg-white border border-slate-200 hover:border-slate-300 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 rounded-xl text-slate-800 text-xs sm:text-sm font-medium transition placeholder:text-slate-400 outline-none"
                />
              </div>

              {/* Field 4: Mật khẩu */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Mật khẩu</label>
                <div className="relative">
                  <input
                    type={showRegPassword ? 'text' : 'password'}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Mật khẩu (tối thiểu 6 ký tự)"
                    className="w-full h-11 px-3.5 pr-10 bg-white border border-slate-200 hover:border-slate-300 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 rounded-xl text-slate-800 text-xs sm:text-sm font-medium transition placeholder:text-slate-400 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition"
                  >
                    {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Field 5: Mã giới thiệu (không bắt buộc) */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Mã giới thiệu (không bắt buộc)</label>
                <input
                  type="text"
                  value={regReferral}
                  onChange={(e) => setRegReferral(e.target.value)}
                  placeholder="Mã giới thiệu (không bắt buộc)"
                  className="w-full h-11 px-3.5 bg-white border border-slate-200 hover:border-slate-300 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 rounded-xl text-slate-800 text-xs sm:text-sm font-medium transition placeholder:text-slate-400 outline-none"
                />
              </div>

              {/* 4 CHECKBOXES (EXACT WORDING FROM USER SCREENSHOT 2) */}
              <div className="space-y-2.5 pt-2 text-[11px] text-slate-600 leading-snug">
                {/* Checkbox 1: Chính sách & Điều khoản (Bắt buộc) */}
                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded border-slate-300 text-brand-500 focus:ring-brand-500 rounded-sm"
                  />
                  <span>
                    Tôi đã đọc, hiểu rõ và đồng ý với{' '}
                    <span className="text-brand-600 font-bold underline">Chính sách và Điều khoản</span> của ModMove.
                  </span>
                </label>

                {/* Checkbox 2: Xử lý dữ liệu cung cấp dịch vụ (Bắt buộc) */}
                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={agreeDataProcessing}
                    onChange={(e) => setAgreeDataProcessing(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded border-slate-300 text-brand-500 focus:ring-brand-500 rounded-sm"
                  />
                  <span>Cho phép ModMove xử lý dữ liệu cá nhân để thực hiện đơn hàng và cung cấp dịch vụ.</span>
                </label>

                {/* Checkbox 3: Quảng cáo tiếp thị (Tùy chọn) */}
                <label className="flex items-start gap-2.5 cursor-pointer select-none text-slate-500">
                  <input
                    type="checkbox"
                    checked={agreeMarketing}
                    onChange={(e) => setAgreeMarketing(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded border-slate-300 text-brand-500 focus:ring-brand-500 rounded-sm"
                  />
                  <span>
                    Cho phép ModMove xử lý dữ liệu cá nhân cho mục đích quảng cáo tiếp thị, truyền thông và các hoạt động
                    xúc tiến thương mại (Tùy chọn).
                  </span>
                </label>

                {/* Checkbox 4: Chuyển giao bên thứ ba (Tùy chọn) */}
                <label className="flex items-start gap-2.5 cursor-pointer select-none text-slate-500">
                  <input
                    type="checkbox"
                    checked={agreeThirdParty}
                    onChange={(e) => setAgreeThirdParty(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded border-slate-300 text-brand-500 focus:ring-brand-500 rounded-sm"
                  />
                  <span>
                    Cho phép ModMove chuyển giao dữ liệu cá nhân cho bên thứ ba liên quan (Tùy chọn).{' '}
                    <span className="text-brand-600 font-bold underline">Xem chi tiết</span>
                  </span>
                </label>
              </div>

              {/* NÚT TIẾP TỤC ĐĂNG KÝ */}
              <button
                type="submit"
                disabled={!isRegisterValid}
                className={`w-full h-12 rounded-xl font-bold text-sm sm:text-base flex items-center justify-center gap-2 mt-4 transition-all duration-200 ${
                  isRegisterValid
                    ? 'bg-brand-500 hover:bg-brand-600 text-white shadow-lg shadow-orange-500/30 cursor-pointer active:scale-98'
                    : 'bg-[#CBD5E1] text-slate-500 cursor-not-allowed'
                }`}
              >
                Tiếp tục
              </button>
            </form>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. MODAL XÁC THỰC MÃ OTP (THEO ĐÚNG TÀI LIỆU SRS UC-GST-01: STEP 5 - 8) */}
      {/* ========================================================================= */}
      {showOtpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-100 text-center animate-fadeIn relative">
            <div className="w-14 h-14 rounded-2xl bg-orange-100 text-brand-600 flex items-center justify-center mx-auto mb-4 shadow-sm">
              <ShieldCheck className="w-7 h-7" />
            </div>

            <h3 className="text-xl font-extrabold text-slate-900">Xác thực mã OTP</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
              Hệ thống đã gửi mã OTP 6 chữ số tới email <strong className="text-slate-800">{regEmail || 'customer@modmove.vn'}</strong>
            </p>

            {otpError && (
              <div className="mt-3 p-2.5 rounded-xl bg-rose-50 text-rose-600 text-xs flex items-center justify-center gap-1.5 font-medium">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{otpError}</span>
              </div>
            )}

            {otpSuccess && (
              <div className="mt-3 p-3 rounded-xl bg-emerald-50 text-emerald-700 text-xs flex items-center justify-center gap-2 font-bold animate-pulse">
                <CheckCircle2 className="w-4 h-4" />
                <span>Đăng ký thành công! Đang chuyển hướng vào hệ thống...</span>
              </div>
            )}

            {/* 6-Digit OTP Input Boxes */}
            <div className="flex items-center justify-center gap-2 sm:gap-3 my-6">
              {otpCode.map((digit, idx) => (
                <input
                  key={idx}
                  id={`otp-input-${idx}`}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    const newOtp = [...otpCode];
                    newOtp[idx] = val;
                    setOtpCode(newOtp);
                    // Auto-focus next input
                    if (val && idx < 5) {
                      const nextInput = document.getElementById(`otp-input-${idx + 1}`);
                      nextInput?.focus();
                    }
                  }}
                  className="w-11 h-13 sm:w-12 sm:h-14 text-center font-mono font-bold text-xl sm:text-2xl border-2 border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 rounded-xl outline-none transition"
                />
              ))}
            </div>

            {/* Countdown timer & Resend button */}
            <div className="flex items-center justify-between text-xs text-slate-500 px-2 mb-6">
              <div className="flex items-center gap-1.5 font-medium">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Hiệu lực còn: <strong className="text-brand-600">{formatTimer(otpCountdown)}</strong></span>
              </div>

              <button
                type="button"
                onClick={() => {
                  setOtpCountdown(300);
                  setOtpError('');
                }}
                className="font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Gửi lại mã</span>
              </button>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowOtpModal(false)}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs sm:text-sm transition"
              >
                Hủy bỏ
              </button>

              <button
                type="button"
                onClick={handleVerifyOtp}
                disabled={isSubmitting || otpSuccess}
                className="flex-1 py-3 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl text-xs sm:text-sm shadow-lg shadow-orange-500/25 transition flex items-center justify-center gap-1.5"
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Xác nhận</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
