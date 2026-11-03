import React, { useState } from 'react';
import {
  Users,
  Search,
  Filter,
  UserPlus,
  ShieldCheck,
  Lock,
  Unlock,
  CheckCircle2,
  XCircle,
  Phone,
  Mail,
  Calendar,
  X,
  Truck,
  ShieldAlert,
  Radio,
} from 'lucide-react';

import { Banner, toast } from '../../components/ui/feedback';
import { Modal } from '../../components/ui/Modal';
import { TextArea } from '../../components/ui/Field';
import { Button } from '../../components/Button';
import { msg } from '../../constants/messages';
import { useAllOrders, useUsers } from '../../hooks/useDomainData';
import { authService } from '../../services/auth.service';
import { errorMessage } from '../../services/mock/storage';
import { useAuthStore } from '../../store/useAuthStore';
import { AccountStatus } from '../../types/user.types';
import { formatDateTime } from '../../utils/format';

/** View model hiển thị – map từ AccountStatus (Active/Locked/Inactive) */
type ViewStatus = 'ACTIVE' | 'LOCKED' | 'PENDING';
const VIEW_STATUS: Record<AccountStatus, ViewStatus> = { Active: 'ACTIVE', Locked: 'LOCKED', Inactive: 'PENDING' };

/** SCR-31 – Quản lý tài khoản (UC-ADM-04, UC-ADM-06, UC-ADM-07) */
export const AdminUsersPage: React.FC = () => {
  const me = useAuthStore((s) => s.user);
  const rawUsers = useUsers();
  const orders = useAllOrders();
  const users = rawUsers
    .filter((u) => u.role !== 'Administrator')
    .map((u) => ({
      ...u,
      status: VIEW_STATUS[u.status],
      registeredAt: formatDateTime(u.createdAt),
      ordersCount: orders.filter((o) => o.customerId === u.id || o.assignedDriver?.id === u.id).length,
    }));
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'Customer' | 'Driver' | 'Dispatcher'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Form state for creating new Dispatcher
  const [newFullName, setNewFullName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');

  /** UC-ADM-06 – bắt buộc lý do + xác nhận (MSG62); MSG65 không tự khoá mình */
  const [statusTarget, setStatusTarget] = useState<{ id: string; name: string; next: AccountStatus } | null>(null);
  const [statusReason, setStatusReason] = useState('');
  const [statusError, setStatusError] = useState<string | null>(null);
  const [statusSaving, setStatusSaving] = useState(false);

  const toggleUserStatus = (id: string) => {
    const u = rawUsers.find((x) => x.id === id);
    if (!u) return;
    setStatusTarget({ id, name: u.fullName, next: u.status === 'Active' ? 'Locked' : 'Active' });
    setStatusReason('');
    setStatusError(null);
  };

  const submitStatusChange = async () => {
    if (!statusTarget || !me) return;
    setStatusSaving(true);
    setStatusError(null);
    try {
      await authService.setAccountStatus(me.id, statusTarget.id, statusTarget.next, statusReason);
      toast.success(msg('MSG04', { record_name: 'trạng thái tài khoản' }));
      setStatusTarget(null);
    } catch (e) {
      setStatusError(errorMessage(e));
    } finally {
      setStatusSaving(false);
    }
  };

  /** UC-ADM-07 / GB-45 */
  const handleCreateDispatcher = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    try {
      await authService.createDispatcher({ fullName: newFullName, phoneNumber: newPhone, email: newEmail, password: newPassword });
      toast.success(msg('MSG04', { record_name: 'tài khoản điều phối viên' }));
      setShowCreateModal(false);
      setNewFullName('');
      setNewPhone('');
      setNewEmail('');
      setNewPassword('');
    } catch (err) {
      setCreateError(errorMessage(err));
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    const matchesSearch =
      u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.phoneNumber.includes(searchTerm) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesRole && matchesSearch;
  });

  return (
    <div className="flex-1 h-full overflow-y-auto p-4 sm:p-6 space-y-6 bg-slate-50 select-none">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-amber-500" />
              <span>Quản lý tài khoản & Phân quyền hệ thống</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Tra cứu người dùng, kích hoạt / khóa tài khoản và khởi tạo nhân viên điều phối
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs flex items-center gap-2 transition shadow-md shadow-amber-500/20 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Thêm Điều phối viên mới</span>
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Tổng tài khoản</span>
            <span className="text-2xl font-black text-slate-900 mt-1 block">{users.length}</span>
            <span className="text-[11px] text-emerald-600 font-semibold">Tất cả vai trò</span>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Khách hàng</span>
            <span className="text-2xl font-black text-brand-600 mt-1 block">
              {users.filter((u) => u.role === 'Customer').length}
            </span>
            <span className="text-[11px] text-slate-400">Đã đăng ký app</span>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Đối tác tài xế</span>
            <span className="text-2xl font-black text-emerald-600 mt-1 block">
              {users.filter((u) => u.role === 'Driver').length}
            </span>
            <span className="text-[11px] text-slate-400">Xe chở hàng</span>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Điều phối viên</span>
            <span className="text-2xl font-black text-sky-600 mt-1 block">
              {users.filter((u) => u.role === 'Dispatcher').length}
            </span>
            <span className="text-[11px] text-sky-600 font-semibold">Trực tổng đài</span>
          </div>
        </div>

        {/* Filter and Table Container */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          {/* Controls Bar */}
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Search */}
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm theo họ tên, SĐT, email..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition"
              />
            </div>

            {/* Role Filter Tabs */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl text-xs font-bold">
              {[
                { id: 'ALL', label: 'Tất cả' },
                { id: 'Customer', label: 'Khách hàng' },
                { id: 'Driver', label: 'Tài xế' },
                { id: 'Dispatcher', label: 'Điều phối viên' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setRoleFilter(tab.id as typeof roleFilter)}
                  className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                    roleFilter === tab.id
                      ? 'bg-white text-slate-900 shadow-xs font-black'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-400 font-extrabold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="p-3.5 pl-5">Người dùng</th>
                  <th className="p-3.5">Số điện thoại</th>
                  <th className="p-3.5">Vai trò hệ thống</th>
                  <th className="p-3.5">Số cuốc xe</th>
                  <th className="p-3.5">Ngày đăng ký</th>
                  <th className="p-3.5">Trạng thái</th>
                  <th className="p-3.5 pr-5 text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3.5 pl-5">
                      <div className="font-black text-slate-900">{u.fullName}</div>
                      <div className="text-[11px] text-slate-400">{u.email}</div>
                    </td>
                    <td className="p-3.5 font-mono text-slate-700 font-semibold">{u.phoneNumber}</td>
                    <td className="p-3.5">
                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                          u.role === 'Customer'
                            ? 'bg-orange-100 text-brand-700'
                            : u.role === 'Driver'
                            ? 'bg-emerald-100 text-emerald-700'
                            : u.role === 'Dispatcher'
                            ? 'bg-sky-100 text-sky-700'
                            : 'bg-purple-100 text-purple-700'
                        }`}
                      >
                        {u.role === 'Customer'
                          ? 'Khách hàng'
                          : u.role === 'Driver'
                          ? 'Tài xế'
                          : u.role === 'Dispatcher'
                          ? 'Điều phối viên'
                          : 'Admin'}
                      </span>
                    </td>
                    <td className="p-3.5 font-bold text-slate-700">{u.ordersCount} đơn</td>
                    <td className="p-3.5 text-slate-500 font-medium">{u.registeredAt}</td>
                    <td className="p-3.5">
                      <span
                        className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${
                          u.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : u.status === 'LOCKED'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            u.status === 'ACTIVE'
                              ? 'bg-emerald-500'
                              : u.status === 'LOCKED'
                              ? 'bg-rose-500'
                              : 'bg-amber-500'
                          }`}
                        />
                        <span>{u.status === 'ACTIVE' ? 'Hoạt động' : u.status === 'LOCKED' ? 'Bị khóa' : 'Vô hiệu hoá'}</span>
                        {u.statusReason && u.status !== 'ACTIVE' && <span className="ml-1 font-medium opacity-80 truncate max-w-[140px]" title={u.statusReason}>– {u.statusReason}</span>}
                      </span>
                    </td>
                    <td className="p-3.5 pr-5 text-right">
                      {u.role !== 'Administrator' && (
                        <button
                          type="button"
                          onClick={() => toggleUserStatus(u.id)}
                          className={`px-3 py-1.5 rounded-xl font-bold text-xs inline-flex items-center gap-1.5 transition cursor-pointer ${
                            u.status === 'ACTIVE'
                              ? 'border border-rose-200 text-rose-600 hover:bg-rose-50'
                              : 'border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          }`}
                        >
                          {u.status === 'ACTIVE' ? (
                            <>
                              <Lock className="w-3.5 h-3.5" />
                              <span>Khóa tài khoản</span>
                            </>
                          ) : (
                            <>
                              <Unlock className="w-3.5 h-3.5" />
                              <span>Mở khóa</span>
                            </>
                          )}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* CREATE DISPATCHER MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center font-bold">
                  <UserPlus className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-black text-slate-900">Tạo tài khoản Điều phối viên</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateDispatcher} className="space-y-3" noValidate>
              {createError && <Banner kind="error">{createError}</Banner>}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Họ và tên điều phối viên:</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Lê Bảo Minh"
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Số điện thoại liên hệ:</label>
                <input
                  type="tel"
                  required
                  placeholder="Ví dụ: 0918889999"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Email nội bộ hệ thống:</label>
                <input
                  type="email"
                  required
                  placeholder="minh.dispatcher@modmove.vn"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Mật khẩu ban đầu:</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs transition cursor-pointer shadow-md shadow-sky-600/20"
                >
                  Tạo tài khoản & Cấp quyền
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {statusTarget && (
        <Modal
          open
          size="sm"
          title={statusTarget.next === 'Locked' ? `Khoá tài khoản ${statusTarget.name}` : `Mở khoá tài khoản ${statusTarget.name}`}
          onClose={() => setStatusTarget(null)}
          footer={
            <>
              <Button size="sm" variant="outline" onClick={() => setStatusTarget(null)}>
                Huỷ
              </Button>
              <Button size="sm" variant={statusTarget.next === 'Locked' ? 'danger' : 'primary'} isLoading={statusSaving} disabled={!statusReason.trim()} onClick={submitStatusChange}>
                Xác nhận
              </Button>
            </>
          }
        >
          <div className="space-y-3">
            <p className="text-xs text-slate-600">
              {msg('MSG62', { action_name: statusTarget.next === 'Locked' ? 'khoá tài khoản' : 'mở khoá tài khoản' })}
              {statusTarget.next === 'Locked' && ' Mọi phiên đăng nhập của người dùng sẽ bị thu hồi (GB-47).'}
            </p>
            <TextArea label="Lý do" required value={statusReason} error={statusError} onChange={(e) => setStatusReason(e.target.value)} />
          </div>
        </Modal>
      )}
    </div>
  );
};
