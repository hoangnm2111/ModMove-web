import React, { useState } from 'react';
import { useDriverStore } from '../../store/useDriverStore';
import { formatCurrency, formatDate } from '../../utils/format';
import { Wallet, ArrowDownRight, ArrowUpRight, QrCode, TrendingUp, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { Button } from '../../components/Button';

export const DriverEarningsPage: React.FC = () => {
  const { walletBalance, depositBalance, todayEarnings } = useDriverStore();
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('1000000');
  const [withdrawSuccess, setWithdrawSuccess] = useState(false);

  const handleWithdraw = () => {
    setWithdrawSuccess(true);
    setTimeout(() => {
      setWithdrawSuccess(false);
      setShowWithdrawModal(false);
    }, 1500);
  };

  const transactions = [
    { id: 'tx_1', code: 'MM-78219', desc: 'Thù lao chuyến xe (đã trừ 20% hoa hồng)', amount: 692000, type: 'IN', time: 'Hôm nay, 21:15' },
    { id: 'tx_2', code: 'MM-78150', desc: 'Thù lao chuyến xe (đã trừ 20% hoa hồng)', amount: 280000, type: 'IN', time: 'Hôm nay, 16:40' },
    { id: 'tx_3', code: 'WD-99120', desc: 'Rút tiền về tài khoản Techcombank (6868***)', amount: -1500000, type: 'OUT', time: 'Hôm qua, 18:20' },
  ];

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6 bg-slate-50">
      {/* Top Header */}
      <div>
        <h1 className="text-xl font-black text-slate-800">Ví Tài Xế & Bảng Kê Doanh Thu (Driver Earnings)</h1>
        <p className="text-xs text-slate-500 mt-0.5">Theo dõi chi tiết số dư, ký quỹ, thù lao cuốc xe và hoa hồng khấu trừ</p>
      </div>

      {/* Wallet Cards Grid */}
      <div className="grid grid-cols-3 gap-4">
        {/* Main Wallet Card */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-5 rounded-2xl shadow-md space-y-3">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Số dư ví khả dụng</span>
            <Wallet className="w-5 h-5 text-brand-400" />
          </div>
          <div className="text-3xl font-black text-white">{formatCurrency(walletBalance)}</div>
          <div className="pt-2 border-t border-slate-700/80 flex items-center justify-between">
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowWithdrawModal(true)}
              className="bg-brand-500 hover:bg-brand-600 text-xs"
            >
              Yêu cầu rút tiền (UC-DRV-23)
            </Button>
            <span className="text-[11px] text-emerald-400 font-medium">Hỗ trợ 24/7</span>
          </div>
        </div>

        {/* Security Deposit Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Tiền ký quỹ an toàn (Deposit)</span>
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{formatCurrency(depositBalance)}</div>
          <div className="text-xs text-slate-500">
            Đảm bảo nhận cuốc xe thu hộ COD và duy trì tài khoản Active.
          </div>
        </div>

        {/* Today's Net Earnings */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Thu nhập hôm nay (Thực nhận)</span>
            <TrendingUp className="w-5 h-5 text-brand-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600">{formatCurrency(todayEarnings)}</div>
          <div className="text-xs text-slate-500">Đã tự động khấu trừ 20% phí sàn ModMove.</div>
        </div>
      </div>

      {/* Transaction History Table */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-800">Lịch sử biến động số dư ví</h2>
          <span className="text-xs text-slate-400">Thời gian thực</span>
        </div>

        <div className="divide-y divide-slate-100 text-xs">
          {transactions.map((tx) => (
            <div key={tx.id} className="py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                    tx.type === 'IN' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                  }`}
                >
                  {tx.type === 'IN' ? <ArrowDownRight className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                </div>
                <div>
                  <div className="font-bold text-slate-800">{tx.desc}</div>
                  <div className="text-slate-400 text-[11px] mt-0.5">
                    Mã: <span className="font-mono">{tx.code}</span> • {tx.time}
                  </div>
                </div>
              </div>

              <div
                className={`text-sm font-black ${
                  tx.type === 'IN' ? 'text-emerald-600' : 'text-slate-900'
                }`}
              >
                {tx.type === 'IN' ? `+${formatCurrency(tx.amount)}` : formatCurrency(tx.amount)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Withdraw Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-2">Tạo yêu cầu rút tiền về tài khoản ngân hàng</h3>
            <p className="text-xs text-slate-500 mb-4">Số tiền sẽ được chuyển khoản trong vòng 1-2 giờ làm việc.</p>

            {withdrawSuccess ? (
              <div className="p-4 bg-emerald-50 text-emerald-800 rounded-xl text-xs text-center font-bold">
                ✓ Lệnh rút tiền đã gửi lên Administrator thành công!
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Số tiền muốn rút (VNĐ):</label>
                  <input
                    type="number"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    className="w-full p-2.5 border rounded-xl font-bold text-slate-800"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Ngân hàng thụ hưởng:</label>
                  <div className="p-3 bg-slate-50 border rounded-xl text-slate-700 font-medium">
                    Techcombank • STK: 190382910291 • Nguyễn Văn Hùng
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" size="sm" onClick={() => setShowWithdrawModal(false)}>
                    Hủy
                  </Button>
                  <Button variant="primary" size="sm" onClick={handleWithdraw}>
                    Xác nhận rút tiền
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
