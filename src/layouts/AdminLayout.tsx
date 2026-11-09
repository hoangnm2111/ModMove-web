import { useSidebarStore } from '../store/useSidebarStore';
import React, { createContext, useContext, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CreditCard, Database, LayoutDashboard, LogOut, Settings, ShieldCheck, Ticket, Truck, Undo2, UserCog, Users, X } from 'lucide-react';
import { IconRail, NavSection, SidebarNav } from './SidebarParts';
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

interface NavItem {
  path: string;
  label: string;
  Icon: React.FC<{ className?: string }>;
  badge?: number;
}

/** Layout Admin – cùng khuôn sáng với Customer/Driver (header tối, thân menu trắng) */
export const AdminLayout: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { user, logout } = useAuthStore();
  const { isSidebarOpen, setIsSidebarOpen, toggleSidebar: toggleShared } = useSidebarStore();
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
    navigate(p);
  };
  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const sidebar = (
    <div className="flex flex-col h-full bg-white text-slate-800 overflow-hidden">
      <div className="bg-slate-900 text-white p-4 flex-shrink-0">
        <div className="flex items-center justify-between pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center">
              <Truck className="w-4 h-4" />
            </div>
            <span className="text-xl font-black tracking-tight">
              Mod<span className="text-amber-400">Move</span>
            </span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-black uppercase bg-slate-800 text-amber-300 border border-slate-700">Admin</span>
          </div>
          <button type="button" onClick={() => setIsSidebarOpen(false)} className="w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center" aria-label="Đóng menu" title="Đóng menu">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-3 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-500 text-slate-950 font-black text-sm flex items-center justify-center flex-shrink-0">{user?.fullName?.charAt(0) ?? 'A'}</div>
          <div className="min-w-0">
            <div className="font-extrabold text-sm truncate">{user?.fullName ?? 'Quản trị viên'}</div>
            <div className="text-[11px] text-slate-400 truncate">{user?.email}</div>
          </div>
        </div>
      </div>
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
      <div className="flex w-screen h-screen overflow-hidden bg-slate-100 font-sans">
        {isSidebarOpen ? (
          <aside className="hidden md:flex w-72 h-full flex-shrink-0 flex-col border-r border-slate-200 z-30 shadow-lg">{sidebar}</aside>
        ) : (
          <IconRail items={all} isActive={isActive} go={go} onOpen={toggleSidebar} />
        )}
        {isSidebarOpen && (
          <div className="md:hidden fixed inset-0 z-50 flex">
            <div className="fixed inset-0 bg-slate-900/40" />
            <div className="relative w-72 h-full shadow-2xl z-50">{sidebar}</div>
          </div>
        )}
        <main className="flex-1 h-full overflow-hidden relative flex bg-slate-50 min-w-0">{children ?? <SuspenseOutlet />}</main>
      </div>
    </AdminLayoutContext.Provider>
  );
};
