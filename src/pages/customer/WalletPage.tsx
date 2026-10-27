import React, { useState } from 'react';
import {
  CreditCard,
  QrCode,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownLeft,
  ShieldCheck,
  Sparkles,
  RefreshCw,
  Wallet,
  Menu,
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { formatCurrency, formatDate } from '../../utils/format';
import { useCustomerLayout } from '../../layouts/CustomerLayout';

export const WalletPage: React.FC = () => {
  const { toggleSidebar } = useCustomerLayout();
  const { user } = useAuthStore();
  const [topUpAmount, setTopUpAmount] = useState<number>(200000);
  const [isSuccessAlert, setIsSuccessAlert] = useState(false);

  const predefinedAmounts = [50000, 100000, 200000, 500000, 1000000];

  const transactions = [
    {
      id: 'tx_01',
      title: 'Nạp ví qua VietQR PayOS',
      date: new Date().toISOString(),
      amount: 500000,
      type: 'TOPUP',
      status: 'SUCCESS',
    },
    {
      id: 'tx_02',
      title: 'Thanh toán cước đơn MM-30961',
      date: new Date(Date.now() - 3600000 * 4).toISOString(),
      amount: -569000,
      type: 'PAYMENT',
      status: 'SUCCESS',
    },
    {
      id: 'tx_03',
      title: 'Nạp ví qua VietQR PayOS',
      date: new Date(Date.now() - 3600000 * 24).toISOString(),
      amount: 1000000,
      type: 'TOPUP',
      status: 'SUCCESS',
    },
  ];

  return (
    <div className="flex-1 h-full overflow-y-auto bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggleSidebar}
              className="p-2 -ml-2 text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              title="Mở menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <CreditCard className="w-6 h-6 text-brand-500" />
                <span>Ví ModMove Pay (VietQR PayOS)</span>
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Thanh toán cước vận chuyển tự động, nạp ví 24/7 tức thì không cần chờ đợi.
              </p>
            </div>
          </div>
          <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Cổng PayOS: Trực tuyến
          </span>
        </div>

        {/* Balance Card & Quick Top-up Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Left: Balance & QR */}
          <div className="md:col-span-7 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5">
            <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-brand-950 rounded-2xl p-6 text-white relative overflow-hidden shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
                  Số dư khả dụng
                </span>
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center font-bold text-white">
                  M
                </div>
              </div>
              <div className="text-3xl sm:text-4xl font-black tracking-tight text-white">
                {formatCurrency(user?.walletBalance || 1250000)}
              </div>
              <div className="mt-4 pt-3 border-t border-white/15 flex items-center justify-between text-xs text-slate-300">
                <span>Chủ ví: <strong className="text-white">{user?.fullName || 'Khách hàng'}</strong></span>
                <span>SĐT: <strong className="text-white">{user?.phoneNumber || '0338967316'}</strong></span>
              </div>
            </div>

            {/* Top-up Amount Selector */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-800 block">
                Chọn số tiền muốn nạp vào ví:
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {predefinedAmounts.map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setTopUpAmount(amt)}
                    className={`py-2 px-1 text-center rounded-xl text-xs font-bold transition border ${
                      topUpAmount === amt
                        ? 'bg-orange-50 text-brand-600 border-brand-500 font-extrabold shadow-xs'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {formatCurrency(amt)}
                  </button>
                ))}
              </div>
            </div>

            {/* PayOS VietQR Presentation */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-300 flex flex-col sm:flex-row items-center gap-5">
              <div className="w-36 h-36 bg-white p-2 rounded-xl border border-slate-200 shadow-sm flex items-center justify-center flex-shrink-0">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=00020101021238540010A00000072701260006970422011203389673160208QRIBFTTA5204601153037045802VN62180814ModMoveNap${topUpAmount}6304E85B`}
                  alt="VietQR PayOS"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="space-y-2 text-center sm:text-left">
                <div className="text-xs font-bold text-brand-600 flex items-center justify-center sm:justify-start gap-1">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Quét mã VietQR chuyển khoản tự động</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Mở ứng dụng ngân hàng bất kỳ (Vietcombank, MB, Techcombank...) quét mã QR để nạp đúng số tiền{' '}
                  <strong className="text-slate-900">{formatCurrency(topUpAmount)}</strong>. Tiền sẽ vào ví sau 30 giây.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setIsSuccessAlert(true);
                    setTimeout(() => setIsSuccessAlert(false), 3000);
                  }}
                  className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs rounded-xl shadow-md transition"
                >
                  Mô phỏng nạp thành công
                </button>
              </div>
            </div>

            {isSuccessAlert && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs font-bold flex items-center gap-2 animate-fadeIn">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Nạp thành công {formatCurrency(topUpAmount)} vào ví ModMove Pay!</span>
              </div>
            )}
          </div>

          {/* Right: Transaction History */}
          <div className="md:col-span-5 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-sm text-slate-900">Lịch sử biến động số dư</h3>
              <span className="text-[11px] text-slate-400 font-medium">3 giao dịch gần nhất</span>
            </div>

            <div className="divide-y divide-slate-100">
              {transactions.map((tx) => (
                <div key={tx.id} className="py-3 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold ${
                        tx.amount > 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {tx.amount > 0 ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="font-bold text-slate-800">{tx.title}</div>
                      <div className="text-[10px] text-slate-400">{formatDate(tx.date)}</div>
                    </div>
                  </div>
                  <div
                    className={`font-black text-right ${
                      tx.amount > 0 ? 'text-emerald-600' : 'text-slate-800'
                    }`}
                  >
                    {tx.amount > 0 ? `+${formatCurrency(tx.amount)}` : formatCurrency(tx.amount)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
