import React, { useState, createContext, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
  ShieldCheck,
  User as UserIcon,
  Radio,
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { formatCurrency } from '../utils/format';

interface CustomerLayoutContextType {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
}

export const CustomerLayoutContext = createContext<CustomerLayoutContextType>({
  isSidebarOpen: false,
  setIsSidebarOpen: () => {},
  toggleSidebar: () => {},
});

export const useCustomerLayout = () => useContext(CustomerLayoutContext);

interface CustomerLayoutProps {
  children: React.ReactNode;
}

export const CustomerLayout: React.FC<CustomerLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);

  const isBookingActive = location.pathname === '/booking' || location.pathname === '/';
  const isOrdersActive = location.pathname === '/orders';
  const isTrackingActive = location.pathname === '/tracking';
  const isWalletActive = location.pathname === '/wallet';

  const handleServiceClick = (serviceType: 'truck' | 'house') => {
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
    navigate(`/booking?service=${serviceType}`);
  };

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

  // Content for expanded sidebar (exactly matches AhaMove style in Image 2)
  const renderSidebarContent = () => (
    <div className="flex flex-col h-full bg-white text-slate-800 select-none overflow-hidden">
      {/* 1. Header: Clean Corporate Logistics Header */}
      <div className="bg-slate-900 text-white p-4 flex-shrink-0 border-b border-slate-800">
        <div className="flex items-center justify-between pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-slate-800 text-white flex items-center justify-center font-bold border border-slate-700">
              <Truck className="w-4 h-4 text-blue-400" />
            </div>
            <span className="text-xl font-black tracking-tight text-white">
              Mod<span className="text-blue-500">Move</span>
            </span>
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

        {/* Profile Card */}
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-black text-sm flex items-center justify-center shadow-xs flex-shrink-0">
              {user?.fullName?.charAt(0) || 'H'}
            </div>
            <div className="overflow-hidden flex-1">
              <div className="font-extrabold text-xs sm:text-sm text-white truncate">
                {user?.fullName || 'Khách hàng ModMove'}
              </div>
              <div className="text-[11px] text-slate-400 truncate">
                {user?.email || 'customer@modmove.vn'}
              </div>
            </div>
          </div>

          <div className="mt-2.5 pt-2 border-t border-slate-700/80 flex items-center justify-between text-[11px]">
            <span className="text-slate-400 font-medium">Hạng thành viên:</span>
            <span className="bg-slate-700 text-slate-200 font-bold px-2 py-0.5 rounded-full flex items-center gap-1 text-[11px] cursor-pointer hover:bg-slate-600 transition">
              <span>Doanh nghiệp / Vàng</span>
              <ChevronRight className="w-3 h-3 text-slate-400" />
            </span>
          </div>
        </div>
      </div>

      {/* 2. Menu Items Body */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-4 bg-white text-xs sm:text-sm">
        {/* Section 1: DỊCH VỤ */}
        <div>
          <div className="text-[10px] uppercase tracking-wider text-slate-400 mb-1.5 font-extrabold px-3">
            Dịch vụ vận chuyển
          </div>
          <div className="space-y-1">
            {/* Giao hàng xe tải */}
            <button
              type="button"
              id="menu-item-truck"
              onClick={() => handleServiceClick('truck')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition text-left ${
                isBookingActive
                  ? 'bg-slate-100 text-slate-900 font-bold border border-slate-300'
                  : 'hover:bg-slate-50 text-slate-700'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Truck className="w-4 h-4" />
                </div>
                <span className="font-semibold">Đặt xe tải vận chuyển</span>
              </div>
              <span className="bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-bold px-1.5 py-0.5 rounded">
                Tiết kiệm
              </span>
            </button>
          </div>
        </div>

        {/* Section 2: ĐƠN HÀNG */}
        <div>
          <div className="text-[10px] uppercase tracking-wider text-slate-400 mb-1.5 font-extrabold px-3">
            Đơn hàng & Chuyến đi
          </div>
          <div className="space-y-1">
            {/* Live Tracking */}
            <button
              type="button"
              id="menu-item-tracking"
              onClick={() => handleNavigate('/tracking')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition text-left ${
                isTrackingActive
                  ? 'bg-slate-100 text-slate-900 font-bold border border-slate-300'
                  : 'hover:bg-slate-50 text-slate-700'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-emerald-100/80 text-emerald-700 flex items-center justify-center">
                  <Radio className="w-4 h-4 animate-pulse" />
                </div>
                <span className="font-semibold">Theo dõi trực tiếp</span>
              </div>
              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                <span>LIVE</span>
              </span>
            </button>

            {/* Lịch sử đơn hàng */}
            <button
              type="button"
              id="menu-item-orders"
              onClick={() => handleNavigate('/orders')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition text-left ${
                isOrdersActive
                  ? 'bg-slate-100 text-slate-900 font-bold border border-slate-300'
                  : 'hover:bg-slate-50 text-slate-700'
              }`}
            >
              <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
              <span className="font-semibold">Lịch sử đơn hàng</span>
            </button>
          </div>
        </div>

        {/* Section 3: TÀI KHOẢN */}
        <div>
          <div className="text-[10px] uppercase tracking-wider text-slate-400 mb-1.5 font-extrabold px-3">
            Tài khoản
          </div>
          <div className="space-y-1">
            <button
              type="button"
              id="menu-item-wallet"
              onClick={() => handleNavigate('/wallet')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition text-left ${
                isWalletActive
                  ? 'bg-slate-100 text-slate-900 font-bold border border-slate-300'
                  : 'hover:bg-slate-50 text-slate-700'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                  <CreditCard className="w-4 h-4" />
                </div>
                <span className="font-semibold">Ví ModMove Pay (VietQR)</span>
              </div>
              <span className="text-[11px] font-extrabold text-slate-800">
                {formatCurrency(user?.walletBalance || 1250000)}
              </span>
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
    <CustomerLayoutContext.Provider value={{ isSidebarOpen, setIsSidebarOpen, toggleSidebar }}>
      <div className="flex w-screen h-screen overflow-hidden bg-slate-100 font-sans select-none relative">
        {/* ========================================================================= */}
        {/* DESKTOP SIDEBAR AREA (IN-FLOW PUSH LAYOUT - MATCHING AHAMOVE IMAGE 2) */}
        {/* ========================================================================= */}
        {/* When isSidebarOpen: The full sidebar expands inline and pushes the main panel without covering it */}
        {/* When !isSidebarOpen: Shows the slim icon bar */}
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
              {/* 1. Xe tải */}
              <button
                onClick={() => handleServiceClick('truck')}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition group relative ${
                  isBookingActive
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
                title="Giao hàng xe tải"
              >
                <Truck className="w-5 h-5" />
                <span className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-[10px] font-bold rounded shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition z-50">
                  Giao hàng xe tải
                </span>
              </button>

              <div className="w-8 h-[1px] bg-slate-200 my-1" />

              {/* 2. Theo dõi trực tiếp (Live Tracking) */}
              <button
                onClick={() => handleNavigate('/tracking')}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition group relative ${
                  isTrackingActive
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
                title="Theo dõi trực tiếp"
              >
                <Radio className="w-5 h-5 animate-pulse" />
                <span className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-[10px] font-bold rounded shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition z-50">
                  Theo dõi trực tiếp (Live)
                </span>
              </button>

              {/* 3. Lịch sử đơn hàng */}
              <button
                onClick={() => handleNavigate('/orders')}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition group relative ${
                  isOrdersActive
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
                title="Lịch sử đơn hàng"
              >
                <Clock className="w-5 h-5" />
                <span className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-[10px] font-bold rounded shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition z-50">
                  Lịch sử đơn hàng
                </span>
              </button>

              {/* 5. Ví tiền PayOS */}
              <button
                onClick={() => handleNavigate('/wallet')}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition group relative ${
                  isWalletActive
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
                title="Ví ModMove Pay (VietQR)"
              >
                <CreditCard className="w-5 h-5" />
                <span className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-[10px] font-bold rounded shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition z-50">
                  Ví ModMove Pay
                </span>
              </button>
            </div>

            {/* Bottom User Avatar Initial */}
            <div
              onClick={toggleSidebar}
              className="w-9 h-9 rounded-full bg-slate-100 hover:bg-orange-50 text-slate-700 hover:text-brand-600 border border-slate-200 flex items-center justify-center font-bold text-xs cursor-pointer transition"
              title="Tài khoản"
            >
              {user?.fullName?.charAt(0) || 'C'}
            </div>
          </aside>
        )}

        {/* ========================================================================= */}
        {/* MOBILE DRAWER (For small screens < md where screen width cannot fit 3 columns) */}
        {/* ========================================================================= */}
        {isSidebarOpen && (
          <div className="md:hidden fixed inset-0 z-50 flex">
            {/* Overlay backdrop only on mobile */}
            <div
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            />

            {/* Slide-out Sidebar Panel on mobile */}
            <div className="relative w-72 sm:w-80 h-full bg-white text-slate-800 flex flex-col shadow-2xl z-50 border-r border-slate-200 animate-slideRight overflow-hidden">
              {renderSidebarContent()}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MAIN CONTENT AREA: PUSHED TO THE RIGHT, INFORMATION BLOCK REMAINS INTACT */}
        {/* ========================================================================= */}
        <main className="flex-1 h-full overflow-hidden relative flex">
          {children}
        </main>
      </div>
    </CustomerLayoutContext.Provider>
  );
};
