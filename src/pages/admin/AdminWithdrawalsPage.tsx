import React, { useState } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '../../components/Button';
import { Banner, toast } from '../../components/ui/feedback';
import { Modal } from '../../components/ui/Modal';
import { Field, TextArea } from '../../components/ui/Field';
import { Card, DataState, Drawer, KV, PageShell, Pager, Pill, SearchBox, Table, Tabs } from '../../components/ui/kit';
import { adminApi } from '../../api/endpoints';
import { useQuery } from '../../api/useQuery';
import { WITHDRAWAL_STATUS } from '../../api/labels';
import type { AdminWithdrawalDetailResponse, WalletTransactionStatus } from '../../api/types';
import { errorMessage } from '../../services/mock/storage';
import { formatCurrency, formatDateTime } from '../../utils/format';
import { PhoneLink } from '../../components/ui/PhoneLink';

type Tab = WalletTransactionStatus | 'ALL';
const TABS: { key: Tab; label: string }[] = [
  { key: 'Pending', label: 'Chờ xử lý' },
  { key: 'Completed', label: 'Đã chuyển' },
  { key: 'Rejected', label: 'Từ chối' },
  { key: 'ALL', label: 'Tất cả' },
];

/** UC-ADM-24 – Xử lý yêu cầu rút thu nhập của tài xế */
export const AdminWithdrawalsPage: React.FC = () => {
  const [tab, setTab] = useState<Tab>('Pending');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [openId, setOpenId] = useState<number | null>(null);
  const filters = { status: tab === 'ALL' ? undefined : tab, search: search.trim() };
  const q = useQuery(() => adminApi.withdrawals({ ...filters, page, pageSize: 15 }), [JSON.stringify(filters), page]);
  return (
    <PageShell
      title="Duyệt rút tiền tài xế"
      subtitle="Chuyển khoản thủ công tới tài khoản tài xế rồi ghi mã tham chiếu "
      toolbar={
        <div className="w-full flex flex-wrap items-center gap-2">
          <Tabs value={tab} onChange={(k) => (setTab(k), setPage(1))} items={TABS} />
          <SearchBox className="ml-auto" value={search} onChange={(v) => (setSearch(v), setPage(1))} placeholder="Tên, số điện thoại tài xế…" />
        </div>
      }
    >
      <div className="max-w-6xl mx-auto">
        <Banner kind="info" className="mb-4">
          Yêu cầu rút tiền do tài xế tạo trên app. Số tiền rút được trừ từ ví thu nhập trước, thiếu thì trừ tiếp từ ví ký quỹ; từ chối thì hoàn đúng từng phần về hai ví. Mỗi tài xế chỉ có một yêu cầu chờ tại một thời điểm, không có mức tối thiểu.
        </Banner>
        <Card>
          <DataState q={q} empty={(d) => d.items.length === 0}>
            {(d) => (
              <>
                <Table
                  rows={d.items}
                  rowKey={(w) => w.transactionId}
                  onRow={(w) => setOpenId(w.transactionId)}
                  cols={[
                    { head: 'Mã giao dịch', cell: (w) => <b>#{w.transactionId}</b> },
                    { head: 'Tài xế', cell: (w) => <div>{w.driverName}<div className="text-[11px] text-slate-400"><PhoneLink phone={w.driverPhone} /></div></div> },
                    { head: 'Số tiền', className: 'text-right', cell: (w) => <b>{formatCurrency(w.amount)}</b> },
                    { head: 'Trừ từ thu nhập', className: 'text-right', cell: (w) => formatCurrency(w.earningsAmount) },
                    { head: 'Trừ từ ký quỹ', className: 'text-right', cell: (w) => formatCurrency(w.depositAmount) },
                    { head: 'Ngân hàng', cell: (w) => (w.bankName ? `${w.bankName} • ${w.bankAccountNumber}` : '—') },
                    { head: 'Trạng thái', cell: (w) => <Pill tone={WITHDRAWAL_STATUS[w.transactionStatus]} /> },
                    { head: 'Tạo lúc', cell: (w) => formatDateTime(w.createdAt) },
                  ]}
                />
                <Pager page={d.pageNumber} pageSize={d.pageSize} total={d.totalCount} onChange={setPage} />
              </>
            )}
          </DataState>
        </Card>
      </div>
      {openId && <WithdrawalDrawer id={openId} onClose={() => setOpenId(null)} onChanged={() => q.reload()} />}
    </PageShell>
  );
};

const WithdrawalDrawer: React.FC<{ id: number; onClose: () => void; onChanged: () => void }> = ({ id, onClose, onChanged }) => {
  const q = useQuery(() => adminApi.withdrawal(id), [id]);
  const [act, setAct] = useState<'approve' | 'reject' | null>(null);
  const w = q.data;
  return (
    <Drawer
      open
      onClose={onClose}
      title={w ? <>Rút tiền #{w.transactionId} <Pill tone={WITHDRAWAL_STATUS[w.transactionStatus]} /></> : 'Rút tiền'}
      footer={
        w?.transactionStatus === 'Pending' && (
          <>
            <Button size="sm" variant="danger" onClick={() => setAct('reject')}>
              <XCircle className="w-4 h-4 mr-1" /> Từ chối
            </Button>
            <Button size="sm" onClick={() => setAct('approve')}>
              <CheckCircle2 className="w-4 h-4 mr-1" /> Đã chuyển khoản
            </Button>
          </>
        )
      }
    >
      <DataState q={q}>
        {(w) => (
          <>
            <div className="rounded-2xl border border-slate-200 p-4 text-center">
              <div className="text-[11px] font-bold text-slate-500">Số tiền rút</div>
              <div className="text-3xl font-black">{formatCurrency(w.amount)}</div>
              <div className="text-[11px] text-slate-500 mt-1">
                Từ thu nhập {formatCurrency(w.earningsAmount)} • Từ ký quỹ {formatCurrency(w.depositAmount)}
              </div>
            </div>
            <Card title="Tài xế">
              <KV label="Họ tên">{w.driverName}</KV>
              <KV label="Số điện thoại / Email">
                <PhoneLink phone={w.driverPhone} /> • {w.driverEmail}
              </KV>
              <KV label="Ví">{w.walletStatus === 'Active' ? 'Hoạt động' : 'Đang khoá'}</KV>
              <KV label="Thu nhập hiện tại">{formatCurrency(w.currentEarningsBalance)}</KV>
              <KV label="Ví cọc hiện tại">{formatCurrency(w.currentDepositBalance)}</KV>
              <KV label="Số dư sau yêu cầu">{formatCurrency(w.balanceAfter)}</KV>
            </Card>
            <Card title="Tài khoản nhận">
              <KV label="Ngân hàng">{w.bankName ?? '—'}</KV>
              <KV label="Số tài khoản">
                <span className="font-mono">{w.bankAccountNumber ?? '—'}</span>
              </KV>
              <KV label="Chủ tài khoản">{w.bankAccountHolder ?? '—'}</KV>
            </Card>
            {w.processedAt && (
              <Card title="Kết quả">
                <KV label="Xử lý bởi">{w.processedByName ?? '—'}</KV>
                <KV label="Lúc">{formatDateTime(w.processedAt)}</KV>
                {w.referenceCode && <KV label="Mã tham chiếu">{w.referenceCode}</KV>}
              </Card>
            )}
            {act && <ActModal act={act} w={w} onClose={() => setAct(null)} onDone={() => (setAct(null), q.reload(), onChanged())} />}
          </>
        )}
      </DataState>
    </Drawer>
  );
};

const ActModal: React.FC<{ act: 'approve' | 'reject'; w: AdminWithdrawalDetailResponse; onClose: () => void; onDone: () => void }> = ({ act, w, onClose, onDone }) => {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    if (act === 'approve' && !text.trim()) return toast.error('Nhập mã giao dịch ngân hàng.');
    setBusy(true);
    try {
      if (act === 'approve') await adminApi.approveWithdrawal(w.transactionId, text.trim());
      else await adminApi.rejectWithdrawal(w.transactionId, text.trim());
      toast.success(act === 'approve' ? 'Đã ghi nhận chuyển khoản. Tài xế đã được thông báo.' : 'Đã từ chối, tiền được hoàn vào thu nhập tài xế.');
      onDone();
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal
      open
      title={act === 'approve' ? 'Xác nhận đã chuyển khoản' : 'Từ chối yêu cầu rút tiền'}
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
      {act === 'approve' ? (
        <Field label="Mã giao dịch ngân hàng" required value={text} onChange={(e) => setText(e.target.value)} maxLength={50} />
      ) : (
        <TextArea label="Lý do (gửi cho tài xế)" value={text} onChange={(e) => setText(e.target.value)} maxLength={1000} />
      )}
    </Modal>
  );
};
