import { Navigate, Route, Routes } from 'react-router'
import { UserPortalLayout } from '../features/user-portal/layout/UserPortalLayout'
import {
  userPortalNavigation,
  userPortalUtilityPages,
} from '../features/user-portal/navigation'
import { UserPortalPage } from '../features/user-portal/pages/UserPortalPage'

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
      <Route path="*" element={<Navigate to="/user/overview" replace />} />
    </Routes>
  )
}
