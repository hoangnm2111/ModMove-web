import React, { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AppRoutes } from './routes/AppRoutes';
import { ConfirmHost, ToastViewport } from './components/ui/feedback';
import { useAuthStore } from './store/useAuthStore';
import { useRealtimeConnection } from './hooks/useRealtime';
import './services'; // đăng ký handler nghiệp vụ (hoàn tiền, quyết toán ví)

export const App: React.FC = () => {
  // Xác nhận lại session cục bộ với backend khi mở ứng dụng (tài khoản có thể đã bị khoá/xoá từ lần trước)
  useEffect(() => {
    void useAuthStore.getState().bootstrap();
  }, []);

  // Thông báo thời gian thực (SignalR): kết nối khi đã đăng nhập, ngắt khi đăng xuất
  useRealtimeConnection();

  return (
    <BrowserRouter>
      <AppRoutes />
      <ToastViewport />
      <ConfirmHost />
    </BrowserRouter>
  );
};

export default App;
