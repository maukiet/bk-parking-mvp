import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router'
import { AdminPortalLayout } from '../features/admin-portal/layout/AdminPortalLayout'
import { AdminDashboardPage } from '../features/admin-portal/pages/AdminDashboardPage'
import { AdminParkingLotsPage } from '../features/admin-portal/pages/AdminParkingLotsPage'
import { AdminVehiclesPage } from '../features/admin-portal/pages/AdminVehiclesPage'
import { AdminReservationsPage } from '../features/admin-portal/pages/AdminReservationsPage'
import { AdminPaymentsPage, AdminReportsPage } from '../features/admin-portal/pages/AdminFinancePages'
import { LoginPage, type LoginDestinations } from '../features/auth/LoginPage'
import { getAccessToken, getStoredRole } from '../features/auth/authApi'
import { UserPortalLayout } from '../features/user-portal/layout/UserPortalLayout'
import {
  userPortalNavigation,
  userPortalUtilityPages,
} from '../features/user-portal/navigation'
import { DashboardPage } from '../features/user-portal/pages/DashboardPage'
import { UserVehiclesPage } from '../features/user-portal/pages/UserVehiclesPage'
import { UserVehicleRegistrationPage } from '../features/user-portal/pages/UserVehicleRegistrationPage'
import { UserReservationsPage } from '../features/user-portal/pages/UserReservationsPage'
import { UserPortalPage } from '../features/user-portal/pages/UserPortalPage'
import { AuthProvider } from '../shared/auth/AuthContext'
import { StaffShell } from '../features/staff/checkpoint/components/StaffShell'
import { PublicView } from '../features/public/components/PublicView'

const loginDestinations: LoginDestinations = {
  ADMIN_PORTAL: '/admin/overview',
  USER_PORTAL: '/user/overview',
  STAFF_PORTAL: '/staff',
}

function RequireAdminSession() {
  const { pathname, search, hash } = useLocation()
  const next = encodeURIComponent(pathname + search + hash)
  if (!getAccessToken()) return <Navigate to={`/login?next=${next}`} replace />
  const role = getStoredRole()
  if (role && role !== 'ROLE_ADMIN') return <Navigate to={`/login?forbidden=1&next=${next}`} replace />
  return <Outlet />
}

function RequireStaffSession() {
  const { pathname, search, hash } = useLocation()
  const next = encodeURIComponent(pathname + search + hash)
  if (!getAccessToken()) return <Navigate to={`/login?next=${next}`} replace />
  const role = getStoredRole()
  if (role && role !== 'ROLE_STAFF' && role !== 'ROLE_ADMIN') {
    return <Navigate to={`/login?forbidden=1&next=${next}`} replace />
  }
  return <Outlet />
}

function AdminLoginRedirect() {
  const { search } = useLocation()
  return <Navigate to={`/login${search || '?next=/admin/overview'}`} replace />
}

function RootRedirect() {
  const token = getAccessToken()
  if (!token) return <Navigate to="/user/overview" replace />
  const role = getStoredRole()
  if (role === 'ROLE_STAFF') return <Navigate to="/staff" replace />
  if (role === 'ROLE_ADMIN') return <Navigate to="/admin/overview" replace />
  return <Navigate to="/user/overview" replace />
}

export function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/public" element={<PublicView />} />
        <Route path="/user" element={<UserPortalLayout />}>
          <Route index element={<Navigate to="overview" replace />} />
          {userPortalNavigation.map((item) => (
            <Route
              key={item.path}
              path={item.path}
              element={
                item.path === 'overview' ? (
                  <DashboardPage />
                ) : item.path === 'vehicles' ? (
                  <UserVehiclesPage />
                ) : item.path === 'reservations' ? (
                  <UserReservationsPage />
                ) : (
                  <UserPortalPage
                    title={item.title}
                    description={item.description}
                  />
                )
              }
            />
          ))}
          <Route path="vehicles/new" element={<UserVehicleRegistrationPage />} />
          {userPortalUtilityPages.map((item) => (
            <Route
              key={item.path}
              path={item.path}
              element={
                <UserPortalPage
                  title={item.title}
                  description={item.description}
                />
              }
            />
          ))}
        </Route>
        <Route path="/login" element={<LoginPage destinations={loginDestinations} publicPath="/public" />} />
        <Route path="/admin/login" element={<AdminLoginRedirect />} />
        <Route element={<RequireStaffSession />}>
          <Route path="/staff" element={<StaffShell />} />
          <Route path="/staff/*" element={<StaffShell />} />
        </Route>
        <Route element={<RequireAdminSession />}>
          <Route path="/admin" element={<AdminPortalLayout />}>
            <Route index element={<Navigate to="overview" replace />} />
            <Route path="overview" element={<AdminDashboardPage />} />
            <Route path="parking-lots" element={<AdminParkingLotsPage />} />
            <Route path="vehicles" element={<AdminVehiclesPage />} />
            <Route path="reservations" element={<AdminReservationsPage />} />
            <Route path="payments" element={<AdminPaymentsPage />} />
            <Route path="reports" element={<AdminReportsPage />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/user/overview" replace />} />
      </Routes>
    </AuthProvider>
  )
}
