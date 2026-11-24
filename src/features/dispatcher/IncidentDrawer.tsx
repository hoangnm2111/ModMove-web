import React, { useState } from 'react';
import { Ban, CheckCircle2, Phone, PlayCircle, Repeat, Send, Undo2, XCircle } from 'lucide-react';
import { Button } from '../../components/Button';
import { Banner, toast } from '../../components/ui/feedback';
import { Modal } from '../../components/ui/Modal';
import { TextArea, inputClass } from '../../components/ui/Field';
import { Card, DataState, Drawer, KV, PhotoGrid, Pill, SectionTitle, StatusPill, StatusTimeline, cx } from '../../components/ui/kit';
import { MapView } from '../../components/MapView';
import { dispatcherApi } from '../../api/endpoints';
import { useQuery } from '../../api/useQuery';
import { INCIDENT_DECISION, INCIDENT_STATUS, INCIDENT_TYPE, PAYMENT_STATUS, PROOF_STATUS, REFUND_STATUS, reporterLabel } from '../../api/labels';
import type { CargoDisposition, IncidentDetailResponse } from '../../api/types';
import { useAuthStore } from '../../store/useAuthStore';
import { errorMessage } from '../../services/mock/storage';
import { formatCurrency, formatDateTime, timeAgo } from '../../utils/format';
import { PhoneLink } from '../../components/ui/PhoneLink';

type Action = 'continue' | 'reassign' | 'cancelOrder' | 'cancelIncident' | 'refundInfo' | 'refundPropose' | null;

/** UC-DIS-04..10 – Chi tiết & xử lý sự cố: GET /dispatcher/Incidents/{id} */
export const IncidentDrawer: React.FC<{ incidentId: number; onClose: () => void; onChanged: () => void; onOpenOrder?: (id: number) => void }> = ({
  incidentId,
  onClose,
  onChanged,
  onOpenOrder,
}) => {
  const q = useQuery(() => dispatcherApi.incident(incidentId), [incidentId]);
  const me = useAuthStore((s) => s.user);
  const [action, setAction] = useState<Action>(null);
  const [busy, setBusy] = useState(false);
  const i = q.data;

  /** `finished`: quyết định cuối (tiếp tục, đổi tài xế, huỷ đơn, huỷ sự cố) → đóng ngăn chi tiết và tải lại danh sách. */
  const after = async (msg: string, finished = false) => {
    toast.success(msg);
    setAction(null);
    if (finished) {
      onChanged();
      onClose();
      return;
    }
    await q.reload();
    onChanged();
  };
  /** Q10: trả lại sự cố đang giữ (ví dụ hết ca) để điều phối viên khác nhận */
  const release = async () => {
    setBusy(true);
    try {
      await dispatcherApi.releaseIncident(incidentId);
      await after('Đã trả lại sự cố. Điều phối viên khác có thể nhận xử lý.');
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };
  const start = async () => {
    setBusy(true);
    try {
      await dispatcherApi.startIncident(incidentId);
      await after('Đã nhận xử lý. Tài xế và khách đã được báo.');
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const isOpen = i && (i.resolutionStatus === 'Open' || i.resolutionStatus === 'InProgress');
  const mine = i?.resolutionStatus === 'InProgress' && String(i.handledById) === String(me?.id);
  const tripActive = i && ['Accepted', 'Arrived', 'PickedUp', 'InTransit'].includes(i.order.orderStatus);
  const refundOpen = i?.refund && i.refund.refundStatus === 'Requested';
  // Sự cố do tài xế báo còn mở thì chuyến tạm dừng; sự cố của khách không chặn chuyến
  const blocksTrip = !!i && i.reporterRole === 'Driver' && isOpen;
  const orderFinished = !!i && ['Delivered', 'Completed', 'Cancelled'].includes(i.order.orderStatus);

  return (
    <Drawer
      open
      onClose={onClose}
      width="max-w-3xl"
      title={
        i ? (
          <>
            Sự cố #{i.id} – {INCIDENT_TYPE[i.incidentType]} <Pill tone={INCIDENT_STATUS[i.resolutionStatus]} />{' '}
            {isOpen && <Pill tone={blocksTrip ? { label: 'Chặn chuyến', cls: 'bg-rose-50 text-rose-700 border-rose-200' } : { label: 'Không chặn chuyến', cls: 'bg-slate-100 text-slate-600 border-slate-200' }} />}
          </>
        ) : (
          'Chi tiết sự cố'
        )
      }
      footer={
        i &&
        isOpen && (
          <>
            {i.resolutionStatus === 'Open' && (
              <Button size="sm" onClick={start} isLoading={busy}>
                <PlayCircle className="w-4 h-4 mr-1" /> Nhận xử lý
              </Button>
            )}
            {orderFinished && (
              <span className="text-xs text-slate-600 mr-auto self-center">
                Đơn đã {i.order.orderStatus === 'Cancelled' ? 'huỷ' : 'giao xong'} nên không còn chuyến để tiếp tục. Hãy dùng “Huỷ sự cố” và ghi lý do.
              </span>
            )}
            {i.resolutionStatus === 'InProgress' && !mine && <span className="text-xs text-amber-700 mr-auto self-center">Đang được {i.handledByName} xử lý.</span>}
            {mine && (
              <Button size="sm" variant="outline" onClick={release} isLoading={busy} title="Trả về Chờ xử lý cho điều phối viên khác">
                <Undo2 className="w-4 h-4 mr-1" /> Trả lại
              </Button>
            )}
            {(mine || i.resolutionStatus === 'Open') && (
              <>
                {/* Chưa "Nhận xử lý" thì chưa quyết định được: khoá sự cố cho mình trước để hai điều phối viên không xử lý cùng lúc. */}
                {!mine && <span className="text-xs text-slate-500 mr-auto self-center">Bấm “Nhận xử lý” trước khi ra quyết định.</span>}
                <Button size="sm" variant="outline" onClick={() => setAction('cancelIncident')} disabled={!mine} title={mine ? undefined : 'Bấm “Nhận xử lý” trước'}>
                  <Ban className="w-4 h-4 mr-1" /> Huỷ sự cố
                </Button>
                {tripActive && (
                  <>
                    <Button size="sm" variant="outline" onClick={() => setAction('continue')} disabled={!mine} title={mine ? undefined : 'Bấm “Nhận xử lý” trước'}>
                      <CheckCircle2 className="w-4 h-4 mr-1" /> Cho tiếp tục chuyến
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => setAction('reassign')} disabled={!mine} title={mine ? undefined : 'Bấm “Nhận xử lý” trước'}>
                      <Repeat className="w-4 h-4 mr-1" /> Đổi tài xế
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => setAction('cancelOrder')} disabled={!mine} title={mine ? undefined : 'Bấm “Nhận xử lý” trước'}>
                      <XCircle className="w-4 h-4 mr-1" /> Huỷ đơn
                    </Button>
                  </>
                )}
              </>
            )}
          </>
        )
      }
    >
      <DataState q={q}>
        {(i) => (
          <>
            {i.resolutionDecision && (
              <Banner kind="success">
                Đã quyết định: <b>{INCIDENT_DECISION[i.resolutionDecision]}</b> {i.handledByName ? `bởi ${i.handledByName}` : ''} {i.resolvedAt ? `lúc ${formatDateTime(i.resolvedAt)}` : ''}
                {i.resolutionNote ? ` – ${i.resolutionNote}` : ''}
              </Banner>
            )}
            {i.resolutionStatus === 'Cancelled' && <Banner kind="warning">Sự cố đã bị huỷ{i.resolutionNote ? `: ${i.resolutionNote}` : ''}</Banner>}

            <Card title="Nội dung báo cáo">
              <div className="text-xs text-slate-500 mb-1">
                {i.reporterName} ({reporterLabel(i.reporterRole)}) • {formatDateTime(i.createdAt)}
              </div>
              <p className="text-sm text-slate-800 mb-3">{i.description}</p>
              <PhotoGrid urls={i.photoUrls} emptyText="Không có ảnh" />
              {i.latitude && i.longitude && (
                <div className="mt-3">
                  <SectionTitle>Vị trí khi báo</SectionTitle>
                  <MapView className="h-48" point={{ lat: i.latitude, lng: i.longitude }} />
                </div>
              )}
            </Card>

            <div className="grid sm:grid-cols-2 gap-4">
              <Card
                title="Đơn hàng"
                actions={
                  onOpenOrder && (
                    <button className="text-xs font-bold text-blue-600" onClick={() => onOpenOrder(i.orderId)}>
                      Xem đơn
                    </button>
                  )
                }
              >
                <KV label="Mã đơn">
                  {i.orderCode} <StatusPill status={i.order.orderStatus} paymentMethod={i.order.paymentMethod} paymentStatus={i.order.paymentStatus} />
                </KV>
                <KV label="Điểm lấy">{i.order.pickupAddress}</KV>
                <KV label="Điểm giao">{i.order.dropoffAddress}</KV>
                <KV label="Cước">{formatCurrency(i.order.totalFee)}</KV>
                <KV label="Thanh toán">
                  {i.order.paymentMethod === 'PayOS' ? 'PayOS' : 'Tiền mặt'} <Pill tone={PAYMENT_STATUS[i.order.paymentStatus]} />
                </KV>
              </Card>
              <Card title="Các bên liên quan">
                <SectionTitle>Khách hàng</SectionTitle>
                <KV label={i.customer.fullName}>
                  <a className="text-blue-600 inline-flex items-center gap-1" href={`tel:${i.customer.phoneNumber}`}>
                    <Phone className="w-3 h-3" /> {i.customer.phoneNumber}
                  </a>
                </KV>
                <div className="mt-2">
                  <SectionTitle>Tài xế</SectionTitle>
                  {i.driver ? (
                    <>
                      <KV label={i.driver.fullName}>
                        <a className="text-blue-600 inline-flex items-center gap-1" href={`tel:${i.driver.phoneNumber}`}>
                          <Phone className="w-3 h-3" /> {i.driver.phoneNumber}
                        </a>
                      </KV>
                      <KV label="Xe">
                        <span className="font-mono">{i.driver.licensePlate}</span> • {i.driver.vehicleTypeName}
                      </KV>
                    </>
                  ) : (
                    <p className="text-xs text-slate-400">Chưa có tài xế.</p>
                  )}
                </div>
              </Card>
            </div>

            <Card title="Đối chiếu bằng chứng">
              {i.order.cargo && (
                <div className="mb-3">
                  <SectionTitle>Hàng khách khai báo – {i.order.cargo.cargoTypeName ?? i.order.cargo.cargoType}</SectionTitle>
                  <PhotoGrid urls={i.order.cargo.photoUrls} size="sm" />
                </div>
              )}
              {i.proof ? (
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <SectionTitle right={<Pill tone={PROOF_STATUS[i.proof.proofStatus]} />}>Ảnh lấy hàng</SectionTitle>
                    <PhotoGrid urls={i.proof.pickupPhotoUrls} size="sm" />
                  </div>
                  <div>
                    <SectionTitle>POD</SectionTitle>
                    <PhotoGrid urls={[i.proof.deliveryPhotoUrl]} size="sm" emptyText="Chưa giao" />
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-400">Chưa lấy hàng.</p>
              )}
            </Card>

            {i.refund && (
              <Card
                title="Yêu cầu hoàn tiền kèm sự cố"
                actions={<Pill tone={REFUND_STATUS[i.refund.refundStatus]} />}
              >
                <KV label="Khách yêu cầu" strong>
                  {formatCurrency(i.refund.requestedAmount)}
                </KV>
                {i.refund.proposedAmount !== null && <KV label="Đã đề xuất">{formatCurrency(i.refund.proposedAmount)}</KV>}
                <p className="text-xs text-slate-700 my-2">{i.refund.reason}</p>
                <PhotoGrid urls={i.refund.evidenceUrls} size="sm" emptyText="Không có ảnh" />
                {i.refund.infoRequestNote && (
                  <div className="mt-2 rounded-lg bg-amber-50 border border-amber-200 p-2 text-xs">
                    <b>Đã hỏi:</b> {i.refund.infoRequestNote}
                    <div className="mt-1">
                      <b>Khách trả lời:</b> {i.refund.customerReply ?? <i className="text-slate-500">chưa trả lời</i>}
                    </div>
                  </div>
                )}
                {i.refund.proposalReason && <p className="text-[11px] text-slate-500 mt-2">Ghi chú đề xuất: {i.refund.proposalReason}</p>}
                {refundOpen && i.refund.sourceType === 'Incident' && i.refund.proposedAmount === null && (
                  <div className="flex gap-2 mt-3">
                    <Button size="sm" variant="outline" onClick={() => setAction('refundInfo')}>
                      Xin thêm thông tin
                    </Button>
                    <Button size="sm" onClick={() => setAction('refundPropose')}>
                      <Send className="w-3.5 h-3.5 mr-1" /> Đề xuất số tiền lên Admin
                    </Button>
                  </div>
                )}
              </Card>
            )}

            <Card title="Lịch sử trạng thái đơn">
              <StatusTimeline items={i.statusHistories.map((h) => ({ ...h, at: h.createdAt }))} />
            </Card>

            {action === 'continue' && (
              <ReasonAction title="Cho tiếp tục chuyến" confirm="Xác nhận tiếp tục" onClose={() => setAction(null)} onSubmit={(r) => dispatcherApi.continueTrip(i.id, r).then(() => after('Đã cho chuyến tiếp tục. Khách và tài xế đã được thông báo.', true))} />
            )}
            {action === 'cancelIncident' && (
              <ReasonAction
                title="Huỷ báo cáo sự cố"
                confirm="Huỷ sự cố"
                danger
                onClose={() => setAction(null)}
                onSubmit={(r) => dispatcherApi.cancelIncident(i.id, r).then(() => after('Đã huỷ sự cố.', true))}
              />
            )}
            {action === 'refundInfo' && (
              <ReasonAction
                title="Xin khách bổ sung thông tin"
                label="Câu hỏi cho khách"
                confirm="Gửi câu hỏi"
                onClose={() => setAction(null)}
                onSubmit={(r) => dispatcherApi.incidentRefundRequestInfo(i.id, r).then(() => after('Đã gửi yêu cầu bổ sung cho khách.'))}
              />
            )}
            {action === 'refundPropose' && i.refund && (
              <ProposeModal max={i.refund.requestedAmount} onClose={() => setAction(null)} onSubmit={(a, r) => dispatcherApi.incidentRefundProposal(i.id, a, r).then(() => after('Đã gửi đề xuất lên Quản trị viên duyệt.'))} />
            )}
            {action === 'reassign' && <ReassignModal incident={i} onClose={() => setAction(null)} onDone={() => after('Đã đổi tài xế. Đơn quay về "Tài xế đã nhận", tài xế mới sẽ kiểm hàng lại.', true)} />}
            {action === 'cancelOrder' && <CancelOrderModal incident={i} onClose={() => setAction(null)} onDone={() => after('Đã huỷ đơn do sự cố.', true)} />}
          </>
        )}
      </DataState>
    </Drawer>
  );
};

/* ------------------------------------------------------------------ hộp thoại con */
const ReasonAction: React.FC<{ title: string; label?: string; hint?: string; confirm: string; danger?: boolean; onClose: () => void; onSubmit: (reason: string) => Promise<void> }> = ({
  title,
  label = 'Lý do / ghi chú quyết định',
  hint: _hint, // gợi ý đã bỏ khỏi giao diện (dọn chữ 2026-11-17), giữ prop để không đổi chỗ gọi
  confirm,
  danger,
  onClose,
  onSubmit,
}) => {
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    if (!reason.trim()) return toast.error('Vui lòng nhập nội dung.');
    setBusy(true);
    try {
      await onSubmit(reason.trim());
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal
      open
      title={title}
      onClose={onClose}
      footer={
        <>
          <Button size="sm" variant="outline" onClick={onClose}>
            Đóng
          </Button>
          <Button size="sm" variant={danger ? 'danger' : 'primary'} onClick={submit} isLoading={busy}>
            {confirm}
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <TextArea label={`${label} *`} value={reason} onChange={(e) => setReason(e.target.value)} maxLength={1000} />
      </div>
    </Modal>
  );
};

export const ProposeModal: React.FC<{ max: number; onClose: () => void; onSubmit: (amount: number, reason: string) => Promise<void> }> = ({ max, onClose, onSubmit }) => {
  const [amount, setAmount] = useState<number>(max);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    if (amount < 0 || amount > max) return toast.error(`Số tiền đề xuất từ 0 đến ${formatCurrency(max)}.`);
    if (!reason.trim()) return toast.error('Vui lòng ghi lý do đề xuất.');
    setBusy(true);
    try {
      await onSubmit(Math.round(amount), reason.trim());
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal
      open
      title="Đề xuất hoàn tiền lên Quản trị viên"
      onClose={onClose}
      footer={
        <>
          <Button size="sm" variant="outline" onClick={onClose}>
            Đóng
          </Button>
          <Button size="sm" onClick={submit} isLoading={busy}>
            Gửi đề xuất
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <div className="flex gap-2">
          {[1, 0.5, 0].map((r) => (
            <button key={r} type="button" onClick={() => setAmount(Math.round(max * r))} className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold hover:bg-slate-50">
              {r === 1 ? 'Toàn phần' : r === 0 ? 'Không hoàn' : '50%'}
            </button>
          ))}
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Số tiền đề xuất *</label>
          <input type="number" min={0} max={max} value={amount} onChange={(e) => setAmount(Number(e.target.value))} className={inputClass()} />
        </div>
        <TextArea label="Lý do *" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={1000} />
      </div>
    </Modal>
  );
};

const ReassignModal: React.FC<{ incident: IncidentDetailResponse; onClose: () => void; onDone: () => Promise<void> }> = ({ incident, onClose, onDone }) => {
  const drivers = useQuery(() => dispatcherApi.replacementDrivers(incident.id), [incident.id]);
  const [pick, setPick] = useState<number | null>(null);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    if (!pick) return toast.error('Chọn một tài xế thay thế.');
    if (!reason.trim()) return toast.error('Vui lòng nhập lý do đổi tài xế.');
    setBusy(true);
    try {
      await dispatcherApi.reassign(incident.id, pick, reason.trim());
      await onDone();
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal
      open
      size="lg"
      title="Đổi tài xế"
      onClose={onClose}
      footer={
        <>
          <Button size="sm" variant="outline" onClick={onClose}>
            Đóng
          </Button>
          <Button size="sm" onClick={submit} isLoading={busy} disabled={!pick}>
            Chuyển đơn cho tài xế đã chọn
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <DataState q={drivers} empty={(d) => d.length === 0}>
          {(list) => (
            <ul className="space-y-2 max-h-72 overflow-y-auto">
              {list.map((d) => (
                <li key={d.driverProfileId}>
                  <button
                    type="button"
                    onClick={() => setPick(d.driverProfileId)}
                    className={cx('w-full text-left p-3 rounded-xl border text-xs flex items-center gap-3', pick === d.driverProfileId ? 'border-blue-600 bg-blue-50' : 'border-slate-200 hover:bg-slate-50')}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-black text-slate-900">{d.fullName}</div>
                      <div className="text-slate-500">
                        <PhoneLink phone={d.phoneNumber} /> • <span className="font-mono">{d.licensePlate}</span> • {d.vehicleTypeName}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-black text-blue-700">{d.distanceKm.toFixed(1)} km</div>
                      <div className="text-slate-400">GPS {timeAgo(d.lastLocationAt)}</div>
                      <div className="text-slate-400">Cọc {formatCurrency(d.depositBalance)}</div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </DataState>
        <TextArea label="Lý do đổi tài xế *" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={1000} />
      </div>
    </Modal>
  );
};

const CancelOrderModal: React.FC<{ incident: IncidentDetailResponse; onClose: () => void; onDone: () => Promise<void> }> = ({ incident, onClose, onDone }) => {
  const paidPayOs = incident.order.paymentMethod === 'PayOS' && incident.order.paymentStatus === 'Paid';
  const cargoOnVehicle = ['PickedUp', 'InTransit'].includes(incident.order.orderStatus);
  const [refund, setRefund] = useState(false);
  const [disposition, setDisposition] = useState<CargoDisposition | ''>('');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    if (!reason.trim()) return toast.error('Vui lòng nhập lý do huỷ.');
    if (cargoOnVehicle && !disposition) return toast.error('Hàng đang trên xe: chọn trả về điểm lấy hay giữ lại.');
    setBusy(true);
    try {
      await dispatcherApi.cancelOrder(incident.id, reason.trim(), refund, cargoOnVehicle ? (disposition as CargoDisposition) : null);
      await onDone();
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal
      open
      size="lg"
      title="Huỷ đơn do sự cố"
      onClose={onClose}
      footer={
        <>
          <Button size="sm" variant="outline" onClick={onClose}>
            Đóng
          </Button>
          <Button size="sm" variant="danger" onClick={submit} isLoading={busy}>
            Huỷ đơn
          </Button>
        </>
      }
    >
      <div className="space-y-3 text-xs">
        <Banner kind="warning">
          Hàng cấm hoặc khách vắng mặt ở điểm lấy: <b>không hoàn tiền</b>. Không tìm được tài xế thay thế: đơn PayOS đã thanh toán <b>hoàn 100%</b> phần còn lại. Đơn tiền mặt xử lý ngoài hệ thống. Tài
          xế cũ không nhận tiền chuyến này.
        </Banner>
        <label className={cx('flex items-start gap-2 p-3 rounded-xl border', paidPayOs ? 'border-slate-200' : 'border-slate-100 opacity-60')}>
          <input type="checkbox" disabled={!paidPayOs} checked={refund} onChange={(e) => setRefund(e.target.checked)} />
          <span>
            <b>Hoàn tiền cho khách</b> {paidPayOs ? `(tối đa ${formatCurrency(incident.order.totalFee)} trừ phần đã duyệt)` : '– chỉ áp dụng đơn PayOS đã thanh toán'}
          </span>
        </label>
        {cargoOnVehicle && (
          <div>
            <span className="block font-bold text-slate-700 mb-1">Hàng đang trên xe – xử lý thế nào? *</span>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  ['ReturnToPickup', 'Trả về điểm lấy'],
                  ['Keep', 'Giữ lại'],
                ] as const
              ).map(([v, l]) => (
                <button key={v} type="button" onClick={() => setDisposition(v)} className={cx('p-2.5 rounded-xl border font-bold', disposition === v ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-200')}>
                  {l}
                </button>
              ))}
            </div>
          </div>
        )}
        <TextArea label="Lý do huỷ *" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={1000} />
      </div>
    </Modal>
  );
};
