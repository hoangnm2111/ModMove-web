import { useSidebarStore } from '../store/useSidebarStore';
import React, { createContext, useContext, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Lock, LogOut, Menu, Navigation, Package, Power, ShieldAlert, UserCog, Wallet } from 'lucide-react';
import { SuspenseOutlet } from '../components/SuspenseOutlet';
import { MobileDrawer, MobileTopBar, SidebarHeader } from './SidebarParts';
import { useAuthStore } from '../store/useAuthStore';
import { DriverProvider, useDriver } from '../features/driver/DriverContext';

interface DriverLayoutContextType {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
}
export const DriverLayoutContext = createContext<DriverLayoutContextType>({ isSidebarOpen: false, setIsSidebarOpen: () => {}, toggleSidebar: () => {} });
export const useDriverLayout = () => useContext(DriverLayoutContext);

export const DriverLayout: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <DriverProvider>
    <Shell>{children}</Shell>
  </DriverProvider>
);

const NAV = [
  { path: '/driver', label: 'Nhận đơn gần tôi', Icon: Package, exact: true },
  { path: '/driver/trip', label: 'Chuyến hiện tại', Icon: Navigation },
  { path: '/driver/incidents', label: 'Sự cố của tôi', Icon: ShieldAlert },
  { path: '/driver/earnings', label: 'Ví & thu nhập', Icon: Wallet },
  { path: '/driver/profile', label: 'Hồ sơ & phương tiện', Icon: UserCog },
];

const Shell: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { user, logout } = useAuthStore();
  const { status, toggleOnline, toggling } = useDriver();
  const { isSidebarOpen, setIsSidebarOpen, toggleSidebar: toggleShared } = useSidebarStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const closeMenu = () => (mobileOpen ? setMobileOpen(false) : setIsSidebarOpen(false));
  const approved = status?.approvalStatus === 'Approved';
  const active = (p: string, exact?: boolean) => (exact ? pathname === p : pathname.startsWith(p));
  const go = (p: string) => {
    setMobileOpen(false);
    navigate(p);
  };

  const sidebar = (
    <div className="flex flex-col h-full bg-white text-slate-800 overflow-hidden">
      <SidebarHeader
        roleLabel="Tài xế"
        name={user?.fullName ?? 'Tài xế'}
        subtitle={status?.licensePlate ?? 'Chưa có xe'}
        mono
        online={!!status?.isOnline}
        onClose={closeMenu}
      >
        <div className="mt-2.5 pt-2 border-t border-slate-200 flex items-center justify-between text-[11px]">
          <span className="text-slate-500">Nhận đơn:</span>
          {approved ? (
            <button
              type="button"
              disabled={toggling}
              onClick={toggleOnline}
              className={`px-2.5 py-1 rounded-full font-bold flex items-center gap-1.5 border ${
                status?.isOnline ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Power className="w-3 h-3" /> {status?.isOnline ? 'ĐANG BẬT' : 'ĐANG NGHỈ'}
            </button>
          ) : (
            <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
              <Lock className="w-3 h-3" /> Hồ sơ chưa duyệt
            </span>
          )}
        </div>
      </SidebarHeader>
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-2 text-sm">
        {NAV.map(({ path, label, Icon, exact }) => (
          <button
            key={path}
            type="button"
            onClick={() => go(path)}
            className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-left transition ${active(path, exact) ? 'bg-slate-100 text-slate-900 font-bold border border-slate-300 shadow-sm' : 'bg-white border border-slate-200 shadow-sm hover:bg-slate-50 hover:border-slate-300 text-slate-700 font-semibold'}`}
          >
            <span className="flex items-center gap-3">
              <Icon className="w-4 h-4" /> {label}
            </span>
            {path === '/driver/trip' && status?.activeOrderId && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-600 text-white">1</span>}
          </button>
        ))}
      </nav>
      <div className="p-3 border-t border-slate-200 bg-slate-50 flex-shrink-0">
        <button
          type="button"
          onClick={() => (logout(), navigate('/login', { replace: true }))}
          className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl text-slate-600 hover:text-rose-600 hover:bg-rose-50 font-bold text-xs"
        >
          <LogOut className="w-4 h-4" /> Đăng xuất
        </button>
      </div>
    </div>
  );

  return (
    <DriverLayoutContext.Provider value={{ isSidebarOpen, setIsSidebarOpen, toggleSidebar: toggleShared }}>
      <div className="flex flex-col md:flex-row w-screen h-screen h-[100dvh] overflow-hidden bg-slate-100 font-sans">
        <MobileTopBar onOpen={() => setMobileOpen(true)} />
        {isSidebarOpen ? (
          <aside className="hidden md:flex w-64 xl:w-72 h-full flex-shrink-0 flex-col border-r border-slate-200 z-30 shadow-lg">{sidebar}</aside>
        ) : (
          <aside className="hidden md:flex w-16 bg-white border-r border-slate-200 flex-col items-center py-3 gap-3 z-30 flex-shrink-0">
            <button type="button" onClick={() => setIsSidebarOpen(true)} aria-label="Mở menu" className="w-10 h-10 rounded-xl hover:bg-slate-100 text-slate-700 flex items-center justify-center mb-2">
              <Menu className="w-5 h-5" />
            </button>
            {NAV.map(({ path, label, Icon, exact }) => (
              <button
                key={path}
                type="button"
                title={label}
                aria-label={label}
                onClick={() => go(path)}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition ${active(path, exact) ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                <Icon className="w-5 h-5" />
              </button>
            ))}
          </aside>
        )}
        <MobileDrawer open={mobileOpen} onClose={() => setMobileOpen(false)}>
          {sidebar}
        </MobileDrawer>
        <main className="flex-1 min-h-0 md:h-full overflow-hidden relative flex min-w-0">{children ?? <SuspenseOutlet />}</main>
      </div>
    </DriverLayoutContext.Provider>
  );
};
