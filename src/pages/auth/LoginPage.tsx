import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  User as UserIcon,
  Lock,
  Eye,
  EyeOff,
  Truck,
  Radio,
  LayoutDashboard,
  PackagePlus,
  ArrowRight,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { useAuthStore, HARDCODED_ACCOUNTS } from '../../store/useAuthStore';
import { UserRole } from '../../types/user.types';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, loginWithRole } = useAuthStore();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleManualLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!username.trim()) {
      setErrorMessage('Vui lòng nhập tên tài khoản.');
      return;
    }
    if (!password) {
      setErrorMessage('Vui lòng nhập mật khẩu.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      const result = login(username, password);
      setIsLoading(false);

      if (result.success && result.defaultPath) {
        navigate(result.defaultPath, { replace: true });
      } else {
        setErrorMessage(result.message || 'Đăng nhập không thành công.');
      }
    }, 250);
  };

  const handleQuickLogin = (role: UserRole) => {
    setIsLoading(true);
    setErrorMessage('');
    setTimeout(() => {
      const targetPath = loginWithRole(role);
      setIsLoading(false);
      navigate(targetPath, { replace: true });
    }, 200);
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'Administrator':
        return <LayoutDashboard className="w-5 h-5 text-amber-500" />;
      case 'Driver':
        return <Truck className="w-5 h-5 text-emerald-500" />;
      case 'Dispatcher':
        return <Radio className="w-5 h-5 text-sky-500" />;
      case 'Customer':
        return <PackagePlus className="w-5 h-5 text-brand-500" />;
    }
  };

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'Administrator':
        return 'bg-amber-50 text-amber-700 border-amber-200 hover:border-amber-400 hover:bg-amber-100/50';
      case 'Driver':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:border-emerald-400 hover:bg-emerald-100/50';
      case 'Dispatcher':
        return 'bg-sky-50 text-sky-700 border-sky-200 hover:border-sky-400 hover:bg-sky-100/50';
      case 'Customer':
        return 'bg-orange-50 text-orange-700 border-orange-200 hover:border-orange-400 hover:bg-orange-100/50';
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-900 flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      {/* Background ambient decorative glows */}
      <div className="absolute top-[-10%] left-[-5%] w-96 h-96 bg-brand-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-4xl relative z-10 flex flex-col gap-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-slate-800/80 border border-slate-700 shadow-inner">
            <div className="w-7 h-7 rounded-lg bg-brand-500 text-white flex items-center justify-center font-black text-sm shadow-md shadow-brand-500/30">
              M
            </div>
            <span className="text-white font-extrabold tracking-wide text-sm">
              ModMove <span className="text-brand-400 font-semibold text-xs ml-1">PORTAL</span>
            </span>
            <span className="text-slate-500 text-xs">•</span>
            <span className="text-xs text-slate-300 font-medium">Hệ Thống Phân Quyền 4 Vai Trò</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Đăng nhập Hệ thống Quản trị & Điều phối
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto">
            Mỗi tài khoản được phân quyền riêng biệt. Sau khi đăng nhập, hệ thống sẽ tự động điều hướng tới trang chuyên môn của vai trò đó.
          </p>
        </div>

        {/* Main Grid: Form Left, Quick Roles Right */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 bg-slate-800/90 backdrop-blur-md rounded-2xl border border-slate-700 shadow-2xl p-6 sm:p-8">
          {/* Left Column: Manual Login Form */}
          <div className="md:col-span-6 flex flex-col justify-between border-b md:border-b-0 md:border-r border-slate-700/80 pb-6 md:pb-0 md:pr-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <ShieldCheck className="w-5 h-5 text-brand-400" />
                <h2 className="text-base font-bold text-white">Đăng nhập tài khoản</h2>
              </div>

              {errorMessage && (
                <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleManualLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Tên tài khoản (Role)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <UserIcon className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="admin / driver / dispatcher / customer"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs sm:text-sm placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition"
                      autoFocus
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Mật khẩu
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Mặc định: 123456"
                      className="w-full pl-10 pr-10 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs sm:text-sm placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 transition"
                      title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full mt-2 py-2.5 px-4 rounded-xl bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-brand-500/25 transition active:scale-[0.99]"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Đăng nhập ngay</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-700/60 text-[11px] text-slate-400">
              <span className="font-semibold text-slate-300">Lưu ý:</span> Mật khẩu mặc định cho toàn bộ 4 tài khoản là <code className="bg-slate-900 text-brand-400 px-1.5 py-0.5 rounded font-mono font-bold">123456</code>.
            </div>
          </div>

          {/* Right Column: 4 Fixed Accounts 1-Click Fast Login */}
          <div className="md:col-span-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>4 Tài khoản phân quyền có sẵn</span>
                </div>
                <span className="text-[11px] text-slate-400">Nhấp để vào ngay</span>
              </div>

              <div className="space-y-2.5">
                {HARDCODED_ACCOUNTS.map((acc) => {
                  return (
                    <div
                      key={acc.role}
                      onClick={() => handleQuickLogin(acc.role)}
                      className={`cursor-pointer p-3 rounded-xl border transition-all duration-150 flex items-center justify-between group ${getRoleBadgeColor(
                        acc.role
                      )}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-white/80 shadow-sm">
                          {getRoleIcon(acc.role)}
                        </div>
                        <div>
                          <div className="text-xs font-bold flex items-center gap-2">
                            <span>{acc.label}</span>
                          </div>
                          <div className="text-[11px] opacity-80 mt-0.5">
                            TK: <span className="font-mono font-bold">{acc.username}</span> | MK: <span className="font-mono font-bold">{acc.password}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 text-[11px] font-bold group-hover:translate-x-0.5 transition-transform">
                        <span>Vào</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-4 p-3 rounded-xl bg-slate-900/60 border border-slate-700/50 text-[11px] text-slate-400">
              <div className="text-slate-300 font-semibold mb-1">Cơ chế bảo vệ Role (Route Protection):</div>
              <ul className="list-disc pl-4 space-y-0.5 text-[10px] text-slate-400">
                <li>Khách hàng chỉ truy cập được Đặt chuyến, Lịch sử đơn & Ví.</li>
                <li>Tài xế chỉ truy cập Bàn làm việc, Ví thu nhập & Hồ sơ xe.</li>
                <li>Điều phối viên chỉ truy cập Bản đồ live map & Console sự cố.</li>
                <li>Admin quản lý Dashboard, Thẩm định giấy tờ & Bảng giá.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
