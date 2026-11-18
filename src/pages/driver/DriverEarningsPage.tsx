import React, { useState } from 'react';
import { PiggyBank, ShieldCheck, Wallet } from 'lucide-react';
import { Banner } from '../../components/ui/feedback';
import { Card, DataState, KV, PageShell, Pager, StatCard, Table } from '../../components/ui/kit';
import { driverApi } from '../../api/endpoints';
import { useQuery } from '../../api/useQuery';
import { WALLET_TX_TYPE } from '../../api/labels';
import { formatCurrency, formatDateTime } from '../../utils/format';

/** Ví tài xế (GET /driver/wallet): ví thu nhập + ví tiền cọc, lịch sử biến động. Nạp tiền và rút tiền thực hiện trên app tài xế. */
export const DriverEarningsPage: React.FC = () => {
  const wallet = useQuery(() => driverApi.wallet(), []);
  const [page, setPage] = useState(1);
  const history = useQuery(() => driverApi.walletTransactions(page, 10), [page]);

  return (
    <PageShell title="Ví & thu nhập" subtitle="Ví thu nhập và ví tiền cọc cộng lại thành tổng số dư; rút được cả hai khi không có đơn đang chạy">
      <div className="w-full space-y-4">
        <DataState q={wallet}>
          {(w) => (
            <>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <StatCard label="Ví thu nhập" value={formatCurrency(w.earningsBalance)} icon={<Wallet className="w-5 h-5" />} accent="bg-emerald-50 text-emerald-600" />
                <StatCard
                  label="Ví tiền cọc"
                  value={<span className={w.depositBalance < 0 ? 'text-rose-600' : ''}>{formatCurrency(w.depositBalance)}</span>}
                  icon={<PiggyBank className="w-5 h-5" />}
                />
                <StatCard label="Tổng số dư" value={formatCurrency(w.walletTotal)} icon={<Wallet className="w-5 h-5" />} />
                <StatCard
                  label="Có thể rút tối đa"
                  value={formatCurrency(w.maxWithdrawableAmount)}
                  icon={<ShieldCheck className="w-5 h-5" />}
                  accent="bg-indigo-50 text-indigo-600"
                />
              </div>

              {w.walletStatus !== 'Active' && <Banner kind="warning">Ví đang bị khoá.</Banner>}
              {w.missingDepositAmount > 0 && (
                <Banner kind="error">
                  Ví tiền cọc thiếu {formatCurrency(w.missingDepositAmount)} so với mức tối thiểu {formatCurrency(w.requiredDeposit)} – bạn chưa nhận được đơn mới cho tới khi nạp đủ. Nạp ít nhất phần thiếu.
                </Banner>
              )}
              {w.hasPendingWithdrawal && <Banner kind="info">Đang có yêu cầu rút {formatCurrency(w.pendingWithdrawalAmount)} chờ quản trị viên chuyển khoản.</Banner>}

              <Card title="Quy định ví">
                <ul className="text-xs text-slate-700 space-y-1.5 list-disc ml-4">
                  <li>Nhận mọi đơn cần ví tiền cọc từ {formatCurrency(w.requiredDeposit)} trở lên; đơn tiền mặt cần thêm ví tiền cọc không nhỏ hơn hoa hồng của đơn.</li>
                  <li>Đơn tiền mặt: hoa hồng trừ vào ví tiền cọc khi hoàn tất. Đơn PayOS: cước trừ hoa hồng cộng vào ví thu nhập.</li>
                  <li>Khi ví tiền cọc thấp hơn mức tối thiểu, thu nhập mới được tự động bù vào tiền cọc cho tới khi đủ.</li>
                  <li>Rút tiền không có mức tối thiểu và chỉ có một yêu cầu chờ tại một thời điểm; trừ ví thu nhập trước, thiếu thì trừ ví tiền cọc. Quản trị viên chuyển khoản thủ công.</li>
                </ul>
              </Card>

              <Card title="Tài khoản nhận tiền">
                <KV label="Ngân hàng">{w.bankAccount?.bankName ?? '—'}</KV>
                <KV label="Số tài khoản">
                  <span className="font-mono">{w.bankAccount?.bankAccountNumber ?? '—'}</span>
                </KV>
                <KV label="Chủ tài khoản">{w.bankAccount?.bankAccountHolder ?? '—'}</KV>
              </Card>
            </>
          )}
        </DataState>

        <Card title="Lịch sử biến động ví">
          <DataState q={history} empty={(d) => d.items.length === 0}>
            {(d) => (
              <>
                <Table
                  rows={d.items}
                  rowKey={(t) => t.id}
                  cols={[
                    { head: 'Thời gian', cell: (t) => formatDateTime(t.createdAt) },
                    { head: 'Loại', cell: (t) => WALLET_TX_TYPE[t.transactionType] ?? t.transactionType },
                    { head: 'Đơn hàng', cell: (t) => t.orderCode ?? '—' },
                    { head: 'Số tiền', className: 'text-right', cell: (t) => <b>{formatCurrency(t.amount)}</b> },
                    { head: 'Ví thu nhập', className: 'text-right', cell: (t) => formatCurrency(t.earningsAmount) },
                    { head: 'Ví tiền cọc', className: 'text-right', cell: (t) => formatCurrency(t.depositAmount) },
                    { head: 'Số dư sau', className: 'text-right', cell: (t) => formatCurrency(t.balanceAfter) },
                  ]}
                />
                <Pager page={d.pageNumber} pageSize={d.pageSize} total={d.totalCount} onChange={setPage} />
              </>
            )}
          </DataState>
        </Card>

      </div>
    </PageShell>
  );
};
