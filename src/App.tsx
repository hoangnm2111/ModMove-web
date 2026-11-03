import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AppRoutes } from './routes/AppRoutes';
import { ConfirmHost, ToastViewport } from './components/ui/feedback';
import './services'; // đăng ký handler nghiệp vụ (hoàn tiền, quyết toán ví)

export const App: React.FC = () => (
  <BrowserRouter>
    <AppRoutes />
    <ToastViewport />
    <ConfirmHost />
  </BrowserRouter>
);

export default App;
