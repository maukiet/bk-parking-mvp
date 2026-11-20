import { useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router'
import { userPortalNavigation } from '../navigation'
import { Avatar } from '../../../shared/components/Avatar'
import { Icon } from '../../../shared/components/Icon'
import { useAuth } from '../../../shared/auth/AuthContext'

export function UserPortalLayout() {
  const { user, isLoading: isAuthLoading, logout } = useAuth()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-[#faf8ff] text-slate-950 md:flex">
      {isMobileMenuOpen ? (
        <button
          aria-label="Đóng điều hướng"
          className="fixed inset-0 z-30 bg-slate-950/30 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
          type="button"
        />
      ) : null}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex h-screen w-64 shrink-0 flex-col border-r border-slate-200 bg-white transition-[width,transform] duration-200 md:sticky md:top-0 md:translate-x-0 ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        } ${isCollapsed ? 'md:w-[76px]' : 'md:w-64'}`}
      >
        <div className="flex h-16 shrink-0 items-center justify-between px-4">
          <Link
            aria-label="BK Parking, về Dashboard"
            className={`flex min-w-0 items-center gap-3 ${isCollapsed ? 'md:mx-auto' : ''}`}
            onClick={() => setIsMobileMenuOpen(false)}
            to="/user/overview"
          >
            <img
              alt="Logo BK TP.HCM"
              className="size-12 shrink-0 object-contain"
              src="/logobk.png"
            />
            <span className={`truncate text-sm font-semibold text-slate-900 ${isCollapsed ? 'md:hidden' : ''}`}>
              BK Parking
            </span>
          </Link>
          <button
            aria-label={isCollapsed ? 'Mở rộng thanh điều hướng' : 'Thu gọn thanh điều hướng'}
            aria-pressed={isCollapsed}
            className={`hidden size-8 shrink-0 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 md:grid ${isCollapsed ? 'md:absolute md:-right-3 md:top-[18px] md:z-10 md:bg-white md:shadow-sm' : ''}`}
            onClick={() => setIsCollapsed((value) => !value)}
            type="button"
          >
            <Icon name={isCollapsed ? 'chevron-right' : 'chevron-left'} className="size-4" />
          </button>
          <button
            aria-label="Đóng thanh điều hướng"
            className="grid size-8 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
            type="button"
          >
            <Icon name="close" className="size-5" />
          </button>
        </div>

        <nav aria-label="Điều hướng người dùng" className="flex-1 space-y-1 overflow-y-auto px-4 pb-5 pt-5">
          {userPortalNavigation.map((item) => (
            <NavLink
              key={item.path}
              aria-label={item.title}
              title={isCollapsed ? item.title : undefined}
              to={`/user/${item.path}`}
              onClick={() => setIsMobileMenuOpen(false)}
              className={({ isActive }) =>
                `flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors ${
                  isCollapsed ? 'md:justify-center md:px-0' : ''
                } ${
                  isActive
                    ? 'bg-black text-white shadow-sm'
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    name={item.icon}
                    className={`size-[18px] shrink-0 ${isActive ? 'text-lime-400' : ''}`}
                  />
                  <span className={isCollapsed ? 'md:hidden' : ''}>{item.title}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-100 bg-white px-4 sm:px-6 lg:px-8">
          <button
            aria-expanded={isMobileMenuOpen}
            aria-label="Mở thanh điều hướng"
            className="grid size-9 place-items-center rounded-lg text-slate-600 hover:bg-slate-100 md:hidden"
            onClick={() => setIsMobileMenuOpen(true)}
            type="button"
          >
            <Icon name="menu" />
          </button>

          <div className="flex-1" />

          <div className="flex items-center gap-3 sm:gap-4">
            <Link
              aria-label="Thông báo"
              className="relative grid size-9 place-items-center rounded-full text-slate-600 hover:bg-slate-100"
              to="/user/notifications"
            >
              <Icon name="bell" className="size-[19px]" />
              <span aria-label="Có thông báo mới" className="absolute right-[7px] top-[6px] size-1.5 rounded-full bg-red-500" />
            </Link>

            <div className="relative">
              <button
                aria-expanded={isProfileMenuOpen}
                aria-label="Mở menu tài khoản"
                className="flex items-center gap-2.5 rounded-lg py-1 pl-1 pr-0.5 text-left hover:bg-slate-50 sm:gap-3 sm:pr-2"
                onClick={() => setIsProfileMenuOpen((value) => !value)}
                type="button"
              >
                <Avatar name={user?.fullName ?? 'Bạn'} />
                <span className="hidden min-w-0 sm:block">
                  <span className="block max-w-36 truncate text-xs font-semibold text-slate-900">
                    {user?.fullName ?? (isAuthLoading ? 'Đang xác thực…' : 'Đăng nhập')}
                  </span>
                  <span className="mt-0.5 block text-[11px] text-slate-500">{user?.roleName ?? 'BK Parking'}</span>
                </span>
                <Icon name="chevron-down" className="hidden size-4 text-slate-500 sm:block" />
              </button>

              {isProfileMenuOpen ? (
                <div className="absolute right-0 top-12 z-30 w-52 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg">
                  {user ? (
                    <>
                      <Link
                        className="block rounded-lg px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
                        onClick={() => setIsProfileMenuOpen(false)}
                        to="/user/settings"
                      >
                        Cài đặt tài khoản
                      </Link>
                      <button
                        className="block w-full rounded-lg px-3 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50"
                        onClick={() => {
                          setIsProfileMenuOpen(false)
                          logout()
                        }}
                        type="button"
                      >
                        Đăng xuất
                      </button>
                    </>
                  ) : (
                    <Link
                      className="block rounded-lg px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
                      onClick={() => setIsProfileMenuOpen(false)}
                      to="/user/overview?tab=qr"
                    >
                      Đăng nhập để xem mã QR
                    </Link>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        </header>

        <main className="min-h-[calc(100vh-4rem)] px-5 py-7 sm:px-8 sm:py-9 lg:px-10">
          <div className="mx-auto w-full max-w-[928px]">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
