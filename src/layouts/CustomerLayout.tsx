import { useSidebarStore } from '../store/useSidebarStore';
import React, { createContext, useContext, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { SuspenseOutlet } from '../components/SuspenseOutlet';
import { Clock, LogOut, Menu, Radio, Star, Truck, User as UserIcon, X } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { toast } from '../components/ui/feedback';
import { msg } from '../constants/messages';

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

interface NavItem {
  path: string;
  label: string;
  Icon: React.FC<{ className?: string }>;
  /** Guest có được truy cập (GB-28: Guest chỉ được lập nháp đơn) */
  guest: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { path: '/booking', label: 'Đặt xe vận chuyển', Icon: Truck, guest: true },
  { path: '/tracking', label: 'Theo dõi trực tiếp', Icon: Radio, guest: false },
  { path: '/orders', label: 'Đơn hàng của tôi', Icon: Clock, guest: false },
  { path: '/ratings', label: 'Đánh giá của tôi', Icon: Star, guest: false },
  { path: '/profile', label: 'Hồ sơ & bảo mật', Icon: UserIcon, guest: false },
];

export const CustomerLayout: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { isSidebarOpen, setIsSidebarOpen, toggleSidebar: toggleShared } = useSidebarStore();
  const toggleSidebar = toggleShared;

  const items = NAV_ITEMS.filter((i) => isAuthenticated || i.guest);

  const go = (path: string) => {
    navigate(path);
  };

  const handleLogout = () => {
    logout();
    toast.info(msg('MSG21'));
    navigate('/login', { replace: true });
  };

  const sidebar = (
    <div className="flex flex-col h-full bg-white text-slate-800 overflow-hidden">
      <div className="bg-slate-900 text-white p-4 flex-shrink-0">
        <div className="flex items-center justify-between pb-3">
          <span className="text-xl font-black tracking-tight">
            Mod<span className="text-blue-500">Move</span>
          </span>
          <button type="button" onClick={() => setIsSidebarOpen(false)} aria-label="Đóng menu" className="w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-3 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-600 font-black text-sm flex items-center justify-center flex-shrink-0">
            {user?.fullName?.charAt(0) ?? 'K'}
          </div>
          <div className="min-w-0">
            <div className="font-extrabold text-sm truncate">{user?.fullName ?? 'Khách vãng lai'}</div>
            <div className="text-[11px] text-slate-400 truncate">{user?.email ?? 'Đăng nhập để gửi đơn và theo dõi'}</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-2 text-sm">
        {items.map(({ path, label, Icon }) => {
          const active = pathname.startsWith(path);
          return (
            <button
              key={path}
              type="button"
              onClick={() => go(path)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition ${
                active ? 'bg-slate-100 text-slate-900 font-bold border border-slate-300 shadow-sm' : 'bg-white border border-slate-200 shadow-sm hover:bg-slate-50 hover:border-slate-300 text-slate-700 font-semibold'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          );
        })}
      </nav>

      <div className="p-3 border-t border-slate-200 bg-slate-50 flex-shrink-0">
        {isAuthenticated ? (
          <button type="button" onClick={handleLogout} className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl text-slate-600 hover:text-rose-600 hover:bg-rose-50 font-bold text-xs">
            <LogOut className="w-4 h-4" /> Đăng xuất
          </button>
        ) : (
          <button type="button" onClick={() => navigate('/login?redirect=/booking')} className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs">
            Đăng nhập / Đăng ký
          </button>
        )}
      </div>
    </div>
  );

  return (
    <CustomerLayoutContext.Provider value={{ isSidebarOpen, setIsSidebarOpen, toggleSidebar }}>
      <div className="flex w-screen h-screen overflow-hidden bg-slate-100 font-sans">
        {isSidebarOpen ? (
          <aside className="hidden md:flex w-72 h-full flex-shrink-0 flex-col border-r border-slate-200 z-30 shadow-lg">{sidebar}</aside>
        ) : (
          <aside className="w-14 sm:w-16 bg-white border-r border-slate-200 flex flex-col items-center py-3 gap-3 z-30 flex-shrink-0">
            <button type="button" onClick={toggleSidebar} aria-label="Mở menu" className="w-10 h-10 rounded-xl hover:bg-slate-100 text-slate-700 flex items-center justify-center mb-2">
              <Menu className="w-5 h-5" />
            </button>
            {items.map(({ path, label, Icon }) => (
              <button
                key={path}
                type="button"
                title={label}
                aria-label={label}
                onClick={() => go(path)}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition ${
                  pathname.startsWith(path) ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
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
    </CustomerLayoutContext.Provider>
  );
};
