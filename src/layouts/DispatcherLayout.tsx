import React, { createContext, useContext, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FileCheck2, Layers, LogOut, Radio, ShieldAlert, UserCog } from 'lucide-react';
import { IconRail, MobileDrawer, MobileTopBar, NavSection, SidebarHeader, SidebarNav } from './SidebarParts';
import { SuspenseOutlet } from '../components/SuspenseOutlet';
import { useAuthStore } from '../store/useAuthStore';
import { useSidebarStore } from '../store/useSidebarStore';
import { dispatcherApi } from '../api/endpoints';
import { useQuery } from '../api/useQuery';

interface DispatcherLayoutContextType {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
}
export const DispatcherLayoutContext = createContext<DispatcherLayoutContextType>({ isSidebarOpen: false, setIsSidebarOpen: () => {}, toggleSidebar: () => {} });
export const useDispatcherLayout = () => useContext(DispatcherLayoutContext);


/** Layout Điều phối viên – cùng khuôn sáng với Customer/Driver (header tối, thân menu trắng) */
export const DispatcherLayout: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { user, logout } = useAuthStore();
  const { isSidebarOpen, setIsSidebarOpen, toggleSidebar } = useSidebarStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const closeMenu = () => (mobileOpen ? setMobileOpen(false) : setIsSidebarOpen(false));

  // Số liệu thật cho badge
  const openIncidents = useQuery(() => dispatcherApi.incidents({ status: 'Open', pageSize: 1 }), [], { refreshMs: 60_000 });
  const needsReview = useQuery(() => dispatcherApi.complaints({ stage: 'NeedsReview', pageSize: 1 }), [], { refreshMs: 60_000 });
  const replied = useQuery(() => dispatcherApi.complaints({ stage: 'CustomerReplied', pageSize: 1 }), [], { refreshMs: 60_000 });
  const pendingCases = (needsReview.data?.totalCount ?? 0) + (replied.data?.totalCount ?? 0);

  const sections: NavSection[] = [
    { title: 'Giám sát thời gian thực', items: [{ path: '/dispatcher/live-map', label: 'Giám sát đơn & tài xế', Icon: Radio }] },
    {
      title: 'Sự cố & điều phối khẩn',
      items: [{ path: '/dispatcher/incidents', label: 'Sự cố hành trình & đổi xe', Icon: ShieldAlert, badge: openIncidents.data?.totalCount, badgeCls: 'bg-rose-50 text-rose-700 border-rose-200' }],
    },
    {
      title: 'Khiếu nại & bồi thường',
      items: [
        { path: '/dispatcher/complaints', label: 'Thẩm định khiếu nại', Icon: FileCheck2, badge: pendingCases, badgeCls: 'bg-amber-50 text-amber-700 border-amber-200' },
        { path: '/dispatcher/handled-cases', label: 'Lịch sử xử lý', Icon: Layers },
      ],
    },
    { title: 'Tài khoản', items: [{ path: '/dispatcher/profile', label: 'Hồ sơ & bảo mật', Icon: UserCog }] },
  ];
  const all = sections.flatMap((s) => s.items);
  const isActive = (p: string) => pathname === p || (p === '/dispatcher/live-map' && pathname === '/dispatcher');
  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const go = (p: string) => {
    setMobileOpen(false);
    navigate(p);
  };

  const sidebar = (
    <div className="flex flex-col h-full bg-white text-slate-800 overflow-hidden">
      <SidebarHeader roleLabel="Điều phối" name={user?.fullName ?? 'Điều phối viên'} subtitle={user?.email} onClose={closeMenu} />
      <SidebarNav sections={sections} isActive={isActive} go={go} />
      <div className="p-3 border-t border-slate-200 bg-slate-50 flex-shrink-0">
        <button type="button" onClick={handleLogout} className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl text-slate-600 hover:text-rose-600 hover:bg-rose-50 font-bold text-xs">
          <LogOut className="w-4 h-4" /> Đăng xuất
        </button>
      </div>
    </div>
  );

  return (
    <DispatcherLayoutContext.Provider value={{ isSidebarOpen, setIsSidebarOpen, toggleSidebar }}>
      <div className="flex flex-col md:flex-row w-screen h-screen h-[100dvh] overflow-hidden bg-slate-100 font-sans">
        <MobileTopBar onOpen={() => setMobileOpen(true)} />
        {isSidebarOpen ? (
          <aside className="hidden md:flex w-64 xl:w-72 h-full flex-shrink-0 flex-col border-r border-slate-200 z-30 shadow-lg">{sidebar}</aside>
        ) : (
          <IconRail items={all} isActive={isActive} go={go} onOpen={toggleSidebar} />
        )}
        <MobileDrawer open={mobileOpen} onClose={() => setMobileOpen(false)}>
          {sidebar}
        </MobileDrawer>
        <main className="flex-1 min-h-0 md:h-full overflow-hidden relative flex bg-slate-50 min-w-0">{children ?? <SuspenseOutlet />}</main>
      </div>
    </DispatcherLayoutContext.Provider>
  );
};
