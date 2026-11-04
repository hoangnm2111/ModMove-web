import { WalletTransaction, WithdrawalRequest } from '../types/case.types';
import { apiClient, toServiceError } from './api';
import { readStore, ServiceError, subscribeStore, writeStore } from './mock/storage';
import { PagedResult } from './pagination';

/**
 * Driver wallet – đọc từ api/driver/status (số dư); api/admin/withdrawals để Admin xử lý yêu cầu rút tiền.
 * Backend hiện CHƯA có endpoint cho tài xế tự tạo yêu cầu rút tiền / nạp ký quỹ trên web
 * (DECISIONS C11: nghiệp vụ tài xế thuộc app di động) – 2 hàm đó báo lỗi rõ ràng, không giả lập.
 */
export interface DriverWallet {
  driverId: string;
  depositBalance: number;
  earningsBalance: number;
  bankName?: string;
  bankAccount?: string;
  transactions: WalletTransaction[];
}

const WITHDRAWALS = 'adminWithdrawals';

const emptyWallet = (driverId: string): DriverWallet => ({ driverId, depositBalance: 0, earningsBalance: 0, transactions: [] });

export const walletService = {
  subscribe: (cb: () => void) => subscribeStore(WITHDRAWALS, cb),

  getWalletSync: (driverId: string): DriverWallet => emptyWallet(driverId),

  // --------------------------------------------------------------- Admin
  listWithdrawalsSync: (): WithdrawalRequest[] => readStore(WITHDRAWALS, () => []),

  /** UC-ADM-07: GET /admin/withdrawals */
  async loadWithdrawals(): Promise<void> {
    try {
      const { data } = await apiClient.get<
        PagedResult<{ transactionId: number; driverName: string; driverPhone: string; amount: number; transactionStatus: string; bankName?: string; bankAccountNumber?: string; referenceCode?: string; createdAt: string }>
      >('/admin/Withdrawals', { params: { page: 1, pageSize: 50 } });
      writeStore(
        WITHDRAWALS,
        data.items.map(
          (w): WithdrawalRequest => ({
            id: String(w.transactionId),
            driverId: '',
            driverName: w.driverName,
            bankName: w.bankName ?? '',
            bankAccount: w.bankAccountNumber ?? '',
            amount: w.amount,
            status: w.transactionStatus === 'Pending' ? 'Pending' : w.transactionStatus === 'Completed' ? 'Paid' : 'Rejected',
            bankReferenceCode: w.referenceCode,
            createdAt: w.createdAt,
          })
        )
      );
    } catch {
      /* ignore */
    }
  },

  /** UC-ADM-07 / GB-27 */
  async markWithdrawalPaid(id: string, bankReferenceCode: string): Promise<void> {
    try {
      await apiClient.post(`/admin/Withdrawals/${id}/approve`, { bankReferenceCode });
      await walletService.loadWithdrawals();
    } catch (e) {
      throw toServiceError(e);
    }
  },

  async rejectWithdrawal(id: string, reason: string): Promise<void> {
    try {
      await apiClient.post(`/admin/Withdrawals/${id}/reject`, { reason: reason || null });
      await walletService.loadWithdrawals();
    } catch (e) {
      throw toServiceError(e);
    }
  },

  // -------------------------------------------------------------- Driver
  async topUpDeposit(_driverId: string, _amount: number): Promise<DriverWallet> {
    throw new ServiceError('Backend chưa có API nạp ký quỹ cho tài xế trên web (DECISIONS C11: dành cho app di động).');
  },

  async requestWithdrawal(_driverId: string, _driverName: string, _amount: number): Promise<WithdrawalRequest> {
    throw new ServiceError('Backend chưa có API tạo yêu cầu rút tiền cho tài xế trên web (DECISIONS C11: dành cho app di động).');
  },
};
