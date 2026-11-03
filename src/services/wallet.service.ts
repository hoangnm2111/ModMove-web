import { BUSINESS } from '../config/business';
import { msg } from '../constants/messages';
import { calculateCommission } from '../domain/pricing';
import { WalletTransaction, WithdrawalRequest } from '../types/case.types';
import { ShippingOrder } from '../types/order.types';
import { latency, readStore, ServiceError, subscribeStore, uid, writeStore } from './mock/storage';
import { registerCompletionHandler } from './order.service';

/**
 * Driver wallet – SRS DriverWallet / WalletTransaction, GB-14, GB-15, GB-32.
 * DepositBalance: chỉ nạp, bị trừ hoa hồng đơn tiền mặt, không rút.
 * EarningsBalance: nhận thu nhập đơn PayOS, rút được, mỗi lúc 1 yêu cầu Pending.
 */
export interface DriverWallet {
  driverId: string;
  depositBalance: number;
  earningsBalance: number;
  bankName?: string;
  bankAccount?: string;
  transactions: WalletTransaction[];
}

const WALLETS = 'wallets';
const WITHDRAWALS = 'withdrawals';
const now = () => new Date().toISOString();

const seedWallets = (): Record<string, DriverWallet> => ({
  drv_88: {
    driverId: 'drv_88',
    depositBalance: 500_000,
    earningsBalance: 1_850_000,
    bankName: 'Vietcombank',
    bankAccount: '0011004455667',
    transactions: [
      { id: 'tx1', type: 'TopUpDeposit', amount: 500_000, balanceAfter: 500_000, referenceCode: 'PAYOS-88123', status: 'Completed', createdAt: new Date(Date.now() - 86_400_000 * 3).toISOString() },
      { id: 'tx2', type: 'TripEarning', amount: 1_850_000, balanceAfter: 1_850_000, orderCode: 'MM-90182', status: 'Completed', createdAt: new Date(Date.now() - 86_400_000).toISOString() },
    ],
  },
});

const seedWithdrawals = (): WithdrawalRequest[] => [
  { id: 'WD-301', driverId: 'drv_33', driverName: 'Phạm Quốc Bảo', bankName: 'Techcombank', bankAccount: '1903 5566 7788', amount: 1_200_000, status: 'Pending', createdAt: new Date(Date.now() - 3_600_000).toISOString() },
  { id: 'WD-302', driverId: 'drv_02', driverName: 'Lê Hoàng Nam', bankName: 'MB Bank', bankAccount: '0338 112 233', amount: 2_450_000, status: 'Pending', createdAt: new Date(Date.now() - 7_200_000).toISOString() },
];

const wallets = () => readStore(WALLETS, seedWallets);
const withdrawals = () => readStore(WITHDRAWALS, seedWithdrawals);

function getOrCreate(driverId: string): DriverWallet {
  return wallets()[driverId] ?? { driverId, depositBalance: 0, earningsBalance: 0, transactions: [] };
}

function saveWallet(w: DriverWallet) {
  writeStore(WALLETS, { ...wallets(), [w.driverId]: w });
}

function addTx(w: DriverWallet, tx: Omit<WalletTransaction, 'id' | 'createdAt' | 'balanceAfter'>, balanceAfter: number): DriverWallet {
  return { ...w, transactions: [{ ...tx, id: uid('tx'), balanceAfter, createdAt: now() }, ...w.transactions] };
}

/** GB-14 / GB-15: quyết toán khi đơn Completed */
registerCompletionHandler((order: ShippingOrder) => {
  const driverId = order.assignedDriver?.id;
  if (!driverId) return;
  let w = getOrCreate(driverId);
  if (w.transactions.some((t) => t.orderCode === order.code)) return; // tối đa 1 lần / đơn
  const rate = order.commissionRate ?? BUSINESS.DEFAULT_COMMISSION_RATE;
  const commission = calculateCommission(order.fare.total, rate);
  if (order.paymentMethod === 'PayOS') {
    // PayOS: cộng cước gộp vào thu nhập rồi trừ hoa hồng
    const afterEarning = w.earningsBalance + order.fare.total;
    w = addTx(w, { type: 'TripEarning', amount: order.fare.total, orderCode: order.code, status: 'Completed' }, afterEarning);
    w = addTx({ ...w, earningsBalance: afterEarning }, { type: 'CommissionDeduction', amount: -commission, orderCode: order.code, status: 'Completed' }, afterEarning - commission);
    w = { ...w, earningsBalance: afterEarning - commission };
  } else {
    // Cash: tài xế đã cầm tiền mặt, hoa hồng trừ vào ký quỹ
    const afterDeposit = w.depositBalance - commission;
    w = addTx({ ...w, depositBalance: afterDeposit }, { type: 'CommissionDeduction', amount: -commission, orderCode: order.code, status: 'Completed' }, afterDeposit);
  }
  saveWallet(w);
});

export const walletService = {
  subscribe: (cb: () => void) => {
    const a = subscribeStore(WALLETS, cb);
    const b = subscribeStore(WITHDRAWALS, cb);
    return () => {
      a();
      b();
    };
  },

  getWalletSync: (driverId: string): DriverWallet => getOrCreate(driverId),
  listWithdrawalsSync: (): WithdrawalRequest[] => withdrawals().sort((a, b) => b.createdAt.localeCompare(a.createdAt)),

  /** UC-DRV-21 / GB-32: tối thiểu 50.000đ (mock PayOS đã thanh toán) */
  async topUpDeposit(driverId: string, amount: number): Promise<DriverWallet> {
    await latency(600);
    if (!Number.isFinite(amount) || amount < BUSINESS.MIN_DEPOSIT_TOPUP) {
      throw new ServiceError(msg('MSG03', { field_name: 'Số tiền nạp', constraints: `tối thiểu ${BUSINESS.MIN_DEPOSIT_TOPUP.toLocaleString('vi-VN')} đ` }));
    }
    const w = getOrCreate(driverId);
    const after = w.depositBalance + amount;
    const next = addTx({ ...w, depositBalance: after }, { type: 'TopUpDeposit', amount, referenceCode: `PAYOS-${Date.now().toString().slice(-6)}`, status: 'Completed' }, after);
    saveWallet(next);
    return next;
  },

  /** UC-DRV-22 / GB-32, MSG55, MSG66 */
  async requestWithdrawal(driverId: string, driverName: string, amount: number): Promise<WithdrawalRequest> {
    await latency();
    const w = getOrCreate(driverId);
    if (!w.bankAccount) throw new ServiceError(msg('MSG66'));
    if (!Number.isFinite(amount) || amount <= 0) throw new ServiceError(msg('MSG02', { field_name: 'số tiền' }));
    if (amount > w.earningsBalance) throw new ServiceError(msg('MSG55'));
    if (withdrawals().some((x) => x.driverId === driverId && x.status === 'Pending')) {
      throw new ServiceError('Bạn đang có một yêu cầu rút tiền chờ xử lý (GB-32).');
    }
    const req: WithdrawalRequest = {
      id: uid('WD').toUpperCase(),
      driverId,
      driverName,
      bankName: w.bankName!,
      bankAccount: w.bankAccount,
      amount,
      status: 'Pending',
      createdAt: now(),
    };
    writeStore(WITHDRAWALS, [req, ...withdrawals()]);
    return req;
  },

  /** UC-ADM-24 / GB-27: chuyển khoản thủ công, ghi mã tham chiếu */
  async markWithdrawalPaid(id: string, bankReferenceCode: string): Promise<WithdrawalRequest> {
    await latency();
    if (!bankReferenceCode.trim()) throw new ServiceError(msg('MSG01', { field_name: 'Mã giao dịch ngân hàng' }));
    const list = withdrawals();
    const req = list.find((x) => x.id === id);
    if (!req || req.status !== 'Pending') throw new ServiceError(msg('MSG07'));
    const w = getOrCreate(req.driverId);
    if (req.amount > w.earningsBalance && wallets()[req.driverId]) throw new ServiceError(msg('MSG55'));
    if (wallets()[req.driverId]) {
      const after = w.earningsBalance - req.amount;
      saveWallet(addTx({ ...w, earningsBalance: after }, { type: 'WithdrawEarnings', amount: -req.amount, referenceCode: bankReferenceCode, status: 'Completed' }, after));
    }
    const next: WithdrawalRequest = { ...req, status: 'Paid', bankReferenceCode };
    writeStore(WITHDRAWALS, list.map((x) => (x.id === id ? next : x)));
    return next;
  },

  async rejectWithdrawal(id: string, reason: string): Promise<WithdrawalRequest> {
    await latency();
    if (!reason.trim()) throw new ServiceError(msg('MSG01', { field_name: 'Lý do từ chối' }));
    const list = withdrawals();
    const req = list.find((x) => x.id === id);
    if (!req || req.status !== 'Pending') throw new ServiceError(msg('MSG07'));
    const next: WithdrawalRequest = { ...req, status: 'Rejected', rejectReason: reason };
    writeStore(WITHDRAWALS, list.map((x) => (x.id === id ? next : x)));
    return next;
  },
};
