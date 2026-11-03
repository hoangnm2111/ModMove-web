import React, { useState, createContext, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { SuspenseOutlet } from '../components/SuspenseOutlet';
import { useRefunds } from '../hooks/useDomainData';
import {
  Menu,
  X,
  Truck,
  Radio,
  ShieldAlert,
  Repeat,
  FileCheck2,
  UserCog,
  LogOut,
  ChevronRight,
  Headphones,
  PhoneCall,
  Activity,
  Layers,
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';

interface DispatcherLayoutContextType {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
}

export const DispatcherLayoutContext = createContext<DispatcherLayoutContextType>({
  isSidebarOpen: false,
  setIsSidebarOpen: () => {},
  toggleSidebar: () => {},
});

export const useDispatcherLayout = () => useContext(DispatcherLayoutContext);

interface DispatcherLayoutProps {
  children?: React.ReactNode;
}

export const DispatcherLayout: React.FC<DispatcherLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);

  // Active navigation paths
  const isLiveMapActive = location.pathname === '/dispatcher' || location.pathname === '/dispatcher/live-map';
  const isIncidentsActive = location.pathname === '/dispatcher/incidents';
  const isProfileActive = location.pathname === '/dispatcher/profile';
  const pendingCases = useRefunds().filter((r) => r.source !== 'Cancellation' && r.status === 'Requested').length;
  const isComplaintsActive = location.pathname === '/dispatcher/complaints';

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

  const renderSidebarContent = () => (
    <div className="flex flex-col h-full bg-[#0B1528] text-slate-200 select-none overflow-hidden">
      {/* 1. Header: Dispatcher Theme */}
      <div className="bg-gradient-to-r from-slate-900 to-sky-950 text-white p-4 flex-shrink-0 border-b border-sky-900/40 shadow-sm">
        <div className="flex items-center justify-between pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-sky-500 text-slate-950 flex items-center justify-center font-black shadow-md shadow-sky-500/20">
              <Headphones className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xl font-black tracking-tight text-white">
                Mod<span className="text-sky-400">Move</span>
              </span>
              <span className="ml-1.5 px-1.5 py-0.5 rounded text-[10px] font-black uppercase bg-sky-500/20 text-sky-400 border border-sky-500/30">
                ĐIỀU PHỐI
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

        {/* Dispatcher Operator Card */}
        <div className="bg-sky-950/60 backdrop-blur-xs border border-sky-800/40 rounded-2xl p-3 shadow-inner">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-sky-500 to-blue-600 text-white font-black text-sm flex items-center justify-center shadow-md flex-shrink-0">
              {user?.fullName?.charAt(0) || 'D'}
            </div>
            <div className="overflow-hidden flex-1">
              <div className="font-extrabold text-xs sm:text-sm text-white truncate">
                {user?.fullName || 'Trần Thị Thu Thảo'}
              </div>
              <div className="text-[11px] text-sky-400 font-mono truncate">
                Kíp trực Tổng đài Trung tâm
              </div>
            </div>
          </div>

          <div className="mt-2.5 pt-2 border-t border-sky-800/40 flex items-center justify-between text-[11px]">
            <span className="text-slate-400 font-medium">Trực ban tổng đài:</span>
            <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>SẴN SÀNG TIẾP NHẬN</span>
            </span>
          </div>
        </div>
      </div>

      {/* 2. Menu Navigation Items */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-4 bg-[#0B1528] text-xs sm:text-sm">
        {/* Section 1: GIÁM SÁT HẠM ĐỘI */}
        <div>
          <div className="text-[10px] uppercase tracking-wider text-slate-400 mb-1.5 font-extrabold px-3">
            Giám sát thời gian thực
          </div>
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => handleNavigate('/dispatcher/live-map')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition text-left ${
                isLiveMapActive
                  ? 'bg-sky-500 text-slate-950 font-bold shadow-md shadow-sky-500/20'
                  : 'hover:bg-slate-800 text-slate-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                    isLiveMapActive ? 'bg-slate-950 text-sky-400' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  <Radio className="w-4 h-4 animate-pulse" />
                </div>
                <span className="font-semibold">Bản đồ giám sát hạm đội</span>
              </div>
              <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-black px-1.5 py-0.5 rounded">
                LIVE
              </span>
            </button>
          </div>
        </div>

        {/* Section 2: XỬ LÝ SỰ CỐ & ĐIỀU PHỐI KHẨN */}
        <div>
          <div className="text-[10px] uppercase tracking-wider text-slate-400 mb-1.5 font-extrabold px-3">
            Sự cố & Điều phối khẩn
          </div>
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => handleNavigate('/dispatcher/incidents')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition text-left ${
                isIncidentsActive
                  ? 'bg-sky-500 text-slate-950 font-bold shadow-md shadow-sky-500/20'
                  : 'hover:bg-slate-800 text-slate-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                    isIncidentsActive ? 'bg-slate-950 text-sky-400' : 'bg-rose-500/20 text-rose-400'
                  }`}
                >
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <span className="font-semibold">Sự cố hành trình & Đổi xe</span>
              </div>
              <span className="bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[10px] font-black px-1.5 py-0.5 rounded-full">
                2 vụ
              </span>
            </button>
          </div>
        </div>

        {/* Section 3: KHIẾU NẠI & BỒI THƯỜNG */}
        <div>
          <div className="text-[10px] uppercase tracking-wider text-slate-400 mb-1.5 font-extrabold px-3">
            Khiếu nại & Bồi thường
          </div>
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => handleNavigate('/dispatcher/complaints')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition text-left ${
                isComplaintsActive
                  ? 'bg-sky-500 text-slate-950 font-bold shadow-md shadow-sky-500/20'
                  : 'hover:bg-slate-800 text-slate-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                    isComplaintsActive ? 'bg-slate-950 text-sky-400' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  <FileCheck2 className="w-4 h-4" />
                </div>
                <span className="font-semibold">Thẩm định khiếu nại hoàn tiền</span>
              </div>
              <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-bold px-1.5 py-0.5 rounded">
                {pendingCases} mới
              </span>
            </button>
            <button
              type="button"
              onClick={() => handleNavigate('/dispatcher/profile')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition text-left ${
                isProfileActive ? 'bg-sky-500 text-slate-950 font-bold' : 'hover:bg-slate-800 text-slate-300'
              }`}
            >
              <UserCog className="w-4 h-4" />
              <span className="font-semibold">Hồ sơ & bảo mật</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Bottom Logout */}
      <div className="p-3 border-t border-slate-800 bg-slate-950 flex-shrink-0">
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 font-bold text-xs transition cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Đăng xuất Điều phối viên</span>
        </button>
      </div>
    </div>
  );

  return (
    <DispatcherLayoutContext.Provider value={{ isSidebarOpen, setIsSidebarOpen, toggleSidebar }}>
      <div className="flex w-screen h-screen overflow-hidden bg-slate-100 font-sans select-none relative">
        {/* DESKTOP SIDEBAR AREA */}
        {isSidebarOpen ? (
          <aside className="hidden md:flex w-72 sm:w-80 h-full flex-shrink-0 flex-col border-r border-sky-900/40 z-30 shadow-2xl animate-slideRight">
            {renderSidebarContent()}
          </aside>
        ) : (
          <aside className="w-14 sm:w-16 bg-[#0B1528] border-r border-sky-900/40 flex flex-col items-center py-3 z-30 flex-shrink-0 shadow-lg">
            {/* Toggle Button */}
            <button
              onClick={toggleSidebar}
              className="w-10 h-10 rounded-xl hover:bg-slate-800 text-slate-300 hover:text-sky-400 flex items-center justify-center transition mb-4 cursor-pointer"
              title="Mở menu điều phối"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Vertical Icons */}
            <div className="flex-1 flex flex-col items-center gap-3 w-full">
              {/* 1. Live Map */}
              <button
                onClick={() => handleNavigate('/dispatcher/live-map')}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition group relative ${
                  isLiveMapActive
                    ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/25'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-sky-400'
                }`}
                title="Bản đồ giám sát hạm đội"
              >
                <Radio className="w-5 h-5" />
                <span className="absolute left-full ml-2 px-2 py-1 bg-slate-900 text-white text-[10px] font-bold rounded shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition z-50">
                  Bản đồ giám sát hạm đội
                </span>
              </button>

              {/* 2. Incidents */}
              <button
                onClick={() => handleNavigate('/dispatcher/incidents')}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition group relative ${
                  isIncidentsActive
                    ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/25'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-sky-400'
                }`}
                title="Sự cố hành trình & Báo cáo"
              >
                <ShieldAlert className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-[#0B1528]" />
                <span className="absolute left-full ml-2 px-2 py-1 bg-slate-900 text-white text-[10px] font-bold rounded shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition z-50">
                  Sự cố hành trình & Đổi xe
                </span>
              </button>

              <div className="w-8 h-[1px] bg-slate-800 my-1" />

              {/* 4. Complaints */}
              <button
                onClick={() => handleNavigate('/dispatcher/complaints')}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition group relative ${
                  isComplaintsActive
                    ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/25'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-sky-400'
                }`}
                title="Thẩm định khiếu nại hoàn tiền"
              >
                <FileCheck2 className="w-5 h-5" />
                <span className="absolute left-full ml-2 px-2 py-1 bg-slate-900 text-white text-[10px] font-bold rounded shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition z-50">
                  Thẩm định khiếu nại hoàn tiền
                </span>
              </button>
              <button
                onClick={() => handleNavigate('/dispatcher/profile')}
                title="Hồ sơ & bảo mật"
                aria-label="Hồ sơ & bảo mật"
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition ${
                  isProfileActive ? 'bg-sky-500 text-slate-950' : 'text-slate-400 hover:bg-slate-800 hover:text-sky-400'
                }`}
              >
                <UserCog className="w-5 h-5" />
              </button>
            </div>

            {/* Bottom Status Dot */}
            <div
              className="w-9 h-9 rounded-full bg-slate-800 text-sky-400 flex items-center justify-center font-bold text-xs border border-sky-900 shadow-sm"
              title="Tổng đài trực tuyến"
            >
              <Activity className="w-4 h-4 text-emerald-400" />
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
            <div className="relative w-72 sm:w-80 h-full bg-[#0B1528] text-slate-200 flex flex-col shadow-2xl z-50 border-r border-sky-900/40 animate-slideRight overflow-hidden">
              {renderSidebarContent()}
            </div>
          </div>
        )}

        {/* MAIN WORKSPACE */}
        <main className="flex-1 h-full overflow-hidden relative flex bg-slate-50">
          {children ?? <SuspenseOutlet />}
        </main>
      </div>
    </DispatcherLayoutContext.Provider>
  );
};
