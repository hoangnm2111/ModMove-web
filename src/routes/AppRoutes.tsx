import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from '../layouts/MainLayout';
import { BookingPage } from '../pages/customer/BookingPage';
import { OrdersPage } from '../pages/customer/OrdersPage';
import { DriverHomePage } from '../pages/driver/DriverHomePage';
import { DriverEarningsPage } from '../pages/driver/DriverEarningsPage';
import { DriverProfilePage } from '../pages/driver/DriverProfilePage';
import { LiveMapPage } from '../pages/dispatcher/LiveMapPage';
import { IncidentsPage } from '../pages/dispatcher/IncidentsPage';
import { DashboardPage } from '../pages/admin/DashboardPage';
import { DriverApprovalPage } from '../pages/admin/DriverApprovalPage';
import { LoginPage } from '../pages/auth/LoginPage';
import { useAuthStore, getRoleHomePath } from '../store/useAuthStore';
import { UserRole } from '../types/user.types';

interface ProtectedRouteProps {
  allowedRoles: UserRole[];
  children: React.ReactElement;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles, children }) => {
  const { isAuthenticated, activeRole } = useAuthStore();

  if (!isAuthenticated || !activeRole) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(activeRole)) {
    return <Navigate to={getRoleHomePath(activeRole)} replace />;
  }

  return children;
};

// Root route handler: if Customer -> BookingPage, otherwise redirect to the role's home page
const RootRouteHandler: React.FC = () => {
  const { isAuthenticated, activeRole } = useAuthStore();

  if (!isAuthenticated || !activeRole) {
    return <Navigate to="/login" replace />;
  }

  if (activeRole === 'Customer') {
    return (
      <MainLayout title="Đặt dịch vụ vận chuyển đồ theo yêu cầu">
        <BookingPage />
      </MainLayout>
    );
  }

  return <Navigate to={getRoleHomePath(activeRole)} replace />;
};

// Login route handler: if already logged in -> redirect to role home
const LoginRouteHandler: React.FC = () => {
  const { isAuthenticated, activeRole } = useAuthStore();
  if (isAuthenticated && activeRole) {
    return <Navigate to={getRoleHomePath(activeRole)} replace />;
  }
  return <LoginPage />;
};

// Fallback handler
const FallbackHandler: React.FC = () => {
  const { isAuthenticated, activeRole } = useAuthStore();
  if (isAuthenticated && activeRole) {
    return <Navigate to={getRoleHomePath(activeRole)} replace />;
  }
  return <Navigate to="/login" replace />;
};

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Login Route */}
      <Route path="/login" element={<LoginRouteHandler />} />

      {/* Customer Routes (Root / is Customer Home) */}
      <Route path="/" element={<RootRouteHandler />} />
      <Route
        path="/orders"
        element={
          <ProtectedRoute allowedRoles={['Customer']}>
            <MainLayout title="Quản lý và tra cứu tiến độ chuyến hàng">
              <OrdersPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/wallet"
        element={
          <ProtectedRoute allowedRoles={['Customer']}>
            <MainLayout title="Ví tài khoản & Nạp tiền PayOS">
              <div className="p-8 max-w-xl mx-auto bg-white rounded-2xl border border-slate-200 mt-8 shadow-sm text-center">
                <h2 className="text-lg font-bold text-slate-800">Ví ModMove Pay</h2>
                <p className="text-xs text-slate-500 mt-1">Số dư khả dụng: 1.250.000 đ</p>
                <div className="mt-6 p-6 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 flex flex-col items-center">
                  <div className="w-48 h-48 bg-white border p-2 rounded-xl flex items-center justify-center shadow-sm">
                    <img
                      src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=00020101021238540010A00000072701260006970422011203389673160208QRIBFTTA5204601153037045802VN62180814ModMoveNapTien6304E85B"
                      alt="VietQR PayOS"
                      className="w-full h-full"
                    />
                  </div>
                  <span className="text-xs font-bold text-brand-600 mt-3">Quét mã VietQR PayOS để nạp ví tự động</span>
                </div>
              </div>
            </MainLayout>
          </ProtectedRoute>
        }
      />

      {/* Driver Routes */}
      <Route
        path="/driver"
        element={
          <ProtectedRoute allowedRoles={['Driver']}>
            <MainLayout title="Bàn làm việc Tài xế - Nhận cuốc & Điều phối trực tiếp">
              <DriverHomePage />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/driver/earnings"
        element={
          <ProtectedRoute allowedRoles={['Driver']}>
            <MainLayout title="Ví & Thu nhập Tài xế đối tác (Chiết khấu 20%)">
              <DriverEarningsPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/driver/profile"
        element={
          <ProtectedRoute allowedRoles={['Driver']}>
            <MainLayout title="Hồ sơ Pháp lý & Phương tiện Tài xế">
              <DriverProfilePage />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      {/* Dispatcher Routes */}
      <Route
        path="/dispatcher/live-map"
        element={
          <ProtectedRoute allowedRoles={['Dispatcher']}>
            <MainLayout title="Bản đồ Giám sát Hạm đội xe Trực tiếp (Fleet Live Map)">
              <LiveMapPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/dispatcher/incidents"
        element={
          <ProtectedRoute allowedRoles={['Dispatcher']}>
            <MainLayout title="Console Xử lý Sự cố Vận chuyển & Điều phối khẩn">
              <IncidentsPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/dispatcher/reassign"
        element={
          <ProtectedRoute allowedRoles={['Dispatcher']}>
            <MainLayout title="Điều phối lại Tài xế Khẩn cấp">
              <IncidentsPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      {/* Administrator Routes */}
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute allowedRoles={['Administrator']}>
            <MainLayout title="Báo cáo Doanh thu & Quản trị Hệ thống">
              <DashboardPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/drivers"
        element={
          <ProtectedRoute allowedRoles={['Administrator']}>
            <MainLayout title="Thẩm định Hồ sơ & Giấy tờ Tài xế">
              <DriverApprovalPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <ProtectedRoute allowedRoles={['Administrator']}>
            <MainLayout title="Quản lý Tài khoản & Phân quyền">
              <div className="p-8 max-w-4xl mx-auto bg-white rounded-2xl border border-slate-200 mt-8 shadow-sm">
                <h2 className="text-base font-bold text-slate-800 mb-4">Danh sách Tài khoản Người dùng</h2>
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 border-b text-slate-500 font-bold uppercase">
                    <tr>
                      <th className="p-3">Họ và tên</th>
                      <th className="p-3">Số điện thoại</th>
                      <th className="p-3">Vai trò</th>
                      <th className="p-3">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="p-3 font-semibold text-slate-800">Hoàng Nguyễn Mạnh</td>
                      <td className="p-3 text-slate-600">0338967316</td>
                      <td className="p-3"><span className="bg-orange-100 text-orange-700 font-bold px-2 py-0.5 rounded">Customer</span></td>
                      <td className="p-3 text-emerald-600 font-bold">Active</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold text-slate-800">Nguyễn Văn Hùng</td>
                      <td className="p-3 text-slate-600">0912345678</td>
                      <td className="p-3"><span className="bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded">Driver</span></td>
                      <td className="p-3 text-emerald-600 font-bold">Active</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold text-slate-800">Trần Trung Hiếu</td>
                      <td className="p-3 text-slate-600">0988116487</td>
                      <td className="p-3"><span className="bg-sky-100 text-sky-700 font-bold px-2 py-0.5 rounded">Dispatcher</span></td>
                      <td className="p-3 text-emerald-600 font-bold">Active</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold text-slate-800">Ban Quản Trị Hệ Thống</td>
                      <td className="p-3 text-slate-600">0338967316</td>
                      <td className="p-3"><span className="bg-amber-100 text-amber-700 font-bold px-2 py-0.5 rounded">Administrator</span></td>
                      <td className="p-3 text-emerald-600 font-bold">Active</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/pricing"
        element={
          <ProtectedRoute allowedRoles={['Administrator']}>
            <MainLayout title="Cấu hình Bảng giá & Tỷ lệ Hoa hồng Nền tảng">
              <div className="p-8 max-w-3xl mx-auto bg-white rounded-2xl border border-slate-200 mt-8 shadow-sm space-y-4">
                <h2 className="text-base font-bold text-slate-800">Cấu hình Cước phí theo Loại xe</h2>
                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border">
                    <div>
                      <div className="font-bold">Xe Bán Tải 500kg</div>
                      <div className="text-slate-500">Giá mở cửa: 150.000 đ • Giá mỗi km: 15.000 đ</div>
                    </div>
                    <span className="font-bold text-brand-600">Hoa hồng: 20%</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border">
                    <div>
                      <div className="font-bold">Xe Tải Nhỏ 1 Tấn</div>
                      <div className="text-slate-500">Giá mở cửa: 250.000 đ • Giá mỗi km: 20.000 đ</div>
                    </div>
                    <span className="font-bold text-brand-600">Hoa hồng: 20%</span>
                  </div>
                </div>
              </div>
            </MainLayout>
          </ProtectedRoute>
        }
      />

      {/* Fallback */}
      <Route path="*" element={<FallbackHandler />} />
    </Routes>
  );
};
