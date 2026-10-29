import React, { useState, createContext, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Menu,
  X,
  Truck,
  Navigation,
  CreditCard,
  LogOut,
  ChevronRight,
  ShieldCheck,
  Power,
  TrendingUp,
  FileCheck,
  AlertTriangle,
  Radio,
  ClipboardList,
  Package,
  History,
  ShieldAlert,
  Lock,
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useDriverStore } from '../store/useDriverStore';
import { formatCurrency } from '../utils/format';

interface DriverLayoutContextType {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
}

export const DriverLayoutContext = createContext<DriverLayoutContextType>({
  isSidebarOpen: false,
  setIsSidebarOpen: () => {},
  toggleSidebar: () => {},
});

export const useDriverLayout = () => useContext(DriverLayoutContext);

interface DriverLayoutProps {
  children: React.ReactNode;
}

export const DriverLayout: React.FC<DriverLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const {
    isOnline,
    toggleOnline,
    todayEarnings,
    activeTrip,
    walletBalance,
    depositBalance,
    profileApprovalStatus,
  } = useDriverStore();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);

  const isApproved = profileApprovalStatus === 'Approved';
  const isJobListActive = location.pathname === '/driver';
  const isTripActive = location.pathname.startsWith('/driver/trip');
  const isHistoryActive = location.pathname === '/driver/history';
  const isIncidentsActive = location.pathname === '/driver/incidents';
  const isEarningsActive = location.pathname === '/driver/earnings';
  const isProfileActive = location.pathname === '/driver/profile';

  const handleNavigate = (path: string) => {
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
    navigate(path);
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  // Content for expanded sidebar (matches CustomerLayout structure with Driver features)
  const renderSidebarContent = () => (
    <div className="flex flex-col h-full bg-white text-slate-800 select-none overflow-hidden">
      {/* 1. Header: Clean Slate Theme with Driver Status */}
      <div className="bg-slate-900 text-white p-4 flex-shrink-0 border-b border-slate-800">
        <div className="flex items-center justify-between pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-slate-800 text-white flex items-center justify-center font-bold border border-slate-700">
              <Truck className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <span className="text-xl font-black tracking-tight text-white">
                Mod<span className="text-blue-500">Move</span>
              </span>
              <span className="ml-1.5 px-1.5 py-0.5 rounded text-[10px] font-black uppercase bg-slate-800 text-slate-300 border border-slate-700">
                Tài xế
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsSidebarOpen(false)}
            className="w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition cursor-pointer"
            title="Đóng menu"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Driver Profile Card */}
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-3">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80"
                alt="Avatar tài xế"
                className="w-10 h-10 rounded-full border border-slate-600 object-cover"
              />
              <span
                className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-slate-900 ${
                  isOnline ? 'bg-emerald-400' : 'bg-slate-400'
                }`}
              />
            </div>
            <div className="overflow-hidden flex-1">
              <div className="font-extrabold text-xs sm:text-sm text-white truncate">
                {user?.fullName || 'Nguyễn Văn Hùng'}
              </div>
              <div className="text-[11px] text-slate-400 font-mono truncate">
                29C-874.12 • Xe Tải 1T
              </div>
            </div>
          </div>

          {/* Quick Online Duty Switch inside Profile card */}
          <div className="mt-2.5 pt-2 border-t border-slate-700/80 flex items-center justify-between text-[11px]">
            <span className="text-slate-400 font-medium">Trực tuyến nhận đơn:</span>
            {isApproved ? (
              <button
                type="button"
                onClick={toggleOnline}
                className={`px-2.5 py-1 rounded-full font-bold flex items-center gap-1.5 transition text-[11px] shadow-xs cursor-pointer ${
                  isOnline
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                <Power className="w-3 h-3" />
                <span>{isOnline ? 'ĐANG BẬT XE' : 'NGHỈ CUỐC'}</span>
              </button>
            ) : (
              <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-amber-400 text-slate-900 flex items-center gap-1 shadow-xs">
                <Lock className="w-3 h-3" />
                <span>Hồ sơ chưa duyệt</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 2. Menu Items Body */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-4 bg-white text-xs sm:text-sm">
        {/* Section 1: CHUYẾN XE & ĐIỀU PHỐI */}
        <div>
          <div className="text-[10px] uppercase tracking-wider text-slate-400 mb-1.5 font-extrabold px-3">
            Điều phối & Chuyến đi
          </div>
          <div className="space-y-1">
            {/* Tab 1: Danh sách đơn hàng */}
            <button
              type="button"
              onClick={() => handleNavigate('/driver')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition text-left ${
                isJobListActive
                  ? 'bg-slate-100 text-slate-900 font-bold border border-slate-300'
                  : 'hover:bg-slate-50 text-slate-700'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                    isJobListActive ? 'bg-slate-200 text-slate-900' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  <Package className="w-4 h-4" />
                </div>
                <span className="font-semibold">Danh sách đơn hàng</span>
              </div>
              <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-1.5 py-0.5 rounded border border-slate-200">
                3 đơn
              </span>
            </button>

            {/* Tab 2: Chuyến đang vận chuyển */}
            <button
              type="button"
              onClick={() => handleNavigate('/driver/trip')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition text-left ${
                isTripActive
                  ? 'bg-slate-100 text-slate-900 font-bold border border-slate-300'
                  : 'hover:bg-slate-50 text-slate-700'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                    activeTrip ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  <Navigation className={`w-4 h-4 ${activeTrip ? 'animate-bounce text-blue-600' : ''}`} />
                </div>
                <span className="font-semibold">Chuyến đang vận chuyển</span>
              </div>
              {activeTrip ? (
                <span className="bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                  LIVE
                </span>
              ) : (
                <span className="text-[10px] text-slate-400 font-medium">Chờ cuốc</span>
              )}
            </button>

            {/* Tab 3: Lịch sử chuyến xe */}
            <button
              type="button"
              onClick={() => handleNavigate('/driver/history')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition text-left ${
                isHistoryActive
                  ? 'bg-slate-100 text-slate-900 font-bold border border-slate-300'
                  : 'hover:bg-slate-50 text-slate-700'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                    isHistoryActive ? 'bg-slate-200 text-slate-900' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  <History className="w-4 h-4" />
                </div>
                <span className="font-semibold">Lịch sử chuyến xe</span>
              </div>
              <span className="text-[10px] text-slate-400 font-medium">4 chuyến</span>
            </button>
          </div>
        </div>

        {/* Section 2: HỖ TRỢ & SỰ CỐ */}
        <div>
          <div className="text-[10px] uppercase tracking-wider text-slate-400 mb-1.5 font-extrabold px-3">
            Hỗ trợ & An toàn
          </div>
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => handleNavigate('/driver/incidents')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition text-left ${
                isIncidentsActive
                  ? 'bg-orange-50 text-brand-600 font-bold border border-orange-200/80 shadow-xs'
                  : 'hover:bg-slate-50 text-slate-700'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                    isIncidentsActive ? 'bg-rose-100 text-rose-600' : 'bg-rose-50 text-rose-500'
                  }`}
                >
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <span className="font-semibold">Nhật ký sự cố</span>
              </div>
              <span className="bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-black px-1.5 py-0.5 rounded">
                3 vụ
              </span>
            </button>
          </div>
        </div>

        {/* Section 3: TÀI CHÍNH & VÍ TÀI XẾ */}
        <div>
          <div className="text-[10px] uppercase tracking-wider text-slate-400 mb-1.5 font-extrabold px-3">
            Tài chính & Thu nhập
          </div>
          <div className="space-y-1">
            {/* Thu nhập & Ví */}
            <button
              type="button"
              onClick={() => handleNavigate('/driver/earnings')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition text-left ${
                isEarningsActive
                  ? 'bg-orange-50 text-brand-600 font-bold border border-orange-200/80 shadow-xs'
                  : 'hover:bg-slate-50 text-slate-700'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-indigo-100/80 text-indigo-700 flex items-center justify-center">
                  <CreditCard className="w-4 h-4" />
                </div>
                <span className="font-semibold">Ví & Doanh thu</span>
              </div>
              <span className="text-[11px] font-black text-emerald-600">
                {formatCurrency(walletBalance)}
              </span>
            </button>
          </div>
        </div>

        {/* Section 4: HỒ SƠ PHÁP LÝ & PHƯƠNG TIỆN */}
        <div>
          <div className="text-[10px] uppercase tracking-wider text-slate-400 mb-1.5 font-extrabold px-3">
            Hồ sơ & Đăng kiểm
          </div>
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => handleNavigate('/driver/profile')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition text-left ${
                isProfileActive
                  ? 'bg-orange-50 text-brand-600 font-bold border border-orange-200/80 shadow-xs'
                  : 'hover:bg-slate-50 text-slate-700'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-sky-100/80 text-sky-700 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <span className="font-semibold">Hồ sơ pháp lý xe</span>
              </div>
              {profileApprovalStatus === 'Approved' && (
                <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-1.5 py-0.5 rounded">
                  ĐÃ DUYỆT
                </span>
              )}
              {profileApprovalStatus === 'Pending' && (
                <span className="bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold px-1.5 py-0.5 rounded">
                  CHỜ DUYỆT
                </span>
              )}
              {profileApprovalStatus === 'Rejected' && (
                <span className="bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold px-1.5 py-0.5 rounded">
                  TỪ CHỐI
                </span>
              )}
              {profileApprovalStatus === 'Draft' && (
                <span className="bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-bold px-1.5 py-0.5 rounded">
                  CHƯA NỘP
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 3. Bottom: Đăng xuất */}
      <div className="p-3 border-t border-slate-200/80 bg-slate-50 flex-shrink-0">
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl text-slate-600 hover:text-rose-600 hover:bg-rose-50 font-bold text-xs transition cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Đăng xuất tài khoản</span>
        </button>
      </div>
    </div>
  );

  return (
    <DriverLayoutContext.Provider value={{ isSidebarOpen, setIsSidebarOpen, toggleSidebar }}>
      <div className="flex w-screen h-screen overflow-hidden bg-slate-100 font-sans select-none relative">
        {/* DESKTOP SIDEBAR AREA: Push layout matching CustomerLayout */}
        {isSidebarOpen ? (
          <aside className="hidden md:flex w-72 sm:w-80 h-full flex-shrink-0 flex-col border-r border-slate-200 z-30 shadow-lg animate-slideRight">
            {renderSidebarContent()}
          </aside>
        ) : (
          <aside className="w-14 sm:w-16 bg-white border-r border-slate-200 flex flex-col items-center py-3 z-30 flex-shrink-0 shadow-xs">
            {/* Hamburger Menu Toggle Button */}
            <button
              onClick={toggleSidebar}
              className="w-10 h-10 rounded-xl hover:bg-slate-100 text-slate-700 hover:text-brand-600 flex items-center justify-center transition mb-4 cursor-pointer"
              title="Mở menu điều hướng"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Vertical Service & Menu Icons */}
            <div className="flex-1 flex flex-col items-center gap-3 w-full">
              {/* 1. Danh sách đơn hàng */}
              <button
                onClick={() => handleNavigate('/driver')}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition group relative ${
                  isJobListActive
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
                title="Danh sách đơn hàng"
              >
                <Package className="w-5 h-5" />
                <span className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-[10px] font-bold rounded shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition z-50">
                  Danh sách đơn hàng
                </span>
              </button>

              {/* 2. Chuyến đang vận chuyển */}
              <button
                onClick={() => handleNavigate('/driver/trip')}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition group relative ${
                  isTripActive
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
                title="Chuyến đang vận chuyển"
              >
                <Navigation className={`w-5 h-5 ${activeTrip ? 'animate-bounce text-blue-500' : ''}`} />
                <span className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-[10px] font-bold rounded shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition z-50">
                  Chuyến đang vận chuyển {activeTrip ? `(#${activeTrip.code})` : ''}
                </span>
              </button>

              {/* 3. Lịch sử chuyến xe */}
              <button
                onClick={() => handleNavigate('/driver/history')}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition group relative ${
                  isHistoryActive
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
                title="Lịch sử chuyến xe"
              >
                <History className="w-5 h-5" />
                <span className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-[10px] font-bold rounded shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition z-50">
                  Lịch sử chuyến xe
                </span>
              </button>

              <div className="w-8 h-[1px] bg-slate-200 my-1" />

              {/* 4. Nhật ký sự cố */}
              <button
                onClick={() => handleNavigate('/driver/incidents')}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition group relative ${
                  isIncidentsActive
                    ? 'bg-rose-600 text-white shadow-md shadow-rose-600/25'
                    : 'text-slate-500 hover:bg-rose-50 hover:text-rose-600'
                }`}
                title="Nhật ký sự cố"
              >
                <ShieldAlert className="w-5 h-5" />
                <span className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-[10px] font-bold rounded shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition z-50">
                  Nhật ký sự cố
                </span>
              </button>

              {/* 5. Thu nhập & Ví */}
              <button
                onClick={() => handleNavigate('/driver/earnings')}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition group relative ${
                  isEarningsActive
                    ? 'bg-brand-500 text-white shadow-md shadow-orange-500/25'
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                }`}
                title="Ví & Thu nhập"
              >
                <CreditCard className="w-5 h-5" />
                <span className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-[10px] font-bold rounded shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition z-50">
                  Ví & Thu nhập
                </span>
              </button>

              {/* 3. Hồ sơ pháp lý xe */}
              <button
                onClick={() => handleNavigate('/driver/profile')}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition group relative ${
                  isProfileActive
                    ? 'bg-brand-500 text-white shadow-md shadow-orange-500/25'
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                }`}
                title="Hồ sơ xe & Pháp lý"
              >
                <ShieldCheck className="w-5 h-5" />
                <span className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-[10px] font-bold rounded shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition z-50">
                  Hồ sơ xe & Giấy tờ
                </span>
              </button>
            </div>

            {/* Bottom Driver Duty Indicator Icon */}
            <div
              onClick={toggleOnline}
              className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs cursor-pointer transition border ${
                isOnline
                  ? 'bg-emerald-500 text-white border-emerald-600 shadow-sm'
                  : 'bg-slate-100 text-slate-500 border-slate-300'
              }`}
              title={isOnline ? 'Tài xế đang Online (Bấm để nghỉ ca)' : 'Tài xế đang Offline (Bấm để bật ca)'}
            >
              <Power className="w-4 h-4" />
            </div>
          </aside>
        )}

        {/* MOBILE DRAWER */}
        {isSidebarOpen && (
          <div className="md:hidden fixed inset-0 z-50 flex">
            <div
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            />
            <div className="relative w-72 sm:w-80 h-full bg-white text-slate-800 flex flex-col shadow-2xl z-50 border-r border-slate-200 animate-slideRight overflow-hidden">
              {renderSidebarContent()}
            </div>
          </div>
        )}

        {/* MAIN CONTENT WORKSPACE: Full width/flex like Customer */}
        <main className="flex-1 h-full overflow-hidden relative flex">
          {children}
        </main>
      </div>
    </DriverLayoutContext.Provider>
  );
};
