/** Tài khoản ngân hàng nhận tiền hoàn: dùng cho khiếu nại, hoàn tiền sự cố và khai/sửa sau khi gửi yêu cầu */
import React, { useState } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/Button';
import { toast } from '../../components/ui/feedback';
import { inputClass } from '../../components/ui/Field';
import { customerApi, publicApi } from '../../api/endpoints';
import { useQuery } from '../../api/useQuery';
import type { MyRefundDetailResponse, PayoutAccountInput } from '../../api/types';
import { errorMessage } from '../../services/mock/storage';

export interface PayoutAccountValue {
  bankCode: string;
  accountNumber: string;
  accountHolder: string;
}

export const emptyPayoutAccount: PayoutAccountValue = { bankCode: '', accountNumber: '', accountHolder: '' };

/** Tên chủ tài khoản: chữ in hoa không dấu, chỉ A–Z và dấu cách (yêu cầu của ngân hàng) */
export const normalizeHolder = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toUpperCase()
    .replace(/[^A-Z ]/g, '');

/** Trả về câu báo lỗi tiếng Việt, hoặc null nếu hợp lệ */
export const validatePayoutAccount = (v: PayoutAccountValue): string | null => {
  if (!v.bankCode) return 'Vui lòng chọn ngân hàng nhận tiền hoàn.';
  if (!/^\d{6,19}$/.test(v.accountNumber)) return 'Số tài khoản gồm 6 đến 19 chữ số.';
  const holder = v.accountHolder.trim();
  if (holder.length < 2 || holder.length > 100) return 'Tên chủ tài khoản từ 2 đến 100 ký tự.';
  return null;
};

export const toPayoutInput = (v: PayoutAccountValue): PayoutAccountInput => ({
  useSuggested: false,
  bankCode: v.bankCode,
  accountNumber: v.accountNumber,
  accountHolder: v.accountHolder.trim(),
});

export const PayoutAccountForm: React.FC<{ value: PayoutAccountValue; onChange: (v: PayoutAccountValue) => void }> = ({ value, onChange }) => {
  const banks = useQuery(() => publicApi.banks(), []);
  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1">
          Ngân hàng nhận tiền hoàn <span className="text-rose-500">*</span>
        </label>
        <select value={value.bankCode} onChange={(e) => onChange({ ...value, bankCode: e.target.value })} className={inputClass()} disabled={banks.loading}>
          <option value="">{banks.loading ? 'Đang tải…' : '— Chọn ngân hàng —'}</option>
          {(banks.data ?? []).map((b) => (
            <option key={b.code} value={b.code}>
              {b.name}
            </option>
          ))}
        </select>
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Số tài khoản <span className="text-rose-500">*</span>
          </label>
          <input
            inputMode="numeric"
            maxLength={19}
            value={value.accountNumber}
            onChange={(e) => onChange({ ...value, accountNumber: e.target.value.replace(/\D/g, '') })}
            className={inputClass()}
            placeholder="6 đến 19 chữ số"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Chủ tài khoản <span className="text-rose-500">*</span>
          </label>
          <input
            maxLength={100}
            value={value.accountHolder}
            onChange={(e) => onChange({ ...value, accountHolder: normalizeHolder(e.target.value) })}
            className={inputClass()}
            placeholder="NGUYEN VAN A (chữ in hoa, không dấu)"
          />
        </div>
      </div>
      <p className="text-[11px] text-slate-500">Hệ thống chỉ hiển thị lại 4 số cuối của tài khoản. Quản trị viên dùng thông tin này để chuyển khoản hoàn tiền.</p>
    </div>
  );
};

/** Khai hoặc sửa tài khoản nhận hoàn tiền cho khoản hoàn đã gửi (khoản chưa chuyển hoặc chuyển lỗi) */
export const PayoutAccountModal: React.FC<{ refund: MyRefundDetailResponse; onClose: () => void; onDone: () => void }> = ({ refund, onClose, onDone }) => {
  const [value, setValue] = useState<PayoutAccountValue>(emptyPayoutAccount);
  const [busy, setBusy] = useState(false);
  // FE-07: BE gợi ý tài khoản đã dùng để thanh toán PayOS cho đơn; chọn thì gửi useSuggested, không gửi lại số tài khoản
  const suggested = refund.suggestedPayoutAccount;
  const [useSuggested, setUseSuggested] = useState(!!suggested && !refund.payoutFailureReason);
  const submit = async () => {
    if (!useSuggested) {
      const error = validatePayoutAccount(value);
      if (error) return toast.error(error);
    }
    setBusy(true);
    try {
      await customerApi.setRefundPayoutAccount(refund.id, useSuggested ? { useSuggested: true, bankCode: null, accountNumber: null, accountHolder: null } : toPayoutInput(value));
      toast.success('Đã lưu tài khoản nhận hoàn tiền.');
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
      size="lg"
      title={`Tài khoản nhận hoàn tiền – khoản #${refund.id}`}
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose}>
            Đóng
          </Button>
          <Button size="sm" onClick={submit} isLoading={busy}>
            Lưu tài khoản
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        {refund.payoutFailureReason && (
          <div className="rounded-lg bg-rose-50 border border-rose-200 p-2 text-xs text-rose-700">
            Lần chuyển khoản trước bị lỗi: {refund.payoutFailureReason}. Hãy nhập tài khoản khác hoặc kiểm tra lại thông tin.
          </div>
        )}
        {suggested && (
          <div className="space-y-2">
            <label className={`flex items-start gap-3 rounded-xl border p-3 cursor-pointer ${useSuggested ? 'border-blue-500 bg-blue-50' : 'border-slate-200'}`}>
              <input type="radio" className="mt-1" checked={useSuggested} onChange={() => setUseSuggested(true)} />
              <span className="text-sm">
                <b>Dùng tài khoản đã thanh toán đơn này</b>
                <span className="block text-xs text-slate-600">
                  {suggested.bankName} • {suggested.maskedAccountNumber} • {suggested.accountHolder}
                </span>
              </span>
            </label>
            <label className={`flex items-center gap-3 rounded-xl border p-3 cursor-pointer ${!useSuggested ? 'border-blue-500 bg-blue-50' : 'border-slate-200'}`}>
              <input type="radio" checked={!useSuggested} onChange={() => setUseSuggested(false)} />
              <span className="text-sm font-bold">Nhập tài khoản khác</span>
            </label>
          </div>
        )}
        {!useSuggested && <PayoutAccountForm value={value} onChange={setValue} />}
      </div>
    </Modal>
  );
};
