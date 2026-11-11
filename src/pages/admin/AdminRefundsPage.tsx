import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Banknote, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '../../components/Button';
import { Banner, toast } from '../../components/ui/feedback';
import { Modal } from '../../components/ui/Modal';
import { Field, TextArea } from '../../components/ui/Field';
import { Card, DataState, Drawer, KV, PageShell, Pager, PhotoGrid, Pill, SearchBox, Select, StatusPill, Table, Tabs } from '../../components/ui/kit';
import { adminApi } from '../../api/endpoints';
import { useQuery } from '../../api/useQuery';
import { REFUND_SOURCE, REFUND_STATUS } from '../../api/labels';
import type { AdminRefundDetailResponse, RefundSourceType, RefundStatus } from '../../api/types';
import { errorMessage } from '../../services/mock/storage';
import { formatCurrency, formatDateTime } from '../../utils/format';
import { PhoneLink } from '../../components/ui/PhoneLink';

type Tab = RefundStatus | 'ALL';
const TABS: { key: Tab; label: string }[] = [
  { key: 'Requested', label: 'Chờ duyệt' },
  { key: 'Approved', label: 'Chờ chuyển khoản' },
  { key: 'Processed', label: 'Đã chuyển' },
  { key: 'Rejected', label: 'Từ chối' },
  { key: 'Withdrawn', label: 'Khách đã rút' },
  { key: 'ALL', label: 'Tất cả' },
];
const SRC_OPTS = [{ value: '', label: 'Mọi nguồn' }, ...(Object.keys(REFUND_SOURCE) as RefundSourceType[]).map((s) => ({ value: s, label: REFUND_SOURCE[s] }))];

/** UC-ADM-17/18 – Duyệt & chi trả hoàn tiền (GB-19, GB-27, GB-41, GB-42) */
export const AdminRefundsPage: React.FC = () => {
  const [params] = useSearchParams();
  const [tab, setTab] = useState<Tab>((params.get('status') as Tab) ?? 'Requested');
  const [source, setSource] = useState<RefundSourceType | ''>('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [openId, setOpenId] = useState<number | null>(null);
  const filters = { status: tab === 'ALL' ? undefined : tab, sourceType: source || undefined, search: search.trim() };
  const q = useQuery(() => adminApi.refunds({ ...filters, page, pageSize: 15 }), [JSON.stringify(filters), page]);

  return (
    <PageShell
      title="Duyệt hoàn tiền & khiếu nại"
      subtitle="Hoàn do huỷ duyệt thẳng; hoàn sự cố/khiếu nại cần đề xuất của Điều phối viên trước • Chi trả thủ công trong 3 ngày làm việc"
      toolbar={
        <div className="w-full flex flex-wrap items-center gap-2">
          <Tabs value={tab} onChange={(k) => (setTab(k), setPage(1))} items={TABS} />
          <div className="ml-auto flex gap-2">
            <Select value={source} onChange={(e) => (setSource(e.target.value as RefundSourceType | ''), setPage(1))} options={SRC_OPTS} />
            <SearchBox value={search} onChange={(v) => (setSearch(v), setPage(1))} placeholder="Mã đơn, khách…" />
          </div>
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
                    { head: 'Nguồn', cell: (r) => REFUND_SOURCE[r.sourceType] },
                    { head: 'Đơn', cell: (r) => <span className="font-bold">{r.orderCode}</span> },
                    { head: 'Khách', cell: (r) => <div>{r.customerName}<div className="text-[11px] text-slate-400"><PhoneLink phone={r.customerPhone} /></div></div> },
                    {
                      head: 'Số tiền',
                      className: 'text-right',
                      cell: (r) => (
                        <div>
                          <div>Yêu cầu {formatCurrency(r.requestedAmount)}</div>
                          {r.proposedAmount !== null ? (
                            <div className="font-black text-blue-700">Đề xuất {formatCurrency(r.proposedAmount)}</div>
                          ) : (
                            r.sourceType !== 'Cancellation' && r.refundStatus === 'Requested' && <div className="text-[11px] text-amber-700">Chờ Dispatcher đề xuất</div>
                          )}
                        </div>
                      ),
                    },
                    { head: 'Trạng thái', cell: (r) => <Pill tone={REFUND_STATUS[r.refundStatus]} /> },
                    { head: 'Tạo lúc', cell: (r) => formatDateTime(r.createdAt) },
                  ]}
                />
                <Pager page={d.pageNumber} pageSize={d.pageSize} total={d.totalCount} onChange={setPage} />
              </>
            )}
          </DataState>
        </Card>
      </div>
      {openId && <RefundDrawer id={openId} onClose={() => setOpenId(null)} onChanged={() => q.reload()} />}
    </PageShell>
  );
};

type Act = 'approve' | 'reject' | 'payout' | null;
const RefundDrawer: React.FC<{ id: number; onClose: () => void; onChanged: () => void }> = ({ id, onClose, onChanged }) => {
  const q = useQuery(() => adminApi.refund(id), [id]);
  const [act, setAct] = useState<Act>(null);
  const r = q.data;
  const canDecide = r && r.refundStatus === 'Requested' && (r.sourceType === 'Cancellation' || r.proposedAmount !== null);
  const done = () => {
    setAct(null);
    void q.reload();
    onChanged();
  };
  return (
    <Drawer
      open
      onClose={onClose}
      width="max-w-3xl"
      title={r ? <>{REFUND_SOURCE[r.sourceType]} #{r.id} <Pill tone={REFUND_STATUS[r.refundStatus]} /></> : 'Hoàn tiền'}
      footer={
        r && (
          <>
            {canDecide && (
              <>
                <Button size="sm" variant="danger" onClick={() => setAct('reject')}>
                  <XCircle className="w-4 h-4 mr-1" /> Từ chối
                </Button>
                <Button size="sm" onClick={() => setAct('approve')}>
                  <CheckCircle2 className="w-4 h-4 mr-1" /> Duyệt {formatCurrency(r.proposedAmount ?? r.requestedAmount)}
                </Button>
              </>
            )}
            {r.refundStatus === 'Approved' && (
              <Button size="sm" onClick={() => setAct('payout')}>
                <Banknote className="w-4 h-4 mr-1" /> Xác nhận đã chuyển khoản
              </Button>
            )}
          </>
        )
      }
    >
      <DataState q={q}>
        {(r) => (
          <>
            {r.refundStatus === 'Requested' && r.sourceType !== 'Cancellation' && r.proposedAmount === null && (
              <Banner kind="warning">Khoản này chưa có đề xuất của Điều phối viên nên chưa thể duyệt.</Banner>
            )}
            <div className="grid sm:grid-cols-3 gap-3">
              <Amount label="Khách yêu cầu" v={r.requestedAmount} />
              <Amount label="Dispatcher đề xuất" v={r.proposedAmount} />
              <Amount label="Tổng cước đơn" v={r.orderTotalFee} />
            </div>
            <Card title="Lý do & bằng chứng">
              {r.reasonCode && <KV label="Mã lý do">{r.reasonCode}</KV>}
              <p className="text-sm text-slate-800 my-2">{r.reason}</p>
              <PhotoGrid urls={r.evidenceUrls} emptyText="Không có ảnh" />
              {r.infoRequestNote && (
                <div className="mt-3 rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs">
                  <b>Dispatcher hỏi:</b> {r.infoRequestNote}
                  <div className="mt-1">
                    <b>Khách trả lời:</b> {r.customerReply ?? <i>chưa trả lời</i>}
                  </div>
                </div>
              )}
              {r.proposalReason && (
                <div className="mt-3 rounded-xl bg-blue-50 border border-blue-200 p-3 text-xs">
                  <b>Lý do đề xuất của {r.proposedByName ?? 'Dispatcher'}:</b> {r.proposalReason}
                </div>
              )}
            </Card>
            <div className="grid sm:grid-cols-2 gap-4">
              <Card title="Đơn & thanh toán">
                <KV label="Mã đơn">
                  {r.orderCode} <StatusPill status={r.orderStatus} paymentMethod={r.paymentMethod} paymentStatus={r.paymentStatus} />
                </KV>
                <KV label="Thanh toán">
                  {r.paymentMethod === 'PayOS' ? 'PayOS' : 'Tiền mặt'} • {r.paymentStatus === 'Paid' ? 'Đã trả' : 'Chưa trả'}
                </KV>
                {r.incidentId && <KV label="Sự cố liên quan">#{r.incidentId}</KV>}
                <KV label="Tạo lúc">{formatDateTime(r.createdAt)}</KV>
              </Card>
              <Card title="Khách & tài xế">
                <KV label="Khách">{r.customerName}</KV>
                <KV label="Số điện thoại / Email">
                  <PhoneLink phone={r.customerPhone} /> • {r.customerEmail}
                </KV>
                {r.driverName && (
                  <KV label="Tài xế">
                    {r.driverName} • <PhoneLink phone={r.driverPhone} /> • <span className="font-mono">{r.licensePlate}</span>
                  </KV>
                )}
              </Card>
            </div>
            {(r.decidedAt || r.processedAt) && (
              <Card title="Kết quả xử lý">
                {r.approvedByName && <KV label="Admin xử lý">{r.approvedByName}</KV>}
                {r.decidedAt && <KV label="Quyết định lúc">{formatDateTime(r.decidedAt)}</KV>}
                {r.decisionNote && <KV label="Ghi chú cho khách">{r.decisionNote}</KV>}
                {r.bankReferenceCode && <KV label="Mã chuyển khoản">{r.bankReferenceCode}</KV>}
                {r.processedAt && <KV label="Chuyển khoản lúc">{formatDateTime(r.processedAt)}</KV>}
              </Card>
            )}
            {act && <ActModal act={act} refund={r} onClose={() => setAct(null)} onDone={done} />}
          </>
        )}
      </DataState>
    </Drawer>
  );
};

const Amount: React.FC<{ label: string; v: number | null }> = ({ label, v }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-3">
    <div className="text-[11px] font-bold text-slate-500">{label}</div>
    <div className="text-lg font-black text-slate-900">{v === null ? '—' : formatCurrency(v)}</div>
  </div>
);

const ActModal: React.FC<{ act: Exclude<Act, null>; refund: AdminRefundDetailResponse; onClose: () => void; onDone: () => void }> = ({ act, refund, onClose, onDone }) => {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    if (act === 'payout' && !text.trim()) return toast.error('Nhập mã giao dịch ngân hàng.');
    setBusy(true);
    try {
      if (act === 'approve') await adminApi.approveRefund(refund.id, text.trim());
      if (act === 'reject') await adminApi.rejectRefund(refund.id, text.trim());
      if (act === 'payout') await adminApi.payoutRefund(refund.id, text.trim());
      toast.success(act === 'approve' ? 'Đã duyệt hoàn tiền.' : act === 'reject' ? 'Đã từ chối hoàn tiền.' : 'Đã ghi nhận chuyển khoản.');
      onDone();
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };
  const title = { approve: 'Duyệt hoàn tiền', reject: 'Từ chối hoàn tiền', payout: 'Xác nhận đã chuyển khoản' }[act];
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
          <Button size="sm" variant={act === 'reject' ? 'danger' : 'primary'} onClick={submit} isLoading={busy}>
            Xác nhận
          </Button>
        </>
      }
    >
      {act === 'payout' ? (
        <div className="space-y-3">
          <Banner kind="info">Chuyển khoản {formatCurrency(refund.proposedAmount ?? refund.requestedAmount)} cho {refund.customerName} rồi nhập mã tham chiếu ngân hàng.</Banner>
          <Field label="Mã giao dịch ngân hàng" required value={text} onChange={(e) => setText(e.target.value)} maxLength={50} />
        </div>
      ) : (
        <TextArea label="Ghi chú cho khách (không bắt buộc – khách sẽ thấy)" value={text} onChange={(e) => setText(e.target.value)} maxLength={1000} />
      )}
    </Modal>
  );
};
