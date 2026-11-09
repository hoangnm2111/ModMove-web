import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  CreditCard,
  ExternalLink,
  MessageSquareWarning,
  Navigation,
  Phone,
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
import { MapEmbed } from '../../components/MapEmbed';
import { customerApi } from '../../api/endpoints';
import { useQuery } from '../../api/useQuery';
import { INCIDENT_DECISION, INCIDENT_STATUS, INCIDENT_TYPE, ORDER_FLOW, ORDER_STATUS, PAYER_ROLE, PAYMENT_STATUS, PAYMENT_TX_STATUS, PROOF_STATUS, REFUND_SOURCE, REFUND_STATUS } from '../../api/labels';
import type { MyIncidentResponse, MyRefundDetailResponse, OrderDetailResponse } from '../../api/types';
import { CancelOrderModal, ComplaintModal, IncidentRefundModal, RatingModal, RejectPickupModal, ReplyInfoModal, ReportIncidentModal } from '../../features/customer/CustomerModals';
import { PayOsPaymentModal } from '../../features/payment/PayOsPaymentModal';
import { useBookingDraftStore } from '../../store/useBookingDraftStore';
import { errorMessage } from '../../services/mock/storage';
import { formatCurrency, formatDateTime, timeAgo } from '../../utils/format';

const H = 3_600_000;
const ACTIVE_TRACK = ['Accepted', 'Arrived', 'PickedUp', 'InTransit'];

type ModalState =
  | { kind: 'cancel' | 'rejectPickup' | 'complaint' | 'incident' | 'rate' | 'pay' }
  | { kind: 'incidentRefund'; incident: MyIncidentResponse }
  | { kind: 'reply'; refund: MyRefundDetailResponse }
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
  const incidents = useQuery(() => customerApi.incidents(1, 50), [orderId]);
  const refunds = useQuery(() => customerApi.refunds(1, 50), [orderId]);
  const ratings = useQuery(() => customerApi.ratings(1, 50), [orderId]);
  const o = order.data;
  const tracking = useQuery(() => customerApi.tracking(orderId), [orderId, o?.orderStatus], {
    enabled: !!o && ACTIVE_TRACK.includes(o.orderStatus),
    refreshMs: 60_000, // BE: mỗi lần gọi tốn 1 lượt Google Maps, giới hạn 10 lần/phút
  });

  const reloadAll = async () => {
    await Promise.all([order.reload(), incidents.reload(), refunds.reload(), ratings.reload()]);
  };
  const done = () => {
    setModal(null);
    void reloadAll();
  };

  if (order.loading && !o) return <Loading />;
  if (order.error && !o) return <ErrorBox error={order.error} onRetry={order.reload} />;
  if (!o) return null;

  const myIncidents = (incidents.data?.items ?? []).filter((i) => i.orderId === o.id);
  const myRefunds = (refunds.data?.items ?? []).filter((r) => r.orderId === o.id);
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
        <div className="max-w-6xl mx-auto space-y-4">
          <Progress order={o} />
          <NextAction
            order={o}
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
                refunds={myRefunds}
                onReport={() => setModal({ kind: 'incident' })}
                onRefund={(incident) => setModal({ kind: 'incidentRefund', incident })}
              />
              <RefundsCard refunds={myRefunds} onReply={(refund) => setModal({ kind: 'reply', refund })} onChanged={reloadAll} />
              <Card title="Lịch sử trạng thái">
                <StatusTimeline items={o.history.map((h) => ({ ...h, at: h.changedAt }))} />
              </Card>
            </div>
            <div className="space-y-4">
              <DriverCard order={o} />
              <Card title="Người nhận">
                <KV label="Họ tên">{o.receiverName}</KV>
                <KV label="Số điện thoại">
                  <a href={`tel:${o.receiverPhone}`} className="text-blue-600">
                    {o.receiverPhone}
                  </a>
                </KV>
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
const Progress: React.FC<{ order: OrderDetailResponse }> = ({ order }) => {
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
    <div className="bg-white border border-slate-200 rounded-2xl p-4 overflow-x-auto">
      <ol className="flex items-start min-w-[640px]">
        {ORDER_FLOW.map((s, i) => {
          const at = historyAt(order, s) ?? (s === 'Pending' ? order.createdAt : null);
          return (
            <li key={s} className="flex-1 flex flex-col items-center text-center relative">
              {i > 0 && <span className={cx('absolute top-3 right-1/2 w-full h-0.5', i <= idx ? 'bg-blue-600' : 'bg-slate-200')} />}
              <span
                className={cx(
                  'relative z-10 w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black border-2',
                  i < idx ? 'bg-blue-600 border-blue-600 text-white' : i === idx ? 'bg-white border-blue-600 text-blue-700' : 'bg-white border-slate-200 text-slate-400'
                )}
              >
                {i < idx ? '✓' : i + 1}
              </span>
              <span className={cx('mt-1 text-[11px] font-bold', i <= idx ? 'text-slate-900' : 'text-slate-400')}>
                {s === 'Pending' && isAwaitingPayment(order.orderStatus, order.paymentMethod, order.paymentStatus) ? 'Chờ thanh toán' : ORDER_STATUS[s].label}
              </span>
              {at && i <= idx && <span className="text-[10px] text-slate-400">{formatDateTime(at)}</span>}
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
  hasOpenComplaint: boolean;
  rated: boolean;
  onModal: (k: 'cancel' | 'rejectPickup' | 'complaint' | 'incident' | 'rate' | 'pay') => void;
  onReload: () => Promise<void>;
}> = ({ order: o, hasOpenComplaint, rated, onModal, onReload }) => {
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
        const left = new Date(o.createdAt).getTime() + 30 * 60_000 - now;
        return box(
          'bg-rose-50 border-rose-200',
          <CreditCard className="w-5 h-5 text-rose-600" />,
          'Thanh toán để bắt đầu tìm tài xế',
          <>
            Đơn PayOS chỉ được gửi tới tài xế sau khi thanh toán (GB-31). Đơn tự huỷ nếu chưa thanh toán sau 30 phút – còn <b>{fmtLeft(left)}</b>.
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
        'Đơn hiển thị cho mọi tài xế đủ điều kiện trong bán kính; tài xế nhận trước sẽ được giao đơn. Không có tài xế nhận trong 10 phút, đơn tự huỷ (GB-24).',
        cancelBtn
      );
    }
    case 'Accepted':
      return box(
        'bg-blue-50 border-blue-200',
        <Truck className="w-5 h-5 text-blue-600" />,
        `Tài xế ${o.driver?.fullName ?? ''} đang tới điểm lấy hàng`,
        'Bạn vẫn có thể huỷ miễn phí cho tới khi tài xế đến điểm lấy (GB-22).',
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
          'Kiểm tra ảnh hàng tài xế vừa chụp bên dưới. Chuyến chỉ bắt đầu sau khi bạn duyệt (GB-26).',
          <>
            <Button size="sm" isLoading={busy} onClick={() => run(() => customerApi.reviewPickup(o.id, true), 'Đã duyệt ảnh. Tài xế bắt đầu vận chuyển.')}>
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
      const left = at ? new Date(at).getTime() + 24 * H - now : 0;
      const canComplain = left > 0 && !hasOpenComplaint;
      return box(
        'bg-teal-50 border-teal-200',
        <CheckCircle2 className="w-5 h-5 text-teal-600" />,
        'Hàng đã giao – kiểm tra và xác nhận',
        hasOpenComplaint ? (
          <>Đơn đang có khiếu nại mở. Đơn sẽ hoàn tất sau khi khiếu nại được đóng (7.3).</>
        ) : (
          <>
            Hàng ổn: bấm <b>Xác nhận đã nhận hàng</b>. Hàng có vấn đề: bấm <b>Khiếu nại</b> (còn <b>{fmtLeft(left)}</b>). Xác nhận rồi sẽ không khiếu nại được nữa; quá 24 giờ đơn tự hoàn
            tất (GB-18, GB-23).
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
      const left = at ? new Date(at).getTime() + 24 * H - now : 0;
      if (rated) return box('bg-emerald-50 border-emerald-200', <CheckCircle2 className="w-5 h-5 text-emerald-600" />, 'Đơn đã hoàn thành', 'Cảm ơn bạn đã đánh giá chuyến đi.', null);
      return box(
        'bg-emerald-50 border-emerald-200',
        <Star className="w-5 h-5 text-amber-500" />,
        'Đơn đã hoàn thành',
        left > 0 ? <>Hãy đánh giá tài xế (còn {fmtLeft(left)}, chỉ một lần – GB-20).</> : 'Đã quá thời hạn 1 ngày để đánh giá.',
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
                    {tracking.driver.isStale ? 'Mất tín hiệu GPS (quá 5 phút)' : 'Đang cập nhật trực tiếp'}
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
                <MapEmbed className="h-72" title="Theo dõi tài xế" from={d && target ? d : pickup} to={d && target ? target : d ? null : dropoff} point={d && !target ? d : null} />
                <p className="text-[11px] text-slate-500">
                  {d
                    ? target
                      ? `Tuyến từ vị trí tài xế tới ${target === pickup ? 'điểm lấy hàng' : 'điểm giao hàng'}.`
                      : 'Vị trí hiện tại của tài xế (đang tới chỗ nhận bàn giao hàng).'
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
          <SectionTitle>Ảnh giao hàng (POD)</SectionTitle>
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
          </div>
        </div>
        <div className="flex gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 mt-1 flex-shrink-0" />
          <div>
            <div className="font-bold text-slate-500">Điểm giao</div>
            <div className="text-slate-900 font-semibold">{o.dropoffAddress}</div>
          </div>
        </div>
        <div className="text-slate-500">
          {o.estimatedDistanceKm} km • ~{o.estimatedDurationMin} phút • {o.vehicleTypeName}
          {o.hasLoadingService && ' • Có bốc xếp'}
        </div>
      </div>
      <div className="text-xs space-y-1">
        <KV label="Loại hàng">{o.cargo.cargoTypeName ?? o.cargo.cargoType}</KV>
        <KV label="Số lượng / Tổng KL">
          {o.cargo.quantity} kiện • {o.cargo.weightKg} kg
        </KV>
        <KV label="Món lớn nhất (D×R×C)">
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
        <a href={`tel:${o.driver.phoneNumber}`} className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-slate-300 text-sm font-bold text-slate-700 hover:bg-slate-50">
          <Phone className="w-4 h-4" /> Gọi {o.driver.phoneNumber}
        </a>
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
  refunds: { sourceType: string; refundStatus: string }[];
  onReport: () => void;
  onRefund: (i: MyIncidentResponse) => void;
}> = ({ order: o, incidents, onReport, onRefund }) => {
  const canReport = ['Arrived', 'PickedUp', 'InTransit'].includes(o.orderStatus);
  const canRefund = o.paymentMethod === 'PayOS' && o.paymentStatus === 'Paid';
  if (incidents.length === 0 && !canReport) return null;
  return (
    <Card
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
        <ul className="space-y-3">
          {incidents.map((i) => (
            <li key={i.id} className="border border-slate-200 rounded-xl p-3 text-xs space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <b className="text-slate-900">#{i.id} – {INCIDENT_TYPE[i.incidentType]}</b>
                <Pill tone={INCIDENT_STATUS[i.resolutionStatus]} />
                <span className="text-slate-400">{i.reportedByYou ? 'Bạn báo' : 'Tài xế báo'} • {formatDateTime(i.createdAt)}</span>
              </div>
              <p className="text-slate-700">{i.description}</p>
              <PhotoGrid urls={i.photoUrls} size="sm" emptyText="Không có ảnh" />
              {i.resolutionDecision && (
                <div className="rounded-lg bg-slate-50 border border-slate-200 p-2">
                  <b>Kết quả xử lý:</b> {INCIDENT_DECISION[i.resolutionDecision]}
                  {i.resolutionNote && <span className="text-slate-600"> – {i.resolutionNote}</span>}
                  {i.resolvedAt && <span className="text-slate-400"> ({formatDateTime(i.resolvedAt)})</span>}
                </div>
              )}
              {i.resolutionStatus === 'Cancelled' && i.resolutionNote && <p className="text-slate-500">Lý do huỷ sự cố: {i.resolutionNote}</p>}
              {canRefund && (
                <Button size="sm" variant="outline" onClick={() => onRefund(i)}>
                  Yêu cầu hoàn tiền cho sự cố này
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
};

/* ------------------------------------------------------------------ Hoàn tiền / khiếu nại */
const RefundsCard: React.FC<{ refunds: { id: number }[]; onReply: (r: MyRefundDetailResponse) => void; onChanged: () => Promise<void> }> = ({ refunds, onReply, onChanged }) => {
  if (refunds.length === 0) return null;
  return (
    <Card title={`Khiếu nại & hoàn tiền (${refunds.length})`}>
      <ul className="space-y-3">
        {refunds.map((r) => (
          <RefundItem key={r.id} id={r.id} onReply={onReply} onChanged={onChanged} />
        ))}
      </ul>
    </Card>
  );
};

const RefundItem: React.FC<{ id: number; onReply: (r: MyRefundDetailResponse) => void; onChanged: () => Promise<void> }> = ({ id, onReply, onChanged }) => {
  const q = useQuery(() => customerApi.refund(id), [id]);
  const [busy, setBusy] = useState(false);
  const r = q.data;
  const canWithdraw = useMemo(() => !!r && r.refundStatus === 'Requested' && r.sourceType !== 'Cancellation', [r]);
  if (!r) return <li className="text-xs text-slate-400">Đang tải khoản hoàn #{id}…</li>;
  const withdraw = async () => {
    if (!(await confirm({ title: 'Rút yêu cầu', message: 'Bạn chắc chắn muốn rút yêu cầu này? Không thể hoàn tác.', danger: true }))) return;
    setBusy(true);
    try {
      await customerApi.withdrawRefund(r.id);
      toast.success('Đã rút yêu cầu.');
      await Promise.all([q.reload(), onChanged()]);
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
          <b>Quyết định của Admin:</b> {r.decisionReason}
        </div>
      )}
      <div className="flex gap-2 pt-1">
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
        setPickup({ address: o.pickupAddress });
        setDropoff({ address: o.dropoffAddress, contactName: o.receiverName, contactPhone: o.receiverPhone });
        setCargo({
          type: o.cargo.cargoType,
          quantity: o.cargo.quantity,
          weightKg: o.cargo.weightKg,
          largestItem: { lengthCm: o.cargo.lengthCm, widthCm: o.cargo.widthCm, heightCm: o.cargo.heightCm },
          photos: o.cargo.photoUrls,
          specialNotes: o.cargo.specialNotes ?? '',
        });
        update({ loadingService: o.hasLoadingService });
        navigate('/booking');
      }}
    >
      <Repeat className="w-4 h-4 mr-1.5" /> Đặt lại đơn tương tự
    </Button>
  );
};
