import { useEffect, useRef } from 'react';
import { noticeBus } from '../notifications/realtime';
import { useToastStore } from '../notifications/store';
import { realtime } from '../services/realtime.service';
import { useAuthStore } from '../store/useAuthStore';

/** Toast báo chính việc đăng xuất / hết phiên: hiện ngay sau khi phiên kết thúc nên không bị xoá cùng toast cũ */
const SESSION_END_TOASTS = ['SESSION_EXPIRED', 'LOGGED_OUT'];

/**
 * Giữ kết nối SignalR theo phiên đăng nhập: có phiên thì kết nối, đăng xuất hoặc đổi tài khoản thì ngắt
 * và xoá toast của phiên cũ. Gắn một lần ở App.
 */
export const useRealtimeConnection = () => {
  const userId = useAuthStore((s) => s.user?.id ?? null);
  const hasToken = useAuthStore((s) => Boolean(s.token));
  useEffect(() => {
    if (userId && hasToken) void realtime.start();
    else void realtime.stop();
    return () => {
      void realtime.stop();
      useToastStore.getState().clear(SESSION_END_TOASTS);
    };
  }, [userId, hasToken]);
};

/**
 * Tải lại dữ liệu khi trạng thái đơn đổi. `orderId` có giá trị: chỉ đơn đó (và khách tự JoinOrder đơn này);
 * bỏ trống: mọi đơn (danh sách đơn của khách, màn giám sát của Dispatcher).
 * Dùng bản gọi lại mới nhất nên không cần bọc `onChange` bằng useCallback.
 */
export const useOrderRealtime = (onChange: () => void, orderId?: number | null) => {
  const callback = useRef(onChange);
  callback.current = onChange;
  const role = useAuthStore((s) => s.user?.role);
  useEffect(() => {
    if (orderId && role === 'Customer') void realtime.joinOrder(orderId);
    const off = realtime.onOrderStatusChanged((e) => {
      if (!orderId || e.orderId === orderId) callback.current();
    });
    return () => {
      off();
      if (orderId) realtime.leaveOrder(orderId);
    };
  }, [orderId, role]);
};

/** Tải lại khi có bất kỳ thông báo thời gian thực nào (đơn, sự cố, khiếu nại…) */
export const useNotificationRefresh = (onChange: () => void) => {
  const callback = useRef(onChange);
  callback.current = onChange;
  useEffect(() => noticeBus.on(() => callback.current()), []);
};
