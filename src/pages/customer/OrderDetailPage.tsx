import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  CreditCard,
  ExternalLink,
  MessageSquareWarning,
  Navigation,
  RefreshCw,
  Repeat,
  Star,
  Truck,
  User,
  XCircle,
} from 'lucide-react';
import { Button } from '../../components/Button';
import { Banner, confirm, toast } from '../../components/ui/feedback';
import { Card, ErrorBox, KV, Loading, PhotoGrid, Pill, SectionTitle, StatusPill, StatusTimeline, cx, isAwaitingPayment } from '../../components/ui/kit';
import { MapView } from '../../components/MapView';
import { customerApi } from '../../api/endpoints';
import { useQuery } from '../../api/useQuery';
import { INCIDENT_DECISION, INCIDENT_STATUS, INCIDENT_TYPE, ORDER_FLOW, ORDER_STATUS, PAYER_ROLE, PAYMENT_STATUS, PAYMENT_TX_STATUS, PROOF_STATUS, REFUND_SOURCE, REFUND_STATUS } from '../../api/labels';
import type { MyIncidentResponse, MyRefundDetailResponse, OrderDetailResponse } from '../../api/types';
import { PayoutAccountModal } from '../../features/customer/PayoutAccountForm';
import { CancelOrderModal, ComplaintModal, IncidentRefundModal, RatingModal, RejectPickupModal, ReplyInfoModal, ReportIncidentModal } from '../../features/customer/CustomerModals';
import { PayOsPaymentModal } from '../../features/payment/PayOsPaymentModal';
import { useBookingDraftStore } from '../../store/useBookingDraftStore';
import { errorMessage } from '../../services/mock/storage';
import { formatCurrency, formatDateTime, formatDistanceCeil, timeAgo } from '../../utils/format';
import { BUSINESS } from '../../config/business';
import { usePublicConfig } from '../../services/config.service';
import { PhoneLink } from '../../components/ui/PhoneLink';
import { useDriverLocations, useDropoffArrival, useOrderRealtime } from '../../hooks/useRealtime';

const H = 3_600_000;
const ACTIVE_TRACK = ['Accepted', 'Arrived', 'PickedUp', 'InTransit'];

type ModalState =
  | { kind: 'cancel' | 'rejectPickup' | 'complaint' | 'incident' | 'rate' | 'pay' }
  | { kind: 'incidentRefund'; incident: MyIncidentResponse }
  | { kind: 'reply'; refund: MyRefundDetailResponse }
  | { kind: 'payout'; refund: MyRefundDetailResponse }
  | null;

/** SCR chi tiết đơn của khách – GET /customer/Orders/{id} + tracking + sự cố + hoàn tiền + đánh giá */
export const OrderDetailPage: React.FC = () => {
  const { id } = useParams();
  const orderId = Number(id);
  const navigate = useNavigate();
  const [search, setSearch] = useSearchParams();
  // Vừa đặt đơn PayOS (?pay=1) → mở thanh toán ngay
  const [modal, setModal] = useState<ModalState>(() => (search.get('pay') === '1' ? { kind: 'pay' } : null));
  useEffect(() => {
    if (search.get('pay')) setSearch({}, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const order = useQuery(() => customerApi.order(orderId), [orderId], { refreshMs: 20_000 });
  const incidents = useQuery(() => customerApi.incidents(1, 50, orderId), [orderId]);
  const refunds = useQuery(() => customerApi.refunds(1, 50), [orderId]);
  const ratings = useQuery(() => customerApi.ratings(1, 50), [orderId]);
  const o = order.data;
  // Tài xế báo đã đến điểm giao (chỉ có ý nghĩa khi đơn còn đang giao)
  const dropoffArrival = useDropoffArrival(orderId);
  const arrivedAtDropoff = o?.orderStatus === 'InTransit' ? dropoffArrival : null;
  // Danh sách tóm tắt không có `incidentId`: tải chi tiết từng khoản hoàn của đơn để gộp vào đúng thẻ sự cố.
  const refundSummaries = (refunds.data?.items ?? []).filter((r) => r.orderId === orderId);
  const refundSignature = refundSummaries.map((r) => `${r.id}:${r.refundStatus}:${r.needsPayoutAccount}:${r.waitingForYourReply}`).join(',');
  const refundDetails = useQuery(() => Promise.all(refundSummaries.map((r) => customerApi.refund(r.id))), [refundSignature], { enabled: refunds.data !== undefined });
  const tracking = useQuery(() => customerApi.tracking(orderId), [orderId, o?.orderStatus], {
    enabled: !!o && ACTIVE_TRACK.includes(o.orderStatus),
    refreshMs: 60_000, // BE: mỗi lần gọi tốn 1 lượt Google Maps, giới hạn 10 lần/phút
  });

  const reloadAll = async () => {
    await Promise.all([order.reload(), incidents.reload(), refunds.reload(), ratings.reload()]);
    await refundDetails.reload();
  };
  const done = () => {
    setModal(null);
    void reloadAll();
  };
  // Tài xế đổi trạng thái đơn → tự tải lại chi tiết đơn đang xem (SignalR OrderStatusChanged)
  useOrderRealtime(() => void reloadAll(), orderId);
  // GPS tài xế realtime (LocationUpdated): ghi đè vị trí trong bản tracking, giữ ETA; REST 60 giây vẫn làm mới ETA
  useDriverLocations((e) => {
    if (tracking.data) tracking.setData({ ...tracking.data, driver: { latitude: e.latitude, longitude: e.longitude, at: e.at, isStale: false } });
  }, orderId);

  // Còn sự cố mở (của ai cũng được) hoặc tài xế đang có sự cố chặn chuyến: tải lại mỗi 15 giây
  const hasOpenIncident =
    !!o?.pendingDriverIncidentId || (incidents.data?.items ?? []).some((i) => i.orderId === orderId && (i.resolutionStatus === 'Open' || i.resolutionStatus === 'InProgress'));
  useEffect(() => {
    if (!hasOpenIncident) return;
    const timer = setInterval(() => void reloadAll(), 15_000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasOpenIncident]);

  if (order.loading && !o) return <Loading />;
  if (order.error && !o) return <ErrorBox error={order.error} onRetry={order.reload} />;
  if (!o) return null;

  const myIncidents = (incidents.data?.items ?? []).filter((i) => i.orderId === o.id);
  const myRefunds = refundSummaries;
  const orderRefunds = refundDetails.data ?? [];
  const myRating = (ratings.data?.items ?? []).find((r) => r.orderId === o.id);
  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 overflow-hidden min-w-0">
      <header className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3 flex flex-wrap items-center gap-3 flex-shrink-0">
        <button onClick={() => navigate('/orders')} className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50">
          Danh sách đơn
        </button>
        <h1 className="text-base sm:text-lg font-black text-slate-900">{o.orderCode}</h1>
        <StatusPill status={o.orderStatus} paymentMethod={o.paymentMethod} paymentStatus={o.paymentStatus} />
        {o.paymentMethod === 'PayOS' && !isAwaitingPayment(o.orderStatus, o.paymentMethod, o.paymentStatus) && <Pill tone={PAYMENT_STATUS[o.paymentStatus]} />}
        <span className="text-[11px] text-slate-400 mr-auto">Tạo lúc {formatDateTime(o.createdAt)}</span>
        <Button variant="ghost" size="sm" onClick={reloadAll}>
          <RefreshCw className="w-3.5 h-3.5 mr-1" /> Làm mới
        </Button>
      </header>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="w-full space-y-4">
          <Progress order={o} dropoffArrivedAt={arrivedAtDropoff} />
          {o.pendingDriverIncidentId ? (
            <button
              type="button"
              onClick={() => document.getElementById('incidents-card')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              className="w-full text-left rounded-2xl border border-rose-200 bg-rose-50 p-4 flex gap-3 items-start hover:bg-rose-100 transition"
            >
              <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
              <span className="text-xs text-rose-800">
                <b className="block text-sm">Tài xế đã báo sự cố #{o.pendingDriverIncidentId}</b>
                Chuyến tạm dừng chờ điều phối viên xử lý. Bấm để xem chi tiết sự cố.
              </span>
            </button>
          ) : null}
          <NextAction
            order={o}
            dropoffArrivedAt={arrivedAtDropoff}
            hasOpenComplaint={myRefunds.some((r) => r.sourceType === 'Complaint' && ['Requested', 'Approved'].includes(r.refundStatus))}
            rated={!!myRating}
            onModal={(kind) => setModal({ kind })}
            onReload={reloadAll}
          />

          <div className="grid lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 space-y-4">
              {ACTIVE_TRACK.includes(o.orderStatus) && <TrackingCard tracking={tracking.data} error={tracking.error} loading={tracking.loading} onRefresh={tracking.reload} />}
              <ProofCard order={o} />
              <CargoCard order={o} />
              <IncidentsCard
                order={o}
                incidents={myIncidents}
                refunds={orderRefunds}
                onReport={() => setModal({ kind: 'incident' })}
                onRefund={(incident) => setModal({ kind: 'incidentRefund', incident })}
                onReply={(refund) => setModal({ kind: 'reply', refund })}
                onPayout={(refund) => setModal({ kind: 'payout', refund })}
                onChanged={reloadAll}
              />
              <RefundsCard
                refunds={orderRefunds.filter((r) => !(r.incidentId != null && myIncidents.some((i) => i.id === r.incidentId)))}
                onReply={(refund) => setModal({ kind: 'reply', refund })}
                onPayout={(refund) => setModal({ kind: 'payout', refund })}
                onChanged={reloadAll}
              />
              <Card title="Lịch sử trạng thái">
                <StatusTimeline items={o.history.map((h) => ({ ...h, at: h.changedAt }))} />
              </Card>
            </div>
            <div className="space-y-4">
              <DriverCard order={o} />
              {o.senderName && (
                <Card title="Người gửi">
                  <KV label="Họ tên">{o.senderName}</KV>
                  {o.senderPhone && <div className="py-1 text-sm font-bold text-slate-800"><PhoneLink phone={o.senderPhone} /></div>}
                </Card>
              )}
              <Card title="Người nhận">
                <KV label="Họ tên">{o.receiverName}</KV>
                <div className="py-1 text-sm font-bold text-slate-800"><PhoneLink phone={o.receiverPhone} /></div>
              </Card>
              <FareCard order={o} />
              {myRating && (
                <Card title="Đánh giá của bạn">
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star key={n} className={cx('w-4 h-4', n <= myRating.ratingStars ? 'fill-amber-400 text-amber-400' : 'text-slate-300')} />
                    ))}
                  </div>
                  {myRating.reviewComment && <p className="text-xs text-slate-600 mt-1">“{myRating.reviewComment}”</p>}
                  <p className="text-[11px] text-slate-400 mt-1">{formatDateTime(myRating.createdAt)}</p>
                </Card>
              )}
              <ReorderButton order={o} />
            </div>
          </div>
        </div>
      </div>

      {modal?.kind === 'cancel' && <CancelOrderModal order={o} onClose={() => setModal(null)} onDone={done} />}
      {modal?.kind === 'rejectPickup' && <RejectPickupModal order={o} onClose={() => setModal(null)} onDone={done} />}
      {modal?.kind === 'complaint' && <ComplaintModal order={o} onClose={() => setModal(null)} onDone={done} />}
      {modal?.kind === 'incident' && <ReportIncidentModal order={o} onClose={() => setModal(null)} onDone={done} />}
      {modal?.kind === 'incidentRefund' && <IncidentRefundModal order={o} incident={modal.incident} onClose={() => setModal(null)} onDone={done} />}
      {modal?.kind === 'reply' && <ReplyInfoModal refund={modal.refund} onClose={() => setModal(null)} onDone={done} />}
      {modal?.kind === 'payout' && <PayoutAccountModal refund={modal.refund} onClose={() => setModal(null)} onDone={done} />}
      {modal?.kind === 'rate' && <RatingModal orderId={o.id} orderCode={o.orderCode} driverName={o.driver?.fullName} onClose={() => setModal(null)} onDone={done} />}
      {modal?.kind === 'pay' && (
        <PayOsPaymentModal
          orderId={o.id}
          orderCode={o.orderCode}
          onClose={() => {
            setModal(null);
            void order.reload();
          }}
          onChecked={async () => {
            const fresh = await customerApi.order(o.id);
            order.setData(fresh);
            return fresh.paymentStatus === 'Paid';
          }}
        />
      )}
    </div>
  );
};

/* ------------------------------------------------------------------ helpers */
const historyAt = (o: OrderDetailResponse, s: string) => [...o.history].reverse().find((h) => h.toStatus === s)?.changedAt ?? null;
const deliveredAtOf = (o: OrderDetailResponse) => o.proof?.deliveredAt ?? historyAt(o, 'Delivered');
const fmtLeft = (ms: number) => {
  if (ms <= 0) return 'đã hết hạn';
  const h = Math.floor(ms / H);
  const m = Math.floor((ms % H) / 60_000);
  return h > 0 ? `${h} giờ ${m} phút` : `${m} phút`;
};

/* ------------------------------------------------------------------ Tiến trình */
const Progress: React.FC<{ order: OrderDetailResponse; dropoffArrivedAt?: string | null }> = ({ order, dropoffArrivedAt }) => {
  if (order.orderStatus === 'Cancelled') {
    const note = [...order.history].reverse().find((h) => h.toStatus === 'Cancelled');
    return (
      <Banner kind="warning">
        Đơn đã huỷ {note ? `lúc ${formatDateTime(note.changedAt)}` : ''}
        {note?.note ? ` – Lý do: ${note.note}` : ''}
      </Banner>
    );
  }
  const idx = ORDER_FLOW.indexOf(order.orderStatus);
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4">
      {/* Màn hẹp: tiến trình dọc; từ md: tiến trình ngang */}
      <ol className="flex flex-col md:flex-row md:items-start gap-3 md:gap-0">
        {ORDER_FLOW.map((s, i) => {
          const at = historyAt(order, s) ?? (s === 'Pending' ? order.createdAt : null);
          const label = s === 'Pending' && isAwaitingPayment(order.orderStatus, order.paymentMethod, order.paymentStatus) ? 'Chờ thanh toán' : ORDER_STATUS[s].label;
          return (
            <li key={s} className="md:flex-1 flex md:flex-col items-center gap-3 md:gap-0 md:text-center relative">
              {i > 0 && <span className={cx('hidden md:block absolute top-3 right-1/2 w-full h-0.5', i <= idx ? 'bg-blue-600' : 'bg-slate-200')} />}
              {i > 0 && <span className={cx('md:hidden absolute left-[11px] -top-3 h-3 w-0.5', i <= idx ? 'bg-blue-600' : 'bg-slate-200')} />}
              <span
                className={cx(
                  'relative z-10 w-6 h-6 flex-shrink-0 rounded-full flex items-center justify-center text-[11px] font-black border-2',
                  i < idx ? 'bg-blue-600 border-blue-600 text-white' : i === idx ? 'bg-white border-blue-600 text-blue-700' : 'bg-white border-slate-200 text-slate-400'
                )}
              >
                {i < idx ? '✓' : i + 1}
              </span>
              <span className="min-w-0 flex md:flex-col items-baseline md:items-center gap-2 md:gap-0 flex-wrap">
                <span className={cx('md:mt-1 text-xs md:text-[11px] font-bold', i <= idx ? 'text-slate-900' : 'text-slate-400')}>{label}</span>
                {at && i <= idx && <span className="text-[10px] text-slate-400">{formatDateTime(at)}</span>}
                {s === 'InTransit' && dropoffArrivedAt && (
                  <span className="text-[10px] font-bold text-emerald-700" data-testid="progress-dropoff">
                    ✓ Đã đến điểm giao · {formatDateTime(dropoffArrivedAt)}
                  </span>
                )}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
};

/* ------------------------------------------------------------------ Việc cần làm tiếp theo */
const NextAction: React.FC<{
  order: OrderDetailResponse;
  dropoffArrivedAt?: string | null;
  hasOpenComplaint: boolean;
  rated: boolean;
  onModal: (k: 'cancel' | 'rejectPickup' | 'complaint' | 'incident' | 'rate' | 'pay') => void;
  onReload: () => Promise<void>;
}> = ({ order: o, dropoffArrivedAt, hasOpenComplaint, rated, onModal, onReload }) => {
  // Tài xế có sự cố mở: khách chưa duyệt được ảnh lấy hàng (BE trả INCIDENT_PENDING), vẫn từ chối được
  const driverIncidentPending = !!o.pendingDriverIncidentId;
  usePublicConfig(); // vẽ lại khi BE trả số thật (hạn thanh toán, hạn khiếu nại, hạn đánh giá)
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);

  const run = async (fn: () => Promise<void>, ok: string) => {
    setBusy(true);
    try {
      await fn();
      toast.success(ok);
      await onReload();
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const box = (tone: string, icon: React.ReactNode, title: string, body: React.ReactNode, actions: React.ReactNode) => (
    <div className={cx('rounded-2xl border p-4 flex flex-col sm:flex-row sm:items-center gap-3', tone)}>
      <div className="flex gap-3 flex-1 min-w-0">
        <div className="flex-shrink-0 mt-0.5">{icon}</div>
        <div className="min-w-0">
          <div className="font-black text-sm text-slate-900">{title}</div>
          <div className="text-xs text-slate-600 mt-0.5">{body}</div>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">{actions}</div>
    </div>
  );

  const cancelBtn = (
    <Button size="sm" variant="outline" onClick={() => onModal('cancel')}>
      <XCircle className="w-4 h-4 mr-1" /> Huỷ đơn
    </Button>
  );

  switch (o.orderStatus) {
    case 'Pending': {
      const needPay = o.paymentMethod === 'PayOS' && o.paymentStatus === 'Unpaid';
      if (needPay) {
        const left = new Date(o.createdAt).getTime() + BUSINESS.UNPAID_ORDER_TIMEOUT_MIN * 60_000 - now;
        return box(
          'bg-rose-50 border-rose-200',
          <CreditCard className="w-5 h-5 text-rose-600" />,
          'Thanh toán để bắt đầu tìm tài xế',
          <>
            Đơn PayOS chỉ được gửi tới tài xế sau khi thanh toán. Đơn tự huỷ nếu chưa thanh toán sau {BUSINESS.UNPAID_ORDER_TIMEOUT_MIN} phút – còn <b>{fmtLeft(left)}</b>.
            {o.payment?.isExpired && ' Mã thanh toán trước đã hết hạn, hãy tạo mã mới.'}
          </>,
          <>
            <Button size="sm" onClick={() => onModal('pay')}>
              <CreditCard className="w-4 h-4 mr-1" /> Thanh toán {formatCurrency(o.totalFee)}
            </Button>
            {cancelBtn}
          </>
        );
      }
      return box(
        'bg-amber-50 border-amber-200',
        <Clock className="w-5 h-5 text-amber-600" />,
        'Đang tìm tài xế phù hợp gần điểm lấy',
        `Đơn hiển thị cho mọi tài xế đủ điều kiện trong bán kính; tài xế nhận trước sẽ được giao đơn. Không có tài xế nhận trong ${BUSINESS.MATCHING_TIMEOUT_MIN} phút, đơn tự huỷ.`,
        cancelBtn
      );
    }
    case 'Accepted':
      return box(
        'bg-blue-50 border-blue-200',
        <Truck className="w-5 h-5 text-blue-600" />,
        `Tài xế ${o.driver?.fullName ?? ''} đang tới điểm lấy hàng`,
        'Bạn vẫn có thể huỷ miễn phí cho tới khi tài xế đến điểm lấy.',
        cancelBtn
      );
    case 'Arrived':
      return box(
        'bg-indigo-50 border-indigo-200',
        <Navigation className="w-5 h-5 text-indigo-600" />,
        'Tài xế đã đến điểm lấy hàng',
        'Tài xế đang kiểm hàng và chụp ảnh lấy hàng để bạn duyệt. Từ bước này không tự huỷ được; nếu có vấn đề hãy báo sự cố.',
        <Button size="sm" variant="outline" onClick={() => onModal('incident')}>
          <AlertTriangle className="w-4 h-4 mr-1" /> Báo sự cố
        </Button>
      );
    case 'PickedUp': {
      const pending = o.proof?.proofStatus === 'Pending';
      if (pending)
        return box(
          'bg-purple-50 border-purple-200',
          <CheckCircle2 className="w-5 h-5 text-purple-600" />,
          `Duyệt ảnh lấy hàng (lần gửi ${o.proof?.pickupSubmissionCount ?? 1}/5)`,
          driverIncidentPending ? (
            <>
              Kiểm tra ảnh hàng tài xế vừa chụp bên dưới. <b className="text-rose-700">Chưa duyệt được khi tài xế đang có sự cố</b>; bạn vẫn có thể từ chối để tài xế chụp lại.
            </>
          ) : (
            'Kiểm tra ảnh hàng tài xế vừa chụp bên dưới. Chuyến chỉ bắt đầu sau khi bạn duyệt.'
          ),
          <>
            <Button size="sm" isLoading={busy} disabled={driverIncidentPending} onClick={() => run(() => customerApi.reviewPickup(o.id, true), 'Đã duyệt ảnh. Tài xế bắt đầu vận chuyển.')}>
              <CheckCircle2 className="w-4 h-4 mr-1" /> Duyệt ảnh, cho xuất phát
            </Button>
            <Button size="sm" variant="danger" onClick={() => onModal('rejectPickup')}>
              Từ chối, chụp lại
            </Button>
          </>
        );
      return box(
        'bg-purple-50 border-purple-200',
        <Clock className="w-5 h-5 text-purple-600" />,
        'Đang chờ tài xế gửi lại ảnh lấy hàng',
        o.proof?.rejectionReason ? `Bạn đã từ chối: “${o.proof.rejectionReason}”.` : 'Tài xế sẽ gửi ảnh để bạn duyệt.',
        <Button size="sm" variant="outline" onClick={() => onModal('incident')}>
          <AlertTriangle className="w-4 h-4 mr-1" /> Báo sự cố
        </Button>
      );
    }
    case 'InTransit':
      if (dropoffArrivedAt) {
        const payCash = o.paymentMethod === 'Cash' && o.payerRole === 'Receiver' && o.paymentStatus !== 'Paid';
        return box(
          'bg-emerald-50 border-emerald-200',
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />,
          'Tài xế đã đến điểm giao',
          <>
            Tài xế báo đã tới điểm giao lúc <b>{new Date(dropoffArrivedAt).toLocaleTimeString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit' })}</b>.
            {payCash && <> Người nhận thanh toán <b>{formatCurrency(o.totalFee)}</b> tiền mặt cho tài xế.</>} Tài xế sẽ chụp ảnh giao hàng để hoàn tất; sau đó bạn xác nhận nhận hàng hoặc khiếu nại trong 24 giờ. Có vấn đề với hàng, hãy báo sự cố ngay.
          </>,
          <Button size="sm" variant="outline" onClick={() => onModal('incident')}>
            <AlertTriangle className="w-4 h-4 mr-1" /> Báo sự cố
          </Button>
        );
      }
      return box(
        'bg-sky-50 border-sky-200',
        <Truck className="w-5 h-5 text-sky-600" />,
        'Hàng đang được vận chuyển',
        'Theo dõi vị trí tài xế ở bản đồ bên dưới. Có vấn đề (hỏng hàng, trễ, sai tuyến…) hãy báo sự cố.',
        <Button size="sm" variant="outline" onClick={() => onModal('incident')}>
          <AlertTriangle className="w-4 h-4 mr-1" /> Báo sự cố
        </Button>
      );
    case 'Delivered': {
      const at = deliveredAtOf(o);
      const left = at ? new Date(at).getTime() + BUSINESS.COMPLAINT_WINDOW_HOURS * H - now : 0;
      const canComplain = left > 0 && !hasOpenComplaint;
      return box(
        'bg-teal-50 border-teal-200',
        <CheckCircle2 className="w-5 h-5 text-teal-600" />,
        'Hàng đã giao – kiểm tra và xác nhận',
        hasOpenComplaint ? (
          <>Đơn đang có khiếu nại mở. Đơn sẽ hoàn tất sau khi khiếu nại được đóng.</>
        ) : (
          <>
            Hàng ổn: bấm <b>Xác nhận đã nhận hàng</b>. Hàng có vấn đề: bấm <b>Khiếu nại</b> (còn <b>{fmtLeft(left)}</b>). Xác nhận rồi sẽ không khiếu nại được nữa; quá {BUSINESS.AUTO_COMPLETE_HOURS} giờ đơn tự hoàn
            tất.
          </>
        ),
        <>
          {!hasOpenComplaint && (
            <Button
              size="sm"
              isLoading={busy}
              onClick={async () => {
                if (!(await confirm({ title: 'Xác nhận đã nhận hàng', message: `Bạn đã kiểm tra hàng của đơn ${o.orderCode} và hàng nguyên vẹn? Sau khi xác nhận bạn không thể khiếu nại.` }))) return;
                await run(() => customerApi.confirmReceipt(o.id), `Đơn ${o.orderCode} đã hoàn thành. Cảm ơn bạn!`);
              }}
            >
              <CheckCircle2 className="w-4 h-4 mr-1" /> Xác nhận đã nhận hàng
            </Button>
          )}
          {canComplain && (
            <Button size="sm" variant="danger" onClick={() => onModal('complaint')}>
              <MessageSquareWarning className="w-4 h-4 mr-1" /> Khiếu nại
            </Button>
          )}
        </>
      );
    }
    case 'Completed': {
      const at = historyAt(o, 'Completed');
      const left = at ? new Date(at).getTime() + BUSINESS.RATING_WINDOW_HOURS * H - now : 0;
      if (rated) return box('bg-emerald-50 border-emerald-200', <CheckCircle2 className="w-5 h-5 text-emerald-600" />, 'Đơn đã hoàn thành', 'Cảm ơn bạn đã đánh giá chuyến đi.', null);
      return box(
        'bg-emerald-50 border-emerald-200',
        <Star className="w-5 h-5 text-amber-500" />,
        'Đơn đã hoàn thành',
        left > 0 ? <>Hãy đánh giá tài xế (còn {fmtLeft(left)}, chỉ một lần).</> : `Đã quá thời hạn ${BUSINESS.RATING_WINDOW_HOURS} giờ để đánh giá.`,
        left > 0 && (
          <Button size="sm" onClick={() => onModal('rate')}>
            <Star className="w-4 h-4 mr-1" /> Đánh giá tài xế
          </Button>
        )
      );
    }
    default:
      return null;
  }
};

/* ------------------------------------------------------------------ Theo dõi */
export const TrackingCard: React.FC<{ tracking?: import('../../api/types').OrderTrackingResponse; error: string | null; loading: boolean; onRefresh: () => void }> = ({
  tracking,
  error,
  loading,
  onRefresh,
}) => {
  const target = { Pickup: 'tới điểm lấy', Handover: 'tới chỗ nhận bàn giao hàng', Dropoff: 'tới điểm giao' } as const;
  return (
    <Card
      title="Theo dõi vị trí tài xế"
      actions={
        <button onClick={onRefresh} className="text-xs font-bold text-blue-600 flex items-center gap-1">
          <RefreshCw className={cx('w-3.5 h-3.5', loading && 'animate-spin')} /> Cập nhật
        </button>
      }
    >
      {error && <Banner kind="warning">{error}</Banner>}
      {tracking && (
        <div className="space-y-3">
          <div className="grid sm:grid-cols-3 gap-2 text-xs">
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-3">
              <div className="text-slate-500 font-bold">Thời gian dự kiến</div>
              <div className="text-lg font-black text-slate-900">{tracking.eta ? `${tracking.eta.durationMinutes} phút` : '—'}</div>
              <div className="text-slate-400">{tracking.eta ? target[tracking.eta.target] : 'Chưa tính được ETA'}</div>
            </div>
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 sm:col-span-2">
              <div className="text-slate-500 font-bold">Vị trí tài xế</div>
              {tracking.driver ? (
                <>
                  <div className={cx('font-black', tracking.driver.isStale ? 'text-amber-600' : 'text-emerald-600')}>
                    {tracking.driver.isStale ? 'Mất tín hiệu GPS' : 'Đang cập nhật trực tiếp'}
                  </div>
                  <div className="text-slate-400">Cập nhật {timeAgo(tracking.driver.at)}</div>
                </>
              ) : (
                <div className="text-slate-400">Tài xế chưa gửi vị trí.</div>
              )}
            </div>
          </div>
          {(() => {
            // Có GPS tài xế: tuyến tài xế → điểm đang hướng tới (Pickup/Dropoff theo ETA); bàn giao giữa đường: chỉ ghim tài xế
            const d = tracking.driver ? { lat: tracking.driver.latitude, lng: tracking.driver.longitude } : null;
            const pickup = { lat: tracking.pickup.latitude, lng: tracking.pickup.longitude };
            const dropoff = { lat: tracking.dropoff.latitude, lng: tracking.dropoff.longitude };
            const toPickup = ['Accepted', 'Arrived'].includes(tracking.orderStatus);
            const target = tracking.eta?.target === 'Handover' ? null : tracking.eta?.target === 'Pickup' || (!tracking.eta && toPickup) ? pickup : dropoff;
            return (
              <>
                <MapView className="h-72" title="Theo dõi tài xế" from={d && target ? d : pickup} to={d && target ? target : d ? null : dropoff} point={d && !target ? d : null} />
                <p className="text-[11px] text-slate-500">
                  {d
                    ? target
                      ? `Tuyến từ vị trí tài xế tới ${target === pickup ? 'điểm lấy hàng' : 'điểm giao hàng'}.`
                      : 'Vị trí hiện tại của tài xế.'
                    : 'Tài xế chưa gửi vị trí – hiển thị tuyến từ điểm lấy tới điểm giao.'}
                </p>
              </>
            );
          })()}
        </div>
      )}
      {!tracking && !error && <p className="text-xs text-slate-400">Đang tải vị trí…</p>}
    </Card>
  );
};

/* ------------------------------------------------------------------ Ảnh lấy hàng & POD */
const ProofCard: React.FC<{ order: OrderDetailResponse }> = ({ order: o }) => {
  if (!o.proof) return null;
  const p = o.proof;
  return (
    <Card title="Bằng chứng lấy hàng & giao hàng" actions={<Pill tone={PROOF_STATUS[p.proofStatus]} />}>
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <SectionTitle right={<span className="text-[11px] text-slate-400">Lần gửi {p.pickupSubmissionCount}/5</span>}>Ảnh lấy hàng</SectionTitle>
          <PhotoGrid urls={p.pickupPhotoUrls} />
          {p.rejectionReason && <p className="text-[11px] text-rose-600 mt-2">Lý do từ chối gần nhất: {p.rejectionReason}</p>}
        </div>
        <div>
          <SectionTitle>Ảnh giao hàng</SectionTitle>
          <PhotoGrid urls={[p.deliveryPhotoUrl]} emptyText="Chưa giao hàng" />
          {p.deliveredAt && <p className="text-[11px] text-slate-500 mt-2">Giao lúc {formatDateTime(p.deliveredAt)}</p>}
        </div>
      </div>
    </Card>
  );
};

const CargoCard: React.FC<{ order: OrderDetailResponse }> = ({ order: o }) => (
  <Card title="Lộ trình & hàng hoá">
    <div className="grid sm:grid-cols-2 gap-4">
      <div className="space-y-2 text-xs">
        <div className="flex gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-600 mt-1 flex-shrink-0" />
          <div>
            <div className="font-bold text-slate-500">Điểm lấy</div>
            <div className="text-slate-900 font-semibold">{o.pickupAddress}</div>
            {o.pickupNote && <div className="text-slate-600 mt-0.5">Ghi chú: {o.pickupNote}</div>}
          </div>
        </div>
        <div className="flex gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 mt-1 flex-shrink-0" />
          <div>
            <div className="font-bold text-slate-500">Điểm giao</div>
            <div className="text-slate-900 font-semibold">{o.dropoffAddress}</div>
            {o.dropoffNote && <div className="text-slate-600 mt-0.5">Ghi chú: {o.dropoffNote}</div>}
          </div>
        </div>
        <div className="text-slate-500">
          {formatDistanceCeil(o.estimatedDistanceKm)} • khoảng {o.estimatedDurationMin} phút • {o.vehicleTypeName}
          {o.hasLoadingService && ' • Có bốc xếp'}
        </div>
      </div>
      <div className="text-xs space-y-1">
        <KV label="Loại hàng">{o.cargo.cargoTypeName ?? o.cargo.cargoType}</KV>
        <KV label="Số lượng / Tổng KL">
          {o.cargo.quantity} kiện • {o.cargo.weightKg} kg
        </KV>
        <KV label="Món lớn nhất">
          {o.cargo.lengthCm}×{o.cargo.widthCm}×{o.cargo.heightCm} cm
        </KV>
        {o.cargo.specialNotes && <KV label="Ghi chú">{o.cargo.specialNotes}</KV>}
        <div className="pt-1">
          <PhotoGrid urls={o.cargo.photoUrls} size="sm" />
        </div>
      </div>
    </div>
  </Card>
);

const DriverCard: React.FC<{ order: OrderDetailResponse }> = ({ order: o }) => (
  <Card title="Tài xế">
    {o.driver ? (
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-slate-900 text-white font-black flex items-center justify-center">{o.driver.fullName.charAt(0)}</div>
          <div className="min-w-0">
            <div className="font-black text-slate-900 truncate">{o.driver.fullName}</div>
            <div className="text-xs text-slate-500">
              {o.vehicleTypeName} • <span className="font-mono font-bold text-slate-700">{o.driver.licensePlate ?? '—'}</span>
            </div>
          </div>
        </div>
        <div className="text-sm font-bold text-slate-700">{o.driver.phoneNumber}</div>
      </div>
    ) : (
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <User className="w-4 h-4" /> {o.orderStatus === 'Cancelled' ? 'Không có tài xế.' : 'Chưa có tài xế nhận đơn.'}
      </div>
    )}
  </Card>
);

const FareCard: React.FC<{ order: OrderDetailResponse }> = ({ order: o }) => (
  <Card title="Cước phí & thanh toán">
    <KV label={`Cước quãng đường (${o.estimatedDistanceKm} km)`}>{formatCurrency(o.distanceFee)}</KV>
    {o.serviceFee > 0 && <KV label="Phí bốc xếp">{formatCurrency(o.serviceFee)}</KV>}
    {o.discountAmount > 0 && <KV label={`Giảm giá ${o.couponCode ?? ''}`}>-{formatCurrency(o.discountAmount)}</KV>}
    <div className="border-t border-slate-100 mt-1 pt-1">
      <KV label="Tổng cước" strong>
        <span className="text-base">{formatCurrency(o.totalFee)}</span>
      </KV>
    </div>
    <div className="mt-2 pt-2 border-t border-slate-100 space-y-1">
      <KV label="Hình thức">{o.paymentMethod === 'PayOS' ? 'PayOS' : 'Tiền mặt'}</KV>
      {o.payerRole && <KV label="Người trả">{PAYER_ROLE[o.payerRole]}</KV>}
      <KV label="Trạng thái">
        <Pill tone={PAYMENT_STATUS[o.paymentStatus]} />
      </KV>
      {o.payment && (
        <>
          <KV label="Giao dịch gần nhất">
            <Pill tone={PAYMENT_TX_STATUS[o.payment.isExpired ? 'Expired' : o.payment.transactionStatus] ?? PAYMENT_TX_STATUS.Pending} />
          </KV>
          {o.payment.paidAt && <KV label="Thanh toán lúc">{formatDateTime(o.payment.paidAt)}</KV>}
          {o.payment.checkoutUrl && !o.payment.isExpired && o.paymentStatus === 'Unpaid' && (
            <a href={o.payment.checkoutUrl} target="_blank" rel="noreferrer" className="text-xs font-bold text-blue-600 inline-flex items-center gap-1">
              <ExternalLink className="w-3.5 h-3.5" /> Mở lại trang thanh toán
            </a>
          )}
        </>
      )}
    </div>
  </Card>
);

/* ------------------------------------------------------------------ Sự cố */
const IncidentsCard: React.FC<{
  order: OrderDetailResponse;
  incidents: MyIncidentResponse[];
  refunds: MyRefundDetailResponse[];
  onReport: () => void;
  onRefund: (i: MyIncidentResponse) => void;
  onReply: (r: MyRefundDetailResponse) => void;
  onPayout: (r: MyRefundDetailResponse) => void;
  onChanged: () => Promise<void>;
}> = ({ order: o, incidents, refunds, onReport, onRefund, onReply, onPayout, onChanged }) => {
  const canReport = ['Arrived', 'PickedUp', 'InTransit'].includes(o.orderStatus);
  const canRefund = o.paymentMethod === 'PayOS' && o.paymentStatus === 'Paid';
  if (incidents.length === 0 && !canReport) return null;
  return (
    <Card
      id="incidents-card"
      title={`Sự cố (${incidents.length})`}
      actions={
        canReport && (
          <Button size="sm" variant="outline" onClick={onReport}>
            <AlertTriangle className="w-3.5 h-3.5 mr-1" /> Báo sự cố
          </Button>
        )
      }
    >
      {incidents.length === 0 ? (
        <p className="text-xs text-slate-400">Chưa có sự cố nào.</p>
      ) : (
        <div className="space-y-4">
          {[
            { title: 'Tài xế báo', items: incidents.filter((i) => !i.reportedByYou) },
            { title: 'Bạn báo', items: incidents.filter((i) => i.reportedByYou) },
          ]
            .filter((g) => g.items.length > 0)
            .map((g) => (
              <div key={g.title}>
                <div className="text-[11px] font-black uppercase tracking-wide text-slate-400 mb-1.5">{g.title}</div>
                <ul className="space-y-3">
                  {g.items.map((i) => {
                    // Khoản hoàn của riêng sự cố này nằm ngay trong thẻ; khoản còn mở thì không cho gửi thêm (mỗi sự cố một yêu cầu mở).
                    // Gồm cả hoàn do "huỷ đơn vì sự cố" (BE ghi sourceType=Cancellation nhưng vẫn gắn incidentId) và hoàn do sự cố.
                    const linked = refunds.filter((r) => r.incidentId === i.id);
                    // Huỷ đơn vì sự cố đã tự tạo khoản hoàn: không cho khách yêu cầu thêm.
                    const hasOpenRefund = linked.some((r) => r.sourceType === 'Cancellation' || ['Requested', 'Approved', 'Failed'].includes(r.refundStatus));
                    return (
                    <li key={i.id} className="border border-slate-200 rounded-xl p-3 text-xs space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <b className="text-slate-900">#{i.id} – {INCIDENT_TYPE[i.incidentType]}</b>
                        <Pill tone={INCIDENT_STATUS[i.resolutionStatus]} />
                        <span className="text-slate-400">{formatDateTime(i.createdAt)}</span>
                      </div>
                      <p className="text-slate-700">{i.description}</p>
                      <PhotoGrid urls={i.photoUrls} size="sm" emptyText="Không có ảnh" />
                      {i.resolutionStatus === 'InProgress' && <p className="text-amber-700 font-semibold">Điều phối viên đang xử lý</p>}
                      {i.resolutionStatus === 'Resolved' && i.resolutionDecision && (
                        <div className="rounded-lg bg-slate-50 border border-slate-200 p-2">
                          <b>Kết quả:</b> {INCIDENT_DECISION[i.resolutionDecision]}
                          {i.resolutionNote && <span className="text-slate-600"> – {i.resolutionNote}</span>}
                          {i.resolvedAt && <span className="text-slate-400"> ({formatDateTime(i.resolvedAt)})</span>}
                        </div>
                      )}
                      {i.resolutionStatus === 'Cancelled' && (
                        <p className="text-slate-500">
                          Báo cáo đã bị hủy{i.resolutionNote ? `: ${i.resolutionNote}` : ''}
                        </p>
                      )}
                      {linked.length > 0 && (
                        <ul className="space-y-2 pt-1">
                          {linked.map((r) => (
                            <RefundItem key={r.id} refund={r} onReply={onReply} onPayout={onPayout} onChanged={onChanged} />
                          ))}
                        </ul>
                      )}
                      {canRefund && !hasOpenRefund && (
                        <Button size="sm" variant="outline" onClick={() => onRefund(i)}>
                          Yêu cầu hoàn tiền cho sự cố này
                        </Button>
                      )}
                    </li>
                    );
                  })}
                </ul>
              </div>
            ))}
        </div>
      )}
    </Card>
  );
};

/* ------------------------------------------------------------------ Hoàn tiền / khiếu nại */
const RefundsCard: React.FC<{ refunds: MyRefundDetailResponse[]; onReply: (r: MyRefundDetailResponse) => void; onPayout: (r: MyRefundDetailResponse) => void; onChanged: () => Promise<void> }> = ({ refunds, onReply, onPayout, onChanged }) => {
  if (refunds.length === 0) return null;
  return (
    <Card title={`Hoàn tiền & khiếu nại (${refunds.length})`}>
      <ul className="space-y-3">
        {refunds.map((r) => (
          <RefundItem key={r.id} refund={r} onReply={onReply} onPayout={onPayout} onChanged={onChanged} />
        ))}
      </ul>
    </Card>
  );
};

const RefundItem: React.FC<{ refund: MyRefundDetailResponse; onReply: (r: MyRefundDetailResponse) => void; onPayout: (r: MyRefundDetailResponse) => void; onChanged: () => Promise<void> }> = ({ refund: r, onReply, onPayout, onChanged }) => {
  const [busy, setBusy] = useState(false);
  const canWithdraw = r.refundStatus === 'Requested' && r.sourceType !== 'Cancellation';
  const withdraw = async () => {
    if (!(await confirm({ title: 'Rút yêu cầu', message: 'Bạn chắc chắn muốn rút yêu cầu này? Không thể hoàn tác.', danger: true }))) return;
    setBusy(true);
    try {
      await customerApi.withdrawRefund(r.id);
      toast.success('Đã rút yêu cầu.');
      await onChanged();
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <li className="border border-slate-200 rounded-xl p-3 text-xs space-y-1.5">
      <div className="flex flex-wrap items-center gap-2">
        <b className="text-slate-900">
          {REFUND_SOURCE[r.sourceType]} #{r.id}
        </b>
        <Pill tone={REFUND_STATUS[r.refundStatus]} />
        <span className="text-slate-400">{formatDateTime(r.createdAt)}</span>
      </div>
      <p className="text-slate-700">{r.reason}</p>
      <div className="flex flex-wrap gap-x-4 text-slate-600">
        <span>
          Yêu cầu: <b>{formatCurrency(r.requestedAmount)}</b>
        </span>
        {r.approvedAmount !== null && (
          <span>
            Được duyệt: <b className="text-emerald-700">{formatCurrency(r.approvedAmount)}</b>
          </span>
        )}
        {r.processedAt && <span>Đã chuyển khoản {formatDateTime(r.processedAt)}</span>}
      </div>
      <PhotoGrid urls={r.evidenceUrls} size="sm" emptyText="Không có ảnh bằng chứng" />
      {r.infoRequestNote && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 p-2">
          <b>Điều phối viên hỏi:</b> {r.infoRequestNote}
          {r.customerReply && (
            <div className="mt-1 text-slate-700">
              <b>Bạn trả lời:</b> {r.customerReply}
            </div>
          )}
        </div>
      )}
      {r.decisionReason && (
        <div className="rounded-lg bg-slate-50 border border-slate-200 p-2">
          <b>Quyết định của Quản trị viên:</b> {r.decisionReason}
        </div>
      )}
      {r.payoutAccount && (
        <div className="rounded-lg bg-slate-50 border border-slate-200 p-2">
          <b>Tài khoản nhận hoàn tiền:</b> {r.payoutAccount.bankName} • {r.payoutAccount.maskedAccountNumber} • {r.payoutAccount.accountHolder}
        </div>
      )}
      {r.needsPayoutAccount && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 p-2 text-amber-800">Bạn chưa khai tài khoản nhận hoàn tiền nên quản trị viên chưa thể chuyển khoản.</div>
      )}
      {r.payoutFailureReason && (
        <div className="rounded-lg bg-rose-50 border border-rose-200 p-2 text-rose-700">Chuyển khoản hoàn tiền bị lỗi: {r.payoutFailureReason}. Hãy kiểm tra hoặc nhập tài khoản khác.</div>
      )}
      {r.bankReferenceCode && (
        <p className="text-slate-600">
          Mã chuyển khoản: <b>{r.bankReferenceCode}</b>
        </p>
      )}
      <div className="flex gap-2 pt-1">
        {(r.needsPayoutAccount || r.refundStatus === 'Failed' || (r.payoutAccount && ['Requested', 'Approved'].includes(r.refundStatus))) && (
          <Button size="sm" variant={r.needsPayoutAccount || r.refundStatus === 'Failed' ? 'primary' : 'outline'} onClick={() => onPayout(r)}>
            {r.payoutAccount ? 'Sửa tài khoản nhận tiền' : 'Khai tài khoản nhận tiền'}
          </Button>
        )}
        {r.waitingForYourReply && (
          <Button size="sm" onClick={() => onReply(r)}>
            Bổ sung thông tin
          </Button>
        )}
        {canWithdraw && (
          <Button size="sm" variant="outline" onClick={withdraw} isLoading={busy}>
            Rút yêu cầu
          </Button>
        )}
      </div>
    </li>
  );
};

/** GB-34: không sửa đơn đã gửi → tạo đơn mới từ thông tin cũ */
const ReorderButton: React.FC<{ order: OrderDetailResponse }> = ({ order: o }) => {
  const navigate = useNavigate();
  const { reset, setPickup, setDropoff, setCargo, update } = useBookingDraftStore();
  return (
    <Button
      variant="outline"
      className="w-full"
      onClick={() => {
        reset();
        setPickup({ address: o.pickupAddress, contactName: o.senderName ?? '', contactPhone: o.senderPhone ?? '', note: o.pickupNote ?? '' });
        setDropoff({ address: o.dropoffAddress, contactName: o.receiverName, contactPhone: o.receiverPhone, note: o.dropoffNote ?? '' });
        setCargo({
          type: o.cargo.cargoType,
          quantity: o.cargo.quantity,
          weightKg: o.cargo.weightKg,
          largestItem: { lengthCm: o.cargo.lengthCm, widthCm: o.cargo.widthCm, heightCm: o.cargo.heightCm },
          photos: o.cargo.photoUrls,
          // Mô tả và ghi chú được gộp làm một khi gửi lên: đặt lại thì đưa cả vào ô mô tả
          description: o.cargo.specialNotes ?? '',
          specialNotes: '',
        });
        update({ loadingService: o.hasLoadingService });
        navigate('/booking');
      }}
    >
      <Repeat className="w-4 h-4 mr-1.5" /> Đặt lại đơn tương tự
    </Button>
  );
};
