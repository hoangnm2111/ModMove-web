import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  PackagePlus,
  ClipboardList,
  AlertTriangle,
  LayoutDashboard,
  ShieldCheck,
  Users,
  Settings,
  CreditCard,
  Truck,
  Repeat,
  Radio,
  LogOut,
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { formatCurrency } from '../utils/format';
import { UserRole } from '../types/user.types';

export const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const { user, activeRole, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const customerLinks = [
    { to: '/booking', label: 'Đặt chuyến chuyển đồ', icon: PackagePlus },
    { to: '/orders', label: 'Quản lý đơn hàng', icon: ClipboardList },
    { to: '/wallet', label: 'Ví & Nạp tiền PayOS', icon: CreditCard },
  ];

  const driverLinks = [
    { to: '/driver', label: 'Bàn làm việc & Cuốc xe', icon: Truck, badge: 'Trực ca' },
    { to: '/driver/earnings', label: 'Thu nhập & Ví tài xế', icon: CreditCard },
    { to: '/driver/profile', label: 'Hồ sơ tài xế & Xe', icon: ShieldCheck },
  ];

  const dispatcherLinks = [
    { to: '/dispatcher/live-map', label: 'Bản đồ giám sát xe', icon: Radio },
    { to: '/dispatcher/incidents', label: 'Xử lý sự cố khẩn cấp', icon: AlertTriangle, badge: '2 mới' },
    { to: '/dispatcher/reassign', label: 'Điều phối lại tài xế', icon: Repeat },
  ];

  const adminLinks = [
    { to: '/admin/dashboard', label: 'Dashboard & Doanh thu', icon: LayoutDashboard },
    { to: '/admin/drivers', label: 'Thẩm định hồ sơ tài xế', icon: ShieldCheck, badge: '3 chờ' },
    { to: '/admin/users', label: 'Quản lý người dùng', icon: Users },
    { to: '/admin/pricing', label: 'Cấu hình cước & Hoa hồng', icon: Settings },
  ];

  const getRoleBadge = (role?: UserRole | null) => {
    switch (role) {
      case 'Administrator':
        return {
          label: 'Quản trị viên (Admin)',
          bg: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
          dot: 'bg-amber-400',
        };
      case 'Driver':
        return {
          label: 'Tài xế đối tác (Driver)',
          bg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
          dot: 'bg-emerald-400',
        };
      case 'Dispatcher':
        return {
          label: 'Điều phối viên (Dispatcher)',
          bg: 'bg-sky-500/20 text-sky-400 border-sky-500/40',
          dot: 'bg-sky-400',
        };
      case 'Customer':
        return {
          label: 'Khách hàng (Customer)',
          bg: 'bg-brand-500/20 text-brand-400 border-brand-500/40',
          dot: 'bg-brand-400',
        };
      default:
        return {
          label: 'Chưa đăng nhập',
          bg: 'bg-slate-700 text-slate-300 border-slate-600',
          dot: 'bg-slate-400',
        };
    }
  };

  const badgeInfo = getRoleBadge(activeRole);

  return (
    <aside className="w-64 bg-[#1E293B] text-slate-300 flex flex-col h-screen border-r border-slate-700 select-none flex-shrink-0">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-700/80 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-700 text-blue-400 flex items-center justify-center font-black text-lg shadow-xs">
            M
          </div>
          <div>
            <div className="font-extrabold text-white text-base tracking-wide flex items-center gap-1.5">
              ModMove <span className="text-[10px] bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded font-bold">TRUCK</span>
            </div>
            <div className="text-[11px] text-slate-400">Vận tải xe tải trực tuyến</div>
          </div>
        </div>
      </div>

      {/* Role Indicator Banner */}
      <div className="px-3.5 py-2.5 bg-slate-900/60 border-b border-slate-800">
        <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
          Quyền truy cập hiện tại:
        </div>
        <div className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs font-bold ${badgeInfo.bg}`}>
          <span className={`w-2 h-2 rounded-full ${badgeInfo.dot} animate-pulse`} />
          <span className="truncate">{badgeInfo.label}</span>
        </div>
      </div>

      {/* Navigation Menu Links - STRICTLY FILTERED BY ROLE */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {/* Customer Menu */}
        {activeRole === 'Customer' && (
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-3 mb-2 flex items-center gap-2">
              <PackagePlus className="w-3.5 h-3.5 text-blue-400" />
              Khách hàng / Đặt đơn
            </div>
            <div className="space-y-1">
              {customerLinks.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-xs font-bold'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`
                    }
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </div>
                  </NavLink>
                );
              })}
            </div>
          </div>
        )}

        {/* Driver Menu */}
        {activeRole === 'Driver' && (
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-3 mb-2 flex items-center gap-2">
              <Truck className="w-3.5 h-3.5 text-emerald-400" />
              Tài xế đối tác (Driver)
            </div>
            <div className="space-y-1">
              {driverLinks.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition ${
                        isActive
                          ? 'bg-emerald-600 text-white shadow-sm font-bold'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`
                    }
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="bg-emerald-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>
        )}

        {/* Dispatcher Menu */}
        {activeRole === 'Dispatcher' && (
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-3 mb-2 flex items-center gap-2">
              <Radio className="w-3.5 h-3.5 text-sky-400" />
              Điều phối viên (Dispatcher)
            </div>
            <div className="space-y-1">
              {dispatcherLinks.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition ${
                        isActive
                          ? 'bg-sky-600 text-white shadow-sm font-bold'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`
                    }
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>
        )}

        {/* Administrator Menu */}
        {activeRole === 'Administrator' && (
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-3 mb-2 flex items-center gap-2">
              <LayoutDashboard className="w-3.5 h-3.5 text-amber-400" />
              Quản trị viên (Admin)
            </div>
            <div className="space-y-1">
              {adminLinks.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition ${
                        isActive
                          ? 'bg-amber-600 text-white shadow-sm font-bold'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`
                    }
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="bg-amber-500 text-slate-900 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* User Footer Profile & Logout */}
      <div className="p-3 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 overflow-hidden flex-1">
          <img
            src={user?.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'}
            alt="Avatar"
            className="w-9 h-9 rounded-full border border-slate-600 object-cover flex-shrink-0"
          />
          <div className="overflow-hidden flex-1">
            <div className="text-xs font-bold text-white truncate">{user?.fullName || 'Người dùng'}</div>
            <div className="text-[10px] text-slate-400 truncate">
              {activeRole === 'Customer' || activeRole === 'Driver'
                ? `Ví: ${formatCurrency(user?.walletBalance || 0)}`
                : user?.email || user?.phoneNumber}
            </div>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          title="Đăng xuất khỏi hệ thống"
          className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition flex-shrink-0"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
};
