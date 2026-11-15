import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, MapPin, Plus, RotateCcw } from 'lucide-react';
import { Button } from '../../components/Button';
import { customerApi } from '../../api/endpoints';
import { useQuery } from '../../api/useQuery';
import { ORDER_STATUS, PAYMENT_STATUS } from '../../api/labels';
import type { OrderStatus, OrderView } from '../../api/types';
import { DataState, PageShell, Pager, Pill, SearchBox, Select, StatusPill, Tabs, isAwaitingPayment } from '../../components/ui/kit';
import { formatCurrency, formatDateTime } from '../../utils/format';
import { PhoneLink } from '../../components/ui/PhoneLink';
import { useNotificationRefresh } from '../../hooks/useRealtime';

const VIEWS: { key: OrderView; label: string }[] = [
  { key: 'All', label: 'Tất cả' },
  { key: 'Active', label: 'Đang thực hiện' },
  { key: 'Completed', label: 'Hoàn thành' },
  { key: 'Cancelled', label: 'Đã huỷ' },
  { key: 'History', label: 'Lịch sử (xong + huỷ)' },
];
const STATUS_OPTS = [{ value: '', label: 'Mọi trạng thái' }, ...(Object.keys(ORDER_STATUS) as OrderStatus[]).map((s) => ({ value: s, label: ORDER_STATUS[s].label }))];
const PAGE_SIZE = 10;

/** UC-CUS-08/09/20 – Danh sách & tìm kiếm đơn: GET /customer/Orders (lọc ở server) */
export const OrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const [view, setView] = useState<OrderView>('All');
  const [status, setStatus] = useState<OrderStatus | ''>('');
  const [search, setSearch] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [receiverPhone, setReceiverPhone] = useState('');
  const [page, setPage] = useState(1);

  const filters = { view, status: status || undefined, search: search.trim(), fromDate, toDate, receiverPhone: receiverPhone.replace(/\D/g, '') };
  const q = useQuery(() => customerApi.orders({ ...filters, page, pageSize: PAGE_SIZE }), [JSON.stringify(filters), page]);
  // Ở danh sách khách chỉ nhận NotificationReceived (OrderStatusChanged chỉ tới đơn đang theo dõi): làm mới khi có thông báo
  useNotificationRefresh(() => void q.reload());
  const set = <V,>(fn: (v: V) => void) => (v: V) => {
    fn(v);
    setPage(1);
  };
  const resetFilters = () => {
    setStatus('');
    setSearch('');
    setFromDate('');
    setToDate('');
    setReceiverPhone('');
    setPage(1);
  };

  return (
    <PageShell
      title="Đơn hàng của tôi"
      subtitle="Theo dõi, thanh toán, xác nhận nhận hàng, khiếu nại và đánh giá"
      actions={
        <Button size="sm" onClick={() => navigate('/booking')}>
          <Plus className="w-4 h-4 mr-1" /> Đặt đơn mới
        </Button>
      }
      toolbar={
        <div className="w-full space-y-2">
          <Tabs value={view} onChange={set(setView)} items={VIEWS} />
          <div className="flex flex-wrap gap-2 items-center">
            <SearchBox value={search} onChange={set(setSearch)} placeholder="Mã đơn, địa chỉ, tên người nhận…" />
            <Select value={status} onChange={(e) => set(setStatus)(e.target.value as OrderStatus | '')} options={STATUS_OPTS} aria-label="Trạng thái" />
            <input type="date" value={fromDate} onChange={(e) => set(setFromDate)(e.target.value)} className="py-2 px-3 rounded-xl border border-slate-200 text-sm" aria-label="Từ ngày" />
            <span className="text-xs text-slate-400">đến</span>
            <input type="date" value={toDate} onChange={(e) => set(setToDate)(e.target.value)} className="py-2 px-3 rounded-xl border border-slate-200 text-sm" aria-label="Đến ngày" />
            <input
              value={receiverPhone}
              onChange={(e) => set(setReceiverPhone)(e.target.value)}
              placeholder="Số điện thoại người nhận"
              inputMode="numeric"
              className="py-2 px-3 rounded-xl border border-slate-200 text-sm w-40"
            />
            <Button variant="ghost" size="sm" onClick={resetFilters}>
              <RotateCcw className="w-3.5 h-3.5 mr-1" /> Xoá lọc
            </Button>
          </div>
        </div>
      }
    >
      <div className="w-full">
        <DataState q={q} empty={(d) => d.items.length === 0}>
          {(d) => (
            <>
              <ul className="space-y-3">
                {d.items.map((o) => (
                  <li key={o.id}>
                    <div
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => e.key === 'Enter' && navigate(`/orders/${o.id}`)}
                      onClick={() => navigate(`/orders/${o.id}`)}
                      className="w-full text-left bg-white border border-slate-200 hover:border-slate-400 rounded-2xl p-4 transition flex gap-3 items-center"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-black text-sm text-slate-900">{o.orderCode}</span>
                          <StatusPill status={o.orderStatus} paymentMethod={o.paymentMethod} paymentStatus={o.paymentStatus} />
                          {o.paymentMethod === 'PayOS' && !isAwaitingPayment(o.orderStatus, o.paymentMethod, o.paymentStatus) && <Pill tone={PAYMENT_STATUS[o.paymentStatus]} />}
                          {o.paymentMethod === 'PayOS' && o.paymentStatus === 'Unpaid' && o.orderStatus === 'Pending' && (
                            <span className="text-[10px] font-bold text-rose-600">• Thanh toán để hệ thống bắt đầu tìm tài xế</span>
                          )}
                        </div>
                        <div className="mt-2 grid sm:grid-cols-2 gap-1 text-xs text-slate-600">
                          <span className="flex gap-1.5 min-w-0">
                            <MapPin className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                            <span className="truncate">{o.pickupAddress}</span>
                          </span>
                          <span className="flex gap-1.5 min-w-0">
                            <MapPin className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                            <span className="truncate">{o.dropoffAddress}</span>
                          </span>
                        </div>
                        <div className="mt-1.5 text-[11px] text-slate-400">
                          {formatDateTime(o.createdAt)} • {o.vehicleTypeName} • {o.paymentMethod === 'PayOS' ? 'PayOS' : 'Tiền mặt'} • Người nhận: {o.receiverName} (<PhoneLink phone={o.receiverPhone} />)
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-sm font-black text-slate-900">{formatCurrency(o.totalFee)}</div>
                        <ChevronRight className="w-4 h-4 text-slate-400 ml-auto mt-1" />
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
              <Pager page={d.pageNumber} pageSize={d.pageSize} total={d.totalCount} onChange={setPage} />
            </>
          )}
        </DataState>
      </div>
    </PageShell>
  );
};
