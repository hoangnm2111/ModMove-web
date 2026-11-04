import React, { useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, Landmark, PiggyBank, Wallet } from 'lucide-react';
import { Button } from '../../components/Button';
import { Banner, confirm, toast } from '../../components/ui/feedback';
import { Field } from '../../components/ui/Field';
import { Modal } from '../../components/ui/Modal';
import { PayOsModal } from '../../features/payment/PayOsModal';
import { BUSINESS } from '../../config/business';
import { msg } from '../../constants/messages';
import { useDriverContext } from '../../hooks/useDriverContext';
import { walletService } from '../../services/wallet.service';
import { errorMessage } from '../../services/mock/storage';
import { WalletTxType } from '../../types/case.types';
import { formatCurrency, formatDateTime } from '../../utils/format';

const PERIODS = { DAY: { label: 'Hôm nay', days: 1 }, WEEK: { label: '7 ngày', days: 7 }, MONTH: { label: '30 ngày', days: 30 } } as const;
type Period = keyof typeof PERIODS;

const TX_LABEL: Record<WalletTxType, string> = {
  TopUpDeposit: 'Nạp ký quỹ',
  TripEarning: 'Thu nhập chuyến',
  CommissionDeduction: 'Trừ hoa hồng',
  WithdrawEarnings: 'Rút thu nhập',
};

/** SCR-28/29 – Ví tài xế, nạp ký quỹ, rút tiền, tổng hợp doanh thu */
export const DriverEarningsPage: React.FC = () => {
  const { user, driverId, wallet } = useDriverContext();
  const [period, setPeriod] = useState<Period>('WEEK');
  const [topUp, setTopUp] = useState<number | null>(null);
  const [topUpInput, setTopUpInput] = useState(String(BUSINESS.MIN_COD_DEPOSIT));
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawErr, setWithdrawErr] = useState<string | null>(null);

  // Backend chưa có API tổng hợp doanh thu theo kỳ cho tài xế trên web (DECISIONS C11); chỉ số dư ví (driver/status) là dữ liệu thật.
  const summary = { trips: 0, gross: 0, commission: 0, net: 0 };
  const pendingWithdrawal = undefined as { amount: number } | undefined;

  const startTopUp = () => {
    const amount = Number(topUpInput);
    if (!(amount >= BUSINESS.MIN_DEPOSIT_TOPUP)) {
      toast.error(msg('MSG03', { field_name: 'Số tiền nạp', constraints: `tối thiểu ${formatCurrency(BUSINESS.MIN_DEPOSIT_TOPUP)}` }));
      return;
    }
    setTopUp(amount);
  };

  const submitWithdraw = async () => {
    const amount = Number(withdrawAmount);
    if (!(await confirm({ title: 'Yêu cầu rút tiền', message: msg('MSG62', { action_name: `rút ${formatCurrency(amount)} về ${wallet.bankName ?? 'ngân hàng'}` }) }))) return;
    try {
      await walletService.requestWithdrawal(driverId, user?.fullName ?? '', amount);
      toast.success('Đã gửi yêu cầu rút tiền. Quản trị viên sẽ chuyển khoản trong 3 ngày làm việc (GB-27).');
      setWithdrawOpen(false);
      setWithdrawAmount('');
    } catch (e) {
      setWithdrawErr(errorMessage(e));
    }
  };

  return (
    <div className="flex-1 h-full overflow-y-auto bg-slate-50 min-w-0">
      <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-5">
        <h1 className="text-lg font-black text-slate-900">Ví & thu nhập</h1>

        <div className="grid sm:grid-cols-2 gap-4">
          <section className="bg-white border border-slate-200 rounded-2xl p-5 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
              <Wallet className="w-4 h-4" /> Thu nhập khả dụng (EarningsBalance)
            </div>
            <div className="text-2xl font-black text-slate-900">{formatCurrency(wallet.earningsBalance)}</div>
            <p className="text-[11px] text-slate-500">Nhận từ đơn PayOS; rút được, không giới hạn tối thiểu (GB-32).</p>
            {pendingWithdrawal ? (
              <Banner kind="info">Đang chờ xử lý yêu cầu rút {formatCurrency(pendingWithdrawal.amount)}.</Banner>
            ) : (
              <Button size="sm" onClick={() => { setWithdrawErr(null); setWithdrawOpen(true); }} disabled={wallet.earningsBalance <= 0}>
                <Landmark className="w-4 h-4 mr-1.5" /> Rút về ngân hàng
              </Button>
            )}
          </section>
          <section className="bg-white border border-slate-200 rounded-2xl p-5 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
              <PiggyBank className="w-4 h-4" /> Ký quỹ (DepositBalance)
            </div>
            <div className="text-2xl font-black text-slate-900">{formatCurrency(wallet.depositBalance)}</div>
            <p className="text-[11px] text-slate-500">Dùng trừ hoa hồng đơn tiền mặt; không rút được. Tối thiểu {formatCurrency(BUSINESS.MIN_COD_DEPOSIT)} để nhận đơn tiền mặt.</p>
            {wallet.depositBalance < BUSINESS.MIN_COD_DEPOSIT && <Banner kind="warning">{msg('MSG26', { required_balance: formatCurrency(BUSINESS.MIN_COD_DEPOSIT) })}</Banner>}
            <div className="flex gap-2 items-end">
              <Field label="Số tiền nạp" type="number" min={BUSINESS.MIN_DEPOSIT_TOPUP} step={10000} value={topUpInput} onChange={(e) => setTopUpInput(e.target.value)} className="flex-1" />
              <Button size="sm" onClick={startTopUp}>
                Nạp qua PayOS
              </Button>
            </div>
          </section>
        </div>

        <section className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <h2 className="font-extrabold text-sm">Tổng hợp doanh thu (UC-DRV-23)</h2>
            <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
              {(Object.keys(PERIODS) as Period[]).map((p) => (
                <button key={p} type="button" onClick={() => setPeriod(p)} className={`px-3 py-1 rounded-lg text-xs font-bold ${period === p ? 'bg-white shadow' : 'text-slate-500'}`}>
                  {PERIODS[p].label}
                </button>
              ))}
            </div>
          </div>
          <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            {[
              ['Chuyến hoàn thành', String(summary.trips)],
              ['Tổng cước', formatCurrency(summary.gross)],
              ['Hoa hồng', `-${formatCurrency(summary.commission)}`],
              ['Thực nhận', formatCurrency(summary.net)],
            ].map(([k, v]) => (
              <div key={k} className="bg-slate-50 rounded-xl p-3">
                <dt className="text-slate-500">{k}</dt>
                <dd className="text-base font-black text-slate-900">{v}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="bg-white border border-slate-200 rounded-2xl p-5">
          <h2 className="font-extrabold text-sm mb-3">Lịch sử giao dịch ví</h2>
          {wallet.transactions.length === 0 ? (
            <p className="text-xs text-slate-500">Chưa có giao dịch.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {wallet.transactions.map((t) => (
                <li key={t.id} className="py-2.5 flex items-center gap-3 text-xs">
                  {t.amount >= 0 ? <ArrowDownLeft className="w-4 h-4 text-emerald-600" /> : <ArrowUpRight className="w-4 h-4 text-rose-600" />}
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-slate-800">
                      {TX_LABEL[t.type]} {t.orderCode && `• ${t.orderCode}`}
                    </p>
                    <p className="text-slate-400">
                      {formatDateTime(t.createdAt)} {t.referenceCode && `• ${t.referenceCode}`}
                    </p>
                  </div>
                  <span className={`font-black ${t.amount >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                    {t.amount >= 0 ? '+' : ''}
                    {formatCurrency(t.amount)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {withdrawOpen && (
        <Modal open title="Rút thu nhập (UC-DRV-22)" size="sm" onClose={() => setWithdrawOpen(false)} footer={<Button size="sm" onClick={submitWithdraw} disabled={!withdrawAmount}>Gửi yêu cầu</Button>}>
          <div className="space-y-3">
            {wallet.bankAccount ? (
              <p className="text-xs">
                Tài khoản nhận: <b>{wallet.bankName}</b> – {wallet.bankAccount}
              </p>
            ) : (
              <Banner kind="warning">{msg('MSG66')}</Banner>
            )}
            <Field label={`Số tiền (tối đa ${formatCurrency(wallet.earningsBalance)})`} type="number" min={1} max={wallet.earningsBalance} value={withdrawAmount} error={withdrawErr} onChange={(e) => setWithdrawAmount(e.target.value)} />
          </div>
        </Modal>
      )}

      {topUp !== null && (
        <PayOsModal
          open
          title="Nạp ký quỹ qua PayOS"
          amount={topUp}
          reference={`MODMOVE NAP ${driverId}`}
          onPaid={async () => {
            await walletService.topUpDeposit(driverId, topUp);
            toast.success(msg('MSG54', { transaction_type: 'Nạp ký quỹ', amount: formatCurrency(topUp) }));
            setTopUp(null);
          }}
          onClose={() => setTopUp(null)}
        />
      )}
    </div>
  );
};
