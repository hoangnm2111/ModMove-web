import { useSidebarStore } from '../store/useSidebarStore';
import React, { createContext, useContext, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CreditCard, Database, LayoutDashboard, LogOut, Settings, ShieldCheck, Ticket, Undo2, UserCog, Users } from 'lucide-react';
import { IconRail, MobileDrawer, MobileTopBar, NavSection, SidebarHeader, SidebarNav } from './SidebarParts';
import { SuspenseOutlet } from '../components/SuspenseOutlet';
import { useAuthStore } from '../store/useAuthStore';
import { adminApi } from '../api/endpoints';
import { useQuery } from '../api/useQuery';

interface AdminLayoutContextType {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
}
export const AdminLayoutContext = createContext<AdminLayoutContextType>({ isSidebarOpen: false, setIsSidebarOpen: () => {}, toggleSidebar: () => {} });
export const useAdminLayout = () => useContext(AdminLayoutContext);

/** Layout Admin – cùng khuôn sáng với Customer/Driver (header tối, thân menu trắng) */
export const AdminLayout: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { user, logout } = useAuthStore();
  const { isSidebarOpen, setIsSidebarOpen, toggleSidebar: toggleShared } = useSidebarStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const closeMenu = () => (mobileOpen ? setMobileOpen(false) : setIsSidebarOpen(false));
  const toggleSidebar = toggleShared;

  const apps = useQuery(() => adminApi.pendingApplications(1, 1), [], { refreshMs: 60_000 });
  const refunds = useQuery(() => adminApi.refunds({ status: 'Requested', pageSize: 50 }), [], { refreshMs: 60_000 });
  const approved = useQuery(() => adminApi.refunds({ status: 'Approved', pageSize: 1 }), [], { refreshMs: 60_000 });
  const withdrawals = useQuery(() => adminApi.withdrawals({ status: 'Pending', pageSize: 1 }), [], { refreshMs: 60_000 });
  const refundBadge = (refunds.data?.items ?? []).filter((r) => r.sourceType === 'Cancellation' || r.proposedAmount !== null).length + (approved.data?.totalCount ?? 0);

  const sections: NavSection[] = [
    { title: 'Tổng quan & báo cáo', items: [{ path: '/admin/dashboard', label: 'Bảng điều khiển & doanh thu', Icon: LayoutDashboard }] },
    {
      title: 'Đối tác & tài chính',
      items: [
        { path: '/admin/drivers', label: 'Thẩm định hồ sơ tài xế', Icon: ShieldCheck, badge: apps.data?.totalCount },
        { path: '/admin/refunds', label: 'Duyệt hoàn tiền & khiếu nại', Icon: Undo2, badge: refundBadge },
        { path: '/admin/withdrawals', label: 'Duyệt rút tiền tài xế', Icon: CreditCard, badge: withdrawals.data?.totalCount },
      ],
    },
    {
      title: 'Hệ thống',
      items: [
        { path: '/admin/users', label: 'Người dùng & phân quyền', Icon: Users },
        { path: '/admin/pricing', label: 'Bảng cước & hoa hồng', Icon: Settings },
        { path: '/admin/coupons', label: 'Mã giảm giá', Icon: Ticket },
        { path: '/admin/master-data', label: 'Danh mục & nội dung', Icon: Database },
        { path: '/admin/profile', label: 'Hồ sơ & bảo mật', Icon: UserCog },
      ],
    },
  ];
  const all = sections.flatMap((s) => s.items);
  const isActive = (p: string) => pathname === p || (p === '/admin/dashboard' && pathname === '/admin');
  const go = (p: string) => {
    setMobileOpen(false);
    navigate(p);
  };
  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const sidebar = (
    <div className="flex flex-col h-full bg-white text-slate-800 overflow-hidden">
      <SidebarHeader roleLabel="Admin" name={user?.fullName ?? 'Quản trị viên'} subtitle={user?.email} onClose={closeMenu} />
      <SidebarNav sections={sections} isActive={isActive} go={go} />
      <div className="p-3 border-t border-slate-200 bg-slate-50 flex-shrink-0">
        <button type="button" onClick={handleLogout} className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl text-slate-600 hover:text-rose-600 hover:bg-rose-50 font-bold text-xs">
          <LogOut className="w-4 h-4" /> Đăng xuất
        </button>
      </div>
    </div>
  );

  return (
    <AdminLayoutContext.Provider value={{ isSidebarOpen, setIsSidebarOpen, toggleSidebar }}>
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
    </AdminLayoutContext.Provider>
  );
};
