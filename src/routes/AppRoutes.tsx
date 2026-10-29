import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from '../layouts/MainLayout';
import { CustomerLayout } from '../layouts/CustomerLayout';
import { DriverLayout } from '../layouts/DriverLayout';
import { AdminLayout } from '../layouts/AdminLayout';
import { DispatcherLayout } from '../layouts/DispatcherLayout';
import { LandingPage } from '../pages/landing/LandingPage';
import { BookingPage } from '../pages/customer/BookingPage';
import { OrdersPage } from '../pages/customer/OrdersPage';
import { LiveTrackingPage } from '../pages/customer/LiveTrackingPage';
import { WalletPage } from '../pages/customer/WalletPage';
import { DriverHomePage } from '../pages/driver/DriverHomePage';
import { DriverJobListPage } from '../pages/driver/DriverJobListPage';
import { DriverTripHistoryPage } from '../pages/driver/DriverTripHistoryPage';
import { DriverIncidentsPage } from '../pages/driver/DriverIncidentsPage';
import { DriverEarningsPage } from '../pages/driver/DriverEarningsPage';
import { DriverProfilePage } from '../pages/driver/DriverProfilePage';
import { LiveMapPage } from '../pages/dispatcher/LiveMapPage';
import { IncidentsPage } from '../pages/dispatcher/IncidentsPage';
import { DispatcherComplaintsPage } from '../pages/dispatcher/DispatcherComplaintsPage';
import { DashboardPage } from '../pages/admin/DashboardPage';
import { DriverApprovalPage } from '../pages/admin/DriverApprovalPage';
import { AdminUsersPage } from '../pages/admin/AdminUsersPage';
import { AdminWithdrawalsPage } from '../pages/admin/AdminWithdrawalsPage';
import { AdminPricingPage } from '../pages/admin/AdminPricingPage';
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
  return <Navigate to="/" replace />;
};

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Landing Page as Root Screen */}
      <Route path="/" element={<LandingPage />} />

      {/* Public Login Route */}
      <Route path="/login" element={<LoginRouteHandler />} />

      {/* Customer Routes (Tất cả màn hình khách hàng dùng CustomerLayout đồng nhất) */}
      <Route
        path="/booking"
        element={
          <ProtectedRoute allowedRoles={['Customer']}>
            <CustomerLayout>
              <BookingPage />
            </CustomerLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/orders"
        element={
          <ProtectedRoute allowedRoles={['Customer']}>
            <CustomerLayout>
              <OrdersPage />
            </CustomerLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/tracking"
        element={
          <ProtectedRoute allowedRoles={['Customer']}>
            <CustomerLayout>
              <LiveTrackingPage />
            </CustomerLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/wallet"
        element={
          <ProtectedRoute allowedRoles={['Customer']}>
            <CustomerLayout>
              <WalletPage />
            </CustomerLayout>
          </ProtectedRoute>
        }
      />

      {/* Driver Routes (Dùng DriverLayout đồng bộ phong cách với Customer) */}
      <Route
        path="/driver"
        element={
          <ProtectedRoute allowedRoles={['Driver']}>
            <DriverLayout>
              <DriverJobListPage />
            </DriverLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/driver/trip"
        element={
          <ProtectedRoute allowedRoles={['Driver']}>
            <DriverLayout>
              <DriverHomePage />
            </DriverLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/driver/history"
        element={
          <ProtectedRoute allowedRoles={['Driver']}>
            <DriverLayout>
              <DriverTripHistoryPage />
            </DriverLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/driver/incidents"
        element={
          <ProtectedRoute allowedRoles={['Driver']}>
            <DriverLayout>
              <DriverIncidentsPage />
            </DriverLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/driver/earnings"
        element={
          <ProtectedRoute allowedRoles={['Driver']}>
            <DriverLayout>
              <DriverEarningsPage />
            </DriverLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/driver/profile"
        element={
          <ProtectedRoute allowedRoles={['Driver']}>
            <DriverLayout>
              <DriverProfilePage />
            </DriverLayout>
          </ProtectedRoute>
        }
      />

      {/* Dispatcher Routes */}
      <Route
        path="/dispatcher"
        element={<Navigate to="/dispatcher/live-map" replace />}
      />
      <Route
        path="/dispatcher/live-map"
        element={
          <ProtectedRoute allowedRoles={['Dispatcher']}>
            <DispatcherLayout>
              <LiveMapPage />
            </DispatcherLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/dispatcher/incidents"
        element={
          <ProtectedRoute allowedRoles={['Dispatcher']}>
            <DispatcherLayout>
              <IncidentsPage />
            </DispatcherLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/dispatcher/reassign"
        element={<Navigate to="/dispatcher/incidents" replace />}
      />
      <Route
        path="/dispatcher/complaints"
        element={
          <ProtectedRoute allowedRoles={['Dispatcher']}>
            <DispatcherLayout>
              <DispatcherComplaintsPage />
            </DispatcherLayout>
          </ProtectedRoute>
        }
      />

      {/* Administrator Routes */}
      <Route
        path="/admin"
        element={<Navigate to="/admin/dashboard" replace />}
      />
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute allowedRoles={['Administrator']}>
            <AdminLayout>
              <DashboardPage />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/drivers"
        element={
          <ProtectedRoute allowedRoles={['Administrator']}>
            <AdminLayout>
              <DriverApprovalPage />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <ProtectedRoute allowedRoles={['Administrator']}>
            <AdminLayout>
              <AdminUsersPage />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/withdrawals"
        element={
          <ProtectedRoute allowedRoles={['Administrator']}>
            <AdminLayout>
              <AdminWithdrawalsPage />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/pricing"
        element={
          <ProtectedRoute allowedRoles={['Administrator']}>
            <AdminLayout>
              <AdminPricingPage />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/reports"
        element={
          <ProtectedRoute allowedRoles={['Administrator']}>
            <AdminLayout>
              <DashboardPage />
            </AdminLayout>
          </ProtectedRoute>
        }
      />

      {/* Fallback */}
      <Route path="*" element={<FallbackHandler />} />
    </Routes>
  );
};
