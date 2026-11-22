import { useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router'
import { Icon } from '../../../shared/components/Icon'
import { Avatar } from '../../../shared/components/Avatar'
import { adminNavigation } from '../navigation'
import { useAdminDashboard } from '../useAdminDashboard'

export type AdminDashboardContext = ReturnType<typeof useAdminDashboard> & {
  lotId: string
  query: string
}

export function AdminPortalLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [lotId, setLotId] = useState('')
  const [query, setQuery] = useState('')
  const { pathname } = useLocation()
  const page = adminNavigation.find(item => pathname.split('/')[2] === item.path)
  const isDashboard = page?.path === 'overview'
  const dashboard = useAdminDashboard(isDashboard)
  const summary = dashboard.state.status === 'ready' ? dashboard.state.summary : null
  const context: AdminDashboardContext = { ...dashboard, lotId, query }

  return (
    <div className="min-h-screen bg-[#faf8ff] text-slate-950 md:flex">
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
              <input
                type="search"
                aria-label="Tìm theo tên, mã hoặc vị trí bãi"
                placeholder="Tìm bãi đỗ..."
                value={query}
                onChange={event => setQuery(event.target.value)}
                className="min-w-32 flex-1 rounded-full border border-slate-200 bg-[#faf8ff] px-4 py-2 text-sm lg:max-w-sm"
              />
              <select
                aria-label="Lọc theo bãi đỗ"
                value={lotId}
                onChange={event => setLotId(event.target.value)}
                className="max-w-48 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm"
              >
                <option value="">Tất cả bãi</option>
                {summary?.parkingLots.map(lot => <option key={lot.id} value={lot.id}>{lot.name}</option>)}
              </select>
              <details className="relative">
                <summary aria-label="Cảnh báo" className="relative grid size-10 cursor-pointer list-none place-items-center rounded-full border border-slate-200">
                  <Icon name="bell" className="size-4" />
                  {!!summary?.alerts.length && <span className="absolute right-2 top-2 size-2 rounded-full bg-red-500" />}
                </summary>
                <div className="absolute right-0 z-10 mt-2 w-60 rounded-xl border border-slate-200 bg-white p-3 text-sm shadow-lg">
                  <p className="mb-2 font-semibold">Cảnh báo</p>
                  {summary?.alerts.length ? (
                    <ul className="space-y-2">
                      {summary.alerts.map((alert, index) => (
                        <li key={index}><Link className="hover:underline" to={alert.targetRoute}>{alert.title}</Link></li>
                      ))}
                    </ul>
                  ) : <p className="text-slate-600">{summary ? 'Hiện chưa có cảnh báo.' : 'Chưa tải được dữ liệu cảnh báo.'}</p>}
                </div>
              </details>
            </div>
          )}
          <span className="hidden text-sm text-slate-500 sm:inline">Quản trị viên</span>
          <Avatar name="Quản trị viên" />
        </header>
        <main className="p-4 sm:p-8"><Outlet context={context} /></main>
      </div>
    </div>
  )
}
