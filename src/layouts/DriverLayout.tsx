import { useSidebarStore } from '../store/useSidebarStore';
import React, { createContext, useContext, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Lock, LogOut, Menu, Navigation, Package, Power, Truck, UserCog, Wallet, X } from 'lucide-react';
import { SuspenseOutlet } from '../components/SuspenseOutlet';
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
  { path: '/driver/earnings', label: 'Ví & thu nhập', Icon: Wallet },
  { path: '/driver/profile', label: 'Hồ sơ & phương tiện', Icon: UserCog },
];

const Shell: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { user, logout } = useAuthStore();
  const { status, toggleOnline, toggling } = useDriver();
  const { isSidebarOpen, setIsSidebarOpen, toggleSidebar: toggleShared } = useSidebarStore();
  const approved = status?.approvalStatus === 'Approved';
  const active = (p: string, exact?: boolean) => (exact ? pathname === p : pathname.startsWith(p));
  const go = (p: string) => {
    navigate(p);
  };

  const sidebar = (
    <div className="flex flex-col h-full bg-white text-slate-800 overflow-hidden">
      <div className="bg-slate-900 text-white p-4 flex-shrink-0">
        <div className="flex items-center justify-between pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center border border-slate-700">
              <Truck className="w-4 h-4 text-blue-400" />
            </div>
            <span className="text-xl font-black tracking-tight">
              Mod<span className="text-blue-500">Move</span>
            </span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-black uppercase bg-slate-800 text-slate-300 border border-slate-700">Tài xế</span>
          </div>
          <button type="button" onClick={() => setIsSidebarOpen(false)} className="w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center" aria-label="Đóng menu">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-3">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-blue-600 font-black flex items-center justify-center">{user?.fullName?.charAt(0) ?? 'T'}</div>
              <span className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-slate-900 ${status?.isOnline ? 'bg-emerald-400' : 'bg-slate-400'}`} />
            </div>
            <div className="min-w-0">
              <div className="font-extrabold text-sm truncate">{user?.fullName}</div>
              <div className="text-[11px] text-slate-400 font-mono truncate">{status?.licensePlate ?? 'Chưa có xe'}</div>
            </div>
          </div>
          <div className="mt-2.5 pt-2 border-t border-slate-700/80 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Nhận đơn:</span>
            {approved ? (
              <button
                type="button"
                disabled={toggling}
                onClick={toggleOnline}
                className={`px-2.5 py-1 rounded-full font-bold flex items-center gap-1.5 ${status?.isOnline ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
              >
                <Power className="w-3 h-3" /> {status?.isOnline ? 'ĐANG BẬT' : 'ĐANG NGHỈ'}
              </button>
            ) : (
              <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-amber-400 text-slate-900 flex items-center gap-1">
                <Lock className="w-3 h-3" /> Hồ sơ chưa duyệt
              </span>
            )}
          </div>
        </div>
      </div>
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
      <div className="flex w-screen h-screen overflow-hidden bg-slate-100 font-sans">
        {isSidebarOpen ? (
          <aside className="hidden md:flex w-72 h-full flex-shrink-0 flex-col border-r border-slate-200 z-30 shadow-lg">{sidebar}</aside>
        ) : (
          <aside className="w-14 sm:w-16 bg-white border-r border-slate-200 flex flex-col items-center py-3 gap-3 z-30 flex-shrink-0">
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
        {isSidebarOpen && (
          <div className="md:hidden fixed inset-0 z-50 flex">
            <div className="fixed inset-0 bg-slate-900/40" />
            <div className="relative w-72 h-full shadow-2xl z-50">{sidebar}</div>
          </div>
        )}
        <main className="flex-1 h-full overflow-hidden relative flex min-w-0">{children ?? <SuspenseOutlet />}</main>
      </div>
    </DriverLayoutContext.Provider>
  );
};
