import React, { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AlertTriangle, Check, Clock, Phone, Truck } from 'lucide-react';
import { Button } from '../../components/Button';
import { Banner, confirm, toast } from '../../components/ui/feedback';
import { Modal } from '../../components/ui/Modal';
import { TextArea } from '../../components/ui/Field';
import { OrderStatusBadge } from '../../components/ui/StatusBadge';
import { RouteMap } from '../../components/RouteMap';
import { CancelOrderModal, ComplaintModal, IncidentReportModal, RatingModal } from '../../features/orders/OrderActionModals';
import { PayOsModal } from '../../features/payment/PayOsModal';
import { BUSINESS } from '../../config/business';
import { ORDER_STATUS_CONFIG } from '../../constants';
import { msg } from '../../constants/messages';
import { canComplain, canCustomerCancel, canReportIncident, canReviewPickupEvidence, ORDER_FLOW, ratingRestriction } from '../../domain/orderRules';
import { useCountdown } from '../../hooks/useLiveData';
import { useCustomerOrders } from '../../hooks/useDomainData';
import { orderService } from '../../services/order.service';
import { errorMessage } from '../../services/mock/storage';
import { useAuthStore } from '../../store/useAuthStore';
import { ShippingOrder } from '../../types/order.types';
import { formatCurrency, formatDateTime, timeAgo } from '../../utils/format';

/** Vị trí xe trên bản đồ mô phỏng theo trạng thái */
const mapState = (o: ShippingOrder): { progress: number | null; phase: 'toPickup' | 'toDropoff' } => {
  switch (o.status) {
    case 'Accepted':
      return { progress: 0.5, phase: 'toPickup' };
    case 'Arrived':
    case 'PickedUp':
      return { progress: 1, phase: 'toPickup' };
    case 'InTransit':
      return { progress: 0.55, phase: 'toDropoff' };
    case 'Delivered':
    case 'Completed':
      return { progress: 1, phase: 'toDropoff' };
    default:
      return { progress: null, phase: 'toPickup' };
  }
};

type ModalKind = 'cancel' | 'incident' | 'complaint' | 'rating' | 'reject' | 'pay' | null;

/** SCR-11 → SCR-15: Chờ ghép tài xế, duyệt ảnh kiểm hàng, theo dõi, nhận hàng */
export const LiveTrackingPage: React.FC = () => {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const { user } = useAuthStore();
  const orders = useCustomerOrders(user?.id);
  const active = useMemo(() => orders.filter((o) => !['Completed', 'Cancelled'].includes(o.status)), [orders]);

  const code = params.get('order');
  const order = orders.find((o) => o.code === code) ?? active[0];
  const [modal, setModal] = useState<ModalKind>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [busy, setBusy] = useState(false);

  // SCR-11: đếm ngược thời gian ghép tài xế (GB-24)
  const matchingStart = order && (order.paymentMethod === 'PayOS' ? order.paidAt : order.createdAt);
  const matchingLeft = useCountdown(order?.status === 'Pending' && matchingStart ? new Date(matchingStart).getTime() + BUSINESS.MATCHING_TIMEOUT_MIN * 60_000 : null);

  if (!order) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 text-sm text-slate-500 p-6">
        <Truck className="w-10 h-10 text-slate-300" />
        Bạn chưa có đơn nào đang vận chuyển.
        <Button size="sm" onClick={() => navigate('/booking')}>
          Đặt xe ngay
        </Button>
      </div>
    );
  }

  const run = async (fn: () => Promise<unknown>, success: string) => {
    setBusy(true);
    try {
      await fn();
      toast.success(success);
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const approveEvidence = () => run(() => orderService.approvePickupEvidence(order.id), msg('MSG34', { order_id: order.code, status: ORDER_STATUS_CONFIG.InTransit.label }));

  const rejectEvidence = async () => {
    await run(() => orderService.rejectPickupEvidence(order.id, rejectReason), 'Đã gửi yêu cầu chụp lại ảnh cho tài xế.');
    setModal(null);
    setRejectReason('');
  };

  const confirmReceipt = async () => {
    if (!(await confirm({ title: 'Xác nhận đã nhận hàng', message: msg('MSG68', { order_id: order.code }) }))) return;
    await run(() => orderService.confirmReceipt(order.id), msg('MSG45', { order_id: order.code }));
  };

  const currentIdx = ORDER_FLOW.indexOf(order.status);
  const driver = order.assignedDriver;
  const locationAge = driver ? (Date.now() - new Date(driver.lastLocationAt).getTime()) / 1000 : 0;
  const { progress, phase } = mapState(order);
  const needsPayment = order.status === 'Pending' && order.paymentMethod === 'PayOS' && order.paymentStatus === 'Unpaid';

  return (
    <div className="flex-1 flex flex-col lg:flex-row h-full overflow-hidden min-w-0">
      <section className="flex-1 min-h-[260px] relative">
        <RouteMap progress={progress} phase={phase} />
        {active.length > 1 && (
          <select
            value={order.code}
            onChange={(e) => setParams({ order: e.target.value })}
            aria-label="Chọn đơn"
            className="absolute top-3 left-3 py-2 px-3 rounded-xl border border-slate-200 bg-white text-sm font-bold shadow"
          >
            {active.map((o) => (
              <option key={o.id} value={o.code}>
                {o.code} – {ORDER_STATUS_CONFIG[o.status].label}
              </option>
            ))}
          </select>
        )}
      </section>

      <aside className="w-full lg:w-[420px] bg-white border-l border-slate-200 overflow-y-auto p-5 space-y-4">
        <div className="flex items-center gap-2">
          <h1 className="font-black text-slate-900">{order.code}</h1>
          <OrderStatusBadge status={order.status} />
          <span className="ml-auto font-black">{formatCurrency(order.fare.total)}</span>
        </div>

        {/* Trạng thái theo từng giai đoạn */}
        {needsPayment && (
          <Banner kind="warning">
            Đơn chưa thanh toán nên chưa được gửi tới tài xế (GB-31).{' '}
            <button className="underline font-bold" onClick={() => setModal('pay')}>
              Thanh toán ngay
            </button>
          </Banner>
        )}

        {order.status === 'Pending' && !needsPayment && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-center space-y-1">
            <Clock className="w-6 h-6 mx-auto text-amber-600 animate-pulse" />
            <p className="font-extrabold text-amber-900">Đang tìm tài xế gần bạn…</p>
            <p className="text-xs text-amber-800">
              Còn {String(Math.floor(matchingLeft / 60)).padStart(2, '0')}:{String(matchingLeft % 60).padStart(2, '0')} – đơn tự huỷ nếu không có tài xế nhận (GB-24).
            </p>
          </div>
        )}

        {canReviewPickupEvidence(order) && order.proof && (
          <div className="rounded-2xl border border-purple-200 bg-purple-50 p-4 space-y-3">
            <p className="font-extrabold text-purple-900 text-sm">{msg('MSG41', { order_id: order.code })}</p>
            <div className="grid grid-cols-3 gap-2">
              {order.proof.pickupPhotos.map((p, i) => (
                <a key={i} href={p} target="_blank" rel="noreferrer">
                  <img src={p} alt={`Ảnh kiểm hàng ${i + 1}`} className="aspect-square w-full rounded-lg object-cover border" />
                </a>
              ))}
            </div>
            <p className="text-[11px] text-purple-800">Lần nộp {order.proof.pickupSubmissionCount}/{BUSINESS.MAX_PICKUP_SUBMISSIONS}. Xe chỉ khởi hành khi bạn duyệt (GB-26).</p>
            <div className="flex gap-2">
              <Button size="sm" onClick={approveEvidence} isLoading={busy}>
                <Check className="w-4 h-4 mr-1" /> Duyệt & cho xe chạy
              </Button>
              <Button size="sm" variant="outline" onClick={() => setModal('reject')}>
                Từ chối
              </Button>
            </div>
          </div>
        )}

        {order.status === 'PickedUp' && order.proof?.pickupStatus === 'Rejected' && (
          <Banner kind="info">Bạn đã từ chối ảnh kiểm hàng. Đang chờ tài xế chụp lại.</Banner>
        )}

        {order.status === 'Delivered' && (
          <div className="rounded-2xl border border-teal-200 bg-teal-50 p-4 space-y-3">
            <p className="font-extrabold text-teal-900 text-sm">Tài xế đã giao hàng lúc {formatDateTime(order.deliveredAt)}</p>
            {order.proof?.deliveryPhoto && <img src={order.proof.deliveryPhoto} alt="Ảnh giao hàng" className="w-full h-40 rounded-xl object-cover border" />}
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={confirmReceipt} isLoading={busy}>
                Xác nhận đã nhận hàng
              </Button>
              {canComplain(order) && (
                <Button size="sm" variant="outline" onClick={() => setModal('complaint')}>
                  Khiếu nại
                </Button>
              )}
            </div>
            <p className="text-[11px] text-teal-800">Đơn tự hoàn thành sau 24 giờ nếu bạn không xác nhận (GB-23).</p>
          </div>
        )}

        {order.status === 'Completed' && !ratingRestriction(order) && (
          <Button size="sm" onClick={() => setModal('rating')}>
            Đánh giá chuyến đi
          </Button>
        )}

        {/* Tài xế */}
        {driver && (
          <section className="rounded-2xl border border-slate-200 p-4 space-y-2">
            <div className="flex items-center gap-3">
              <img src={driver.avatar} alt="" className="w-11 h-11 rounded-full object-cover" />
              <div className="min-w-0">
                <p className="font-extrabold text-sm text-slate-900">{driver.name}</p>
                <p className="text-xs text-slate-500">
                  {driver.licensePlate} • ★ {driver.rating} • {order.vehicle.name}
                </p>
              </div>
              {/* SRS III.1.1.3: hiển thị số điện thoại tài xế (không có nút gọi/nhắn trong app) */}
              <span className="ml-auto flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-50 text-slate-800 text-xs font-bold select-text">
                <Phone className="w-3.5 h-3.5 text-slate-500" /> {driver.phone}
              </span>
            </div>
            {locationAge > BUSINESS.LOCATION_STALE_SECONDS ? (
              <Banner kind="warning">{msg('MSG43', { last_updated_time: timeAgo(driver.lastLocationAt) })}</Banner>
            ) : (
              <p className="text-[11px] text-slate-500">Vị trí cập nhật {timeAgo(driver.lastLocationAt)} • ETA ~{order.fare.durationMins} phút</p>
            )}
          </section>
        )}

        {/* Tiến trình (UC-CUS-14) */}
        <section>
          <h2 className="text-sm font-extrabold text-slate-900 mb-2">Tiến trình</h2>
          {order.status === 'Cancelled' ? (
            <Banner kind="warning">Đơn đã huỷ{order.cancellationReason ? `: ${order.cancellationReason}` : ''}.</Banner>
          ) : (
            <ol className="space-y-2">
              {ORDER_FLOW.map((s, i) => {
                const done = i < currentIdx;
                const current = i === currentIdx;
                const at = order.history.find((h) => h.to === s)?.changedAt;
                return (
                  <li key={s} className="flex items-center gap-2.5 text-xs">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${done ? 'bg-emerald-600 text-white' : current ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                      {done ? <Check className="w-3 h-3" /> : i + 1}
                    </span>
                    <span className={current ? 'font-extrabold text-slate-900' : done ? 'text-slate-700' : 'text-slate-400'}>{ORDER_STATUS_CONFIG[s].label}</span>
                    {at && <span className="ml-auto text-slate-400">{formatDateTime(at)}</span>}
                  </li>
                );
              })}
            </ol>
          )}
        </section>

        <section className="text-xs space-y-1 text-slate-600">
          <p>
            <b>Lấy:</b> {order.pickup.address}
          </p>
          <p>
            <b>Giao:</b> {order.dropoff.address} – {order.dropoff.contactName} ({order.dropoff.contactPhone})
          </p>
        </section>

        <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
          {canReportIncident(order) && (
            <Button size="sm" variant="outline" onClick={() => setModal('incident')}>
              <AlertTriangle className="w-4 h-4 mr-1" /> Báo sự cố
            </Button>
          )}
          {canCustomerCancel(order) && (
            <Button size="sm" variant="danger" onClick={() => setModal('cancel')}>
              Huỷ đơn
            </Button>
          )}
        </div>
      </aside>

      {modal === 'cancel' && user && <CancelOrderModal order={order} customerId={user.id} onClose={() => setModal(null)} />}
      {modal === 'incident' && <IncidentReportModal order={order} onClose={() => setModal(null)} />}
      {modal === 'complaint' && <ComplaintModal order={order} onClose={() => setModal(null)} />}
      {modal === 'rating' && <RatingModal order={order} onClose={() => setModal(null)} />}
      {modal === 'reject' && (
        <Modal
          open
          title="Từ chối ảnh kiểm hàng"
          size="sm"
          onClose={() => setModal(null)}
          footer={
            <Button size="sm" variant="danger" onClick={rejectEvidence} isLoading={busy} disabled={!rejectReason.trim()}>
              Gửi yêu cầu chụp lại
            </Button>
          }
        >
          <TextArea label="Lý do" required value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="VD: ảnh mờ, thiếu góc tủ bên trái…" />
        </Modal>
      )}
      {modal === 'pay' && (
        <PayOsModal
          open
          amount={order.fare.total}
          reference={`MODMOVE ${order.code}`}
          onPaid={async () => {
            const paid = await orderService.confirmPayment(order.id);
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
