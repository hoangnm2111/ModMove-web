import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, MapPin, Search, X } from 'lucide-react';
import { Button } from '../../components/Button';
import { Banner, confirm, toast } from '../../components/ui/feedback';
import { OrderStatusBadge } from '../../components/ui/StatusBadge';
import { PayOsModal } from '../../features/payment/PayOsModal';
import { CancelOrderModal, ComplaintModal, RatingModal, ReplyInfoModal } from '../../features/orders/OrderActionModals';
import { ORDER_STATUS_CONFIG, REFUND_SOURCE_LABEL, REFUND_STATUS_LABEL } from '../../constants';
import { msg } from '../../constants/messages';
import { canComplain, canCustomerCancel, ratingRestriction } from '../../domain/orderRules';
import { useCustomerOrders, useRefunds } from '../../hooks/useDomainData';
import { orderService } from '../../services/order.service';
import { caseService } from '../../services/case.service';
import { errorMessage } from '../../services/mock/storage';
import { useAuthStore } from '../../store/useAuthStore';
import { useBookingDraftStore } from '../../store/useBookingDraftStore';
import { OrderStatus, ShippingOrder } from '../../types/order.types';
import { Refund } from '../../types/case.types';
import { downloadCsv, formatCurrency, formatDateTime } from '../../utils/format';

type TabKey = 'ALL' | OrderStatus;
const TABS: TabKey[] = ['ALL', 'Pending', 'Accepted', 'Arrived', 'PickedUp', 'InTransit', 'Delivered', 'Completed', 'Cancelled'];
const TIME_RANGES = [
  { key: 'ALL', label: 'Mọi thời gian', days: Infinity },
  { key: '7D', label: '7 ngày', days: 7 },
  { key: '30D', label: '30 ngày', days: 30 },
] as const;

type ModalState =
  | { kind: 'cancel' | 'complaint' | 'rating' | 'pay'; order: ShippingOrder }
  | { kind: 'reply'; refund: Refund }
  | null;

/** SCR-18 – Lịch sử đơn (UC-CUS-08/09/10/20) + các thao tác theo trạng thái */
export const OrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const orders = useCustomerOrders(user?.id);
  const refunds = useRefunds();
  const { reset, update } = useBookingDraftStore();

  const [tab, setTab] = useState<TabKey>('ALL');
  const [query, setQuery] = useState('');
  const [range, setRange] = useState<(typeof TIME_RANGES)[number]['key']>('ALL');
  const [detailCode, setDetailCode] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalState>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const days = TIME_RANGES.find((r) => r.key === range)!.days;
    return orders.filter((o) => {
      if (tab !== 'ALL' && o.status !== tab) return false;
      if (days !== Infinity && Date.now() - new Date(o.createdAt).getTime() > days * 86_400_000) return false;
      if (!q) return true;
      return [o.code, o.pickup.address, o.dropoff.address, o.cargo.description].some((s) => s.toLowerCase().includes(q));
    });
  }, [orders, tab, query, range]);

  const detail = orders.find((o) => o.code === detailCode) ?? null;
  const detailRefunds = detail ? refunds.filter((r) => r.orderId === detail.id) : [];

  /** GB-34: không sửa đơn đã gửi → tạo đơn mới từ thông tin cũ */
  const handleReorder = (o: ShippingOrder) => {
    reset();
    update({ pickup: o.pickup, dropoff: o.dropoff, cargo: { ...o.cargo }, vehicleTypeId: o.vehicle.id, loadingService: o.loadingService });
    navigate('/booking');
  };

  const handleConfirmReceipt = async (o: ShippingOrder) => {
    if (!(await confirm({ title: 'Xác nhận đã nhận hàng', message: msg('MSG68', { order_id: o.code }) }))) return;
    try {
      await orderService.confirmReceipt(o.id);
      toast.success(msg('MSG45', { order_id: o.code }));
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  const handleWithdraw = async (r: Refund) => {
    try {
      await caseService.withdrawComplaint(r.id);
      toast.success(msg('MSG04', { record_name: 'trạng thái khiếu nại' }));
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  const exportCsv = () =>
    downloadCsv(
      `modmove-don-hang-${new Date().toISOString().slice(0, 10)}.csv`,
      ['Mã đơn', 'Loại xe', 'Điểm lấy', 'Điểm giao', 'Thời gian tạo', 'Tổng cước', 'Thanh toán', 'Trạng thái'],
      filtered.map((o) => [o.code, o.vehicle.name, o.pickup.address, o.dropoff.address, formatDateTime(o.createdAt), o.fare.total, o.paymentMethod, ORDER_STATUS_CONFIG[o.status].label])
    );

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 overflow-hidden min-w-0">
      <header className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3 flex flex-wrap items-center gap-3 flex-shrink-0">
        <h1 className="text-base font-extrabold text-slate-900 mr-auto">Lịch sử đơn hàng</h1>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm mã đơn, địa chỉ, hàng hoá…"
            aria-label="Tìm kiếm đơn"
            className="pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-sm w-64 max-w-full"
          />
        </div>
        <select value={range} onChange={(e) => setRange(e.target.value as typeof range)} aria-label="Khoảng thời gian" className="py-2 px-3 rounded-xl border border-slate-200 text-sm">
          {TIME_RANGES.map((r) => (
            <option key={r.key} value={r.key}>
              {r.label}
            </option>
          ))}
        </select>
        <Button variant="outline" size="sm" onClick={exportCsv} disabled={filtered.length === 0}>
          <Download className="w-4 h-4 mr-1.5" /> Xuất CSV
        </Button>
      </header>

      <div className="bg-white border-b border-slate-200 px-4 sm:px-6 flex gap-1 overflow-x-auto flex-shrink-0" role="tablist">
        {TABS.map((t) => {
          const count = t === 'ALL' ? orders.length : orders.filter((o) => o.status === t).length;
          return (
            <button
              key={t}
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={`px-3 py-2.5 text-xs font-bold whitespace-nowrap border-b-2 transition ${tab === t ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
            >
              {t === 'ALL' ? 'Tất cả' : ORDER_STATUS_CONFIG[t].label} ({count})
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        {filtered.length === 0 ? (
          <div className="text-center text-sm text-slate-500 py-16">
            Không có đơn hàng phù hợp.{' '}
            <button className="text-blue-600 font-bold" onClick={() => navigate('/booking')}>
              Đặt xe ngay
            </button>
          </div>
        ) : (
          <ul className="space-y-3 max-w-5xl mx-auto">
            {filtered.map((o) => (
              <li key={o.id}>
                <button type="button" onClick={() => setDetailCode(o.code)} className="w-full text-left bg-white border border-slate-200 hover:border-slate-400 rounded-2xl p-4 transition">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-black text-sm text-slate-900">{o.code}</span>
                    <OrderStatusBadge status={o.status} />
                    {o.paymentMethod === 'PayOS' && o.paymentStatus === 'Unpaid' && o.status === 'Pending' && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">Chưa thanh toán</span>
                    )}
                    <span className="ml-auto text-sm font-black text-slate-900">{formatCurrency(o.fare.total)}</span>
                  </div>
                  <div className="mt-2 grid sm:grid-cols-2 gap-1 text-xs text-slate-600">
                    <span className="flex gap-1.5 truncate">
                      <MapPin className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                      {o.pickup.address}
                    </span>
                    <span className="flex gap-1.5 truncate">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                      {o.dropoff.address}
                    </span>
                  </div>
                  <div className="mt-1.5 text-[11px] text-slate-400">
                    {formatDateTime(o.createdAt)} • {o.vehicle.name} • {o.paymentMethod === 'PayOS' ? 'PayOS' : 'Tiền mặt'}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {detail && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40" onClick={() => setDetailCode(null)}>
          <aside className="w-full max-w-md h-full bg-white shadow-2xl overflow-y-auto" onClick={(e) => e.stopPropagation()} aria-label="Chi tiết đơn">
            <div className="sticky top-0 bg-white border-b border-slate-100 px-5 py-4 flex items-center gap-2">
              <h2 className="font-black text-slate-900">{detail.code}</h2>
              <OrderStatusBadge status={detail.status} />
              <button type="button" className="ml-auto p-1.5 rounded-lg hover:bg-slate-100" onClick={() => setDetailCode(null)} aria-label="Đóng">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4 text-sm">
              <OrderActions
                order={detail}
                onTrack={() => navigate(`/tracking?order=${detail.code}`)}
                onPay={() => setModal({ kind: 'pay', order: detail })}
                onCancel={() => setModal({ kind: 'cancel', order: detail })}
                onConfirm={() => handleConfirmReceipt(detail)}
                onComplain={() => setModal({ kind: 'complaint', order: detail })}
                onRate={() => setModal({ kind: 'rating', order: detail })}
                onReorder={() => handleReorder(detail)}
              />

              <section className="space-y-1 text-xs">
                <h3 className="font-extrabold text-slate-900 text-sm">Lộ trình</h3>
                <p>
                  <b>Lấy:</b> {detail.pickup.address} – {detail.pickup.contactName} ({detail.pickup.contactPhone})
                </p>
                <p>
                  <b>Giao:</b> {detail.dropoff.address} – {detail.dropoff.contactName} ({detail.dropoff.contactPhone})
                </p>
              </section>

              <section className="space-y-1 text-xs">
                <h3 className="font-extrabold text-slate-900 text-sm">Hàng hoá & xe</h3>
                <p>{detail.cargo.description}</p>
                <p>
                  {detail.cargo.quantity} kiện • {detail.cargo.weightKg} kg • {detail.vehicle.name}
                </p>
                {detail.cargo.photos.length > 0 && (
                  <div className="flex gap-2 pt-1">
                    {detail.cargo.photos.map((p, i) => (
                      <img key={i} src={p} alt="" className="w-14 h-14 rounded-lg object-cover border" />
                    ))}
                  </div>
                )}
              </section>

              <section className="text-xs space-y-1">
                <h3 className="font-extrabold text-slate-900 text-sm">Cước phí</h3>
                <div className="flex justify-between">
                  <span>Cước quãng đường ({detail.fare.distanceKm} km)</span>
                  <b>{formatCurrency(detail.fare.distanceFare)}</b>
                </div>
                {detail.fare.loadingFee > 0 && (
                  <div className="flex justify-between">
                    <span>Bốc xếp</span>
                    <b>{formatCurrency(detail.fare.loadingFee)}</b>
                  </div>
                )}
                {detail.fare.discount > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Giảm giá {detail.couponCode}</span>
                    <b>-{formatCurrency(detail.fare.discount)}</b>
                  </div>
                )}
                <div className="flex justify-between pt-1 border-t">
                  <span className="font-bold">Tổng</span>
                  <b className="text-base">{formatCurrency(detail.fare.total)}</b>
                </div>
                <p className="text-slate-500">
                  {detail.paymentMethod === 'PayOS' ? 'PayOS' : `Tiền mặt – ${detail.payerRole === 'Receiver' ? 'người nhận trả' : 'người gửi trả'}`} •{' '}
                  {detail.paymentStatus === 'Paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                </p>
              </section>

              {detail.assignedDriver && (
                <section className="text-xs">
                  <h3 className="font-extrabold text-slate-900 text-sm mb-1">Tài xế</h3>
                  <p>
                    {detail.assignedDriver.name} • {detail.assignedDriver.licensePlate} • ★ {detail.assignedDriver.rating}
                  </p>
                </section>
              )}

              {detail.rating && (
                <section className="text-xs">
                  <h3 className="font-extrabold text-slate-900 text-sm mb-1">Đánh giá của bạn (UC-CUS-26)</h3>
                  <p>
                    {'★'.repeat(detail.rating.stars)} {detail.rating.tags.join(', ')}
                  </p>
                  {detail.rating.comment && <p className="text-slate-500">“{detail.rating.comment}”</p>}
                </section>
              )}

              {detailRefunds.length > 0 && (
                <section className="text-xs space-y-2">
                  <h3 className="font-extrabold text-slate-900 text-sm">Khiếu nại / Hoàn tiền (UC-CUS-23)</h3>
                  {detailRefunds.map((r) => (
                    <div key={r.id} className="border border-slate-200 rounded-xl p-3 space-y-1">
                      <div className="flex justify-between">
                        <b>
                          {REFUND_SOURCE_LABEL[r.source]} • {r.id}
                        </b>
                        <span className="font-bold">{REFUND_STATUS_LABEL[r.status]}</span>
                      </div>
                      <p className="text-slate-600">{r.reason}</p>
                      <p>
                        Yêu cầu: {formatCurrency(r.requestedAmount)}
                        {r.approvedAmount !== undefined && ` • Đã duyệt: ${formatCurrency(r.approvedAmount)}`}
                      </p>
                      {r.proposalNote && <p className="text-slate-500">Ghi chú: {r.proposalNote}</p>}
                      <div className="flex gap-2 pt-1">
                        {r.status === 'InfoRequested' && (
                          <Button size="sm" onClick={() => setModal({ kind: 'reply', refund: r })}>
                            Bổ sung thông tin
                          </Button>
                        )}
                        {r.source === 'Complaint' && (r.status === 'Requested' || r.status === 'InfoRequested') && (
                          <Button size="sm" variant="outline" onClick={() => handleWithdraw(r)}>
                            Rút khiếu nại
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </section>
              )}

              {detail.cancellationReason && <Banner kind="warning">Lý do huỷ: {detail.cancellationReason}</Banner>}

              <section className="text-xs">
                <h3 className="font-extrabold text-slate-900 text-sm mb-1">Lịch sử trạng thái</h3>
                <ol className="space-y-1 border-l-2 border-slate-200 pl-3">
                  {detail.history.map((h, i) => (
                    <li key={i}>
                      <b>{ORDER_STATUS_CONFIG[h.to].label}</b> <span className="text-slate-400">• {formatDateTime(h.changedAt)} • {h.changedBy}</span>
                      {h.note && <span className="block text-slate-500">{h.note}</span>}
                    </li>
                  ))}
                </ol>
              </section>
            </div>
          </aside>
        </div>
      )}

      {modal?.kind === 'cancel' && user && <CancelOrderModal order={modal.order} customerId={user.id} onClose={() => setModal(null)} />}
      {modal?.kind === 'complaint' && <ComplaintModal order={modal.order} onClose={() => setModal(null)} />}
      {modal?.kind === 'rating' && <RatingModal order={modal.order} onClose={() => setModal(null)} />}
      {modal?.kind === 'reply' && <ReplyInfoModal refund={modal.refund} onClose={() => setModal(null)} />}
      {modal?.kind === 'pay' && (
        <PayOsModal
          open
          amount={modal.order.fare.total}
          reference={`MODMOVE ${modal.order.code}`}
          onPaid={async () => {
            const paid = await orderService.confirmPayment(modal.order.id);
            toast.success(msg('MSG48', { amount: formatCurrency(paid.fare.total), order_id: paid.code }));
            setModal(null);
          }}
          onClose={() => {
            toast.warning(msg('MSG51'));
            setModal(null);
          }}
        />
      )}
    </div>
  );
};

/** Các nút thao tác hiển thị theo trạng thái đơn và Business Rule */
const OrderActions: React.FC<{
  order: ShippingOrder;
  onTrack: () => void;
  onPay: () => void;
  onCancel: () => void;
  onConfirm: () => void;
  onComplain: () => void;
  onRate: () => void;
  onReorder: () => void;
}> = ({ order, onTrack, onPay, onCancel, onConfirm, onComplain, onRate, onReorder }) => {
  const needsPayment = order.status === 'Pending' && order.paymentMethod === 'PayOS' && order.paymentStatus === 'Unpaid';
  const ratingBlock = ratingRestriction(order);
  return (
    <div className="flex flex-wrap gap-2">
      {needsPayment && (
        <Button size="sm" onClick={onPay}>
          Thanh toán ngay
        </Button>
      )}
      {!['Completed', 'Cancelled'].includes(order.status) && (
        <Button size="sm" variant="secondary" onClick={onTrack}>
          Theo dõi đơn
        </Button>
      )}
      {order.status === 'Delivered' && (
        <Button size="sm" onClick={onConfirm}>
          Xác nhận đã nhận hàng
        </Button>
      )}
      {canComplain(order) && (
        <Button size="sm" variant="outline" onClick={onComplain}>
          Khiếu nại
        </Button>
      )}
      {order.status === 'Completed' && !ratingBlock && (
        <Button size="sm" variant="outline" onClick={onRate}>
          Đánh giá
        </Button>
      )}
      {canCustomerCancel(order) && (
        <Button size="sm" variant="danger" onClick={onCancel}>
          Huỷ đơn
        </Button>
      )}
      <Button size="sm" variant="ghost" onClick={onReorder} title="Đơn đã gửi không sửa được (GB-34); tạo đơn mới từ thông tin này">
        Đặt lại đơn tương tự
      </Button>
    </div>
  );
};
