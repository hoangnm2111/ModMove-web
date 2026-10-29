import React, { useState } from 'react';
import {
  Wallet,
  ShieldCheck,
  TrendingUp,
  ArrowDownRight,
  ArrowUpRight,
  Download,
  QrCode,
  CheckCircle2,
  AlertCircle,
  Clock,
  History,
  CreditCard,
  Building2,
  ChevronRight,
  Filter,
  Sparkles,
  DollarSign,
  Calendar,
  Check,
  ArrowUpCircle,
  ArrowDownCircle,
  HelpCircle,
  Info
} from 'lucide-react';
import { useDriverStore } from '../../store/useDriverStore';
import { formatCurrency } from '../../utils/format';

interface WalletTransaction {
  id: string;
  code: string;
  time: string;
  type: 'IN' | 'OUT';
  amount: number;
  desc: string;
  method: string;
  status: 'COMPLETED' | 'PENDING';
  category: 'TRIP_FARE' | 'WITHDRAW' | 'DEPOSIT_TOPUP' | 'COD_SETTLEMENT';
}

export const DriverEarningsPage: React.FC = () => {
  const { walletBalance, depositBalance, todayEarnings } = useDriverStore();

  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showTopUpDepositModal, setShowTopUpDepositModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState<string>('500000');
  const [bankAccount, setBankAccount] = useState('19036789012 - TECHCOMBANK');
  const [bankName, setBankName] = useState('NGUYEN VAN HUNG');
  const [withdrawSuccess, setWithdrawSuccess] = useState(false);
  const [topUpSuccess, setTopUpSuccess] = useState(false);

  // Filter tabs for transactions
  const [activeTxTab, setActiveTxTab] = useState<'ALL' | 'IN' | 'OUT'>('ALL');
  const [selectedTimeRange, setSelectedTimeRange] = useState<'TODAY' | 'WEEK' | 'MONTH'>('WEEK');

  // Quick amounts for withdraw
  const QUICK_WITHDRAW_AMOUNTS = [200000, 500000, 1000000, 2000000];

  const transactions: WalletTransaction[] = [
    {
      id: 'tx_1',
      code: 'TX-88219',
      time: 'Hôm nay, 21:15',
      type: 'IN',
      amount: 692000,
      desc: 'Thù lao chuyến xe #MM-78219 (80% cước phí)',
      method: 'Cộng tự động',
      status: 'COMPLETED',
      category: 'TRIP_FARE',
    },
    {
      id: 'tx_2',
      code: 'TX-78150',
      time: 'Hôm nay, 16:40',
      type: 'IN',
      amount: 280000,
      desc: 'Thù lao chuyến xe #MM-78150 (80% cước phí)',
      method: 'Cộng tự động',
      status: 'COMPLETED',
      category: 'TRIP_FARE',
    },
    {
      id: 'tx_3',
      code: 'WD-99120',
      time: 'Hôm qua, 18:20',
      type: 'OUT',
      amount: 1500000,
      desc: 'Rút tiền về Techcombank (STK: 1903***)',
      method: 'Chuyển khoản 24/7',
      status: 'COMPLETED',
      category: 'WITHDRAW',
    },
    {
      id: 'tx_4',
      code: 'DEP-55012',
      time: '25/10/2026, 09:30',
      type: 'IN',
      amount: 500000,
      desc: 'Nạp quỹ bảo đảm nhận cuốc tiền mặt (VietQR PayOS)',
      method: 'VietQR PayOS',
      status: 'COMPLETED',
      category: 'DEPOSIT_TOPUP',
    },
    {
      id: 'tx_5',
      code: 'TX-65104',
      time: '24/10/2026, 14:10',
      type: 'IN',
      amount: 496000,
      desc: 'Thù lao chuyến xe #MM-65104 (80% cước phí)',
      method: 'Cộng tự động',
      status: 'COMPLETED',
      category: 'TRIP_FARE',
    },
  ];

  const handleWithdraw = (e: React.FormEvent) => {
    e.preventDefault();
    setWithdrawSuccess(true);
    setTimeout(() => {
      setWithdrawSuccess(false);
      setShowWithdrawModal(false);
    }, 1800);
  };

  const handleTopUp = () => {
    setTopUpSuccess(true);
    setTimeout(() => {
      setTopUpSuccess(false);
      setShowTopUpDepositModal(false);
    }, 1800);
  };

  const filteredTransactions = transactions.filter((tx) => {
    if (activeTxTab === 'IN') return tx.type === 'IN';
    if (activeTxTab === 'OUT') return tx.type === 'OUT';
    return true;
  });

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50/70 select-none overflow-y-auto font-sans min-w-0">
      {/* 1. Header Bar */}
      <div className="bg-white border-b border-slate-200/80 px-4 sm:px-6 py-4 sticky top-0 z-10 shadow-2xs">
        <div className="max-w-[1680px] mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-brand-500" />
              <h1 className="text-lg sm:text-xl font-black text-slate-900 leading-tight">
                Ví Tài Xế & Quản Lý Doanh Thu
              </h1>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              Quản lý tài khoản thu nhập, tiền ký quỹ đơn hàng và lịch sử thanh toán minh bạch
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowTopUpDepositModal(true)}
              className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs transition cursor-pointer flex items-center gap-1.5"
            >
              <QrCode className="w-4 h-4 text-brand-600" />
              <span>Nạp quỹ bảo đảm</span>
            </button>
            <button
              type="button"
              onClick={() => setShowWithdrawModal(true)}
              className="py-2.5 px-4 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-black text-xs shadow-md shadow-orange-500/25 transition cursor-pointer flex items-center gap-1.5"
            >
              <Download className="w-4 h-4" />
              <span>Rút tiền về ngân hàng</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Main Container: 2-Column Split Modern FinTech Layout */}
      <div className="flex-1 px-4 sm:px-6 py-5 max-w-[1680px] w-full mx-auto space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* ========================================================= */}
          {/* CỘT TRÁI (5 Cột): THẺ VÍ ĐIỆN TỬ VIP & QUẢN LÝ TÀI KHOẢN */}
          {/* ========================================================= */}
          <div className="lg:col-span-5 space-y-5">
            {/* THẺ ATM / VÍ ĐIỆN TỬ DRIVER CARD */}
            <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-brand-950 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden border border-slate-800">
              {/* Background ambient lighting */}
              <div className="absolute -right-16 -top-16 w-52 h-52 bg-brand-500/15 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -left-16 -bottom-16 w-52 h-52 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10 space-y-5">
                {/* Header thẻ: Logo & Chip */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-500 to-orange-400 flex items-center justify-center font-black text-white text-xs shadow-sm">
                      M
                    </div>
                    <div>
                      <span className="font-black text-sm tracking-tight text-white block">
                        ModMove <span className="text-amber-400">Driver Pay</span>
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">Tài khoản thu nhập đối tác</span>
                    </div>
                  </div>

                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-black uppercase flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    Đang hoạt động
                  </span>
                </div>

                {/* Số dư chính */}
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    SỐ DƯ KHẢ DỤNG (RÚT ĐƯỢC NGAY)
                  </span>
                  <div className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                    {formatCurrency(walletBalance)}
                  </div>
                </div>

                {/* Card Holder & Account Footer */}
                <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold">CHỦ TÀI KHOẢN:</span>
                    <span className="font-extrabold text-white text-sm">NGUYỄN VĂN HÙNG</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block font-bold">MÃ TÀI XẾ:</span>
                    <span className="font-mono font-bold text-amber-300 text-xs">DRV-88219</span>
                  </div>
                </div>

                {/* Quick Action Button on Card */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowWithdrawModal(true)}
                    className="py-2.5 px-3 rounded-xl bg-white text-slate-900 hover:bg-slate-100 font-black text-xs transition cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5 text-brand-600" />
                    <span>Rút về ngân hàng</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowTopUpDepositModal(true)}
                    className="py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-black text-xs transition cursor-pointer flex items-center justify-center gap-1.5 border border-white/15"
                  >
                    <QrCode className="w-3.5 h-3.5 text-amber-400" />
                    <span>Nạp quỹ bảo đảm</span>
                  </button>
                </div>
              </div>
            </div>

            {/* THẺ QUỸ BẢO ĐẢM NHẬN CUỐC TIỀN MẶT */}
            <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-black text-sm text-slate-900">Quỹ bảo đảm nhận cuốc tiền mặt</h3>
                    <span className="text-[10px] text-slate-400">Ký quỹ phục vụ thu hộ cước tiền mặt</span>
                  </div>
                </div>

                <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-black px-2 py-0.5 rounded-full">
                  ĐỦ ĐIỀU KIỆN
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Số dư quỹ hiện tại:</span>
                  <span className="text-2xl font-black text-slate-900">{formatCurrency(depositBalance)}</span>
                </div>
                <div className="text-right text-xs">
                  <span className="text-[10px] text-slate-400 block font-bold">Mức duy trì tối thiểu:</span>
                  <span className="font-bold text-slate-700">200.000 đ</span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl text-[11px] text-slate-600 flex items-start gap-2">
                <Info className="w-4 h-4 text-brand-500 mt-0.5 flex-shrink-0" />
                <span>
                  Tiền ký quỹ được hoàn trả 100% khi tài xế tạm dừng hoạt động hoặc đối soát hết các đơn tiền mặt.
                </span>
              </div>
            </div>

            {/* THẺ TỔNG KẾT DOANH THU & HIỆU SUẤT TRONG NGÀY */}
            <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-orange-50 text-brand-600 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <h3 className="font-black text-sm text-slate-900">Hiệu suất thu nhập hôm nay</h3>
                </div>
                <span className="text-xs text-slate-500 font-bold">2 chuyến đã chạy</span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 bg-emerald-50/80 rounded-2xl border border-emerald-100">
                  <span className="text-slate-500 text-[10px] block font-bold uppercase">Thù lao thực nhận:</span>
                  <span className="text-xl font-black text-emerald-600 block mt-0.5">
                    +{formatCurrency(todayEarnings)}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-1">Đã khấu trừ 20% phí sàn</span>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                  <span className="text-slate-500 text-[10px] block font-bold uppercase">Tỷ lệ hoàn thành:</span>
                  <span className="text-xl font-black text-slate-900 block mt-0.5">100%</span>
                  <span className="text-[10px] text-emerald-600 font-bold block mt-1">Không hủy cuốc</span>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* CỘT PHẢI (7 Cột): BẢNG LỊCH SỬ BIẾN ĐỘNG SỐ DƯ & BỘ LỌC */}
          {/* ========================================================= */}
          <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
            {/* Header bảng & Tabs lọc */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-brand-600" />
                <h2 className="text-sm sm:text-base font-black text-slate-900">
                  Lịch Sử Giao Dịch & Biến Động Số Dư
                </h2>
              </div>

              {/* Tabs lọc: Tất cả / Tiền vào / Rút ra */}
              <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-600">
                <button
                  type="button"
                  onClick={() => setActiveTxTab('ALL')}
                  className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                    activeTxTab === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
                  }`}
                >
                  Tất cả
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTxTab('IN')}
                  className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                    activeTxTab === 'IN' ? 'bg-white text-emerald-700 shadow-xs' : 'hover:text-slate-900'
                  }`}
                >
                  Tiền vào (+)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTxTab('OUT')}
                  className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                    activeTxTab === 'OUT' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
                  }`}
                >
                  Rút ra (-)
                </button>
              </div>
            </div>

            {/* Danh sách giao dịch */}
            <div className="divide-y divide-slate-100 text-xs">
              {filteredTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="py-3.5 flex items-center justify-between gap-3 hover:bg-slate-50/70 px-2 rounded-2xl transition"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                        tx.type === 'IN'
                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                          : 'bg-rose-50 text-rose-600 border border-rose-100'
                      }`}
                    >
                      {tx.type === 'IN' ? (
                        <ArrowDownRight className="w-5 h-5 stroke-[2.5]" />
                      ) : (
                        <ArrowUpRight className="w-5 h-5 stroke-[2.5]" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="font-extrabold text-slate-800 text-xs sm:text-sm truncate">
                        {tx.desc}
                      </div>
                      <div className="text-slate-400 text-[11px] mt-0.5 flex flex-wrap items-center gap-2">
                        <span className="font-mono font-bold text-slate-500">#{tx.code}</span>
                        <span>•</span>
                        <span>{tx.time}</span>
                        <span>•</span>
                        <span className="text-slate-600 font-medium">{tx.method}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <div
                      className={`font-black text-sm sm:text-base ${
                        tx.type === 'IN' ? 'text-emerald-600' : 'text-slate-900'
                      }`}
                    >
                      {tx.type === 'IN' ? '+' : '-'}
                      {formatCurrency(tx.amount)}
                    </div>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full inline-block mt-0.5">
                      Thành công
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer thông tin ngân hàng liên kết */}
            <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-500">
              <div className="flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                <span>Ngân hàng liên kết nhận tiền: <strong>TECHCOMBANK - 19036789012</strong></span>
              </div>
              <span className="text-emerald-600 font-bold">Xác thực chính chủ ✓</span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: YÊU CẦU RÚT TIỀN VỀ TÀI KHOẢN NGÂN HÀNG */}
      {/* ========================================================================= */}
      {showWithdrawModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200">
            <div className="bg-slate-900 border-b border-slate-800 p-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Download className="w-5 h-5 text-blue-400" />
                <h3 className="font-black text-sm text-white">Rút tiền về tài khoản ngân hàng</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowWithdrawModal(false)}
                className="w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            {withdrawSuccess ? (
              <div className="p-6 text-center space-y-3">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto animate-bounce" />
                <h4 className="font-black text-slate-800 text-base">Gửi lệnh rút tiền thành công!</h4>
                <p className="text-xs text-slate-500">
                  Hệ thống chuyển khoản tức thì 24/7 về tài khoản của bạn trong vòng 3-5 phút.
                </p>
              </div>
            ) : (
              <form onSubmit={handleWithdraw} className="p-5 space-y-4 text-xs">
                {/* Số dư khả dụng */}
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex justify-between items-center">
                  <span className="text-slate-500">Số dư khả dụng:</span>
                  <span className="font-black text-slate-900 text-sm">{formatCurrency(walletBalance)}</span>
                </div>

                <div>
                  <label className="font-extrabold text-slate-800 block mb-1">Số tiền muốn rút (VNĐ):</label>
                  <input
                    type="number"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    max={walletBalance}
                    min={50000}
                    step={10000}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-slate-800 font-black text-base focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                  {/* Phím chọn nhanh */}
                  <div className="grid grid-cols-4 gap-1.5 mt-2">
                    {QUICK_WITHDRAW_AMOUNTS.map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setWithdrawAmount(amt.toString())}
                        className="py-1 px-1 rounded-lg border border-slate-200 bg-slate-50 text-[10px] font-bold hover:bg-orange-50 hover:text-brand-600 transition"
                      >
                        {amt >= 1000000 ? `${amt / 1000000} Tr` : `${amt / 1000} K`}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="font-extrabold text-slate-800 block mb-1">Tài khoản ngân hàng thụ hưởng:</label>
                  <input
                    type="text"
                    disabled
                    value={bankAccount}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-100 text-slate-700 font-bold"
                  />
                </div>

                <div>
                  <label className="font-extrabold text-slate-800 block mb-1">Chủ tài khoản (Đã xác minh):</label>
                  <input
                    type="text"
                    disabled
                    value={bankName}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-100 text-slate-700 font-bold"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowWithdrawModal(false)}
                    className="flex-1 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 font-bold text-slate-700 cursor-pointer"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-black shadow-md shadow-orange-500/25 cursor-pointer"
                  >
                    Xác nhận rút tiền
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: NẠP TIỀN QUỸ BẢO ĐẢM NHẬN CUỐC COD (VIETQR PAYOS) */}
      {/* ========================================================================= */}
      {showTopUpDepositModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-sm w-full overflow-hidden shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200 p-6 text-center space-y-4 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-black text-sm text-slate-900">Nạp quỹ bảo đảm VietQR</h3>
              <button
                type="button"
                onClick={() => setShowTopUpDepositModal(false)}
                className="w-6 h-6 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-slate-500 leading-relaxed">
              Quét mã VietQR chuyển khoản <strong>500.000 VNĐ</strong> để tăng hạn mức nhận cuốc tiền mặt COD.
            </p>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 inline-block">
              <img
                src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=00020101021238540010A00000072701240006970422011009123456780208QRIBFTTA530370454065000005802VN62160812TOPUP-MODMOVE6304"
                alt="VietQR PayOS"
                className="w-44 h-44 mx-auto rounded-xl"
              />
            </div>

            <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-800 text-[11px] font-bold">
              Nội dung chuyển khoản: TOPUP DRV-88219
            </div>

            <button
              type="button"
              onClick={handleTopUp}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black shadow-md cursor-pointer"
            >
              {topUpSuccess ? '✓ Đã nhận tiền thành công!' : 'Tôi đã chuyển khoản xong'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
