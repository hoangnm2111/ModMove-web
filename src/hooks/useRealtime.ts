import { useEffect, useRef } from 'react';
import { realtime } from '../services/realtime.service';
import { useAuthStore } from '../store/useAuthStore';

/**
 * Giữ kết nối SignalR theo phiên đăng nhập: có phiên thì kết nối, đăng xuất hoặc đổi tài khoản thì ngắt.
 * Gắn một lần ở App.
 */
export const useRealtimeConnection = () => {
  const userId = useAuthStore((s) => s.user?.id ?? null);
  const hasToken = useAuthStore((s) => Boolean(s.token));
  useEffect(() => {
    if (userId && hasToken) void realtime.start();
    else void realtime.stop();
    return () => {
      void realtime.stop();
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
  useEffect(() => realtime.onNotification(() => callback.current()), []);
};
