import React, { useState } from 'react';
import { Pencil, Plus } from 'lucide-react';
import { Button } from '../../components/Button';
import { toast } from '../../components/ui/feedback';
import { Modal } from '../../components/ui/Modal';
import { Field } from '../../components/ui/Field';
import { Card, DataState, PageShell, Pager, Pill, Table, Tabs } from '../../components/ui/kit';
import { adminApi } from '../../api/endpoints';
import { useQuery } from '../../api/useQuery';
import type { CouponDto } from '../../api/types';
import { errorMessage } from '../../services/mock/storage';
import { formatCurrency, formatDateTime } from '../../utils/format';

type Tab = 'ALL' | 'ON' | 'OFF';
const couponState = (c: CouponDto) => {
  const now = Date.now();
  if (!c.isActive) return { label: 'Đã tắt', cls: 'bg-slate-100 text-slate-600 border-slate-200' };
  if (new Date(c.validFrom).getTime() > now) return { label: 'Chưa tới hạn', cls: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
  if (new Date(c.expiresAt).getTime() < now) return { label: 'Hết hạn', cls: 'bg-rose-50 text-rose-700 border-rose-200' };
  if (c.usageLimit !== null && c.usedCount >= c.usageLimit) return { label: 'Hết lượt', cls: 'bg-amber-50 text-amber-700 border-amber-200' };
  return { label: 'Đang áp dụng', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
};

/** GB-21/GB-30 – Quản lý mã giảm giá */
export const AdminCouponsPage: React.FC = () => {
  const [tab, setTab] = useState<Tab>('ALL');
  const [page, setPage] = useState(1);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<CouponDto | null>(null);
  const q = useQuery(() => adminApi.coupons(page, 15, tab === 'ALL' ? undefined : tab === 'ON'), [tab, page]);
  const toggle = async (c: CouponDto) => {
    try {
      await adminApi.setCouponActive(c.id, !c.isActive);
      toast.success(`${c.isActive ? 'Đã tắt' : 'Đã bật'} mã ${c.discountCode}.`);
      await q.reload();
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };
  return (
    <PageShell
      title="Mã giảm giá"
      subtitle="Mỗi đơn dùng tối đa 1 mã • lượt dùng tăng khi tạo đơn và không hoàn khi huỷ • tài xế chịu phần giảm giá"
      actions={
        <Button size="sm" onClick={() => setCreating(true)}>
          <Plus className="w-4 h-4 mr-1" /> Tạo mã mới
        </Button>
      }
      toolbar={
        <Tabs
          value={tab}
          onChange={(k) => (setTab(k), setPage(1))}
          items={[
            { key: 'ALL', label: 'Tất cả' },
            { key: 'ON', label: 'Đang bật' },
            { key: 'OFF', label: 'Đã tắt' },
          ]}
        />
      }
    >
      <div className="w-full">
        <Card>
          <DataState q={q} empty={(d) => d.items.length === 0}>
            {(d) => (
              <>
                <Table
                  rows={d.items}
                  rowKey={(c) => c.id}
                  cols={[
                    { head: 'Mã', cell: (c) => <span className="font-mono font-black text-slate-900">{c.discountCode}</span> },
                    { head: 'Giảm', className: 'text-right', cell: (c) => <b className="text-emerald-700">{formatCurrency(c.discountValue)}</b> },
                    { head: 'Đơn tối thiểu', className: 'text-right', cell: (c) => formatCurrency(c.minimumOrderValue) },
                    { head: 'Hiệu lực', cell: (c) => <div>{formatDateTime(c.validFrom)}<div className="text-slate-400">đến {formatDateTime(c.expiresAt)}</div></div> },
                    {
                      head: 'Đã dùng',
                      cell: (c) => (
                        <div className="w-28">
                          <div>
                            {c.usedCount} / {c.usageLimit ?? '∞'}
                          </div>
                          {c.usageLimit !== null && (
                            <div className="h-1.5 rounded-full bg-slate-100 mt-1">
                              <div className="h-full rounded-full bg-blue-600" style={{ width: `${Math.min(100, (c.usedCount / Math.max(1, c.usageLimit)) * 100)}%` }} />
                            </div>
                          )}
                        </div>
                      ),
                    },
                    { head: 'Tình trạng', cell: (c) => <Pill tone={couponState(c)} /> },
                    {
                      head: '',
                      className: 'text-right',
                      cell: (c) => (
                        <div className="flex justify-end gap-1">
                          <Button size="sm" variant="ghost" onClick={() => setEditing(c)}>
                            <Pencil className="w-3.5 h-3.5 mr-1" /> Sửa
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => toggle(c)}>
                            {c.isActive ? 'Tắt' : 'Bật'}
                          </Button>
                        </div>
                      ),
                    },
                  ]}
                />
                <Pager page={d.pageNumber} pageSize={d.pageSize} total={d.totalCount} onChange={setPage} />
              </>
            )}
          </DataState>
        </Card>
      </div>
      {creating && <CreateModal onClose={() => setCreating(false)} onDone={() => (setCreating(false), q.reload())} />}
      {editing && <CreateModal coupon={editing} onClose={() => setEditing(null)} onDone={() => (setEditing(null), q.reload())} />}
    </PageShell>
  );
};

/** Giờ địa phương cho ô datetime-local */
const toLocalInput = (iso: string) => {
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
};

/** Tạo mã mới, hoặc sửa điều kiện mã có sẵn (K-30: mã không đổi, giới hạn lượt ≥ số lượt đã dùng) */
const CreateModal: React.FC<{ coupon?: CouponDto; onClose: () => void; onDone: () => void }> = ({ coupon, onClose, onDone }) => {
  const today = toLocalInput(new Date().toISOString());
  const [f, setF] = useState(
    coupon
      ? { code: coupon.discountCode, value: coupon.discountValue, min: coupon.minimumOrderValue, from: toLocalInput(coupon.validFrom), to: toLocalInput(coupon.expiresAt), limit: coupon.usageLimit === null ? '' : String(coupon.usageLimit) }
      : { code: '', value: 0, min: 0, from: today, to: '', limit: '' }
  );
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    if (!coupon && !/^[A-Z0-9_-]{1,30}$/.test(f.code)) return toast.error('Mã giảm giá tối đa 30 ký tự, chỉ gồm chữ in hoa, chữ số, dấu gạch ngang và dấu gạch dưới.');
    if (!(f.value > 0)) return toast.error('Giá trị giảm phải lớn hơn 0.');
    if (f.min < 0) return toast.error('Giá trị đơn tối thiểu không được âm.');
    if (!f.to || new Date(f.to) <= new Date(f.from)) return toast.error('Ngày hết hạn phải sau ngày bắt đầu.');
    const limit = f.limit ? Number(f.limit) : null;
    if (limit !== null && !(limit > 0)) return toast.error('Tổng lượt dùng phải lớn hơn 0.');
    if (coupon && limit !== null && limit < coupon.usedCount) return toast.error(`Tổng lượt dùng không được nhỏ hơn ${coupon.usedCount} lượt đã dùng.`);
    const terms = {
      discountValue: f.value,
      minimumOrderValue: f.min,
      validFrom: new Date(f.from).toISOString(),
      expiresAt: new Date(f.to).toISOString(),
      usageLimit: limit,
    };
    setBusy(true);
    try {
      if (coupon) {
        await adminApi.updateCoupon(coupon.id, terms);
        toast.success(`Đã cập nhật mã ${coupon.discountCode}.`);
      } else {
        await adminApi.createCoupon({ discountCode: f.code, ...terms });
        toast.success(`Đã tạo mã ${f.code}.`);
      }
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
      title={coupon ? `Sửa mã ${coupon.discountCode}` : 'Tạo mã giảm giá'}
      onClose={onClose}
      footer={
        <>
          <Button size="sm" variant="outline" onClick={onClose}>
            Đóng
          </Button>
          <Button size="sm" onClick={submit} isLoading={busy}>
            {coupon ? 'Lưu' : 'Tạo mã'}
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <Field label="Mã" required disabled={!!coupon} value={f.code} onChange={(e) => setF({ ...f, code: e.target.value.toUpperCase() })} />
        {coupon && <p className="text-xs text-slate-500">Mã không đổi được. Đơn đã đặt giữ nguyên số tiền giảm. Đã dùng {coupon.usedCount} lượt.</p>}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Số tiền giảm VND" type="number" required value={f.value || ''} onChange={(e) => setF({ ...f, value: Number(e.target.value) })} />
          <Field label="Giá trị đơn tối thiểu VND" type="number" value={f.min || ''} onChange={(e) => setF({ ...f, min: Number(e.target.value) })} />
          <Field label="Bắt đầu" type="datetime-local" required value={f.from} onChange={(e) => setF({ ...f, from: e.target.value })} />
          <Field label="Hết hạn" type="datetime-local" required value={f.to} onChange={(e) => setF({ ...f, to: e.target.value })} />
        </div>
        <Field label="Tổng lượt dùng" type="number" value={f.limit} onChange={(e) => setF({ ...f, limit: e.target.value })} />
      </div>
    </Modal>
  );
};
