import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, MapPin, Navigation, Power, RefreshCw, Satellite, XCircle } from 'lucide-react';
import { Button } from '../../components/Button';
import { Banner, toast } from '../../components/ui/feedback';
import { Modal } from '../../components/ui/Modal';
import { Card, DataState, Empty, KV, Loading, PageShell, PhotoGrid, cx } from '../../components/ui/kit';
import { MapEmbed } from '../../components/MapEmbed';
import { driverApi } from '../../api/endpoints';
import { useQuery } from '../../api/useQuery';
import { PAYER_ROLE } from '../../api/labels';
import type { NearbyOrderDto } from '../../api/types';
import { useDriver } from '../../features/driver/DriverContext';
import { errorMessage } from '../../services/mock/storage';
import { formatCurrency, timeAgo } from '../../utils/format';

/** UC-DRV-08/09/10 – Xem đơn gần và nhận đơn: GET /driver/Matching/orders, POST .../accept */
export const DriverJobListPage: React.FC = () => {
  const navigate = useNavigate();
  const { status: s, toggleOnline, toggling, gps, reload } = useDriver();
  const jobs = useQuery(() => driverApi.nearbyOrders(), [s?.isOnline, s?.activeOrderId], { enabled: !!s?.canReceiveOrders, refreshMs: 15_000 });
  const [pick, setPick] = useState<NearbyOrderDto | null>(null);

  if (!s)
    return (
      <PageShell title="Nhận đơn gần tôi">
        <Loading />
      </PageShell>
    );

  const checks = [
    { ok: s.hasProfile && s.approvalStatus === 'Approved', label: 'Hồ sơ đã được duyệt', fix: () => navigate('/driver/profile'), fixLabel: 'Xem hồ sơ' },
    { ok: s.isOnline, label: 'Đang bật nhận đơn (Online)' },
    { ok: !s.isGpsStale, label: s.lastLocationAt ? `GPS mới (cập nhật ${timeAgo(s.lastLocationAt)})` : 'Đã gửi vị trí GPS' },
    { ok: !s.activeOrderId, label: 'Không có đơn đang chạy', fix: () => navigate('/driver/trip'), fixLabel: 'Xem chuyến' },
  ];

  return (
    <PageShell
      title="Nhận đơn gần tôi"
      subtitle="Đơn trong bán kính ghép đơn, đúng loại xe, gần nhất trước – tài xế nhận trước sẽ được giao đơn"
      actions={
        s.approvalStatus === 'Approved' && (
          <Button size="sm" variant={s.isOnline ? 'outline' : 'primary'} onClick={toggleOnline} isLoading={toggling}>
            <Power className="w-4 h-4 mr-1" /> {s.isOnline ? 'Tắt nhận đơn' : 'Bật nhận đơn'}
          </Button>
        )
      }
    >
      <div className="w-full space-y-4">
        <div className="grid lg:grid-cols-3 gap-4">
          <Card title="Điều kiện nhận đơn" className="lg:col-span-2">
            <ul className="grid sm:grid-cols-2 gap-2">
              {checks.map((c) => (
                <li key={c.label} className={cx('flex items-center gap-2 rounded-xl border p-2.5 text-xs font-semibold', c.ok ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-rose-200 bg-rose-50 text-rose-800')}>
                  {c.ok ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                  <span className="flex-1">{c.label}</span>
                  {!c.ok && c.fix && (
                    <button onClick={c.fix} className="underline font-bold">
                      {c.fixLabel}
                    </button>
                  )}
                </li>
              ))}
            </ul>
            <p className="text-[11px] text-slate-500 mt-3">
              Đơn tiền mặt chỉ hiện khi ví cọc ≥ mức tiền cọc tối thiểu và ≥ hoa hồng của đơn. Ví cọc hiện tại: <b>{formatCurrency(s.depositBalance)}</b>.
            </p>
          </Card>
          <Card title="Vị trí GPS">
            <div className={cx('flex items-center gap-2 text-xs font-bold', gps.error ? 'text-rose-600' : gps.sharing ? 'text-emerald-600' : 'text-slate-500')}>
              <Satellite className="w-4 h-4" />
              {gps.error ?? (gps.sharing ? `Đang chia sẻ vị trí${gps.lastSentAt ? ` – gửi ${timeAgo(new Date(gps.lastSentAt).toISOString())}` : ''}` : 'Chưa chia sẻ vị trí')}
            </div>
            <label className="flex items-center gap-2 text-xs text-slate-600 mt-2">
              <input type="checkbox" checked={gps.enabled} onChange={(e) => gps.setSharing(e.target.checked)} /> Gửi vị trí từ trình duyệt này khi Online / đang có đơn
            </label>
            <p className="text-[11px] text-slate-400 mt-2">Quá 5 phút không có GPS sẽ không thấy đơn mới và bị ẩn khỏi bản đồ điều phối.</p>
          </Card>
        </div>

        {s.activeOrderId && (
          <Banner kind="info">
            Bạn đang có đơn #{s.activeOrderId}.{' '}
            <button className="underline font-bold" onClick={() => navigate('/driver/trip')}>
              Xem chuyến hiện tại
            </button>
          </Banner>
        )}

        <Card
          title={`Đơn đang chờ (${jobs.data?.length ?? 0})`}
          actions={
            <button onClick={() => (jobs.reload(), reload())} className="text-xs font-bold text-blue-600 flex items-center gap-1">
              <RefreshCw className="w-3.5 h-3.5" /> Làm mới
            </button>
          }
        >
          {!s.canReceiveOrders ? (
            <Empty text="Chưa đủ điều kiện nhận đơn – hoàn thành các mục ở trên." />
          ) : (
            <DataState q={jobs} empty={(d) => d.length === 0}>
              {(list) => (
                <ul className="grid md:grid-cols-2 gap-3">
                  {list.map((j) => (
                    <li key={j.orderId}>
                      <button onClick={() => setPick(j)} className="w-full text-left border border-slate-200 hover:border-slate-400 rounded-2xl p-4 transition">
                        <div className="flex items-center gap-2">
                          <b className="text-sm">{j.orderCode}</b>
                          <span className={cx('text-[10px] font-bold px-2 py-0.5 rounded-full', j.paymentMethod === 'Cash' ? 'bg-amber-50 text-amber-700' : 'bg-blue-50 text-blue-700')}>
                            {j.paymentMethod === 'Cash' ? 'Tiền mặt' : 'PayOS đã trả'}
                          </span>
                          <span className="ml-auto text-xs font-bold text-slate-500">cách {j.distanceToPickupKm.toFixed(1)} km</span>
                        </div>
                        <div className="text-xs text-slate-600 mt-2 space-y-1">
                          <div className="flex gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                            <span className="truncate">{j.pickupAddress}</span>
                          </div>
                          <div className="flex gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                            <span className="truncate">{j.dropoffAddress}</span>
                          </div>
                        </div>
                        <div className="flex items-end justify-between mt-3">
                          <div className="text-[11px] text-slate-400">
                            {j.estimatedDistanceKm} km • ~{j.estimatedDurationMin}' • {j.cargoTypeName ?? j.cargoType} • {j.cargoWeightKg} kg
                          </div>
                          <div className="text-right">
                            <div className="text-[10px] text-slate-400">Bạn nhận</div>
                            <div className="text-lg font-black text-emerald-700">{formatCurrency(j.driverEarning)}</div>
                          </div>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </DataState>
          )}
        </Card>
      </div>
      {pick && (
        <JobModal
          job={pick}
          onClose={() => setPick(null)}
          onAccepted={async () => {
            setPick(null);
            await reload();
            navigate('/driver/trip');
          }}
          onGone={() => (setPick(null), jobs.reload())}
        />
      )}
    </PageShell>
  );
};

const JobModal: React.FC<{ job: NearbyOrderDto; onClose: () => void; onAccepted: () => Promise<void>; onGone: () => void }> = ({ job: j, onClose, onAccepted, onGone }) => {
  const [busy, setBusy] = useState(false);
  const accept = async () => {
    setBusy(true);
    try {
      await driverApi.acceptOrder(j.orderId);
      toast.success(`Đã nhận đơn ${j.orderCode}. Hãy di chuyển tới điểm lấy hàng.`);
      await onAccepted();
    } catch (e) {
      const msg = errorMessage(e);
      toast.error(msg);
      if (/CONFLICT|trùng|thay đổi|huỷ/i.test(msg)) onGone();
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal
      open
      size="lg"
      title={`Đơn ${j.orderCode}`}
      onClose={onClose}
      footer={
        <>
          <Button size="sm" variant="outline" onClick={onClose}>
            Đóng
          </Button>
          <Button size="sm" onClick={accept} isLoading={busy}>
            <CheckCircle2 className="w-4 h-4 mr-1" /> Nhận đơn – nhận {formatCurrency(j.driverEarning)}
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <MapEmbed className="h-52" from={{ lat: j.pickupLatitude, lng: j.pickupLongitude }} to={{ lat: j.dropoffLatitude, lng: j.dropoffLongitude }} />
        <div className="grid sm:grid-cols-2 gap-x-6">
          <div>
            <KV label="Điểm lấy">{j.pickupAddress}</KV>
            <KV label="Điểm giao">{j.dropoffAddress}</KV>
            <KV label="Cách điểm lấy">{j.distanceToPickupKm.toFixed(1)} km</KV>
            <KV label="Quãng đường chở">
              {j.estimatedDistanceKm} km • ~{j.estimatedDurationMin} phút
            </KV>
          </div>
          <div>
            <KV label="Tổng cước">{formatCurrency(j.totalFee)}</KV>
            <KV label="Hoa hồng nền tảng">-{formatCurrency(j.commissionAmount)}</KV>
            <KV label="Bạn nhận" strong>
              <span className="text-emerald-700">{formatCurrency(j.driverEarning)}</span>
            </KV>
            <KV label="Thanh toán">{j.paymentMethod === 'Cash' ? `Tiền mặt – ${j.payerRole ? PAYER_ROLE[j.payerRole] : ''}` : 'PayOS (đã thanh toán)'}</KV>
            <KV label="Bốc xếp">{j.hasLoadingService ? 'Có – hỗ trợ bốc xếp 2 đầu' : 'Không'}</KV>
          </div>
        </div>
        <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 text-xs">
          <b>Hàng:</b> {j.cargoTypeName ?? j.cargoType} • {j.cargoQuantity} kiện • {j.cargoWeightKg} kg • món lớn nhất {j.cargoLengthCm}×{j.cargoWidthCm}×{j.cargoHeightCm} cm
          {j.specialNotes && <div className="mt-1 text-amber-800">Ghi chú: {j.specialNotes}</div>}
          <div className="mt-2">
            <PhotoGrid urls={j.cargoPhotoUrls} size="sm" />
          </div>
        </div>
        {j.paymentMethod === 'Cash' && (
          <Banner kind="warning">
            Đơn tiền mặt: hoa hồng {formatCurrency(j.commissionAmount)} sẽ trừ vào ví cọc khi đơn hoàn tất.
          </Banner>
        )}
        <p className="text-[11px] text-slate-400 flex gap-1">
          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" /> Đã nhận thì không tự huỷ được; gặp sự cố phải báo để Điều phối xử lý.
        </p>
        <a className="text-xs font-bold text-blue-600 inline-flex items-center gap-1" target="_blank" rel="noreferrer" href={`https://www.google.com/maps/dir/?api=1&destination=${j.pickupLatitude},${j.pickupLongitude}`}>
          <Navigation className="w-3.5 h-3.5" /> Xem đường tới điểm lấy
        </a>
      </div>
    </Modal>
  );
};
