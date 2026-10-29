import React, { useState, createContext, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Menu,
  X,
  Truck,
  LayoutDashboard,
  ShieldCheck,
  Users,
  CreditCard,
  DollarSign,
  Settings,
  LogOut,
  ChevronRight,
  TrendingUp,
  FileSpreadsheet,
  AlertOctagon,
  Power,
  ShieldAlert,
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useDriverStore } from '../store/useDriverStore';

interface AdminLayoutContextType {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
}

export const AdminLayoutContext = createContext<AdminLayoutContextType>({
  isSidebarOpen: false,
  setIsSidebarOpen: () => {},
  toggleSidebar: () => {},
});

export const useAdminLayout = () => useContext(AdminLayoutContext);

interface AdminLayoutProps {
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { profileApprovalStatus } = useDriverStore();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);

  // Active route checks
  const isDashboardActive = location.pathname === '/admin' || location.pathname === '/admin/dashboard';
  const isDriversActive = location.pathname === '/admin/drivers';
  const isUsersActive = location.pathname === '/admin/users';
  const isWithdrawalsActive = location.pathname === '/admin/withdrawals';
  const isPricingActive = location.pathname === '/admin/pricing';
  const isReportsActive = location.pathname === '/admin/reports';

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

  // Pending count calculation (if driver store status is Pending, count as 1 + mock pending)
  const pendingDriverCount = profileApprovalStatus === 'Pending' ? 2 : 1;

  // Sidebar content (Drawer style matching CustomerLayout & DriverLayout)
  const renderSidebarContent = () => (
    <div className="flex flex-col h-full bg-[#0F172A] text-slate-200 select-none overflow-hidden">
      {/* 1. Header: Admin Enterprise Theme */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-4 flex-shrink-0 border-b border-slate-700/80 shadow-sm">
        <div className="flex items-center justify-between pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shadow-md shadow-amber-500/20">
              <Truck className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xl font-black tracking-tight text-white">
                Mod<span className="text-amber-400">Move</span>
              </span>
              <span className="ml-1.5 px-1.5 py-0.5 rounded text-[10px] font-black uppercase bg-amber-500/20 text-amber-400 border border-amber-500/30">
                ADMIN
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

        {/* Admin Operator Profile Card */}
        <div className="bg-slate-800/80 backdrop-blur-xs border border-slate-700 rounded-2xl p-3 shadow-inner">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-500 to-orange-500 text-slate-950 font-black text-sm flex items-center justify-center shadow-md flex-shrink-0">
              {user?.fullName?.charAt(0) || 'A'}
            </div>
            <div className="overflow-hidden flex-1">
              <div className="font-extrabold text-xs sm:text-sm text-white truncate">
                {user?.fullName || 'Quản trị viên Hệ thống'}
              </div>
              <div className="text-[11px] text-amber-400 font-mono truncate">
                admin@modmove.vn • Toàn quyền
              </div>
            </div>
          </div>

          <div className="mt-2.5 pt-2 border-t border-slate-700/60 flex items-center justify-between text-[11px]">
            <span className="text-slate-400 font-medium">Hệ thống giám sát:</span>
            <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>HOẠT ĐỘNG 24/7</span>
            </span>
          </div>
        </div>
      </div>

      {/* 2. Menu Navigation Body */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-4 bg-[#0F172A] text-xs sm:text-sm">
        {/* Section 1: TỔNG QUAN & DOANH THU */}
        <div>
          <div className="text-[10px] uppercase tracking-wider text-slate-400 mb-1.5 font-extrabold px-3">
            Tổng quan & Báo cáo
          </div>
          <div className="space-y-1">
            {/* Dashboard & Doanh thu */}
            <button
              type="button"
              onClick={() => handleNavigate('/admin/dashboard')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition text-left ${
                isDashboardActive
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                  : 'hover:bg-slate-800 text-slate-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                    isDashboardActive ? 'bg-slate-950 text-amber-400' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                </div>
                <span className="font-semibold">Bảng điều khiển & Doanh thu</span>
              </div>
            </button>
          </div>
        </div>

        {/* Section 2: THẨM ĐỊNH & ĐỐI TÁC */}
        <div>
          <div className="text-[10px] uppercase tracking-wider text-slate-400 mb-1.5 font-extrabold px-3">
            Đối tác & Giấy tờ xe
          </div>
          <div className="space-y-1">
            {/* Thẩm định hồ sơ tài xế */}
            <button
              type="button"
              onClick={() => handleNavigate('/admin/drivers')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition text-left ${
                isDriversActive
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                  : 'hover:bg-slate-800 text-slate-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                    isDriversActive ? 'bg-slate-950 text-amber-400' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <span className="font-semibold">Thẩm định hồ sơ tài xế</span>
              </div>
              {pendingDriverCount > 0 && (
                <span
                  className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                    isDriversActive
                      ? 'bg-slate-950 text-amber-400'
                      : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  }`}
                >
                  {pendingDriverCount} chờ
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Section 3: TÀI CHÍNH & VÍ */}
        <div>
          <div className="text-[10px] uppercase tracking-wider text-slate-400 mb-1.5 font-extrabold px-3">
            Tài chính & Thanh toán
          </div>
          <div className="space-y-1">
            {/* Duyệt yêu cầu rút tiền ví tài xế */}
            <button
              type="button"
              onClick={() => handleNavigate('/admin/withdrawals')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition text-left ${
                isWithdrawalsActive
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                  : 'hover:bg-slate-800 text-slate-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                    isWithdrawalsActive ? 'bg-slate-950 text-amber-400' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                </div>
                <span className="font-semibold">Duyệt rút tiền ví & Bồi thường</span>
              </div>
              <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-black px-1.5 py-0.5 rounded">
                2 lệnh
              </span>
            </button>
          </div>
        </div>

        {/* Section 4: HỆ THỐNG & TÀI KHOẢN */}
        <div>
          <div className="text-[10px] uppercase tracking-wider text-slate-400 mb-1.5 font-extrabold px-3">
            Hệ thống & Cấu hình
          </div>
          <div className="space-y-1">
            {/* Quản lý người dùng & Điều phối viên */}
            <button
              type="button"
              onClick={() => handleNavigate('/admin/users')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition text-left ${
                isUsersActive
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                  : 'hover:bg-slate-800 text-slate-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                    isUsersActive ? 'bg-slate-950 text-amber-400' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  <Users className="w-4 h-4" />
                </div>
                <span className="font-semibold">Quản lý người dùng & Quyền</span>
              </div>
            </button>

            {/* Cấu hình cước & Hoa hồng */}
            <button
              type="button"
              onClick={() => handleNavigate('/admin/pricing')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition text-left ${
                isPricingActive
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                  : 'hover:bg-slate-800 text-slate-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                    isPricingActive ? 'bg-slate-950 text-amber-400' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  <Settings className="w-4 h-4" />
                </div>
                <span className="font-semibold">Bảng cước & Hoa hồng 20%</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Bottom: Đăng xuất */}
      <div className="p-3 border-t border-slate-800 bg-slate-950 flex-shrink-0">
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 font-bold text-xs transition cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Đăng xuất Quản trị viên</span>
        </button>
      </div>
    </div>
  );

  return (
    <AdminLayoutContext.Provider value={{ isSidebarOpen, setIsSidebarOpen, toggleSidebar }}>
      <div className="flex w-screen h-screen overflow-hidden bg-slate-100 font-sans select-none relative">
        {/* DESKTOP SIDEBAR AREA: Push layout matching CustomerLayout & DriverLayout */}
        {isSidebarOpen ? (
          <aside className="hidden md:flex w-72 sm:w-80 h-full flex-shrink-0 flex-col border-r border-slate-800 z-30 shadow-2xl animate-slideRight">
            {renderSidebarContent()}
          </aside>
        ) : (
          <aside className="w-14 sm:w-16 bg-[#0F172A] border-r border-slate-800 flex flex-col items-center py-3 z-30 flex-shrink-0 shadow-lg">
            {/* Hamburger Menu Toggle Button */}
            <button
              onClick={toggleSidebar}
              className="w-10 h-10 rounded-xl hover:bg-slate-800 text-slate-300 hover:text-amber-400 flex items-center justify-center transition mb-4 cursor-pointer"
              title="Mở menu quản trị"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Vertical Menu Icons */}
            <div className="flex-1 flex flex-col items-center gap-3 w-full">
              {/* 1. Dashboard */}
              <button
                onClick={() => handleNavigate('/admin/dashboard')}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition group relative ${
                  isDashboardActive
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/25'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-amber-400'
                }`}
                title="Bảng điều khiển & Doanh thu"
              >
                <LayoutDashboard className="w-5 h-5" />
                <span className="absolute left-full ml-2 px-2 py-1 bg-slate-900 text-white text-[10px] font-bold rounded shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition z-50">
                  Bảng điều khiển & Doanh thu
                </span>
              </button>

              {/* 2. Thẩm định tài xế */}
              <button
                onClick={() => handleNavigate('/admin/drivers')}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition group relative ${
                  isDriversActive
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/25'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-amber-400'
                }`}
                title="Thẩm định hồ sơ tài xế"
              >
                <ShieldCheck className="w-5 h-5" />
                {pendingDriverCount > 0 && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-amber-400 rounded-full ring-2 ring-[#0F172A]" />
                )}
                <span className="absolute left-full ml-2 px-2 py-1 bg-slate-900 text-white text-[10px] font-bold rounded shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition z-50">
                  Thẩm định hồ sơ tài xế ({pendingDriverCount} chờ duyệt)
                </span>
              </button>

              {/* 3. Duyệt rút tiền */}
              <button
                onClick={() => handleNavigate('/admin/withdrawals')}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition group relative ${
                  isWithdrawalsActive
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/25'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-amber-400'
                }`}
                title="Duyệt rút tiền ví & Bồi thường"
              >
                <CreditCard className="w-5 h-5" />
                <span className="absolute left-full ml-2 px-2 py-1 bg-slate-900 text-white text-[10px] font-bold rounded shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition z-50">
                  Duyệt rút tiền ví & Bồi thường
                </span>
              </button>

              <div className="w-8 h-[1px] bg-slate-800 my-1" />

              {/* 4. Quản lý người dùng */}
              <button
                onClick={() => handleNavigate('/admin/users')}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition group relative ${
                  isUsersActive
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/25'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-amber-400'
                }`}
                title="Quản lý người dùng & Phân quyền"
              >
                <Users className="w-5 h-5" />
                <span className="absolute left-full ml-2 px-2 py-1 bg-slate-900 text-white text-[10px] font-bold rounded shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition z-50">
                  Quản lý người dùng & Phân quyền
                </span>
              </button>

              {/* 5. Cấu hình bảng cước */}
              <button
                onClick={() => handleNavigate('/admin/pricing')}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition group relative ${
                  isPricingActive
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/25'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-amber-400'
                }`}
                title="Bảng cước & Hoa hồng"
              >
                <Settings className="w-5 h-5" />
                <span className="absolute left-full ml-2 px-2 py-1 bg-slate-900 text-white text-[10px] font-bold rounded shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition z-50">
                  Bảng cước & Hoa hồng
                </span>
              </button>
            </div>

            {/* Bottom Status Dot */}
            <div
              className="w-9 h-9 rounded-full bg-slate-800 text-amber-400 flex items-center justify-center font-bold text-xs border border-slate-700 shadow-sm"
              title="Quản trị viên đang trực"
            >
              <Power className="w-4 h-4 text-emerald-400" />
            </div>
          </aside>
        )}

        {/* MOBILE DRAWER */}
        {isSidebarOpen && (
          <div className="md:hidden fixed inset-0 z-50 flex">
            <div
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            />
            <div className="relative w-72 sm:w-80 h-full bg-[#0F172A] text-slate-200 flex flex-col shadow-2xl z-50 border-r border-slate-800 animate-slideRight overflow-hidden">
              {renderSidebarContent()}
            </div>
          </div>
        )}

        {/* MAIN CONTENT WORKSPACE */}
        <main className="flex-1 h-full overflow-hidden relative flex bg-slate-50">
          {children}
        </main>
      </div>
    </AdminLayoutContext.Provider>
  );
};
