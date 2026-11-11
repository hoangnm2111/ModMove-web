import React from 'react';
import { ExternalLink, Phone } from 'lucide-react';
import { dispatcherApi } from '../../api/endpoints';
import { useQuery } from '../../api/useQuery';
import { INCIDENT_DECISION, INCIDENT_STATUS, INCIDENT_TYPE, PAYER_ROLE, PAYMENT_STATUS, PAYMENT_TX_STATUS, PROOF_STATUS, REFUND_SOURCE, REFUND_STATUS } from '../../api/labels';
import { Card, DataState, Drawer, KV, PhotoGrid, Pill, SectionTitle, StatusPill, StatusTimeline } from '../../components/ui/kit';
import { MapEmbed, mapsLink } from '../../components/MapEmbed';
import { formatCurrency, formatDateTime, timeAgo } from '../../utils/format';

/** UC-DIS-01 bước 6 – Chi tiết đầy đủ đơn cho Dispatcher: GET /dispatcher/Orders/{id} */
export const DispatcherOrderDrawer: React.FC<{ orderId: number; onClose: () => void; onOpenIncident?: (id: number) => void }> = ({ orderId, onClose, onOpenIncident }) => {
  const q = useQuery(() => dispatcherApi.order(orderId), [orderId], { refreshMs: 30_000 });
  const o = q.data;
  return (
    <Drawer
      open
      onClose={onClose}
      width="max-w-3xl"
      title={
        o ? (
          <>
            {o.orderCode} <StatusPill status={o.orderStatus} paymentMethod={o.paymentMethod} paymentStatus={o.paymentStatus} /> <Pill tone={PAYMENT_STATUS[o.paymentStatus]} />
          </>
        ) : (
          'Chi tiết đơn'
        )
      }
    >
      <DataState q={q}>
        {(o) => (
          <>
            {o.cancellationReason && <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800">Lý do huỷ: {o.cancellationReason}</div>}
            <div className="grid sm:grid-cols-2 gap-4">
              <Card title="Khách hàng & người nhận">
                <KV label="Khách">{o.customer.fullName}</KV>
                <KV label="Số điện thoại khách">
                  <a className="text-blue-600" href={`tel:${o.customer.phoneNumber}`}>
                    {o.customer.phoneNumber}
                  </a>
                </KV>
                <KV label="Email">{o.customer.email}</KV>
                <KV label="Người nhận">{o.receiver.name}</KV>
                <KV label="Số điện thoại người nhận">
                  <a className="text-blue-600" href={`tel:${o.receiver.phoneNumber}`}>
                    {o.receiver.phoneNumber}
                  </a>
                </KV>
              </Card>
              <Card title="Tài xế">
                {o.driver ? (
                  <>
                    <KV label="Họ tên">{o.driver.fullName}</KV>
                    <KV label="Số điện thoại">
                      <a className="text-blue-600 inline-flex items-center gap-1" href={`tel:${o.driver.phoneNumber}`}>
                        <Phone className="w-3 h-3" /> {o.driver.phoneNumber}
                      </a>
                    </KV>
                    <KV label="Biển số / Loại xe">
                      <span className="font-mono">{o.driver.licensePlate ?? '—'}</span> • {o.vehicleTypeName}
                    </KV>
                    <KV label="GPS cuối">
                      {o.driver.lastLatitude && o.driver.lastLongitude ? (
                        <a className="text-blue-600 inline-flex items-center gap-1" target="_blank" rel="noreferrer" href={mapsLink(o.driver.lastLatitude, o.driver.lastLongitude)}>
                          {timeAgo(o.driver.lastLocationAt ?? undefined)} <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        '—'
                      )}
                    </KV>
                  </>
                ) : (
                  <p className="text-xs text-slate-400">Chưa có tài xế.</p>
                )}
              </Card>
            </div>

            <Card title="Tuyến đường">
              <div className="text-xs space-y-1 mb-3">
                <KV label="Điểm lấy">{o.pickupAddress}</KV>
                <KV label="Điểm giao">{o.dropoffAddress}</KV>
                <KV label="Quãng đường / thời gian">
                  {o.estimatedDistanceKm} km • ~{o.estimatedDurationMin} phút
                </KV>
              </div>
              <MapEmbed
                className="h-56"
                point={o.driver?.lastLatitude && o.driver?.lastLongitude && ['Accepted', 'Arrived', 'PickedUp', 'InTransit'].includes(o.orderStatus) ? { lat: o.driver.lastLatitude, lng: o.driver.lastLongitude } : null}
                from={{ lat: o.pickupLatitude, lng: o.pickupLongitude }}
                to={{ lat: o.dropoffLatitude, lng: o.dropoffLongitude }}
              />
            </Card>

            <div className="grid sm:grid-cols-2 gap-4">
              <Card title="Cước & thanh toán">
                <KV label="Cước quãng đường">{formatCurrency(o.distanceFee)}</KV>
                {o.serviceFee > 0 && <KV label="Phí bốc xếp">{formatCurrency(o.serviceFee)}</KV>}
                {o.discountAmount > 0 && <KV label="Giảm giá">-{formatCurrency(o.discountAmount)}</KV>}
                <KV label="Tổng cước" strong>
                  {formatCurrency(o.totalFee)}
                </KV>
                <KV label="Hình thức">
                  {o.paymentMethod === 'PayOS' ? 'PayOS' : 'Tiền mặt'}
                  {o.payerRole ? ` – ${PAYER_ROLE[o.payerRole]}` : ''}
                </KV>
                {o.commissionAmount !== null && (
                  <KV label={`Hoa hồng (${Math.round((o.commissionRate ?? 0) * 100)}%)`}>{formatCurrency(o.commissionAmount)}</KV>
                )}
                {o.payments.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-slate-100 space-y-1">
                    {o.payments.map((p) => (
                      <div key={p.id} className="flex justify-between text-[11px]">
                        <span className="text-slate-500">
                          {formatDateTime(p.createdAt)} {p.payosOrderCode ? `• #${p.payosOrderCode}` : ''}
                        </span>
                        <Pill tone={PAYMENT_TX_STATUS[p.transactionStatus] ?? PAYMENT_TX_STATUS.Pending} />
                      </div>
                    ))}
                  </div>
                )}
              </Card>
              <Card title="Mốc thời gian">
                <KV label="Tạo đơn">{formatDateTime(o.createdAt)}</KV>
                {o.paidAt && <KV label="Thanh toán">{formatDateTime(o.paidAt)}</KV>}
                {o.acceptedAt && <KV label="Tài xế nhận">{formatDateTime(o.acceptedAt)}</KV>}
                {o.deliveredAt && <KV label="Đã giao">{formatDateTime(o.deliveredAt)}</KV>}
                {o.completedAt && <KV label="Hoàn thành">{formatDateTime(o.completedAt)}</KV>}
              </Card>
            </div>

            <Card title="Hàng hoá & bằng chứng">
              {o.cargo && (
                <div className="mb-3">
                  <KV label="Loại hàng">{o.cargo.cargoTypeName ?? o.cargo.cargoType}</KV>
                  <KV label="SL / KL / Kích thước">
                    {o.cargo.quantity} kiện • {o.cargo.weightKg} kg • {o.cargo.lengthCm}×{o.cargo.widthCm}×{o.cargo.heightCm} cm
                  </KV>
                  {o.cargo.specialNotes && <KV label="Ghi chú">{o.cargo.specialNotes}</KV>}
                  <SectionTitle>Ảnh khách khai báo</SectionTitle>
                  <PhotoGrid urls={o.cargo.photoUrls} size="sm" />
                </div>
              )}
              {o.proof ? (
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <SectionTitle right={<Pill tone={PROOF_STATUS[o.proof.proofStatus]} />}>Ảnh lấy hàng (lần {o.proof.pickupSubmissionCount}/5)</SectionTitle>
                    <PhotoGrid urls={o.proof.pickupPhotoUrls} size="sm" />
                    {o.proof.rejectionReason && <p className="text-[11px] text-rose-600 mt-1">Khách từ chối: {o.proof.rejectionReason}</p>}
                  </div>
                  <div>
                    <SectionTitle>POD</SectionTitle>
                    <PhotoGrid urls={[o.proof.deliveryPhotoUrl]} size="sm" emptyText="Chưa giao" />
                    {o.proof.deliveryCompletionTime && <p className="text-[11px] text-slate-500 mt-1">{formatDateTime(o.proof.deliveryCompletionTime)}</p>}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-400">Chưa có ảnh lấy hàng.</p>
              )}
            </Card>

            {o.incidents.length > 0 && (
              <Card title={`Sự cố (${o.incidents.length})`}>
                <ul className="space-y-2">
                  {o.incidents.map((i) => (
                    <li key={i.id} className="border border-slate-200 rounded-xl p-2.5 text-xs">
                      <div className="flex flex-wrap items-center gap-2">
                        <b>
                          #{i.id} {INCIDENT_TYPE[i.incidentType]}
                        </b>
                        <Pill tone={INCIDENT_STATUS[i.resolutionStatus]} />
                        <span className="text-slate-400">
                          {i.reporterName} • {formatDateTime(i.createdAt)}
                        </span>
                        {onOpenIncident && (
                          <button className="ml-auto text-blue-600 font-bold" onClick={() => onOpenIncident(i.id)}>
                            Mở xử lý
                          </button>
                        )}
                      </div>
                      <p className="text-slate-600 mt-1">{i.description}</p>
                      {i.resolutionDecision && (
                        <p className="text-slate-500 mt-1">
                          {INCIDENT_DECISION[i.resolutionDecision]} {i.handledByName ? `bởi ${i.handledByName}` : ''} {i.resolutionNote ? `– ${i.resolutionNote}` : ''}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            {o.refunds.length > 0 && (
              <Card title={`Hoàn tiền (${o.refunds.length})`}>
                <ul className="space-y-2">
                  {o.refunds.map((r) => (
                    <li key={r.id} className="border border-slate-200 rounded-xl p-2.5 text-xs flex flex-wrap gap-2 items-center">
                      <b>
                        {REFUND_SOURCE[r.sourceType]} #{r.id}
                      </b>
                      <Pill tone={REFUND_STATUS[r.refundStatus]} />
                      <span className="text-slate-500">
                        Yêu cầu {formatCurrency(r.requestedAmount)}
                        {r.proposedAmount !== null && ` • Đề xuất ${formatCurrency(r.proposedAmount)}`}
                      </span>
                      <span className="w-full text-slate-600">{r.reason}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            <Card title="Lịch sử trạng thái">
              <StatusTimeline items={o.statusHistories.map((h) => ({ ...h, at: h.createdAt }))} />
            </Card>
          </>
        )}
      </DataState>
    </Drawer>
  );
};
