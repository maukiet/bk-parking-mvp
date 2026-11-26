import { useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router'
import { useAuth } from '../../../shared/auth/AuthContext'
import { Icon } from '../../../shared/components/Icon'
import { Avatar } from '../../../shared/components/Avatar'
import { adminNavigation } from '../navigation'
import { useAdminDashboard } from '../useAdminDashboard'

export type AdminDashboardContext = ReturnType<typeof useAdminDashboard> & {
  lotId: string
}

export function AdminPortalLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [lotId, setLotId] = useState('')
  const { pathname } = useLocation()
  const page = adminNavigation.find(item => pathname.split('/')[2] === item.path)
  const isDashboard = page?.path === 'overview'
  const dashboard = useAdminDashboard(isDashboard)
  const summary = dashboard.state.status === 'ready' ? dashboard.state.summary : null
  const context: AdminDashboardContext = { ...dashboard, lotId }
  const accountName = user?.fullName ?? 'Quản trị viên'

  return (
    <div data-admin-portal className="min-h-screen min-w-0 bg-[#faf8ff] text-slate-950 md:flex">
      <aside className={`border-r border-slate-200 bg-white md:sticky md:top-0 md:block md:h-screen md:shrink-0 ${mobileOpen ? 'block' : 'hidden'} ${collapsed ? 'md:w-20' : 'md:w-64'}`}>
        <div className="flex h-[72px] items-center justify-between px-4">
          <Link to="/admin/overview" aria-label="BK Parking – Bảng điều khiển" onClick={() => setMobileOpen(false)} className="grid size-9 place-items-center rounded-full bg-black font-black text-lime-400">P</Link>
          <button type="button" aria-label={collapsed ? 'Mở rộng menu' : 'Thu gọn menu'} onClick={() => setCollapsed(!collapsed)} className="hidden rounded text-slate-500 md:block">
            <Icon name={collapsed ? 'chevron-right' : 'chevron-left'} className="size-4" />
          </button>
          <button type="button" aria-label="Đóng menu" onClick={() => setMobileOpen(false)} className="md:hidden"><Icon name="close" /></button>
        </div>
        <nav aria-label="Điều hướng quản trị" className="space-y-1.5 px-4 py-5">
          {adminNavigation.map(item => (
            <NavLink key={item.path} to={item.path} title={item.title} aria-label={item.title} onClick={() => setMobileOpen(false)}
              className={({ isActive }) => `group flex min-h-11 items-center gap-3 rounded-2xl px-3 text-sm font-medium ${isActive ? 'bg-black text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}>
              <Icon name={item.icon} className="size-4 shrink-0 group-aria-[current=page]:text-lime-400" />
              <span className={collapsed ? 'md:hidden' : ''}>{item.title}</span>
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="min-w-0 flex-1">
        <header className="flex min-h-[72px] flex-wrap items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 lg:px-8">
          <button type="button" aria-label="Menu quản trị" aria-expanded={mobileOpen} onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden"><Icon name="menu" /></button>
          <span className="mr-auto text-sm font-semibold">{page?.title}</span>
          {isDashboard && (
            <div className="order-last flex w-full flex-wrap items-center gap-2 lg:order-none lg:w-auto lg:flex-1 lg:justify-end">
              <select
                aria-label="Lọc theo bãi đỗ"
                value={lotId}
                onChange={event => setLotId(event.target.value)}
                className="max-w-48 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm"
              >
                <option value="">Tất cả bãi</option>
                {summary?.parkingLots.map(lot => <option key={lot.id} value={lot.id}>{lot.name}</option>)}
              </select>
            </div>
          )}
          <details className="relative">
            <summary aria-label="Tài khoản quản trị" className="flex min-h-11 cursor-pointer list-none items-center gap-3 rounded-lg focus-visible:outline-2 focus-visible:outline-lime-600">
              <span className="shrink-0 [&>*]:size-10"><Avatar name={accountName} /></span>
              <span className="hidden min-w-0 sm:block">
                <span className="block max-w-36 truncate text-sm font-semibold">{accountName}</span>
                {user?.roleName && <span className="block text-xs text-slate-500">{user.roleName}</span>}
              </span>
            </summary>
            <div className="absolute right-0 z-20 mt-2 w-40 rounded-xl border border-slate-200 bg-white p-1 shadow-lg">
              <button type="button" className="min-h-11 w-full rounded-lg px-3 text-left text-sm text-slate-700 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-lime-600" onClick={() => {
                logout()
                navigate('/login', { replace: true })
              }}>
                Đăng xuất
              </button>
            </div>
          </details>
        </header>
        <main className="p-4 sm:p-8"><Outlet context={context} /></main>
      </div>
    </div>
  )
}
