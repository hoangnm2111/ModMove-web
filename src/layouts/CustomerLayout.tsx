import { useSidebarStore } from '../store/useSidebarStore';
import React, { createContext, useContext, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { SuspenseOutlet } from '../components/SuspenseOutlet';
import { MobileDrawer, MobileTopBar, SidebarHeader } from './SidebarParts';
import { Clock, LogOut, Menu, Radio, Star, Truck, User as UserIcon } from 'lucide-react';
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
  const [mobileOpen, setMobileOpen] = useState(false);
  const closeMenu = () => (mobileOpen ? setMobileOpen(false) : setIsSidebarOpen(false));
  const toggleSidebar = toggleShared;

  const items = NAV_ITEMS.filter((i) => isAuthenticated || i.guest);

  const go = (path: string) => {
    setMobileOpen(false);
    navigate(path);
  };

  const handleLogout = () => {
    logout();
    toast.info(msg('MSG21'));
    navigate('/login', { replace: true });
  };

  const sidebar = (
    <div className="flex flex-col h-full bg-white text-slate-800 overflow-hidden">
      <SidebarHeader
        name={user?.fullName ?? 'Khách vãng lai'}
        subtitle={user?.email ?? 'Đăng nhập để gửi đơn và theo dõi'}
        onClose={closeMenu}
        onLogoClick={() => navigate('/')}
      />

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
      <div className="flex flex-col md:flex-row w-screen h-screen h-[100dvh] overflow-hidden bg-slate-100 font-sans">
        <MobileTopBar onOpen={() => setMobileOpen(true)} onLogoClick={() => navigate('/')} />
        {isSidebarOpen ? (
          <aside className="hidden md:flex w-64 xl:w-72 h-full flex-shrink-0 flex-col border-r border-slate-200 z-30 shadow-lg">{sidebar}</aside>
        ) : (
          <aside className="hidden md:flex w-16 bg-white border-r border-slate-200 flex-col items-center py-3 gap-3 z-30 flex-shrink-0">
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

        <MobileDrawer open={mobileOpen} onClose={() => setMobileOpen(false)}>
          {sidebar}
        </MobileDrawer>
        <main className="flex-1 min-h-0 md:h-full overflow-hidden relative flex min-w-0">{children ?? <SuspenseOutlet />}</main>
      </div>
    </CustomerLayoutContext.Provider>
  );
};
