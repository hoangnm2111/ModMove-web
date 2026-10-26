import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Key, ShieldCheck, CheckCircle2, LogOut } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';

interface NavbarProps {
  title?: string;
}

export const Navbar: React.FC<NavbarProps> = ({ title = 'Đặt dịch vụ vận chuyển đồ theo yêu cầu' }) => {
  const navigate = useNavigate();
  const { user, token, activeRole, logout } = useAuthStore();
  const [showTokenModal, setShowTokenModal] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const getRoleTagColor = (role?: string | null) => {
    switch (role) {
      case 'Administrator':
        return 'text-amber-700 bg-amber-50 border-amber-200';
      case 'Driver':
        return 'text-emerald-700 bg-emerald-50 border-emerald-200';
      case 'Dispatcher':
        return 'text-sky-700 bg-sky-50 border-sky-200';
      case 'Customer':
        return 'text-brand-600 bg-brand-50 border-brand-200';
      default:
        return 'text-slate-600 bg-slate-50 border-slate-200';
    }
  };

  return (
    <header className="h-14 bg-white border-b border-slate-200 px-6 flex items-center justify-between select-none">
      <div className="flex items-center gap-3">
        <h1 className="text-base font-bold text-slate-800">{title}</h1>
        <span className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          SignalR Realtime: Đã kết nối
        </span>
      </div>

      <div className="flex items-center gap-3">
        {/* Token Badge / Viewer */}
        <button
          onClick={() => setShowTokenModal(true)}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
          title="Xem thông tin Token JWT người dùng"
        >
          <Key className="w-3.5 h-3.5 text-brand-500" />
          <span className="hidden md:inline">JWT Token</span>
        </button>

        {/* Notifications */}
        <button className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-brand-500"></span>
        </button>

        {/* Role tag & User info */}
        <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
          <div className="text-right">
            <div className="text-xs font-bold text-slate-800">{user?.fullName || 'Người dùng'}</div>
            <span
              className={`inline-block text-[10px] font-bold uppercase px-1.5 py-0.2 rounded border ${getRoleTagColor(
                activeRole
              )}`}
            >
              {activeRole || 'Guest'}
            </span>
          </div>

          {/* Quick Logout Button */}
          <button
            onClick={handleLogout}
            title="Đăng xuất"
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition flex items-center gap-1 text-xs font-semibold"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden lg:inline text-[11px]">Đăng xuất</span>
          </button>
        </div>
      </div>

      {/* Modal View Token JWT */}
      {showTokenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                Thông tin Xác thực (JWT Auth Session)
              </div>
              <button
                onClick={() => setShowTokenModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-500">Mã Người dùng (User ID / Phone):</label>
                <div className="text-sm font-mono font-medium text-slate-800 bg-slate-50 p-2 rounded-lg mt-1 border">
                  {user?.id} ({user?.fullName})
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500">Chuỗi Token JWT đã cấp:</label>
                <div className="text-xs font-mono text-slate-700 bg-slate-100 p-2.5 rounded-lg mt-1 border break-all max-h-36 overflow-y-auto">
                  {token}
                </div>
              </div>

              <div className="bg-emerald-50 text-emerald-800 p-3 rounded-xl border border-emerald-200 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Token đang có hiệu lực. Hệ thống đã tự động gán vào Header Authorization để gọi API Backend C#.</span>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowTokenModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold transition"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
