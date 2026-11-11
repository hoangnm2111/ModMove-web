import React, { useState } from 'react';
import { HelpCircle, Phone, Send, Star } from 'lucide-react';
import { Button } from '../../components/Button';
import { Banner, toast } from '../../components/ui/feedback';
import { Modal } from '../../components/ui/Modal';
import { TextArea } from '../../components/ui/Field';
import { Card, DataState, Drawer, KV, PageShell, Pager, PhotoGrid, Pill, SearchBox, SectionTitle, StatusPill, StatusTimeline, Table, Tabs, cx } from '../../components/ui/kit';
import { dispatcherApi } from '../../api/endpoints';
import { useQuery } from '../../api/useQuery';
import { COMPLAINT_STAGE, INCIDENT_DECISION, INCIDENT_STATUS, INCIDENT_TYPE, PROOF_STATUS, REFUND_STATUS } from '../../api/labels';
import type { ComplaintStage } from '../../api/types';
import { ProposeModal } from '../../features/dispatcher/IncidentDrawer';
import { DispatcherOrderDrawer } from '../../features/dispatcher/DispatcherOrderDrawer';
import { errorMessage } from '../../services/mock/storage';
import { formatCurrency, formatDateTime } from '../../utils/format';

type StageTab = ComplaintStage | 'ALL';
const TABS: { key: StageTab; label: string }[] = [
  { key: 'NeedsReview', label: 'Cần xem xét' },
  { key: 'CustomerReplied', label: 'Khách đã trả lời' },
  { key: 'WaitingForCustomer', label: 'Chờ khách' },
  { key: 'ProposedToAdmin', label: 'Đã đề xuất Admin' },
  { key: 'Closed', label: 'Đã đóng' },
  { key: 'ALL', label: 'Tất cả' },
];

/** UC-DIS-11..15 – Khiếu nại: GET /dispatcher/Complaints */
export const DispatcherComplaintsPage: React.FC = () => {
  const [tab, setTab] = useState<StageTab>('NeedsReview');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [openId, setOpenId] = useState<number | null>(null);
  const filters = { stage: tab === 'ALL' ? undefined : tab, search: search.trim() };
  const q = useQuery(() => dispatcherApi.complaints({ ...filters, page, pageSize: 15 }), [JSON.stringify(filters), page], { refreshMs: 30_000 });

  return (
    <PageShell
      title="Khiếu nại của khách"
      subtitle="Đối chiếu bằng chứng, xin thêm thông tin và đề xuất số tiền hoàn lên Admin"
      toolbar={
        <div className="w-full flex flex-wrap items-center gap-2">
          <Tabs value={tab} onChange={(k) => (setTab(k), setPage(1))} items={TABS} />
          <SearchBox className="ml-auto" value={search} onChange={(v) => (setSearch(v), setPage(1))} placeholder="Mã đơn, tên khách…" />
        </div>
      }
    >
      <div className="max-w-7xl mx-auto">
        <Card>
          <DataState q={q} empty={(d) => d.items.length === 0}>
            {(d) => (
              <>
                <Table
                  rows={d.items}
                  rowKey={(r) => r.id}
                  onRow={(r) => setOpenId(r.id)}
                  cols={[
                    { head: 'Mã', cell: (r) => <b>#{r.id}</b> },
                    { head: 'Đơn', cell: (r) => <span className="font-bold">{r.orderCode}</span> },
                    { head: 'Khách', cell: (r) => r.customerName },
                    {
                      head: 'Lý do',
                      cell: (r) => (
                        <div className="max-w-xs">
                          <div className="font-bold">{r.reasonCodeName ?? r.reasonCode}</div>
                          <div className="text-slate-500 truncate">{r.reason}</div>
                        </div>
                      ),
                    },
                    {
                      head: 'Số tiền',
                      className: 'text-right',
                      cell: (r) => (
                        <div>
                          <div className="font-black">{formatCurrency(r.requestedAmount)}</div>
                          {r.proposedAmount !== null && <div className="text-[11px] text-blue-700">Đề xuất {formatCurrency(r.proposedAmount)}</div>}
                        </div>
                      ),
                    },
                    { head: 'Giai đoạn', cell: (r) => <Pill tone={COMPLAINT_STAGE[r.stage]} /> },
                    { head: 'Gửi lúc', cell: (r) => formatDateTime(r.createdAt) },
                  ]}
                />
                <Pager page={d.pageNumber} pageSize={d.pageSize} total={d.totalCount} onChange={setPage} />
              </>
            )}
          </DataState>
        </Card>
      </div>
      {openId && <ComplaintDrawer id={openId} onClose={() => setOpenId(null)} onChanged={() => q.reload()} />}
    </PageShell>
  );
};

const ComplaintDrawer: React.FC<{ id: number; onClose: () => void; onChanged: () => void }> = ({ id, onClose, onChanged }) => {
  const q = useQuery(() => dispatcherApi.complaint(id), [id]);
  const [action, setAction] = useState<'info' | 'propose' | null>(null);
  const [orderId, setOrderId] = useState<number | null>(null);
  const c = q.data;
  const editable = c && c.refundStatus === 'Requested' && ['NeedsReview', 'CustomerReplied', 'WaitingForCustomer'].includes(c.stage);
  const after = async (msg: string) => {
    toast.success(msg);
    setAction(null);
    await q.reload();
    onChanged();
  };
  return (
    <Drawer
      open
      onClose={onClose}
      width="max-w-3xl"
      title={
        c ? (
          <>
            Khiếu nại #{c.id} – {c.orderCode} <Pill tone={COMPLAINT_STAGE[c.stage]} />
          </>
        ) : (
          'Khiếu nại'
        )
      }
      footer={
        editable && (
          <>
            <Button size="sm" variant="outline" onClick={() => setAction('info')}>
              <HelpCircle className="w-4 h-4 mr-1" /> Xin thêm thông tin
            </Button>
            <Button size="sm" onClick={() => setAction('propose')}>
              <Send className="w-4 h-4 mr-1" /> Đề xuất lên Admin
            </Button>
          </>
        )
      }
    >
      <DataState q={q}>
        {(c) => (
          <>
            {c.stage === 'WaitingForCustomer' && <Banner kind="warning">Đang chờ khách trả lời câu hỏi bổ sung.</Banner>}
            <Card title="Nội dung khiếu nại" actions={<Pill tone={REFUND_STATUS[c.refundStatus]} />}>
              <KV label="Lý do">{c.reasonCodeName ?? c.reasonCode ?? '—'}</KV>
              <KV label="Khách yêu cầu" strong>
                {formatCurrency(c.requestedAmount)}
              </KV>
              {c.proposedAmount !== null && (
                <KV label="Đã đề xuất">
                  {formatCurrency(c.proposedAmount)} {c.proposedByName ? `(${c.proposedByName})` : ''}
                </KV>
              )}
              <p className="text-sm text-slate-800 my-2">{c.reason}</p>
              <PhotoGrid urls={c.evidenceUrls} emptyText="Khách không gửi ảnh" />
              {c.infoRequestNote && (
                <div className="mt-3 rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs">
                  <b>Câu hỏi đã gửi:</b> {c.infoRequestNote}
                  <div className="mt-1">
                    <b>Khách trả lời:</b> {c.customerReply ?? <i className="text-slate-500">chưa trả lời</i>}
                  </div>
                </div>
              )}
              {c.proposalReason && <p className="text-[11px] text-slate-500 mt-2">Ghi chú đề xuất (nội bộ): {c.proposalReason}</p>}
            </Card>

            <div className="grid sm:grid-cols-2 gap-4">
              <Card
                title="Đơn hàng"
                actions={
                  <button className="text-xs font-bold text-blue-600" onClick={() => setOrderId(c.orderId)}>
                    Xem đơn
                  </button>
                }
              >
                <KV label="Trạng thái">
                  <StatusPill status={c.order.orderStatus} />
                </KV>
                <KV label="Tổng cước">{formatCurrency(c.order.totalFee)}</KV>
                <KV label="Thanh toán">{c.order.paymentMethod === 'PayOS' ? 'PayOS' : 'Tiền mặt'}</KV>
                <KV label="Giao lúc">{c.order.deliveredAt ? formatDateTime(c.order.deliveredAt) : '—'}</KV>
                <KV label="Điểm giao">{c.order.dropoffAddress}</KV>
              </Card>
              <Card title="Các bên">
                <KV label={`Khách: ${c.customer.fullName}`}>
                  <a className="text-blue-600 inline-flex items-center gap-1" href={`tel:${c.customer.phoneNumber}`}>
                    <Phone className="w-3 h-3" /> {c.customer.phoneNumber}
                  </a>
                </KV>
                {c.driver && (
                  <>
                    <KV label={`Tài xế: ${c.driver.fullName}`}>
                      <a className="text-blue-600 inline-flex items-center gap-1" href={`tel:${c.driver.phoneNumber}`}>
                        <Phone className="w-3 h-3" /> {c.driver.phoneNumber}
                      </a>
                    </KV>
                    <KV label="Xe">
                      <span className="font-mono">{c.driver.licensePlate}</span> • {c.driver.vehicleTypeName}
                    </KV>
                  </>
                )}
                {c.rating && (
                  <div className="mt-2 pt-2 border-t border-slate-100">
                    <SectionTitle>Đánh giá của khách</SectionTitle>
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <Star key={n} className={cx('w-3.5 h-3.5', n <= c.rating!.ratingStars ? 'fill-amber-400 text-amber-400' : 'text-slate-300')} />
                      ))}
                    </div>
                    {c.rating.reviewComment && <p className="text-xs text-slate-600 mt-1">“{c.rating.reviewComment}”</p>}
                  </div>
                )}
              </Card>
            </div>

            <Card title="Đối chiếu bằng chứng">
              {c.order.cargo && (
                <div className="mb-3">
                  <SectionTitle>
                    Hàng khách khai báo – {c.order.cargo.cargoTypeName ?? c.order.cargo.cargoType} ({c.order.cargo.quantity} kiện, {c.order.cargo.weightKg} kg)
                  </SectionTitle>
                  <PhotoGrid urls={c.order.cargo.photoUrls} size="sm" />
                </div>
              )}
              {c.verificationEvidence ? (
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <SectionTitle right={<Pill tone={PROOF_STATUS[c.verificationEvidence.proofStatus]} />}>Ảnh lấy hàng</SectionTitle>
                    <PhotoGrid urls={c.verificationEvidence.pickupPhotoUrls} size="sm" />
                  </div>
                  <div>
                    <SectionTitle>POD</SectionTitle>
                    <PhotoGrid urls={[c.verificationEvidence.deliveryPhotoUrl]} size="sm" />
                    {c.verificationEvidence.deliveryCompletionTime && <p className="text-[11px] text-slate-500 mt-1">{formatDateTime(c.verificationEvidence.deliveryCompletionTime)}</p>}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-400">Không có bằng chứng lấy/giao hàng.</p>
              )}
              {c.incidents.length > 0 && (
                <div className="mt-3">
                  <SectionTitle>Sự cố trước đó của đơn</SectionTitle>
                  <ul className="space-y-1 text-xs">
                    {c.incidents.map((i) => (
                      <li key={i.id} className="flex flex-wrap gap-2 items-center">
                        <b>#{i.id}</b> {INCIDENT_TYPE[i.incidentType]} <Pill tone={INCIDENT_STATUS[i.resolutionStatus]} />
                        {i.resolutionDecision && <span className="text-slate-500">{INCIDENT_DECISION[i.resolutionDecision]}</span>}
                        <span className="text-slate-400">{formatDateTime(i.createdAt)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </Card>

            <Card title="Lịch sử trạng thái đơn">
              <StatusTimeline items={c.statusHistories.map((h) => ({ ...h, at: h.createdAt }))} />
            </Card>

            {action === 'info' && <InfoModal onClose={() => setAction(null)} onSubmit={(note) => dispatcherApi.complaintRequestInfo(c.id, note).then(() => after('Đã gửi câu hỏi cho khách.'))} />}
            {action === 'propose' && (
              <ProposeModal max={c.requestedAmount} onClose={() => setAction(null)} onSubmit={(a, r) => dispatcherApi.complaintProposal(c.id, a, r).then(() => after('Đã gửi đề xuất lên Admin.'))} />
            )}
          </>
        )}
      </DataState>
      {orderId && <DispatcherOrderDrawer orderId={orderId} onClose={() => setOrderId(null)} />}
    </Drawer>
  );
};

const InfoModal: React.FC<{ onClose: () => void; onSubmit: (note: string) => Promise<void> }> = ({ onClose, onSubmit }) => {
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  return (
    <Modal
      open
      title="Xin khách bổ sung thông tin"
      onClose={onClose}
      footer={
        <>
          <Button size="sm" variant="outline" onClick={onClose}>
            Đóng
          </Button>
          <Button
            size="sm"
            isLoading={busy}
            onClick={async () => {
              if (!note.trim()) return toast.error('Nhập câu hỏi cho khách.');
              setBusy(true);
              try {
                await onSubmit(note.trim());
              } catch (e) {
                toast.error(errorMessage(e));
              } finally {
                setBusy(false);
              }
            }}
          >
            Gửi
          </Button>
        </>
      }
    >
      <TextArea label="Câu hỏi / thông tin cần bổ sung *" value={note} onChange={(e) => setNote(e.target.value)} maxLength={1000} />
      <p className="text-[11px] text-slate-400 mt-2">Khách trả lời bằng một đoạn chữ và có thể thêm ảnh (tổng tối đa 5 ảnh).</p>
    </Modal>
  );
};
