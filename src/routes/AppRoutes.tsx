import React, { lazy, Suspense } from 'react';
import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { CustomerLayout } from '../layouts/CustomerLayout';
import { DriverLayout } from '../layouts/DriverLayout';
import { AdminLayout } from '../layouts/AdminLayout';
import { DispatcherLayout } from '../layouts/DispatcherLayout';
import { getRoleHomePath, useAuthStore } from '../store/useAuthStore';
import { UserRole } from '../types/user.types';

/** Lazy-load theo trang để giảm bundle ban đầu */
const page = <K extends string>(loader: () => Promise<Record<K, React.ComponentType>>, name: K) =>
  lazy(() => loader().then((m) => ({ default: m[name] })));

const LandingPage = page(() => import('../pages/landing/LandingPage'), 'LandingPage');
const LoginPage = page(() => import('../pages/auth/LoginPage'), 'LoginPage');
const ProfilePage = page(() => import('../pages/account/ProfilePage'), 'ProfilePage');
const BookingPage = page(() => import('../pages/customer/BookingPage'), 'BookingPage');
const OrdersPage = page(() => import('../pages/customer/OrdersPage'), 'OrdersPage');
const OrderDetailPage = page(() => import('../pages/customer/OrderDetailPage'), 'OrderDetailPage');
const MyRatingsPage = page(() => import('../pages/customer/MyRatingsPage'), 'MyRatingsPage');
const LiveTrackingPage = page(() => import('../pages/customer/LiveTrackingPage'), 'LiveTrackingPage');
const DriverJobListPage = page(() => import('../pages/driver/DriverJobListPage'), 'DriverJobListPage');
const DriverHomePage = page(() => import('../pages/driver/DriverHomePage'), 'DriverHomePage');
const DriverEarningsPage = page(() => import('../pages/driver/DriverEarningsPage'), 'DriverEarningsPage');
const DriverProfilePage = page(() => import('../pages/driver/DriverProfilePage'), 'DriverProfilePage');
const LiveMapPage = page(() => import('../pages/dispatcher/LiveMapPage'), 'LiveMapPage');
const IncidentsPage = page(() => import('../pages/dispatcher/IncidentsPage'), 'IncidentsPage');
const DispatcherComplaintsPage = page(() => import('../pages/dispatcher/DispatcherComplaintsPage'), 'DispatcherComplaintsPage');
const DispatcherHandledCasesPage = page(() => import('../pages/dispatcher/DispatcherHandledCasesPage'), 'DispatcherHandledCasesPage');
const DashboardPage = page(() => import('../pages/admin/DashboardPage'), 'DashboardPage');
const DriverApprovalPage = page(() => import('../pages/admin/DriverApprovalPage'), 'DriverApprovalPage');
const AdminUsersPage = page(() => import('../pages/admin/AdminUsersPage'), 'AdminUsersPage');
const AdminWithdrawalsPage = page(() => import('../pages/admin/AdminWithdrawalsPage'), 'AdminWithdrawalsPage');
const AdminPricingPage = page(() => import('../pages/admin/AdminPricingPage'), 'AdminPricingPage');
const AdminMasterDataPage = page(() => import('../pages/admin/AdminMasterDataPage'), 'AdminMasterDataPage');
const AdminRefundsPage = page(() => import('../pages/admin/AdminRefundsPage'), 'AdminRefundsPage');
const AdminCouponsPage = page(() => import('../pages/admin/AdminCouponsPage'), 'AdminCouponsPage');

const PageFallback = () => <div className="flex-1 flex items-center justify-center text-sm text-slate-400 p-10">Đang tải…</div>;

/** Route guard theo vai trò (SRS 4.4 Permission Matrix) */
const RequireRole: React.FC<{ roles: UserRole[] }> = ({ roles }) => {
  const { isAuthenticated, activeRole } = useAuthStore();
  const location = useLocation();
  if (!isAuthenticated || !activeRole) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  }
  if (!roles.includes(activeRole)) return <Navigate to={getRoleHomePath(activeRole)} replace />;
  return <Outlet />;
};

/** Guest hoặc Customer (GB-28: Guest được lập nháp đơn) */
const GuestOrCustomer: React.FC = () => {
  const { isAuthenticated, activeRole } = useAuthStore();
  if (isAuthenticated && activeRole !== 'Customer') return <Navigate to={getRoleHomePath(activeRole)} replace />;
  return <Outlet />;
};

const GuestOnly: React.FC = () => {
  const { isAuthenticated, activeRole } = useAuthStore();
  return isAuthenticated ? <Navigate to={getRoleHomePath(activeRole)} replace /> : <Outlet />;
};

const Fallback: React.FC = () => {
  const { isAuthenticated, activeRole } = useAuthStore();
  return <Navigate to={isAuthenticated ? getRoleHomePath(activeRole) : '/'} replace />;
};

export const AppRoutes: React.FC = () => (
  <Suspense fallback={<PageFallback />}>
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route element={<GuestOnly />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<LoginPage />} />
      </Route>

      {/* Customer */}
      <Route element={<GuestOrCustomer />}>
        <Route element={<CustomerLayout />}>
          <Route path="/booking" element={<BookingPage />} />
        </Route>
      </Route>
      <Route element={<RequireRole roles={['Customer']} />}>
        <Route element={<CustomerLayout />}>
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/orders/:id" element={<OrderDetailPage />} />
          <Route path="/ratings" element={<MyRatingsPage />} />
          <Route path="/tracking" element={<LiveTrackingPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>
      </Route>

      {/* Driver */}
      <Route element={<RequireRole roles={['Driver']} />}>
        <Route path="/driver" element={<DriverLayout />}>
          <Route index element={<DriverJobListPage />} />
          <Route path="trip" element={<DriverHomePage />} />
          <Route path="history" element={<Navigate to="/driver/trip" replace />} />
          <Route path="incidents" element={<Navigate to="/driver/trip" replace />} />
          <Route path="earnings" element={<DriverEarningsPage />} />
          <Route path="profile" element={<DriverProfilePage />} />
        </Route>
      </Route>

      {/* Dispatcher */}
      <Route element={<RequireRole roles={['Dispatcher']} />}>
        <Route path="/dispatcher" element={<DispatcherLayout />}>
          <Route index element={<Navigate to="live-map" replace />} />
          <Route path="live-map" element={<LiveMapPage />} />
          <Route path="incidents" element={<IncidentsPage />} />
          <Route path="complaints" element={<DispatcherComplaintsPage />} />
          <Route path="handled-cases" element={<DispatcherHandledCasesPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>
      </Route>

      {/* Administrator */}
      <Route element={<RequireRole roles={['Administrator']} />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="drivers" element={<DriverApprovalPage />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="withdrawals" element={<AdminWithdrawalsPage />} />
          <Route path="refunds" element={<AdminRefundsPage />} />
          <Route path="coupons" element={<AdminCouponsPage />} />
          <Route path="pricing" element={<AdminPricingPage />} />
          <Route path="master-data" element={<AdminMasterDataPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>
      </Route>

      <Route path="*" element={<Fallback />} />
    </Routes>
  </Suspense>
);
