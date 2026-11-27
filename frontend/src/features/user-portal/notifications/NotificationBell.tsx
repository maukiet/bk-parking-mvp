import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { Bell, CheckCheck, ChevronRight } from 'lucide-react'
import { useNotificationCenter } from './NotificationCenter'

function shortTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }).format(date)
}

export function NotificationBell() {
  const { notifications, unreadCount, isReady, markRead, markAllRead } = useNotificationCenter()
  const [isOpen, setIsOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const recent = [...notifications].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)).slice(0, 5)

  useEffect(() => {
    if (!isOpen) return
    const closeOnOutside = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setIsOpen(false)
    }
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false)
    }
    document.addEventListener('pointerdown', closeOnOutside)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('pointerdown', closeOnOutside)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [isOpen])

  return (
    <div className="relative" ref={rootRef}>
      <button
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-label={unreadCount ? `Thông báo, ${unreadCount} chưa đọc` : 'Thông báo'}
        className="relative grid size-9 place-items-center rounded-full text-slate-600 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-500"
        onClick={() => setIsOpen((open) => !open)}
        type="button"
      >
        <Bell className="size-[19px]" strokeWidth={1.8} />
        {unreadCount > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 grid min-h-[17px] min-w-[17px] place-items-center rounded-full border-2 border-white bg-red-500 px-1 text-[9px] font-bold leading-none text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        ) : null}
      </button>

      {isOpen ? (
        <section aria-label="Thông báo gần đây" aria-modal="false" className="absolute right-0 top-12 z-50 w-[min(92vw,390px)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl" role="dialog">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3.5">
            <div>
              <h2 className="text-sm font-bold text-slate-950">Thông báo</h2>
              <p className="mt-0.5 text-xs text-slate-500">{unreadCount ? `${unreadCount} thông báo chưa đọc` : 'Bạn đã cập nhật hết'}</p>
            </div>
            <button
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
              disabled={!unreadCount}
              onClick={markAllRead}
              title="Đánh dấu tất cả đã đọc"
              type="button"
            >
              <CheckCheck className="size-4" />
            </button>
          </div>

          {!isReady ? (
            <div className="px-4 py-8 text-center text-sm text-slate-500">Đang tải thông báo…</div>
          ) : recent.length ? (
            <ul className="max-h-[390px] overflow-y-auto">
              {recent.map((item) => (
                <li key={item.id}>
                  <Link
                    className={`flex gap-3 border-b border-slate-100 px-4 py-3.5 transition-colors hover:bg-slate-50 ${item.read ? '' : 'bg-violet-50/50'}`}
                    onClick={() => {
                      markRead(item.id)
                      setIsOpen(false)
                    }}
                    to={`/user/notifications?notification=${encodeURIComponent(item.id)}`}
                  >
                    <span className={`mt-1.5 size-2 shrink-0 rounded-full ${item.read ? 'bg-transparent' : 'bg-violet-600'}`} />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-start justify-between gap-3">
                        <span className="line-clamp-1 text-sm font-semibold text-slate-900">{item.title}</span>
                        <span className="shrink-0 text-[10px] text-slate-400">{shortTime(item.createdAt)}</span>
                      </span>
                      <span className="mt-1 line-clamp-2 block text-xs leading-5 text-slate-500">{item.message}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-5 py-9 text-center">
              <Bell className="mx-auto size-7 text-slate-300" />
              <p className="mt-2 text-sm font-medium text-slate-700">Chưa có thông báo</p>
              <p className="mt-1 text-xs text-slate-500">Thông báo mới sẽ xuất hiện tại đây.</p>
            </div>
          )}

          <Link
            className="flex items-center justify-between px-4 py-3 text-sm font-semibold text-violet-700 hover:bg-violet-50"
            onClick={() => setIsOpen(false)}
            to="/user/notifications"
          >
            Xem tất cả thông báo <ChevronRight className="size-4" />
          </Link>
        </section>
      ) : null}
    </div>
  )
}
