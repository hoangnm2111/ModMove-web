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
  const isWalletActive = location.pathname === '/wallet';

  const handleServiceClick = (serviceType: 'bike' | 'truck' | 'house') => {
    setIsSidebarOpen(false);
    navigate(`/booking?service=${serviceType}`);
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <CustomerLayoutContext.Provider value={{ isSidebarOpen, setIsSidebarOpen, toggleSidebar }}>
      <div className="flex w-screen h-screen overflow-hidden bg-slate-100 font-sans select-none relative">
        {/* ========================================================================= */}
        {/* 1. SLIM ICON BAR (COLLAPSED STATE) */}
        {/* ========================================================================= */}
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
            {/* 1. Xe máy */}
            <button
              onClick={() => handleServiceClick('bike')}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition group relative ${
                isBookingActive && location.search.includes('bike')
                  ? 'bg-brand-500 text-white shadow-md shadow-orange-500/25'
                  : 'text-slate-500 hover:bg-orange-50 hover:text-brand-600'
              }`}
              title="Giao hàng xe máy"
            >
              <Package className="w-5 h-5" />
              <span className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-[10px] font-bold rounded shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition z-50">
                Giao hàng xe máy
              </span>
            </button>

            {/* 2. Xe tải */}
            <button
              onClick={() => handleServiceClick('truck')}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition group relative ${
                isBookingActive && (location.search.includes('truck') || (!location.search.includes('bike') && !location.search.includes('house')))
                  ? 'bg-brand-500 text-white shadow-md shadow-orange-500/25'
                  : 'text-slate-500 hover:bg-orange-50 hover:text-brand-600'
              }`}
              title="Xe tải chở hàng"
            >
              <Truck className="w-5 h-5" />
              <span className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-[10px] font-bold rounded shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition z-50">
                Xe tải 500kg - 2 tấn
              </span>
            </button>

            {/* 3. Chuyển nhà */}
            <button
              onClick={() => handleServiceClick('house')}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition group relative ${
                isBookingActive && location.search.includes('house')
                  ? 'bg-brand-500 text-white shadow-md shadow-orange-500/25'
                  : 'text-slate-500 hover:bg-orange-50 hover:text-brand-600'
              }`}
              title="Chuyển nhà trọn gói"
            >
              <Home className="w-5 h-5" />
              <span className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-[10px] font-bold rounded shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition z-50">
                Chuyển nhà trọn gói
              </span>
            </button>

            <div className="w-8 h-[1px] bg-slate-200 my-1" />

            {/* 4. Lịch sử đơn hàng */}
            <button
              onClick={() => navigate('/orders')}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition group relative ${
                isOrdersActive
                  ? 'bg-brand-500 text-white shadow-md shadow-orange-500/25'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
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
              onClick={() => navigate('/wallet')}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition group relative ${
                isWalletActive
                  ? 'bg-brand-500 text-white shadow-md shadow-orange-500/25'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
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

        {/* ========================================================================= */}
        {/* 2. EXPANDED SIDEBAR DRAWER (MÀU TRẦM TRẮNG THANH LỊCH, DỄ NHÌN) */}
        {/* ========================================================================= */}
        {isSidebarOpen && (
          <div className="fixed inset-0 z-50 flex">
            {/* Overlay backdrop */}
            <div
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            />

            {/* Slide-out Sidebar Panel - MÀU TRẦM TRẮNG THANH THOÁT */}
            <div className="relative w-72 sm:w-80 h-full bg-white text-slate-800 flex flex-col shadow-2xl z-50 border-r border-slate-200 animate-slideRight overflow-hidden">
              {/* Header: Thiết kế trầm trắng nhã nhặn, không bị chói cam */}
              <div className="bg-slate-50/90 border-b border-slate-200/80 p-4">
                <div className="flex items-center justify-between pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-brand-500 text-white flex items-center justify-center font-bold shadow-xs">
                      <Truck className="w-4 h-4" />
                    </div>
                    <span className="text-xl font-black text-slate-900 tracking-tight">
                      Mod<span className="text-brand-500">Move</span>
                    </span>
                  </div>
                  <button
                    onClick={() => setIsSidebarOpen(false)}
                    className="w-7 h-7 rounded-full bg-slate-200/70 hover:bg-slate-300 text-slate-600 flex items-center justify-center transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Profile Card: Nền trắng viền xám nhạt cao cấp */}
                <div className="bg-white rounded-2xl p-3 border border-slate-200/80 shadow-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-orange-100 text-brand-600 font-black text-sm flex items-center justify-center border border-orange-200/80">
                      {user?.fullName?.charAt(0) || 'H'}
                    </div>
                    <div className="overflow-hidden flex-1">
                      <div className="font-extrabold text-xs sm:text-sm text-slate-900 truncate">
                        {user?.fullName || 'Khách hàng'}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">
                        {user?.email || 'customer@modmove.vn'}
                      </div>
                    </div>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 font-medium">Hạng thành viên:</span>
                    <span className="bg-amber-50 text-amber-700 border border-amber-200 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                      <span>Vàng (Gold)</span>
                      <ChevronRight className="w-3 h-3 text-amber-500" />
                    </span>
                  </div>
                </div>
              </div>

              {/* Body Menu Items: NỀN TRẮNG TINH TẾ, CHỮ RÕ RÀNG */}
              <div className="flex-1 overflow-y-auto px-3 py-4 space-y-4 bg-white text-xs sm:text-sm">
                {/* Section 1: DỊCH VỤ (Theo tài liệu SRS) */}
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-slate-400 mb-1.5 font-extrabold px-3">
                    Dịch vụ chuyển hàng
                  </div>
                  <div className="space-y-1">
                    {/* Xe máy */}
                    <button
                      type="button"
                      id="menu-item-bike"
                      onClick={() => handleServiceClick('bike')}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition text-left ${
                        isBookingActive && location.search.includes('bike')
                          ? 'bg-orange-50 text-brand-600 font-bold border border-orange-200/80 shadow-xs'
                          : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-orange-100/80 text-brand-600 flex items-center justify-center">
                          <Package className="w-4 h-4" />
                        </div>
                        <span className="font-semibold">Xe máy</span>
                      </div>
                      <span className="bg-rose-50 text-rose-600 border border-rose-200 text-[10px] font-bold px-1.5 py-0.5 rounded">
                        -20%
                      </span>
                    </button>

                    {/* Xe tải */}
                    <button
                      type="button"
                      id="menu-item-truck"
                      onClick={() => handleServiceClick('truck')}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition text-left ${
                        isBookingActive && (location.search.includes('truck') || (!location.search.includes('bike') && !location.search.includes('house')))
                          ? 'bg-orange-50 text-brand-600 font-bold border border-orange-200/80 shadow-xs'
                          : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-amber-100/80 text-amber-700 flex items-center justify-center">
                          <Truck className="w-4 h-4" />
                        </div>
                        <span className="font-semibold">Xe tải 500kg - 2 tấn</span>
                      </div>
                      <span className="bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold px-1.5 py-0.5 rounded">
                        -100K
                      </span>
                    </button>

                    {/* Chuyển nhà trọn gói */}
                    <button
                      type="button"
                      id="menu-item-house"
                      onClick={() => handleServiceClick('house')}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition text-left ${
                        isBookingActive && location.search.includes('house')
                          ? 'bg-orange-50 text-brand-600 font-bold border border-orange-200/80 shadow-xs'
                          : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-emerald-100/80 text-emerald-700 flex items-center justify-center">
                          <Home className="w-4 h-4" />
                        </div>
                        <span className="font-semibold">Chuyển nhà trọn gói</span>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Section 2: ĐƠN HÀNG */}
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-slate-400 mb-1.5 font-extrabold px-3">
                    Đơn hàng & Tra cứu
                  </div>
                  <div className="space-y-1">
                    <button
                      type="button"
                      id="menu-item-orders"
                      onClick={() => {
                        setIsSidebarOpen(false);
                        navigate('/orders');
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition text-left ${
                        isOrdersActive
                          ? 'bg-orange-50 text-brand-600 font-bold border border-orange-200/80 shadow-xs'
                          : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="w-7 h-7 rounded-lg bg-sky-100/80 text-sky-700 flex items-center justify-center">
                        <Clock className="w-4 h-4" />
                      </div>
                      <span className="font-semibold">Lịch sử đơn hàng</span>
                    </button>
                  </div>
                </div>

                {/* Section 3: TÀI KHOẢN */}
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-slate-400 mb-1.5 font-extrabold px-3">
                    Tài khoản & Thanh toán
                  </div>
                  <div className="space-y-1">
                    <button
                      type="button"
                      id="menu-item-wallet"
                      onClick={() => {
                        setIsSidebarOpen(false);
                        navigate('/wallet');
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition text-left ${
                        isWalletActive
                          ? 'bg-orange-50 text-brand-600 font-bold border border-orange-200/80 shadow-xs'
                          : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-indigo-100/80 text-indigo-700 flex items-center justify-center">
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

              {/* Bottom: Đăng xuất */}
              <div className="p-3 border-t border-slate-200/80 bg-slate-50">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl text-slate-600 hover:text-rose-600 hover:bg-rose-50 font-bold text-xs transition"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Đăng xuất tài khoản</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 h-full overflow-hidden relative flex">
          {children}
        </main>
      </div>
    </CustomerLayoutContext.Provider>
  );
};

