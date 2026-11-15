import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BadgePercent, Banknote, CheckCircle2, CircleDollarSign, Download, FileCheck2, Package, Receipt, ShieldCheck, Ticket, TrendingUp, Truck, Undo2, Users, Wallet } from 'lucide-react';
import { Button } from '../../components/Button';
import { toast } from '../../components/ui/feedback';
import { Card, DataState, PageShell, StatCard, Table, cx, isoDate } from '../../components/ui/kit';
import { BarList, ColumnChart } from '../../components/ui/charts';
import { adminApi } from '../../api/endpoints';
import { useQuery } from '../../api/useQuery';
import type { RevenueReportResponse } from '../../api/types';
import { errorMessage } from '../../services/mock/storage';
import { formatCurrency, formatDateTime } from '../../utils/format';

type Preset = '7D' | '30D' | 'MONTH' | 'LAST_MONTH' | 'CUSTOM';
const PRESETS: { key: Preset; label: string }[] = [
  { key: '7D', label: '7 ngày' },
  { key: '30D', label: '30 ngày' },
  { key: 'MONTH', label: 'Tháng này' },
  { key: 'LAST_MONTH', label: 'Tháng trước' },
  { key: 'CUSTOM', label: 'Tuỳ chọn' },
];
const rangeOf = (p: Preset): [string, string] => {
  const now = new Date();
  const d = (n: number) => new Date(now.getFullYear(), now.getMonth(), now.getDate() - n);
  switch (p) {
    case '7D':
      return [isoDate(d(6)), isoDate(now)];
    case '30D':
      return [isoDate(d(29)), isoDate(now)];
    case 'MONTH':
      return [isoDate(new Date(now.getFullYear(), now.getMonth(), 1)), isoDate(now)];
    case 'LAST_MONTH':
      return [isoDate(new Date(now.getFullYear(), now.getMonth() - 1, 1)), isoDate(new Date(now.getFullYear(), now.getMonth(), 0))];
    default:
      return [isoDate(d(29)), isoDate(now)];
  }
};
const compact = (v: number) => (v >= 1e9 ? `${(v / 1e9).toFixed(1)} tỷ` : v >= 1e6 ? `${(v / 1e6).toFixed(1)}tr` : v >= 1e3 ? `${Math.round(v / 1e3)}k` : String(Math.round(v)));
const pct = (a: number, b: number) => (b > 0 ? `${((a / b) * 100).toFixed(1)}%` : '—');

/** UC-ADM-21/22/23 – Bảng điều khiển, doanh thu nền tảng, xuất báo cáo */
export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [preset, setPreset] = useState<Preset>('30D');
  const [custom, setCustom] = useState<[string, string]>(rangeOf('30D'));
  const [from, to] = preset === 'CUSTOM' ? custom : rangeOf(preset);
  const [exporting, setExporting] = useState(false);

  const report = useQuery(() => adminApi.revenue(from, to), [from, to]);

  // Việc cần xử lý + quy mô người dùng (đếm qua totalCount, pageSize=1)
  const pendingApps = useQuery(() => adminApi.pendingApplications(1, 1), [], { refreshMs: 60_000 });
  const refundsRequested = useQuery(() => adminApi.refunds({ status: 'Requested', pageSize: 50 }), [], { refreshMs: 60_000 });
  const refundsApproved = useQuery(() => adminApi.refunds({ status: 'Approved', pageSize: 1 }), [], { refreshMs: 60_000 });
  const withdrawalsPending = useQuery(() => adminApi.withdrawals({ status: 'Pending', pageSize: 1 }), [], { refreshMs: 60_000 });
  const customers = useQuery(() => adminApi.users({ role: 'Customer', pageSize: 1 }), []);
  const drivers = useQuery(() => adminApi.users({ role: 'Driver', pageSize: 1 }), []);
  const dispatchers = useQuery(() => adminApi.users({ role: 'Dispatcher', pageSize: 1 }), []);
  const locked = useQuery(() => adminApi.users({ status: 'Locked', pageSize: 1 }), []);
  const coupons = useQuery(() => adminApi.coupons(1, 1, true), []);

  // Hoàn tiền chờ Admin duyệt: hoàn do huỷ (không cần đề xuất) hoặc đã có đề xuất của Dispatcher
  const refundsToApprove = (refundsRequested.data?.items ?? []).filter((r) => r.sourceType === 'Cancellation' || r.proposedAmount !== null).length;

  const exportXlsx = async () => {
    setExporting(true);
    try {
      await adminApi.exportRevenue(from, to);
      toast.success('Đã xuất báo cáo Excel.');
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setExporting(false);
    }
  };

  return (
    <PageShell
      title="Bảng điều khiển & doanh thu"
      subtitle={`Doanh thu nền tảng = tổng hoa hồng của đơn Hoàn thành • Kỳ từ ${from} đến ${to} (giờ Việt Nam)`}
      actions={
        <Button size="sm" variant="outline" onClick={exportXlsx} isLoading={exporting}>
          <Download className="w-4 h-4 mr-1" /> Xuất Excel
        </Button>
      }
      toolbar={
        <div className="flex flex-wrap items-center gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.key}
              onClick={() => setPreset(p.key)}
              className={cx('px-3 py-1.5 rounded-lg text-xs font-bold border', preset === p.key ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400')}
            >
              {p.label}
            </button>
          ))}
          {preset === 'CUSTOM' && (
            <>
              <input type="date" value={custom[0]} max={custom[1]} onChange={(e) => setCustom([e.target.value, custom[1]])} className="py-1.5 px-2 rounded-lg border border-slate-200 text-xs" />
              <span className="text-xs text-slate-400">đến</span>
              <input type="date" value={custom[1]} min={custom[0]} onChange={(e) => setCustom([custom[0], e.target.value])} className="py-1.5 px-2 rounded-lg border border-slate-200 text-xs" />
              <span className="text-[11px] text-slate-400">tối đa 366 ngày</span>
            </>
          )}
        </div>
      }
    >
      <div className="w-full space-y-5">
        {/* Việc cần xử lý */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <TodoTile icon={<ShieldCheck className="w-5 h-5" />} label="Hồ sơ tài xế chờ duyệt" value={pendingApps.data?.totalCount} onClick={() => navigate('/admin/drivers')} />
          <TodoTile icon={<Undo2 className="w-5 h-5" />} label="Hoàn tiền chờ duyệt" value={refundsToApprove} onClick={() => navigate('/admin/refunds')} />
          <TodoTile icon={<Banknote className="w-5 h-5" />} label="Hoàn tiền chờ chuyển khoản" value={refundsApproved.data?.totalCount} onClick={() => navigate('/admin/refunds?status=Approved')} />
          <TodoTile icon={<Wallet className="w-5 h-5" />} label="Yêu cầu rút tiền chờ xử lý" value={withdrawalsPending.data?.totalCount} onClick={() => navigate('/admin/withdrawals')} />
        </div>

        <DataState q={report}>{(r) => <ReportBody r={r} />}</DataState>

        {/* Quy mô nền tảng */}
        <Card title="Quy mô nền tảng">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <MiniStat icon={<Users className="w-4 h-4" />} label="Khách hàng" value={customers.data?.totalCount} onClick={() => navigate('/admin/users?role=Customer')} />
            <MiniStat icon={<Truck className="w-4 h-4" />} label="Tài xế" value={drivers.data?.totalCount} onClick={() => navigate('/admin/users?role=Driver')} />
            <MiniStat icon={<FileCheck2 className="w-4 h-4" />} label="Điều phối viên" value={dispatchers.data?.totalCount} onClick={() => navigate('/admin/users?role=Dispatcher')} />
            <MiniStat icon={<ShieldCheck className="w-4 h-4" />} label="Tài khoản bị khoá" value={locked.data?.totalCount} onClick={() => navigate('/admin/users?status=Locked')} />
            <MiniStat icon={<Ticket className="w-4 h-4" />} label="Coupon đang bật" value={coupons.data?.totalCount} onClick={() => navigate('/admin/coupons')} />
          </div>
        </Card>
      </div>
    </PageShell>
  );
};

const TodoTile: React.FC<{ icon: React.ReactNode; label: string; value?: number; onClick: () => void }> = ({ icon, label, value, onClick }) => (
  <button
    onClick={onClick}
    className={cx(
      'text-left rounded-2xl border p-4 flex items-center gap-3 transition',
      value ? 'bg-amber-50 border-amber-200 hover:border-amber-400' : 'bg-white border-slate-200 hover:border-slate-400'
    )}
  >
    <div className={cx('w-10 h-10 rounded-xl flex items-center justify-center', value ? 'bg-amber-500 text-slate-950' : 'bg-slate-100 text-slate-500')}>{icon}</div>
    <div>
      <div className="text-2xl font-black text-slate-900">{value ?? '…'}</div>
      <div className="text-[11px] font-bold text-slate-600">{label}</div>
    </div>
  </button>
);
const MiniStat: React.FC<{ icon: React.ReactNode; label: string; value?: number; onClick: () => void }> = ({ icon, label, value, onClick }) => (
  <button onClick={onClick} className="text-left rounded-xl border border-slate-200 p-3 hover:border-slate-400">
    <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-bold">
      {icon} {label}
    </div>
    <div className="text-xl font-black text-slate-900 mt-1">{value ?? '…'}</div>
  </button>
);

const ReportBody: React.FC<{ r: RevenueReportResponse }> = ({ r }) => {
  const [metric, setMetric] = useState<'revenue' | 'orders' | 'gmv'>('revenue');
  const gmv = r.totalDeliveryFees + r.totalLoadingFees - r.totalDiscountAmount;
  const avg = r.totalCompletedOrders ? gmv / r.totalCompletedOrders : 0;

  const daily = useMemo(
    () =>
      r.dailyStats.map((d) => {
        const dd = new Date(d.date);
        const label = `${String(dd.getDate()).padStart(2, '0')}/${String(dd.getMonth() + 1).padStart(2, '0')}`;
        const value = metric === 'revenue' ? d.revenue : metric === 'orders' ? d.completedOrders : d.totalDeliveryFees + d.loadingFees - d.discountAmount;
        return {
          label,
          value,
          tip: (
            <>
              Hoa hồng {formatCurrency(d.revenue)} • {d.completedOrders} chuyến
              <br />
              Cước {formatCurrency(d.totalDeliveryFees + d.loadingFees - d.discountAmount)} • Tài xế nhận {formatCurrency(d.driverEarnings)}
            </>
          ),
        };
      }),
    [r, metric]
  );

  const byVehicle = useMemo(() => groupSum(r.orders, (o) => o.vehicleTypeName, (o) => o.totalFee), [r]);
  const byPayment = useMemo(() => groupSum(r.orders, (o) => (o.paymentMethod === 'PayOS' ? 'PayOS' : 'Tiền mặt'), (o) => o.totalFee), [r]);
  const topDrivers = useMemo(() => {
    const m = new Map<string, { trips: number; earn: number; plate: string | null }>();
    for (const o of r.orders) {
      const k = o.driverName ?? '—';
      const v = m.get(k) ?? { trips: 0, earn: 0, plate: o.licensePlate };
      v.trips += 1;
      v.earn += o.driverEarning;
      m.set(k, v);
    }
    return [...m.entries()].sort((a, b) => b[1].trips - a[1].trips).slice(0, 6);
  }, [r]);

  const fmt = metric === 'orders' ? (v: number) => String(Math.round(v)) : compact;

  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Doanh thu nền tảng (hoa hồng)" value={formatCurrency(r.totalRevenue)} hint={`Tỷ lệ thu ${pct(r.totalRevenue, gmv)} trên cước`} icon={<TrendingUp className="w-5 h-5" />} />
        <StatCard label="Chuyến hoàn thành" value={r.totalCompletedOrders.toLocaleString('vi-VN')} hint={`TB ${formatCurrency(avg)}/chuyến`} icon={<CheckCircle2 className="w-5 h-5" />} accent="bg-emerald-50 text-emerald-600" />
        <StatCard label="Tổng cước thực thu (GMV)" value={formatCurrency(gmv)} hint="Cước + bốc xếp − giảm giá" icon={<CircleDollarSign className="w-5 h-5" />} accent="bg-sky-50 text-sky-600" />
        <StatCard label="Thu nhập trả tài xế" value={formatCurrency(r.totalDriverEarnings)} hint="Cước sau giảm − hoa hồng" icon={<Wallet className="w-5 h-5" />} accent="bg-indigo-50 text-indigo-600" />
        <StatCard label="Cước quãng đường" value={formatCurrency(r.totalDeliveryFees)} icon={<Truck className="w-5 h-5" />} accent="bg-slate-100 text-slate-600" />
        <StatCard label="Phí bốc xếp" value={formatCurrency(r.totalLoadingFees)} icon={<Package className="w-5 h-5" />} accent="bg-slate-100 text-slate-600" />
        <StatCard label="Giảm giá coupon (tài xế chịu)" value={formatCurrency(r.totalDiscountAmount)} hint="M1: hoa hồng tính trên cước sau giảm" icon={<BadgePercent className="w-5 h-5" />} accent="bg-rose-50 text-rose-600" />
        <StatCard label="Đơn PayOS / tiền mặt" value={`${r.orders.filter((o) => o.paymentMethod === 'PayOS').length} / ${r.orders.filter((o) => o.paymentMethod === 'Cash').length}`} icon={<Receipt className="w-5 h-5" />} accent="bg-amber-50 text-amber-600" />
      </div>

      <Card
        title="Diễn biến theo ngày"
        actions={
          <div className="flex gap-1">
            {(
              [
                ['revenue', 'Doanh thu nền tảng'],
                ['gmv', 'Tổng cước'],
                ['orders', 'Số chuyến'],
              ] as const
            ).map(([k, l]) => (
              <button key={k} onClick={() => setMetric(k)} className={cx('px-2.5 py-1 rounded-lg text-[11px] font-bold border', metric === k ? 'bg-blue-600 text-white border-blue-600' : 'border-slate-200 text-slate-600')}>
                {l}
              </button>
            ))}
          </div>
        }
      >
        <ColumnChart data={daily} height={220} format={fmt} />
      </Card>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card title="Tổng cước theo loại xe">
          <BarList data={byVehicle.map(([label, v]) => ({ label, value: v.sum, tip: `${v.count} chuyến` }))} format={(v) => formatCurrency(v)} />
        </Card>
        <Card title="Tổng cước theo hình thức thanh toán">
          <BarList data={byPayment.map(([label, v]) => ({ label, value: v.sum, tip: `${v.count} chuyến • ${pct(v.sum, gmv)}` }))} format={(v) => formatCurrency(v)} />
        </Card>
        <Card title="Tài xế nhiều chuyến nhất">
          <BarList data={topDrivers.map(([name, v]) => ({ label: `${name}${v.plate ? ` (${v.plate})` : ''}`, value: v.trips, tip: `Thu nhập ${formatCurrency(v.earn)}` }))} format={(v) => `${v} chuyến`} />
        </Card>
      </div>

      <Card title={`Đơn hoàn thành trong kỳ (${r.orders.length})`}>
        {r.orders.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-6">Chưa có đơn hoàn thành trong kỳ.</p>
        ) : (
          <Table
            rows={[...r.orders].sort((a, b) => b.completedAt.localeCompare(a.completedAt)).slice(0, 50)}
            rowKey={(o) => o.orderId}
            cols={[
              { head: 'Đơn', cell: (o) => <b>{o.orderCode}</b> },
              { head: 'Hoàn thành', cell: (o) => formatDateTime(o.completedAt) },
              { head: 'Khách', cell: (o) => o.customerName },
              { head: 'Tài xế', cell: (o) => (o.driverName ? `${o.driverName} • ${o.licensePlate ?? ''}` : '—') },
              { head: 'Xe', cell: (o) => o.vehicleTypeName },
              { head: 'TT', cell: (o) => (o.paymentMethod === 'PayOS' ? 'PayOS' : 'Tiền mặt') },
              { head: 'Tổng cước', className: 'text-right', cell: (o) => formatCurrency(o.totalFee) },
              { head: 'Hoa hồng', className: 'text-right', cell: (o) => <b>{formatCurrency(o.commissionAmount)}</b> },
              { head: 'Tài xế nhận', className: 'text-right', cell: (o) => formatCurrency(o.driverEarning) },
            ]}
          />
        )}
        {r.orders.length > 50 && <p className="text-[11px] text-slate-400 mt-2">Hiển thị 50 đơn mới nhất – xuất Excel để xem đầy đủ.</p>}
      </Card>
    </>
  );
};

function groupSum<T>(rows: T[], key: (r: T) => string, val: (r: T) => number) {
  const m = new Map<string, { sum: number; count: number }>();
  for (const r of rows) {
    const k = key(r);
    const v = m.get(k) ?? { sum: 0, count: 0 };
    v.sum += val(r);
    v.count += 1;
    m.set(k, v);
  }
  return [...m.entries()].sort((a, b) => b[1].sum - a[1].sum);
}
