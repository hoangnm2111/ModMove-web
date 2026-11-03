import React, { useState } from 'react';
import { QrCode, RefreshCw } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { Banner } from '../../components/ui/feedback';
import { Button } from '../../components/Button';
import { BUSINESS, IS_DEMO, PAYOS_RECEIVER } from '../../config/business';
import { msg } from '../../constants/messages';
import { useCountdown } from '../../hooks/useLiveData';
import { formatCurrency } from '../../utils/format';

interface PayOsModalProps {
  open: boolean;
  amount: number;
  reference: string;
  title?: string;
  /** Gọi backend kiểm tra trạng thái (mock: xác nhận đã trả) */
  onPaid: () => Promise<void>;
  onClose: () => void;
}

/** UC-CUS-27 / UC-DRV-21 – Thanh toán VietQR qua PayOS */
export const PayOsModal: React.FC<PayOsModalProps> = ({ open, amount, reference, title = 'Thanh toán PayOS', onPaid, onClose }) => {
  const [deadline, setDeadline] = useState(() => Date.now() + BUSINESS.PAYOS_CODE_TTL_SECONDS * 1000);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const left = useCountdown(open ? deadline : null);
  const expired = open && left === 0;

  const renew = () => {
    setError(null);
    setDeadline(Date.now() + BUSINESS.PAYOS_CODE_TTL_SECONDS * 1000);
  };

  const check = async () => {
    setChecking(true);
    setError(null);
    try {
      await onPaid();
    } catch (e) {
      setError(e instanceof Error ? e.message : msg('MSG49'));
    } finally {
      setChecking(false);
    }
  };

  const mm = String(Math.floor(left / 60)).padStart(2, '0');
  const ss = String(left % 60).padStart(2, '0');

  return (
    <Modal
      open={open}
      title={title}
      onClose={onClose}
      footer={
        expired ? (
          <Button size="sm" onClick={renew}>
            <RefreshCw className="w-4 h-4 mr-1.5" /> Tạo mã mới
          </Button>
        ) : (
          <Button size="sm" onClick={check} isLoading={checking}>
            {IS_DEMO ? 'Tôi đã chuyển khoản (mô phỏng webhook)' : 'Kiểm tra trạng thái'}
          </Button>
        )
      }
    >
      <div className="space-y-3">
        {expired ? <Banner kind="warning">{msg('MSG50')}</Banner> : <Banner kind="info">{msg('MSG46', { amount: formatCurrency(amount) })}</Banner>}
        <div className="flex flex-col items-center gap-2 py-2">
          <div className={`w-44 h-44 rounded-2xl border-2 border-slate-200 flex items-center justify-center ${expired ? 'opacity-30' : ''}`}>
            <QrCode className="w-32 h-32 text-slate-800" />
          </div>
          {!expired && (
            <span className="text-xs text-slate-500">
              Mã hết hạn sau <b className="text-slate-900">{mm}:{ss}</b>
            </span>
          )}
        </div>
        <dl className="text-xs grid grid-cols-[auto,1fr] gap-x-3 gap-y-1 bg-slate-50 rounded-xl p-3">
          <dt className="text-slate-500">Ngân hàng</dt>
          <dd className="font-bold">{PAYOS_RECEIVER.bankName}</dd>
          <dt className="text-slate-500">Số tài khoản</dt>
          <dd className="font-bold">{PAYOS_RECEIVER.accountNumber}</dd>
          <dt className="text-slate-500">Chủ tài khoản</dt>
          <dd className="font-bold">{PAYOS_RECEIVER.accountName}</dd>
          <dt className="text-slate-500">Số tiền</dt>
          <dd className="font-black text-blue-700">{formatCurrency(amount)}</dd>
          <dt className="text-slate-500">Nội dung</dt>
          <dd className="font-bold">{reference}</dd>
        </dl>
        {error && <Banner kind="error">{error}</Banner>}
      </div>
    </Modal>
  );
};
