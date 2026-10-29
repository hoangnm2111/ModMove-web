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

interface WithdrawalRequest {
  id: string;
  driverName: string;
  driverPhone: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  amount: number;
  requestedAt: string;
  status: 'PENDING' | 'COMPLETED' | 'REJECTED';
  transferCode?: string;
  rejectReason?: string;
}

interface CompensationRefundRequest {
  id: string;
  orderCode: string;
  customerName: string;
  customerPhone: string;
  proposedAmount: number;
  reason: string;
  dispatcherName: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  submittedAt: string;
}

const INITIAL_WITHDRAWALS: WithdrawalRequest[] = [
  {
    id: 'wd_101',
    driverName: 'Nguyễn Văn Hùng',
    driverPhone: '0912345678',
    bankName: 'MB Bank (Quân Đội)',
    accountNumber: '091234567888',
    accountHolder: 'NGUYEN VAN HUNG',
    amount: 1500000,
    requestedAt: 'Hôm nay, 16:15',
    status: 'PENDING',
  },
  {
    id: 'wd_102',
    driverName: 'Hoàng Hải Nam',
    driverPhone: '0988112233',
    bankName: 'Vietcombank',
    accountNumber: '10192837465',
    accountHolder: 'HOANG HAI NAM',
    amount: 2800000,
    requestedAt: 'Hôm qua, 11:30',
    status: 'PENDING',
  },
  {
    id: 'wd_103',
    driverName: 'Vũ Đức Thịnh',
    driverPhone: '0971234567',
    bankName: 'Techcombank',
    accountNumber: '190345678901',
    accountHolder: 'VU DUC THINH',
    amount: 950000,
    requestedAt: '27/10/2026',
    status: 'COMPLETED',
    transferCode: 'MB-TRF-99482',
  },
];

const INITIAL_REFUNDS: CompensationRefundRequest[] = [
  {
    id: 'rf_01',
    orderCode: 'MM-90182',
    customerName: 'Hoàng Nguyễn Mạnh',
    customerPhone: '0338967316',
    proposedAmount: 350000,
    reason: 'Sự cố nổ lốp trên đường, hàng giao trễ 45 phút so với cam kết ban đầu',
    dispatcherName: 'Trần Thị Thu Thảo',
    status: 'PENDING',
    submittedAt: 'Hôm nay, 14:40',
  },
];

export const AdminWithdrawalsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'WITHDRAWALS' | 'REFUNDS'>('WITHDRAWALS');
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>(INITIAL_WITHDRAWALS);
  const [refunds, setRefunds] = useState<CompensationRefundRequest[]>(INITIAL_REFUNDS);

  // Approve withdrawal
  const handleApproveWithdrawal = (id: string) => {
    setWithdrawals((prev) =>
      prev.map((w) =>
        w.id === id ? { ...w, status: 'COMPLETED', transferCode: `PAY-${Date.now().toString().slice(-6)}` } : w
      )
    );
  };

  // Reject withdrawal
  const handleRejectWithdrawal = (id: string) => {
    setWithdrawals((prev) =>
      prev.map((w) =>
        w.id === id ? { ...w, status: 'REJECTED', rejectReason: 'Thông tin tài khoản ngân hàng không chính chủ' } : w
      )
    );
  };

  // Approve refund
  const handleApproveRefund = (id: string) => {
    setRefunds((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'APPROVED' } : r))
    );
  };

  // Reject refund
  const handleRejectRefund = (id: string) => {
    setRefunds((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'REJECTED' } : r))
    );
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
    </div>
  );
};
