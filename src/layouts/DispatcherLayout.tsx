import React, { createContext, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FileCheck2, Headphones, Layers, LogOut, Radio, ShieldAlert, UserCog, X } from 'lucide-react';
import { IconRail, NavSection, SidebarNav } from './SidebarParts';
import { SuspenseOutlet } from '../components/SuspenseOutlet';
import { useAuthStore } from '../store/useAuthStore';
import { useSidebarStore } from '../store/useSidebarStore';
import { dispatcherApi } from '../api/endpoints';
import { useQuery } from '../api/useQuery';
import { useNoticeRefresh } from '../notifications/useNoticeRefresh';

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

  // Số liệu thật cho badge
  const openIncidents = useQuery(() => dispatcherApi.incidents({ status: 'Open', pageSize: 1 }), [], { refreshMs: 60_000 });
  const needsReview = useQuery(() => dispatcherApi.complaints({ stage: 'NeedsReview', pageSize: 1 }), [], { refreshMs: 60_000 });
  const replied = useQuery(() => dispatcherApi.complaints({ stage: 'CustomerReplied', pageSize: 1 }), [], { refreshMs: 60_000 });
  const pendingCases = (needsReview.data?.totalCount ?? 0) + (replied.data?.totalCount ?? 0);
  // Thông báo realtime làm đổi bộ đếm → tải lại ngay thay vì chờ 60 giây
  useNoticeRefresh(
    (t) => ['INCIDENT_REPORTED', 'COMPLAINT_SUBMITTED', 'REFUND_INFO_REPLIED', 'INCIDENT_REFUND_REQUESTED'].includes(t),
    () => void Promise.all([openIncidents.reload(), needsReview.reload(), replied.reload()])
  );

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

  const sidebar = (
    <div className="flex flex-col h-full bg-white text-slate-800 overflow-hidden">
      <div className="bg-slate-900 text-white p-4 flex-shrink-0">
        <div className="flex items-center justify-between pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-sky-500 text-slate-950 flex items-center justify-center">
              <Headphones className="w-4 h-4" />
            </div>
            <span className="text-xl font-black tracking-tight">
              Mod<span className="text-sky-400">Move</span>
            </span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-black uppercase bg-slate-800 text-sky-300 border border-slate-700">Điều phối</span>
          </div>
          <button type="button" onClick={() => setIsSidebarOpen(false)} className="w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center" aria-label="Đóng menu" title="Đóng menu">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-3 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-sky-500 text-slate-950 font-black text-sm flex items-center justify-center flex-shrink-0">{user?.fullName?.charAt(0) ?? 'D'}</div>
          <div className="min-w-0">
            <div className="font-extrabold text-sm truncate">{user?.fullName ?? 'Điều phối viên'}</div>
            <div className="text-[11px] text-slate-400 truncate">{user?.email}</div>
          </div>
        </div>
      </div>
      <SidebarNav sections={sections} isActive={isActive} go={navigate} />
      <div className="p-3 border-t border-slate-200 bg-slate-50 flex-shrink-0">
        <button type="button" onClick={handleLogout} className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl text-slate-600 hover:text-rose-600 hover:bg-rose-50 font-bold text-xs">
          <LogOut className="w-4 h-4" /> Đăng xuất
        </button>
      </div>
    </div>
  );

  return (
    <DispatcherLayoutContext.Provider value={{ isSidebarOpen, setIsSidebarOpen, toggleSidebar }}>
      <div className="flex w-screen h-screen overflow-hidden bg-slate-100 font-sans">
        {isSidebarOpen ? (
          <aside className="hidden md:flex w-72 h-full flex-shrink-0 flex-col border-r border-slate-200 z-30 shadow-lg">{sidebar}</aside>
        ) : (
          <IconRail items={all} isActive={isActive} go={navigate} onOpen={toggleSidebar} />
        )}
        {isSidebarOpen && (
          <div className="md:hidden fixed inset-0 z-50 flex">
            <div className="fixed inset-0 bg-slate-900/40" />
            <div className="relative w-72 h-full shadow-2xl z-50">{sidebar}</div>
          </div>
        )}
        <main className="flex-1 h-full overflow-hidden relative flex bg-slate-50 min-w-0">{children ?? <SuspenseOutlet />}</main>
      </div>
    </DispatcherLayoutContext.Provider>
  );
};
