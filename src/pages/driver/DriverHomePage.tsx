import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Camera, CheckCircle2, Clock, MapPin, Navigation, Phone } from 'lucide-react';
import { Button } from '../../components/Button';
import { Banner, confirm, toast } from '../../components/ui/feedback';
import { Modal } from '../../components/ui/Modal';
import { TextArea } from '../../components/ui/Field';
import { PhotoUploader } from '../../components/ui/PhotoUploader';
import { OrderStatusBadge } from '../../components/ui/StatusBadge';
import { RouteMap } from '../../components/RouteMap';
import { BUSINESS } from '../../config/business';
import { INCIDENT_TYPE_LABEL, ORDER_STATUS_CONFIG } from '../../constants';
import { msg } from '../../constants/messages';
import { calculateCommission, calculateDriverEarning } from '../../domain/pricing';
import { useDriverContext } from '../../hooks/useDriverContext';
import { caseService } from '../../services/case.service';
import { orderService } from '../../services/order.service';
import { errorMessage } from '../../services/mock/storage';
import { IncidentType } from '../../types/case.types';
import { LocationPoint, ShippingOrder } from '../../types/order.types';
import { formatCurrency } from '../../utils/format';

const DRIVER_INCIDENT_TYPES: IncidentType[] = ['VehicleBreakdown', 'DamagedCargo', 'Accident', 'Other'];

/** UC-DRV-11 / UC-DRV-14: mở Google Maps chỉ đường */
const directionsUrl = (p: LocationPoint) => `https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}`;

/** SCR-21 → SCR-27: Thực hiện chuyến */
export const DriverHomePage: React.FC = () => {
  const navigate = useNavigate();
  const { activeTrip } = useDriverContext();
  const [lastDelivered, setLastDelivered] = useState<ShippingOrder | null>(null);
  const [pickupPhotos, setPickupPhotos] = useState<string[]>([]);
  const [podPhotos, setPodPhotos] = useState<string[]>([]);
  const [atDestination, setAtDestination] = useState(false);
  const [busy, setBusy] = useState(false);
  const [incidentOpen, setIncidentOpen] = useState(false);

  const run = async <T,>(fn: () => Promise<T>, success?: string): Promise<T | undefined> => {
    setBusy(true);
    try {
      const r = await fn();
      if (success) toast.success(success);
      return r;
    } catch (e) {
      toast.error(errorMessage(e));
      return undefined;
    } finally {
      setBusy(false);
    }
  };

  if (!activeTrip) {
    return lastDelivered ? (
      <TripSummary order={lastDelivered} onDone={() => navigate('/driver')} />
    ) : (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 text-sm text-slate-500 p-6">
        Bạn chưa có chuyến nào đang thực hiện.
        <Button size="sm" onClick={() => navigate('/driver')}>
          Tìm đơn gần bạn
        </Button>
      </div>
    );
  }

  const o = activeTrip;
  const status = (to: keyof typeof ORDER_STATUS_CONFIG) => msg('MSG34', { order_id: o.code, status: ORDER_STATUS_CONFIG[to].label });
  const isCash = o.paymentMethod === 'Cash';
  const cashAtPickup = isCash && o.payerRole === 'Sender' && o.paymentStatus === 'Unpaid';
  const cashAtDropoff = isCash && o.payerRole === 'Receiver' && o.paymentStatus === 'Unpaid';

  /** UC-DRV-17 / MSG52 */
  const collectCash = async () => {
    if (!(await confirm({ title: 'Xác nhận thu tiền mặt', message: msg('MSG52', { amount: formatCurrency(o.fare.total), order_id: o.code }) }))) return;
    await run(() => orderService.confirmCashCollected(o.id), msg('MSG53', { order_id: o.code }));
  };

  const submitPickup = async () => {
    const r = await run(() => orderService.submitPickupEvidence(o.id, pickupPhotos), 'Đã gửi ảnh kiểm hàng, chờ khách duyệt.');
    if (r) setPickupPhotos([]);
  };

  const deliver = async () => {
    const r = await run(() => orderService.markDelivered(o.id, podPhotos[0] ?? ''), status('Delivered'));
    if (r) {
      setLastDelivered(r);
      setPodPhotos([]);
      setAtDestination(false);
    }
  };

  const mapPhase = o.status === 'InTransit' ? 'toDropoff' : 'toPickup';
  const mapProgress = o.status === 'Accepted' ? 0.4 : o.status === 'InTransit' ? (atDestination ? 1 : 0.5) : 1;

  return (
    <div className="flex-1 flex flex-col lg:flex-row h-full overflow-hidden min-w-0">
      <section className="flex-1 min-h-[240px]">
        <RouteMap progress={mapProgress} phase={mapPhase} />
      </section>

      <aside className="w-full lg:w-[440px] bg-white border-l border-slate-200 overflow-y-auto p-5 space-y-4">
        <div className="flex items-center gap-2">
          <h1 className="font-black text-slate-900">{o.code}</h1>
          <OrderStatusBadge status={o.status} />
          <span className="ml-auto text-sm font-black text-emerald-700">{formatCurrency(calculateDriverEarning(o.fare.total, o.commissionRate ?? BUSINESS.DEFAULT_COMMISSION_RATE))}</span>
        </div>

        <section className="text-xs space-y-1.5">
          <p className="flex gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
            <span>
              <b>Lấy:</b> {o.pickup.address} – {o.pickup.contactName}{' '}
              <a className="text-blue-600 font-bold" href={`tel:${o.pickup.contactPhone}`}>
                <Phone className="inline w-3 h-3" /> {o.pickup.contactPhone}
              </a>
            </span>
          </p>
          <p className="flex gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
            <span>
              <b>Giao:</b> {o.dropoff.address} – {o.dropoff.contactName}{' '}
              <a className="text-blue-600 font-bold" href={`tel:${o.dropoff.contactPhone}`}>
                <Phone className="inline w-3 h-3" /> {o.dropoff.contactPhone}
              </a>
            </span>
          </p>
          <p className="text-slate-500">
            {o.cargo.description} • {o.cargo.quantity} kiện • {o.cargo.weightKg} kg{o.loadingService && ' • Có bốc xếp'}
          </p>
          {o.cargo.specialNotes && <p className="text-amber-700 font-semibold">Lưu ý: {o.cargo.specialNotes}</p>}
        </section>

        {/* ---------- Accepted: tới điểm lấy (UC-DRV-11, UC-DRV-12) */}
        {o.status === 'Accepted' && (
          <Step title="1. Di chuyển tới điểm lấy hàng">
            <a href={directionsUrl(o.pickup)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700">
              <Navigation className="w-4 h-4" /> Mở chỉ đường Google Maps
            </a>
            <Button size="sm" className="w-full" isLoading={busy} onClick={() => run(() => orderService.markArrived(o.id), status('Arrived'))}>
              Đã đến điểm lấy hàng
            </Button>
          </Step>
        )}

        {/* ---------- Arrived / bị từ chối ảnh: chụp ảnh kiểm hàng (UC-DRV-13, GB-11) */}
        {(o.status === 'Arrived' || (o.status === 'PickedUp' && o.proof?.pickupStatus === 'Rejected')) && (
          <Step title="2. Kiểm tra & chụp ảnh hàng hoá">
            {o.proof?.pickupStatus === 'Rejected' && <Banner kind="warning">{msg('MSG67', { reason: o.proof.pickupRejectReason ?? '' })}</Banner>}
            {cashAtPickup && (
              <Banner kind="info">
                Người gửi trả tiền mặt {formatCurrency(o.fare.total)}.{' '}
                <button className="underline font-bold" onClick={collectCash}>
                  Xác nhận đã thu
                </button>
              </Banner>
            )}
            <PhotoUploader
              label={`Ảnh kiểm hàng (${BUSINESS.MIN_PICKUP_PHOTOS}–${BUSINESS.MAX_PICKUP_PHOTOS} ảnh)`}
              value={pickupPhotos}
              onChange={setPickupPhotos}
              max={BUSINESS.MAX_PICKUP_PHOTOS}
            />
            <p className="text-[11px] text-slate-500">
              Lần nộp {(o.proof?.pickupSubmissionCount ?? 0) + 1}/{BUSINESS.MAX_PICKUP_SUBMISSIONS}. Phát hiện hàng cấm: không bốc hàng và báo sự cố (GB-07).
            </p>
            <Button size="sm" className="w-full" isLoading={busy} disabled={pickupPhotos.length < BUSINESS.MIN_PICKUP_PHOTOS || cashAtPickup} onClick={submitPickup}>
              <Camera className="w-4 h-4 mr-1.5" /> Gửi ảnh cho khách duyệt
            </Button>
          </Step>
        )}

        {/* ---------- PickedUp Pending: chờ khách duyệt (GB-26) */}
        {o.status === 'PickedUp' && o.proof?.pickupStatus === 'Pending' && (
          <Step title="3. Chờ khách hàng duyệt ảnh">
            <div className="flex items-center gap-2 text-xs text-purple-800 bg-purple-50 rounded-xl p-3">
              <Clock className="w-4 h-4 animate-pulse" /> {msg('MSG42')}
            </div>
          </Step>
        )}

        {/* ---------- InTransit: tới điểm giao, POD (UC-DRV-14/15/16/17) */}
        {o.status === 'InTransit' && (
          <Step title="4. Giao hàng">
            <a href={directionsUrl(o.dropoff)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700">
              <Navigation className="w-4 h-4" /> Chỉ đường tới điểm giao
            </a>
            {!atDestination ? (
              <Button
                size="sm"
                className="w-full"
                onClick={() => {
                  setAtDestination(true);
                  toast.info('Đã thông báo cho khách: tài xế đã tới điểm giao.');
                }}
              >
                Đã đến điểm giao
              </Button>
            ) : (
              <>
                {cashAtDropoff && (
                  <Banner kind="info">
                    Người nhận trả tiền mặt {formatCurrency(o.fare.total)}. Nếu người nhận từ chối, người gửi trả thay; tài xế không tự bỏ tiền (GB-40).{' '}
                    <button className="underline font-bold" onClick={collectCash}>
                      Xác nhận đã thu
                    </button>
                  </Banner>
                )}
                <PhotoUploader label="Ảnh giao hàng (POD) *" value={podPhotos} onChange={setPodPhotos} max={1} />
                <Button size="sm" className="w-full" isLoading={busy} disabled={podPhotos.length === 0 || cashAtDropoff} onClick={deliver}>
                  <CheckCircle2 className="w-4 h-4 mr-1.5" /> Xác nhận đã giao hàng
                </Button>
              </>
            )}
          </Step>
        )}

        <div className="pt-2 border-t border-slate-100">
          <Button size="sm" variant="outline" onClick={() => setIncidentOpen(true)}>
            <AlertTriangle className="w-4 h-4 mr-1.5" /> Báo cáo sự cố
          </Button>
          <p className="mt-1 text-[11px] text-slate-400">Tài xế không thể tự huỷ đơn đã nhận; điều phối viên sẽ xử lý (GB-36).</p>
        </div>
      </aside>

      {incidentOpen && <DriverIncidentModal order={o} onClose={() => setIncidentOpen(false)} />}
    </div>
  );
};

const Step: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section className="rounded-2xl border border-slate-200 p-4 space-y-3">
    <h2 className="text-sm font-extrabold text-slate-900">{title}</h2>
    {children}
  </section>
);

/** SCR-27 – Tổng kết thu nhập sau chuyến (GB-14) */
const TripSummary: React.FC<{ order: ShippingOrder; onDone: () => void }> = ({ order, onDone }) => {
  const rate = order.commissionRate ?? BUSINESS.DEFAULT_COMMISSION_RATE;
  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="w-full max-w-sm bg-white border border-slate-200 rounded-2xl p-6 space-y-3 text-sm">
        <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
        <h1 className="text-center font-black">Đã giao đơn {order.code}</h1>
        <dl className="space-y-1 text-xs">
          <div className="flex justify-between">
            <dt>Tổng cước</dt>
            <dd className="font-bold">{formatCurrency(order.fare.total)}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Hoa hồng ModMove ({Math.round(rate * 100)}%)</dt>
            <dd className="font-bold">-{formatCurrency(calculateCommission(order.fare.total, rate))}</dd>
          </div>
          <div className="flex justify-between pt-1 border-t">
            <dt className="font-bold">Thực nhận</dt>
            <dd className="font-black text-emerald-700">{formatCurrency(calculateDriverEarning(order.fare.total, rate))}</dd>
          </div>
        </dl>
        <p className="text-[11px] text-slate-500">Thu nhập được quyết toán vào ví khi khách xác nhận nhận hàng hoặc sau 24 giờ (GB-14, GB-23).</p>
        <Button className="w-full" size="sm" onClick={onDone}>
          Tìm đơn tiếp theo
        </Button>
      </div>
    </div>
  );
};

/** SCR-25 – UC-DRV-18 */
const DriverIncidentModal: React.FC<{ order: ShippingOrder; onClose: () => void }> = ({ order, onClose }) => {
  const [type, setType] = useState<IncidentType>('VehicleBreakdown');
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setPending(true);
    setError(null);
    try {
      const inc = await caseService.reportIncident(order, { reportedBy: 'Driver', reporterId: order.assignedDriver?.id, type, description, photos });
      toast.success(msg('MSG59', { case_type: 'Sự cố', case_id: inc.id, status: 'Mới tiếp nhận', additional_information: 'Điều phối viên sẽ liên hệ.' }));
      onClose();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setPending(false);
    }
  };

  return (
    <Modal open title={`Báo sự cố – ${order.code}`} onClose={onClose} footer={<Button size="sm" variant="danger" isLoading={pending} onClick={submit}>Gửi điều phối viên</Button>}>
      <div className="space-y-3">
        <div className="flex flex-wrap gap-1.5">
          {DRIVER_INCIDENT_TYPES.map((t) => (
            <button key={t} type="button" onClick={() => setType(t)} className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${type === t ? 'bg-rose-600 text-white border-rose-600' : 'border-slate-200 text-slate-600'}`}>
              {INCIDENT_TYPE_LABEL[t]}
            </button>
          ))}
        </div>
        <TextArea label="Mô tả" required value={description} onChange={(e) => setDescription(e.target.value)} placeholder="VD: khách vắng mặt quá 15 phút (GB-35), xe hỏng…" />
        <PhotoUploader label="Ảnh hiện trường" value={photos} onChange={setPhotos} max={BUSINESS.MAX_EVIDENCE_PHOTOS} />
        <p className="text-[11px] text-slate-500">Vị trí GPS hiện tại sẽ được đính kèm.</p>
        {error && <Banner kind="error">{error}</Banner>}
      </div>
    </Modal>
  );
};
