import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, CheckCircle2, CircleDollarSign, Flag, MapPin, Navigation, ShieldAlert, Truck } from 'lucide-react';
import { Button } from '../../components/Button';
import { Banner } from '../../components/ui/feedback';
import { Card, Empty, KV, Loading, PageShell, PhotoGrid } from '../../components/ui/kit';
import { MapEmbed } from '../../components/MapEmbed';
import type { NearbyOrderDto } from '../../api/types';
import { PAYER_ROLE } from '../../api/labels';
import { useDriver } from '../../features/driver/DriverContext';
import { ACCEPTED_KEY } from './DriverJobListPage';
import { formatCurrency } from '../../utils/format';

const readAccepted = (id: number | null): NearbyOrderDto | null => {
  try {
    const j = JSON.parse(sessionStorage.getItem(ACCEPTED_KEY) ?? 'null') as NearbyOrderDto | null;
    return j && j.orderId === id ? j : null;
  } catch {
    return null;
  }
};

const STEPS = [
  { Icon: Navigation, label: 'Đến điểm lấy & xác nhận đã đến (trong 500 m)' },
  { Icon: Camera, label: 'Kiểm hàng, chụp 2–5 ảnh lấy hàng, chờ khách duyệt' },
  { Icon: Truck, label: 'Vận chuyển tới điểm giao' },
  { Icon: Flag, label: 'Báo đã tới điểm giao' },
  { Icon: CheckCircle2, label: 'Chụp ảnh giao hàng (POD), đơn chuyển Đã giao' },
  { Icon: CircleDollarSign, label: 'Xác nhận đã thu tiền mặt (đơn COD)' },
  { Icon: ShieldAlert, label: 'Báo sự cố giữa đường (hỏng xe, hàng cấm, khách vắng mặt…)' },
];

/** Chuyến hiện tại của tài xế – activeOrderId lấy từ GET /driver/status */
export const DriverHomePage: React.FC = () => {
  const navigate = useNavigate();
  const { status: s } = useDriver();
  if (!s)
    return (
      <PageShell title="Chuyến hiện tại">
        <Loading />
      </PageShell>
    );
  const job = readAccepted(s.activeOrderId);

  return (
    <PageShell title="Chuyến hiện tại" subtitle={s.activeOrderId ? `Đơn #${s.activeOrderId}` : 'Bạn chưa có chuyến nào đang chạy'}>
      <div className="max-w-5xl mx-auto space-y-4">
        {!s.activeOrderId ? (
          <Empty
            text="Chưa có chuyến đang chạy."
            action={
              <Button size="sm" onClick={() => navigate('/driver')}>
                Tìm đơn gần tôi
              </Button>
            }
          />
        ) : (
          <>
            <Banner kind="warning">
              Các bước thực hiện chuyến (đến nơi, ảnh lấy hàng, giao hàng POD, thu COD, báo sự cố) được làm trên <b>app ModMove cho tài xế</b>. Backend hiện chưa cung cấp API
              cho các bước này nên web chưa thao tác được. Hệ thống vẫn nhận vị trí GPS từ trình duyệt này khi bạn mở trang.
            </Banner>
            {job ? (
              <div className="grid lg:grid-cols-2 gap-4">
                <Card title={`Đơn ${job.orderCode}`}>
                  <KV label="Điểm lấy">{job.pickupAddress}</KV>
                  <KV label="Điểm giao">{job.dropoffAddress}</KV>
                  <KV label="Quãng đường">
                    {job.estimatedDistanceKm} km • ~{job.estimatedDurationMin} phút
                  </KV>
                  <KV label="Hàng">
                    {job.cargoTypeName ?? job.cargoType} • {job.cargoQuantity} kiện • {job.cargoWeightKg} kg
                  </KV>
                  <KV label="Thanh toán">{job.paymentMethod === 'Cash' ? `Tiền mặt – ${job.payerRole ? PAYER_ROLE[job.payerRole] : ''} (${formatCurrency(job.totalFee)})` : 'PayOS – đã thanh toán'}</KV>
                  <KV label="Bạn nhận" strong>
                    <span className="text-emerald-700">{formatCurrency(job.driverEarning)}</span>
                  </KV>
                  {job.specialNotes && <p className="text-xs text-amber-800 mt-2">Ghi chú: {job.specialNotes}</p>}
                  <div className="mt-3">
                    <PhotoGrid urls={job.cargoPhotoUrls} size="sm" />
                  </div>
                  <div className="flex flex-wrap gap-2 mt-4">
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${job.pickupLatitude},${job.pickupLongitude}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold"
                    >
                      <MapPin className="w-4 h-4" /> Dẫn đường tới điểm lấy
                    </a>
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&origin=${job.pickupLatitude},${job.pickupLongitude}&destination=${job.dropoffLatitude},${job.dropoffLongitude}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700"
                    >
                      <Navigation className="w-4 h-4" /> Dẫn đường tới điểm giao
                    </a>
                  </div>
                </Card>
                <Card title="Bản đồ tuyến" padded>
                  <MapEmbed className="h-80" from={{ lat: job.pickupLatitude, lng: job.pickupLongitude }} to={{ lat: job.dropoffLatitude, lng: job.dropoffLongitude }} />
                </Card>
              </div>
            ) : (
              <Card title={`Đơn #${s.activeOrderId}`}>
                <p className="text-xs text-slate-500">
                  Chi tiết đơn được hiển thị khi bạn nhận đơn trên trình duyệt này. Backend chưa có API “đơn hiện tại của tài xế”, hãy xem chi tiết trên app.
                </p>
              </Card>
            )}
            <Card title="Các bước của chuyến">
              <ol className="space-y-2">
                {STEPS.map(({ Icon, label }, i) => (
                  <li key={label} className="flex items-center gap-3 text-xs rounded-xl border border-slate-200 p-2.5">
                    <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 font-black flex items-center justify-center">{i + 1}</span>
                    <Icon className="w-4 h-4 text-slate-500" />
                    <span className="flex-1 text-slate-700">{label}</span>
                    <span className="text-[10px] font-bold text-slate-400">Thực hiện trên app</span>
                  </li>
                ))}
              </ol>
            </Card>
          </>
        )}
      </div>
    </PageShell>
  );
};
