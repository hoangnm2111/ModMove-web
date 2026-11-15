import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Navigation, ShieldAlert } from 'lucide-react';
import { Button } from '../../components/Button';
import { Banner } from '../../components/ui/feedback';
import { Card, DataState, Empty, KV, PageShell, PhotoGrid, Pill, StatusPill, StatusTimeline } from '../../components/ui/kit';
import { MapEmbed } from '../../components/MapEmbed';
import { driverApi } from '../../api/endpoints';
import { INCIDENT_STATUS, INCIDENT_TYPE, PAYER_ROLE, PROOF_STATUS } from '../../api/labels';
import type { DriverTripDetailResponse } from '../../api/types';
import { useQuery } from '../../api/useQuery';
import { useNotificationRefresh, useOrderRealtime } from '../../hooks/useRealtime';
import { formatCurrency } from '../../utils/format';

/** Việc tài xế cần làm tiếp theo trên app, theo trạng thái đơn. */
const nextStep = (t: DriverTripDetailResponse): string => {
  if (t.incidents.some((i) => i.reportedByYou && (i.resolutionStatus === 'Open' || i.resolutionStatus === 'InProgress'))) return 'Chuyến đang tạm dừng: chờ điều phối viên xử lý sự cố bạn đã báo.';
  switch (t.orderStatus) {
    case 'Accepted':
      return t.handoverPoint ? 'Đến điểm bàn giao để nhận hàng từ xe trước, rồi xác nhận đã đến.' : 'Đến điểm lấy hàng rồi xác nhận đã đến.';
    case 'Arrived':
      return 'Kiểm hàng và gửi 2–5 ảnh lấy hàng để khách duyệt.';
    case 'PickedUp':
      return t.proof?.proofStatus === 'Rejected' ? 'Khách đã từ chối ảnh: chụp lại và gửi ảnh mới.' : 'Chờ khách duyệt ảnh lấy hàng.';
    case 'InTransit':
      return t.cashToCollect > 0 && t.paymentStatus !== 'Paid' ? 'Giao hàng, thu tiền mặt rồi chụp ảnh giao hàng để hoàn tất.' : 'Giao hàng rồi chụp ảnh giao hàng để hoàn tất.';
    default:
      return '';
  }
};

/** Chuyến đang chạy của tài xế (GET /driver/Trips/active). Web chỉ xem; các bước thực hiện làm trên app (DECISIONS C11). */
export const DriverHomePage: React.FC = () => {
  const navigate = useNavigate();
  const q = useQuery(() => driverApi.activeTrip(), [], { refreshMs: 30_000 });
  useOrderRealtime(() => void q.reload());
  useNotificationRefresh(() => void q.reload());
  const trip = q.data ?? null;

  return (
    <PageShell title="Chuyến hiện tại" subtitle={trip ? `Đơn ${trip.orderCode}` : 'Chuyến đang chạy của bạn'}>
      <div className="w-full space-y-4">
        <DataState q={q}>
          {() =>
            !trip ? (
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
                <Banner kind="info">
                  Xác nhận đã đến, gửi ảnh lấy hàng, thu tiền mặt, giao hàng và báo sự cố được thực hiện trên <b>app ModMove cho tài xế</b>. Trang này hiển thị trạng thái chuyến và tự cập nhật.
                  {nextStep(trip) && <span className="block mt-1 font-semibold">Việc tiếp theo: {nextStep(trip)}</span>}
                </Banner>
                <div className="grid lg:grid-cols-2 gap-4">
                  <Card title={`Đơn ${trip.orderCode}`} actions={<StatusPill status={trip.orderStatus} />}>
                    <KV label="Điểm lấy">{trip.pickupAddress}</KV>
                    <KV label="Điểm giao">{trip.dropoffAddress}</KV>
                    <KV label="Quãng đường">
                      {trip.estimatedDistanceKm} km • ~{trip.estimatedDurationMin} phút
                    </KV>
                    <KV label="Khách hàng">
                      {trip.customerName} • {trip.customerPhone}
                    </KV>
                    <KV label="Người nhận">
                      {trip.receiverName} • {trip.receiverPhone}
                    </KV>
                    <KV label="Hàng">
                      {trip.cargo.cargoTypeName ?? trip.cargo.cargoType} • {trip.cargo.quantity} kiện • {trip.cargo.weightKg} kg
                    </KV>
                    <KV label="Thanh toán">
                      {trip.paymentMethod === 'Cash'
                        ? `Tiền mặt – ${trip.payerRole ? PAYER_ROLE[trip.payerRole] : ''}${trip.paymentStatus === 'Paid' ? ' (đã thu)' : ` (cần thu ${formatCurrency(trip.cashToCollect)})`}`
                        : 'PayOS – đã thanh toán'}
                    </KV>
                    <KV label="Tổng cước">{formatCurrency(trip.totalFee)}</KV>
                    <KV label="Bạn nhận" strong>
                      <span className="text-emerald-700">{formatCurrency(trip.driverEarning)}</span>
                    </KV>
                    {trip.cargo.specialNotes && <p className="text-xs text-amber-800 mt-2">Ghi chú: {trip.cargo.specialNotes}</p>}
                    <div className="mt-3">
                      <PhotoGrid urls={trip.cargo.photoUrls} size="sm" />
                    </div>
                    <div className="flex flex-wrap gap-2 mt-4">
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${trip.pickupLatitude},${trip.pickupLongitude}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold"
                      >
                        <MapPin className="w-4 h-4" /> Dẫn đường tới điểm lấy
                      </a>
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&origin=${trip.pickupLatitude},${trip.pickupLongitude}&destination=${trip.dropoffLatitude},${trip.dropoffLongitude}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700"
                      >
                        <Navigation className="w-4 h-4" /> Dẫn đường tới điểm giao
                      </a>
                    </div>
                  </Card>
                  <Card title="Bản đồ tuyến" padded>
                    <MapEmbed className="h-80" from={{ lat: trip.pickupLatitude, lng: trip.pickupLongitude }} to={{ lat: trip.dropoffLatitude, lng: trip.dropoffLongitude }} />
                  </Card>
                </div>

                {trip.proof && (
                  <Card title="Ảnh lấy hàng" actions={<Pill tone={PROOF_STATUS[trip.proof.proofStatus]} />}>
                    <p className="text-xs text-slate-500 mb-2">
                      Đã gửi {trip.proof.pickupSubmissionCount}/5 lần • còn {trip.proof.remainingPickupSubmissions} lần gửi
                    </p>
                    <PhotoGrid urls={trip.proof.pickupPhotoUrls} size="sm" />
                    {trip.proof.rejectionReason && <p className="text-xs text-rose-700 mt-2">Khách từ chối: {trip.proof.rejectionReason}</p>}
                  </Card>
                )}

                {trip.incidents.length > 0 && (
                  <Card
                    title={`Sự cố trên chuyến (${trip.incidents.length})`}
                    actions={
                      <Button size="sm" variant="outline" onClick={() => navigate('/driver/incidents')}>
                        Sự cố của tôi
                      </Button>
                    }
                  >
                    <ul className="space-y-2">
                      {trip.incidents.map((i) => (
                        <li key={i.id} className="flex items-start gap-2 text-xs rounded-xl border border-slate-200 p-2.5">
                          <ShieldAlert className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-slate-800">
                              #{i.id} • {INCIDENT_TYPE[i.incidentType]} • {i.reportedByYou ? 'Bạn báo' : 'Khách hoặc điều phối viên báo'}
                            </div>
                            {i.description && <div className="text-slate-600 break-words">{i.description}</div>}
                          </div>
                          <Pill tone={INCIDENT_STATUS[i.resolutionStatus]} />
                        </li>
                      ))}
                    </ul>
                  </Card>
                )}

                <Card title="Lịch sử trạng thái">
                  <StatusTimeline items={trip.statusHistories.map((h) => ({ fromStatus: h.fromStatus, toStatus: h.toStatus, changedByRole: h.changedByRole, note: h.note, at: h.changedAt }))} />
                </Card>
              </>
            )
          }
        </DataState>
      </div>
    </PageShell>
  );
};
