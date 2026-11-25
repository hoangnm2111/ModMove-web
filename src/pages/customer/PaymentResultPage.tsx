import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { Button } from '../../components/Button';
import { customerApi } from '../../api/endpoints';
import { PAYOS_PENDING_ORDER_KEY } from '../../features/payment/payosReturn';

const POLL_MS = 2_000;
const POLL_MAX = 10; // ~20 giây chờ webhook PayOS ghi nhận tiền

type View = 'checking' | 'paid' | 'waiting' | 'cancelled';

/**
 * PayOS đưa khách về /orders/success hoặc /orders/cancel (BE: PayOS:ReturnUrls/CancelUrls:Web).
 * Trang này không phải chi tiết đơn: tìm lại đơn vừa thanh toán, đợi webhook xác nhận rồi chuyển vào chi tiết đơn.
 * "Đã trả" chỉ tin trạng thái từ BE (webhook), không tin tham số trên URL.
 */
export const PaymentResultPage: React.FC = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [search] = useSearchParams();
  const cancelled = pathname.endsWith('/cancel') || search.get('cancel') === 'true' || search.get('status') === 'CANCELLED';
  const [view, setView] = useState<View>(cancelled ? 'cancelled' : 'checking');
  const [orderId] = useState<number | null>(() => {
    const n = Number(localStorage.getItem(PAYOS_PENDING_ORDER_KEY));
    return Number.isInteger(n) && n > 0 ? n : null;
  });

  useEffect(() => {
    if (orderId === null) {
      navigate('/orders', { replace: true });
      return;
    }
    if (cancelled) {
      const t = setTimeout(() => navigate(`/orders/${orderId}`, { replace: true }), 1500);
      return () => clearTimeout(t);
    }
    let stop = false;
    let tries = 0;
    let timer: ReturnType<typeof setTimeout>;
    const poll = async () => {
      let paid = false;
      try {
        paid = (await customerApi.order(orderId)).paymentStatus === 'Paid';
      } catch {
        /* lỗi mạng tạm thời: thử lại */
      }
      if (stop) return;
      if (paid) {
        localStorage.removeItem(PAYOS_PENDING_ORDER_KEY);
        setView('paid');
        timer = setTimeout(() => navigate(`/orders/${orderId}`, { replace: true }), 1500);
      } else if (++tries >= POLL_MAX) {
        setView('waiting');
      } else {
        timer = setTimeout(poll, POLL_MS);
      }
    };
    void poll();
    return () => {
      stop = true;
      clearTimeout(timer);
    };
  }, [orderId, cancelled, navigate]);

  const goDetail = () => navigate(orderId ? `/orders/${orderId}` : '/orders', { replace: true });

  return (
    <div className="max-w-md mx-auto py-16 px-4 text-center space-y-4">
      {view === 'checking' && (
        <>
          <Loader2 className="w-12 h-12 mx-auto text-blue-600 animate-spin" />
          <h1 className="text-lg font-black text-slate-900">Đang xác nhận thanh toán…</h1>
          <p className="text-sm text-slate-500">Vui lòng đợi vài giây, ModMove đang nhận kết quả từ PayOS.</p>
        </>
      )}
      {view === 'paid' && (
        <>
          <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-600" />
          <h1 className="text-lg font-black text-slate-900">Thanh toán thành công</h1>
          <p className="text-sm text-slate-500">Đơn đang được gửi tới tài xế. Đang chuyển tới chi tiết đơn…</p>
        </>
      )}
      {view === 'waiting' && (
        <>
          <Loader2 className="w-12 h-12 mx-auto text-amber-500" />
          <h1 className="text-lg font-black text-slate-900">Chưa nhận được xác nhận từ PayOS</h1>
          <p className="text-sm text-slate-500">Nếu bạn đã chuyển khoản, hệ thống sẽ cập nhật trong ít phút. Bạn có thể xem lại trạng thái trong chi tiết đơn.</p>
          <Button onClick={goDetail}>Xem chi tiết đơn</Button>
        </>
      )}
      {view === 'cancelled' && (
        <>
          <XCircle className="w-12 h-12 mx-auto text-rose-500" />
          <h1 className="text-lg font-black text-slate-900">Bạn đã huỷ thanh toán</h1>
          <p className="text-sm text-slate-500">Đơn vẫn chờ thanh toán, bạn có thể tạo mã mới trong chi tiết đơn.</p>
          <Button onClick={goDetail}>Về chi tiết đơn</Button>
        </>
      )}
    </div>
  );
};
