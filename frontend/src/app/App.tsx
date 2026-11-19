import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router'
import { UserPortalLayout } from '../features/user-portal/layout/UserPortalLayout'
import {
  userPortalNavigation,
  userPortalUtilityPages,
} from '../features/user-portal/navigation'
import { UserPortalPage } from '../features/user-portal/pages/UserPortalPage'
import { AdminPortalLayout } from '../features/admin-portal/layout/AdminPortalLayout'
import { AdminDashboardPage } from '../features/admin-portal/pages/AdminDashboardPage'
import { AdminParkingLotsPage } from '../features/admin-portal/pages/AdminParkingLotsPage'
import { AdminVehiclesPage } from '../features/admin-portal/pages/AdminVehiclesPage'
import { LoginPage, type LoginDestinations } from '../features/auth/LoginPage'
import { getAccessToken, getStoredRole } from '../features/auth/authApi'

const loginDestinations: LoginDestinations = {
  ADMIN_PORTAL: '/admin/overview',
  USER_PORTAL: '/user/overview',
}

function RequireAdminSession() {
  const { pathname, search, hash } = useLocation()
  const next = encodeURIComponent(pathname + search + hash)
  if (!getAccessToken()) return <Navigate to={`/login?next=${next}`} replace />
  const role = getStoredRole()
  if (role && role !== 'ROLE_ADMIN') return <Navigate to={`/login?forbidden=1&next=${next}`} replace />
  return <Outlet />
}

function AdminLoginRedirect() {
  const { search } = useLocation()
  return <Navigate to={`/login${search || '?next=/admin/overview'}`} replace />
}

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/user/overview" replace />} />
      <Route path="/user" element={<UserPortalLayout />}>
        <Route index element={<Navigate to="overview" replace />} />
        {userPortalNavigation.map((item) => (
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
      <Route path="/login" element={<LoginPage destinations={loginDestinations} />} />
      <Route path="/admin/login" element={<AdminLoginRedirect />} />
      <Route element={<RequireAdminSession />}>
        <Route path="/admin" element={<AdminPortalLayout />}>
          <Route index element={<Navigate to="overview" replace />} />
          <Route path="overview" element={<AdminDashboardPage />} />
          <Route path="parking-lots" element={<AdminParkingLotsPage />} />
          <Route path="vehicles" element={<AdminVehiclesPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/user/overview" replace />} />
    </Routes>
  )
}
