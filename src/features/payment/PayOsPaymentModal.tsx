import React, { useEffect, useRef, useState } from 'react';
import { ExternalLink, RefreshCw, ShieldCheck, Timer } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { Banner, toast } from '../../components/ui/feedback';
import { Button } from '../../components/Button';
import { customerApi } from '../../api/endpoints';
import type { CreateOrderPaymentResponse } from '../../api/types';
import { errorMessage } from '../../services/mock/storage';
import { formatCurrency, formatDateTime } from '../../utils/format';

/**
 * UC-CUS-27 – Thanh toán PayOS: POST /customer/Orders/{id}/payment (platform=Web).
 * Mã sống 10 phút; hết hạn thì tạo mã mới cho cùng đơn (DECISIONS 3.1).
 * Trạng thái "đã trả" chỉ tin webhook → nút "Kiểm tra" tải lại chi tiết đơn.
 */
export const PayOsPaymentModal: React.FC<{ orderId: number; orderCode: string; onClose: () => void; onChecked: () => Promise<boolean> }> = ({
  orderId,
  orderCode,
  onClose,
  onChecked,
}) => {
  const [session, setSession] = useState<CreateOrderPaymentResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [checking, setChecking] = useState(false);
  const [now, setNow] = useState(Date.now());

  const create = async () => {
    setCreating(true);
    setError(null);
    try {
      setSession(await customerApi.createPayment(orderId));
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setCreating(false);
    }
  };

  // Chỉ tạo phiên một lần khi mở (StrictMode dev chạy effect 2 lần → tránh tạo 2 giao dịch PayOS)
  const created = useRef<number | null>(null);
  useEffect(() => {
    if (created.current !== orderId) {
      created.current = orderId;
      void create();
    }
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  const left = session ? Math.max(0, Math.floor((new Date(session.expiresAt).getTime() - now) / 1000)) : 0;
  const expired = !!session && left === 0;

  const check = async () => {
    setChecking(true);
    try {
      const paid = await onChecked();
      if (paid) {
        toast.success(`Đã nhận thanh toán cho đơn ${orderCode}. Đơn đang được gửi tới tài xế.`);
        onClose();
      } else toast.warning('Chưa nhận được xác nhận từ PayOS. Nếu bạn vừa chuyển khoản, đợi vài giây rồi kiểm tra lại.');
    } finally {
      setChecking(false);
    }
  };

  return (
    <Modal open title={`Thanh toán PayOS – ${orderCode}`} onClose={onClose}>
      <div className="space-y-4">
        {error && <Banner kind="error">{error}</Banner>}
        {creating && !session && <p className="text-sm text-slate-500">Đang tạo phiên thanh toán…</p>}
        {session && (
          <>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center space-y-1">
              <div className="text-[11px] font-bold uppercase text-slate-500">Số tiền cần thanh toán</div>
              <div className="text-3xl font-black text-slate-900">{formatCurrency(session.amount)}</div>
              <div className={`text-xs font-bold flex items-center justify-center gap-1 ${expired ? 'text-rose-600' : 'text-amber-600'}`}>
                <Timer className="w-3.5 h-3.5" />
                {expired ? 'Mã đã hết hạn' : `Mã hết hạn sau ${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`}
                <span className="text-slate-400 font-medium">({formatDateTime(session.expiresAt)})</span>
              </div>
            </div>
            {!expired ? (
              <a href={session.checkoutUrl} target="_blank" rel="noreferrer" className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm">
                <ExternalLink className="w-4 h-4" /> Mở trang thanh toán PayOS
              </a>
            ) : (
              <Banner kind="warning">Mã thanh toán cũ không còn nhận chuyển khoản. Hãy tạo mã mới cho cùng đơn.</Banner>
            )}
          </>
        )}
        <ul className="text-[11px] text-slate-500 space-y-1">
          <li className="flex gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" /> Đơn chỉ hiện cho tài xế sau khi PayOS xác nhận thanh toán.
          </li>
          <li>• Mỗi mã sống 10 phút; đơn chưa thanh toán sau 30 phút kể từ lúc tạo sẽ tự huỷ.</li>
        </ul>
        <div className="flex flex-wrap justify-end gap-2 pt-1">
          <Button variant="outline" size="sm" onClick={create} isLoading={creating}>
            <RefreshCw className="w-3.5 h-3.5 mr-1" /> Tạo mã mới
          </Button>
          <Button size="sm" onClick={check} isLoading={checking} disabled={!session}>
            Tôi đã thanh toán – kiểm tra
          </Button>
        </div>
      </div>
    </Modal>
  );
};
