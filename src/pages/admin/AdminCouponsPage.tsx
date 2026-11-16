import React, { useState } from 'react';
import { Plus } from 'lucide-react';
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
                        <Button size="sm" variant="outline" onClick={() => toggle(c)}>
                          {c.isActive ? 'Tắt' : 'Bật'}
                        </Button>
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
    </PageShell>
  );
};

const CreateModal: React.FC<{ onClose: () => void; onDone: () => void }> = ({ onClose, onDone }) => {
  const today = new Date().toISOString().slice(0, 16);
  const [f, setF] = useState({ code: '', value: 20000, min: 100000, from: today, to: '', limit: '' });
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    if (!/^[A-Z0-9_-]{1,30}$/.test(f.code)) return toast.error('Mã tối đa 30 ký tự, chữ in hoa/số/-/_.');
    if (!(f.value > 0)) return toast.error('Giá trị giảm phải > 0.');
    if (!f.to || new Date(f.to) <= new Date(f.from)) return toast.error('Ngày hết hạn phải sau ngày bắt đầu.');
    setBusy(true);
    try {
      await adminApi.createCoupon({
        discountCode: f.code,
        discountValue: f.value,
        minimumOrderValue: f.min,
        validFrom: new Date(f.from).toISOString(),
        expiresAt: new Date(f.to).toISOString(),
        usageLimit: f.limit ? Number(f.limit) : null,
      });
      toast.success(`Đã tạo mã ${f.code}.`);
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
      title="Tạo mã giảm giá"
      onClose={onClose}
      footer={
        <>
          <Button size="sm" variant="outline" onClick={onClose}>
            Đóng
          </Button>
          <Button size="sm" onClick={submit} isLoading={busy}>
            Tạo mã
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <Field label="Mã" required value={f.code} onChange={(e) => setF({ ...f, code: e.target.value.toUpperCase() })} placeholder="VD: MODMOVE30" />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Số tiền giảm VND" type="number" required value={f.value} onChange={(e) => setF({ ...f, value: Number(e.target.value) })} />
          <Field label="Giá trị đơn tối thiểu VND" type="number" value={f.min} onChange={(e) => setF({ ...f, min: Number(e.target.value) })} />
          <Field label="Bắt đầu" type="datetime-local" required value={f.from} onChange={(e) => setF({ ...f, from: e.target.value })} />
          <Field label="Hết hạn" type="datetime-local" required value={f.to} onChange={(e) => setF({ ...f, to: e.target.value })} />
        </div>
        <Field label="Tổng lượt dùng" type="number" value={f.limit} onChange={(e) => setF({ ...f, limit: e.target.value })} />
      </div>
    </Modal>
  );
};
