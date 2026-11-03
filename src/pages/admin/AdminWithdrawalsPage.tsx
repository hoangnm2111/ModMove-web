import React, { useState } from 'react';
import {
  CreditCard,
  Check,
  X,
  Search,
  Filter,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Building,
  User,
  Calendar,
  ArrowUpRight,
  ShieldAlert,
} from 'lucide-react';
import { formatCurrency } from '../../utils/format';

import { Button } from '../../components/Button';
import { Banner, toast } from '../../components/ui/feedback';
import { Field } from '../../components/ui/Field';
import { Modal } from '../../components/ui/Modal';
import { REFUND_SOURCE_LABEL } from '../../constants';
import { msg } from '../../constants/messages';
import { useRefunds, useWithdrawals } from '../../hooks/useDomainData';
import { caseService } from '../../services/case.service';
import { walletService } from '../../services/wallet.service';
import { errorMessage } from '../../services/mock/storage';
import { formatDateTime } from '../../utils/format';

type PayoutAction = { kind: 'withdrawal' | 'refund'; id: string; approve: boolean; title: string } | null;

/** SCR-45 – Duyệt hoàn tiền & rút tiền (UC-ADM-18, UC-ADM-24, GB-19, GB-27) */
export const AdminWithdrawalsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'WITHDRAWALS' | 'REFUNDS'>('WITHDRAWALS');
  const rawWithdrawals = useWithdrawals();
  const rawRefunds = useRefunds();

  // View model cho phần hiển thị
  const withdrawals = rawWithdrawals.map((w) => ({
    id: w.id,
    driverName: w.driverName,
    driverPhone: '',
    bankName: w.bankName,
    accountNumber: w.bankAccount,
    accountHolder: w.driverName.toUpperCase(),
    amount: w.amount,
    requestedAt: formatDateTime(w.createdAt),
    status: (w.status === 'Pending' ? 'PENDING' : w.status === 'Paid' ? 'COMPLETED' : 'REJECTED') as 'PENDING' | 'COMPLETED' | 'REJECTED',
    transferCode: w.bankReferenceCode,
    rejectReason: w.rejectReason,
  }));
  // Admin chỉ thấy refund đã có đề xuất (GB-19) hoặc đã xử lý
  const refunds = rawRefunds
    .filter((r) => ['Proposed', 'Approved', 'Processed', 'Rejected'].includes(r.status))
    .map((r) => ({
      id: r.id,
      orderCode: r.orderCode,
      customerName: r.customerName,
      customerPhone: REFUND_SOURCE_LABEL[r.source],
      proposedAmount: r.proposedAmount ?? 0,
      reason: `${r.reason}${r.proposalNote ? ` — Đề xuất: ${r.proposalNote}` : ''}`,
      dispatcherName: r.source === 'Cancellation' ? 'Tự động (GB-41)' : 'Điều phối viên',
      status: (r.status === 'Proposed' ? 'PENDING' : r.status === 'Processed' || r.status === 'Approved' ? 'APPROVED' : 'REJECTED') as 'PENDING' | 'APPROVED' | 'REJECTED',
      submittedAt: formatDateTime(r.updatedAt),
    }));

  const [action, setAction] = useState<PayoutAction>(null);
  const [inputValue, setInputValue] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const zeroRefund = action?.kind === 'refund' && action.approve && (rawRefunds.find((r) => r.id === action.id)?.proposedAmount ?? 0) === 0;

  const open = (a: NonNullable<PayoutAction>) => {
    setAction(a);
    setInputValue('');
    setActionError(null);
  };

  const handleApproveWithdrawal = (id: string) => open({ kind: 'withdrawal', id, approve: true, title: 'Xác nhận đã chuyển khoản rút tiền' });
  const handleRejectWithdrawal = (id: string) => open({ kind: 'withdrawal', id, approve: false, title: 'Từ chối yêu cầu rút tiền' });
  const handleApproveRefund = (id: string) => open({ kind: 'refund', id, approve: true, title: 'Duyệt & xác nhận đã hoàn tiền' });
  const handleRejectRefund = (id: string) => open({ kind: 'refund', id, approve: false, title: 'Từ chối đề xuất hoàn tiền' });

  const submitAction = async () => {
    if (!action) return;
    setPending(true);
    setActionError(null);
    try {
      if (action.kind === 'withdrawal') {
        if (action.approve) await walletService.markWithdrawalPaid(action.id, inputValue);
        else await walletService.rejectWithdrawal(action.id, inputValue);
      } else if (action.approve) await caseService.approveRefund(action.id, inputValue);
      else await caseService.rejectRefund(action.id, inputValue);
      toast.success(msg('MSG04', { record_name: 'quyết định' }));
      setAction(null);
    } catch (e) {
      setActionError(errorMessage(e));
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="flex-1 h-full overflow-y-auto p-4 sm:p-6 space-y-6 bg-slate-50 select-none">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-amber-500" />
              <span>Duyệt chi trả rút tiền & Khiếu nại bồi thường</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Xác thực lệnh chuyển khoản ngân hàng tới tài xế và phê duyệt hoàn tiền khách hàng
            </p>
          </div>

          {/* Switch Tab */}
          <div className="flex items-center gap-1 p-1 bg-white border border-slate-200 rounded-2xl shadow-xs text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveTab('WITHDRAWALS')}
              className={`px-4 py-2 rounded-xl transition cursor-pointer flex items-center gap-2 ${
                activeTab === 'WITHDRAWALS'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span>Rút tiền ví tài xế ({withdrawals.filter((w) => w.status === 'PENDING').length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('REFUNDS')}
              className={`px-4 py-2 rounded-xl transition cursor-pointer flex items-center gap-2 ${
                activeTab === 'REFUNDS'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShieldAlert className="w-4 h-4" />
              <span>Bồi thường & Khiếu nại ({refunds.filter((r) => r.status === 'PENDING').length})</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Driver Withdrawals */}
        {activeTab === 'WITHDRAWALS' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Yêu cầu chờ chuyển tiền</span>
                <span className="text-2xl font-black text-amber-600 mt-1 block">
                  {withdrawals.filter((w) => w.status === 'PENDING').length} lệnh
                </span>
                <span className="text-[11px] text-slate-400">Cần thực hiện ủy nhiệm chi</span>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Tổng tiền chờ giải ngân</span>
                <span className="text-2xl font-black text-slate-900 mt-1 block">
                  {formatCurrency(
                    withdrawals.filter((w) => w.status === 'PENDING').reduce((acc, curr) => acc + curr.amount, 0)
                  )}
                </span>
                <span className="text-[11px] text-emerald-600 font-semibold">Tài khoản đối tác</span>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Đã thanh toán thành công</span>
                <span className="text-2xl font-black text-emerald-600 mt-1 block">
                  {withdrawals.filter((w) => w.status === 'COMPLETED').length} lệnh
                </span>
                <span className="text-[11px] text-slate-400">Đã khớp lệnh ngân hàng</span>
              </div>
            </div>

            {/* Withdrawals List Table */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <span className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  Hàng đợi yêu cầu rút tiền ví tài xế
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 border-b border-slate-100 text-slate-400 font-extrabold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="p-3.5 pl-5">Tài xế yêu cầu</th>
                      <th className="p-3.5">Ngân hàng thụ hưởng</th>
                      <th className="p-3.5">Số tài khoản</th>
                      <th className="p-3.5">Số tiền rút</th>
                      <th className="p-3.5">Thời gian gửi</th>
                      <th className="p-3.5">Trạng thái</th>
                      <th className="p-3.5 pr-5 text-right">Xử lý</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {withdrawals.map((w) => (
                      <tr key={w.id} className="hover:bg-slate-50/80 transition">
                        <td className="p-3.5 pl-5">
                          <div className="font-black text-slate-900">{w.driverName}</div>
                          <div className="text-[11px] text-slate-400 font-mono">{w.driverPhone}</div>
                        </td>
                        <td className="p-3.5 font-bold text-slate-700">{w.bankName}</td>
                        <td className="p-3.5">
                          <div className="font-mono font-bold text-slate-900">{w.accountNumber}</div>
                          <div className="text-[10px] text-slate-400 uppercase font-semibold">{w.accountHolder}</div>
                        </td>
                        <td className="p-3.5 font-black text-sm text-emerald-600">
                          {formatCurrency(w.amount)}
                        </td>
                        <td className="p-3.5 text-slate-500 font-medium">{w.requestedAt}</td>
                        <td className="p-3.5">
                          <span
                            className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${
                              w.status === 'PENDING'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : w.status === 'COMPLETED'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            <span>
                              {w.status === 'PENDING'
                                ? 'Chờ chi trả'
                                : w.status === 'COMPLETED'
                                ? 'Đã chuyển tiền'
                                : 'Đã từ chối'}
                            </span>
                          </span>
                        </td>
                        <td className="p-3.5 pr-5 text-right">
                          {w.status === 'PENDING' ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleRejectWithdrawal(w.id)}
                                className="px-2.5 py-1.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 font-bold text-xs transition cursor-pointer"
                              >
                                Từ chối
                              </button>
                              <button
                                type="button"
                                onClick={() => handleApproveWithdrawal(w.id)}
                                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition cursor-pointer shadow-xs"
                              >
                                Đã chuyển khoản
                              </button>
                            </div>
                          ) : (
                            <span className="text-[11px] font-mono text-slate-400">
                              {w.transferCode || '---'}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Refunds & Compensation */}
        {activeTab === 'REFUNDS' && (
          <div className="space-y-4">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <span className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  Đề xuất hoàn tiền & Đền bù khiếu nại từ Điều phối viên
                </span>
              </div>
              <div className="divide-y divide-slate-100">
                {refunds.map((r) => (
                  <div key={r.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-xs text-brand-600 bg-orange-50 px-2 py-0.5 rounded-md font-mono">
                          Mã đơn: {r.orderCode}
                        </span>
                        <span className="font-extrabold text-xs text-slate-900">{r.customerName}</span>
                        <span className="text-slate-400 text-xs">({r.customerPhone})</span>
                      </div>
                      <p className="text-xs text-slate-600">
                        <strong>Lý do bồi hoàn:</strong> {r.reason}
                      </p>
                      <div className="text-[11px] text-slate-400 flex items-center gap-3">
                        <span>Đề xuất bởi: <strong>{r.dispatcherName}</strong></span>
                        <span>Thời gian: {r.submittedAt}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block uppercase font-bold">Số tiền đề xuất</span>
                        <span className="text-base font-black text-rose-600">
                          {formatCurrency(r.proposedAmount)}
                        </span>
                      </div>

                      {r.status === 'PENDING' ? (
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleRejectRefund(r.id)}
                            className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-bold text-xs transition cursor-pointer"
                          >
                            Bác bỏ
                          </button>
                          <button
                            type="button"
                            onClick={() => handleApproveRefund(r.id)}
                            className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs transition cursor-pointer shadow-xs"
                          >
                            Duyệt hoàn tiền
                          </button>
                        </div>
                      ) : (
                        <span
                          className={`text-xs font-bold px-3 py-1 rounded-xl border ${
                            r.status === 'APPROVED'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {r.status === 'APPROVED' ? 'Đã duyệt hoàn' : 'Đã từ chối'}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {action && (
        <Modal
          open
          title={action.title}
          size="sm"
          onClose={() => setAction(null)}
          footer={
            <Button size="sm" variant={action.approve ? 'primary' : 'danger'} isLoading={pending} onClick={submitAction} disabled={!zeroRefund && !inputValue.trim()}>
              Xác nhận
            </Button>
          }
        >
          <div className="space-y-3">
            {zeroRefund && <Banner kind="info">Đề xuất không hoàn tiền – chỉ cần xác nhận, không có chuyển khoản.</Banner>}
            {action.approve && !zeroRefund && <Banner kind="info">Chuyển khoản thủ công trong 3 ngày làm việc và ghi lại mã giao dịch ngân hàng (GB-27).</Banner>}
            <Field label={action.approve ? 'Mã giao dịch ngân hàng' : 'Lý do từ chối'} required value={inputValue} error={actionError} onChange={(e) => setInputValue(e.target.value)} />
          </div>
        </Modal>
      )}
    </div>
  );
};
