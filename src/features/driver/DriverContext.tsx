import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { driverApi } from '../../api/endpoints';
import { useQuery } from '../../api/useQuery';
import type { DriverOnboardingStatusResponse, DriverStatusResponse } from '../../api/types';
import { toast } from '../../components/ui/feedback';
import { errorMessage } from '../../services/mock/storage';
import { useNoticeRefresh } from '../../notifications/useNoticeRefresh';

interface Ctx {
  status: DriverStatusResponse | undefined;
  onboarding: DriverOnboardingStatusResponse | undefined;
  loading: boolean;
  reload: () => Promise<void>;
  toggleOnline: () => Promise<void>;
  toggling: boolean;
  /** enabled = lựa chọn của tài xế; sharing = đang thực sự gửi (Approved + Online/có đơn) */
  gps: { enabled: boolean; sharing: boolean; error: string | null; lastSentAt: number | null; setSharing: (v: boolean) => void };
}
const DriverCtx = createContext<Ctx | null>(null);
export const useDriver = () => {
  const c = useContext(DriverCtx);
  if (!c) throw new Error('useDriver must be inside DriverProvider');
  return c;
};

const SEND_EVERY_MS = 10_000;

/**
 * Trạng thái tài xế từ API thật + gửi GPS trình duyệt (POST /driver/location) khi Online hoặc đang có đơn.
 * GB-39: không có GPS quá 5 phút → không thấy đơn mới, ẩn khỏi bản đồ Dispatcher.
 */
export const DriverProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const st = useQuery(() => driverApi.status(), [], { refreshMs: 15_000 });
  const ob = useQuery(() => driverApi.onboardingStatus(), [], { refreshMs: 60_000 });
  // Thông báo realtime: đơn mới / ảnh được duyệt hoặc từ chối / đơn bị huỷ → tải lại trạng thái; hồ sơ được duyệt hoặc từ chối → tải lại hồ sơ
  useNoticeRefresh((t) => t === 'NEW_MATCHING_ORDER' || t.startsWith('PICKUP_') || t === 'ORDER_CANCELLED', () => void st.reload());
  useNoticeRefresh((t) => t.startsWith('DRIVER_APPLICATION_'), () => void ob.reload());
  const [toggling, setToggling] = useState(false);
  const [sharing, setSharing] = useState(true);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [lastSentAt, setLastSentAt] = useState<number | null>(null);
  const lastSent = useRef(0);

  const s = st.data;
  const shouldShare = sharing && !!s && s.approvalStatus === 'Approved' && (s.isOnline || !!s.activeOrderId);

  useEffect(() => {
    if (!shouldShare) return;
    if (!navigator.geolocation) {
      setGpsError('Trình duyệt không hỗ trợ định vị.');
      return;
    }
    const id = navigator.geolocation.watchPosition(
      async (p) => {
        setGpsError(null);
        if (Date.now() - lastSent.current < SEND_EVERY_MS) return;
        lastSent.current = Date.now();
        try {
          await driverApi.sendLocation(p.coords.latitude, p.coords.longitude);
          setLastSentAt(Date.now());
        } catch (e) {
          setGpsError(errorMessage(e));
        }
      },
      (err) => setGpsError(err.code === err.PERMISSION_DENIED ? 'Bạn chưa cho phép truy cập vị trí.' : 'Không lấy được vị trí GPS.'),
      { enableHighAccuracy: true, maximumAge: 5_000, timeout: 20_000 }
    );
    return () => navigator.geolocation.clearWatch(id);
  }, [shouldShare]);

  const toggleOnline = async () => {
    if (!s) return;
    setToggling(true);
    try {
      await driverApi.setOnline(!s.isOnline);
      toast.success(s.isOnline ? 'Đã tắt nhận đơn.' : 'Đã bật nhận đơn. Giữ trình duyệt mở để gửi vị trí.');
      await st.reload();
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setToggling(false);
    }
  };

  return (
    <DriverCtx.Provider
      value={{
        status: s,
        onboarding: ob.data,
        loading: st.loading && !s,
        reload: async () => {
          await Promise.all([st.reload(), ob.reload()]);
        },
        toggleOnline,
        toggling,
        gps: { enabled: sharing, sharing: shouldShare, error: gpsError, lastSentAt, setSharing },
      }}
    >
      {children}
    </DriverCtx.Provider>
  );
};
