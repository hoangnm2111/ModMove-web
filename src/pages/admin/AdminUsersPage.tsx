import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Lock, Power, Unlock, UserPlus } from 'lucide-react';
import { Button } from '../../components/Button';
import { Banner, toast } from '../../components/ui/feedback';
import { Modal } from '../../components/ui/Modal';
import { Field, TextArea } from '../../components/ui/Field';
import { Card, DataState, Drawer, KV, PageShell, Pager, Pill, SearchBox, Select, Table } from '../../components/ui/kit';
import { adminApi } from '../../api/endpoints';
import { useQuery } from '../../api/useQuery';
import { ACCOUNT_STATUS, APPROVAL_STATUS, ROLE_LABEL } from '../../api/labels';
import type { AccountStatus, UserDetailResponse, UserRole } from '../../api/types';
import { useAuthStore } from '../../store/useAuthStore';
import { errorMessage } from '../../services/mock/storage';
import { formatDateTime } from '../../utils/format';
import { PhoneLink } from '../../components/ui/PhoneLink';

const ROLE_OPTS = [{ value: '', label: 'Mọi vai trò' }, ...(Object.keys(ROLE_LABEL) as UserRole[]).map((r) => ({ value: r, label: ROLE_LABEL[r] }))];
const STATUS_OPTS = [{ value: '', label: 'Mọi trạng thái' }, ...(Object.keys(ACCOUNT_STATUS) as AccountStatus[]).map((s) => ({ value: s, label: ACCOUNT_STATUS[s].label }))];

/** UC-ADM-04..07 – Quản lý tài khoản */
export const AdminUsersPage: React.FC = () => {
  const [params] = useSearchParams();
  const [role, setRole] = useState<UserRole | ''>((params.get('role') as UserRole) ?? '');
  const [status, setStatus] = useState<AccountStatus | ''>((params.get('status') as AccountStatus) ?? '');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [openId, setOpenId] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const filters = { role: role || undefined, status: status || undefined, search: search.trim() };
  const q = useQuery(() => adminApi.users({ ...filters, page, pageSize: 15 }), [JSON.stringify(filters), page]);

  return (
    <PageShell
      title="Quản lý người dùng"
      subtitle="Khách hàng, tài xế, điều phối viên và quản trị viên"
      actions={
        <Button size="sm" onClick={() => setCreating(true)}>
          <UserPlus className="w-4 h-4 mr-1" /> Tạo tài khoản điều phối viên
        </Button>
      }
      toolbar={
        <div className="flex flex-wrap gap-2">
          <SearchBox value={search} onChange={(v) => (setSearch(v), setPage(1))} placeholder="Tên, số điện thoại, email…" />
          <Select value={role} onChange={(e) => (setRole(e.target.value as UserRole | ''), setPage(1))} options={ROLE_OPTS} />
          <Select value={status} onChange={(e) => (setStatus(e.target.value as AccountStatus | ''), setPage(1))} options={STATUS_OPTS} />
        </div>
      }
    >
      <div className="w-full">
        <Card>
          <DataState q={q} empty={(d) => d.items.length === 0}>
            {(d) => (
              <>
                <Table
                  rows={d.items}
                  rowKey={(u) => u.id}
                  onRow={(u) => setOpenId(u.id)}
                  cols={[
                    {
                      head: 'Người dùng',
                      cell: (u) => (
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-slate-900 text-white text-xs font-black flex items-center justify-center">{u.fullName.charAt(0)}</div>
                          <div>
                            <div className="font-bold text-slate-900">{u.fullName}</div>
                            <div className="text-[11px] text-slate-400">#{u.id}</div>
                          </div>
                        </div>
                      ),
                    },
                    { head: 'Liên hệ', cell: (u) => <div>{u.email}<div className="text-[11px] text-slate-400"><PhoneLink phone={u.phoneNumber} /></div></div> },
                    { head: 'Vai trò', cell: (u) => ROLE_LABEL[u.role] },
                    { head: 'Trạng thái', cell: (u) => <Pill tone={ACCOUNT_STATUS[u.accountStatus]} /> },
                    { head: 'Email', cell: (u) => (u.emailVerified ? <span className="text-emerald-700 font-bold">Đã xác minh</span> : <span className="text-amber-700 font-bold">Chưa xác minh</span>) },
                    { head: 'Tạo lúc', cell: (u) => formatDateTime(u.createdAt) },
                  ]}
                />
                <Pager page={d.pageNumber} pageSize={d.pageSize} total={d.totalCount} onChange={setPage} />
              </>
            )}
          </DataState>
        </Card>
      </div>
      {openId && <UserDrawer id={openId} onClose={() => setOpenId(null)} onChanged={() => q.reload()} />}
      {creating && <CreateDispatcherModal onClose={() => setCreating(false)} onDone={() => (setCreating(false), q.reload())} />}
    </PageShell>
  );
};

const UserDrawer: React.FC<{ id: number; onClose: () => void; onChanged: () => void }> = ({ id, onClose, onChanged }) => {
  const q = useQuery(() => adminApi.user(id), [id]);
  const me = useAuthStore((s) => s.user);
  const [target, setTarget] = useState<AccountStatus | null>(null);
  const u = q.data;
  const self = u && String(u.id) === String(me?.id);
  return (
    <Drawer
      open
      onClose={onClose}
      title={u ? <>{u.fullName} <Pill tone={ACCOUNT_STATUS[u.accountStatus]} /></> : 'Người dùng'}
      footer={
        u &&
        !self && (
          <>
            {u.accountStatus !== 'Active' && (
              <Button size="sm" onClick={() => setTarget('Active')}>
                <Unlock className="w-4 h-4 mr-1" /> {u.accountStatus === 'Locked' ? 'Mở khoá' : 'Kích hoạt lại'}
              </Button>
            )}
            {u.accountStatus !== 'Inactive' && (
              <Button size="sm" variant="outline" onClick={() => setTarget('Inactive')}>
                <Power className="w-4 h-4 mr-1" /> Vô hiệu hoá
              </Button>
            )}
            {u.accountStatus !== 'Locked' && (
              <Button size="sm" variant="danger" onClick={() => setTarget('Locked')}>
                <Lock className="w-4 h-4 mr-1" /> Khoá tài khoản
              </Button>
            )}
          </>
        )
      }
    >
      <DataState q={q}>
        {(u) => (
          <>
            {self && <Banner kind="info">Đây là tài khoản của bạn – không thể tự khoá/vô hiệu hoá.</Banner>}
            <Card title="Hồ sơ">
              <KV label="Vai trò">{ROLE_LABEL[u.role]}</KV>
              <KV label="Email">{u.email}</KV>
              <div className="py-1 text-sm font-bold text-slate-800">{u.phoneNumber}</div>
              <KV label="Xác minh email">{u.emailVerified ? 'Đã xác minh' : 'Chưa xác minh'}</KV>
              <KV label="Tạo lúc">{formatDateTime(u.createdAt)}</KV>
              {u.updatedAt && <KV label="Cập nhật">{formatDateTime(u.updatedAt)}</KV>}
            </Card>
            <Card title="Thống kê đơn hàng">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-slate-50 border border-slate-200 p-3">
                  <div className="text-[11px] font-bold text-slate-500">Tổng đơn</div>
                  <div className="text-2xl font-black">{u.totalOrders}</div>
                </div>
                <div className="rounded-xl bg-slate-50 border border-slate-200 p-3">
                  <div className="text-[11px] font-bold text-slate-500">Hoàn thành</div>
                  <div className="text-2xl font-black text-emerald-700">{u.completedOrders}</div>
                </div>
              </div>
            </Card>
            {u.role === 'Driver' && (
              <Card title="Thông tin tài xế">
                <KV label="Hồ sơ">{u.driverApprovalStatus ? <Pill tone={APPROVAL_STATUS[u.driverApprovalStatus]} /> : 'Chưa nộp'}</KV>
                <KV label="Trực tuyến">{u.driverOnlineStatus === 'Online' ? 'Online' : 'Offline'}</KV>
                <KV label="Biển số">{u.licensePlate ?? '—'}</KV>
              </Card>
            )}
            {target && <StatusModal user={u} status={target} onClose={() => setTarget(null)} onDone={() => (setTarget(null), q.reload(), onChanged())} />}
          </>
        )}
      </DataState>
    </Drawer>
  );
};

const StatusModal: React.FC<{ user: UserDetailResponse; status: AccountStatus; onClose: () => void; onDone: () => void }> = ({ user, status, onClose, onDone }) => {
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    if (!reason.trim()) return toast.error('Vui lòng nhập lý do.');
    setBusy(true);
    try {
      await adminApi.setUserStatus(user.id, status, reason.trim());
      toast.success(`Đã chuyển ${user.fullName} sang "${ACCOUNT_STATUS[status].label}".`);
      onDone();
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal
      open
      title={`Đổi trạng thái: ${ACCOUNT_STATUS[status].label}`}
      onClose={onClose}
      footer={
        <>
          <Button size="sm" variant="outline" onClick={onClose}>
            Đóng
          </Button>
          <Button size="sm" variant={status === 'Active' ? 'primary' : 'danger'} onClick={submit} isLoading={busy}>
            Xác nhận
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        {status !== 'Active' && <Banner kind="warning">Người dùng sẽ bị đăng xuất khỏi mọi thiết bị và không thể đăng nhập.</Banner>}
        {status !== 'Active' && user.role === 'Customer' && (user.openRefundCount ?? 0) > 0 && (
          <Banner kind="error">
            Khách còn {user.openRefundCount} khoản hoàn tiền đang mở. Khoá vẫn được, nhưng khách sẽ không khai được tài khoản nhận hay trả lời điều phối viên: hãy xử lý các khoản này ngoài hệ thống
            (đã có tài khoản nhận thì chuyển khoản như bình thường; chưa có thì từ chối với ghi chú "Xử lý ngoài hệ thống").
          </Banner>
        )}
        <TextArea label="Lý do *" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={500} />
      </div>
    </Modal>
  );
};

const CreateDispatcherModal: React.FC<{ onClose: () => void; onDone: () => void }> = ({ onClose, onDone }) => {
  const [f, setF] = useState({ fullName: '', phoneNumber: '', email: '', password: '' });
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    if (!f.fullName.trim() || !f.phoneNumber.trim() || !f.email.trim()) return toast.error('Nhập đủ họ tên, số điện thoại, email.');
    if (f.password.length < 8 || f.password.length > 100) return toast.error('Mật khẩu 8–100 ký tự.');
    setBusy(true);
    try {
      await adminApi.createDispatcher({ fullName: f.fullName.trim(), phoneNumber: f.phoneNumber.trim(), email: f.email.trim().toLowerCase(), password: f.password });
      toast.success('Đã tạo tài khoản điều phối viên. Có thể đăng nhập ngay.');
      onDone();
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal
      open
      title="Tạo tài khoản điều phối viên"
      onClose={onClose}
      footer={
        <>
          <Button size="sm" variant="outline" onClick={onClose}>
            Đóng
          </Button>
          <Button size="sm" onClick={submit} isLoading={busy}>
            Tạo tài khoản
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <Field label="Họ tên" required value={f.fullName} onChange={(e) => setF({ ...f, fullName: e.target.value })} />
        <Field label="Số điện thoại" required value={f.phoneNumber} onChange={(e) => setF({ ...f, phoneNumber: e.target.value })} />
        <Field label="Email" type="email" required value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
        <Field label="Mật khẩu ban đầu" type="password" required value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} />
      </div>
    </Modal>
  );
};
