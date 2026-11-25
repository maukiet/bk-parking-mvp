import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import {
  AlertCircle,
  Bell,
  CalendarDays,
  CarFront,
  Check,
  CheckCheck,
  ChevronDown,
  Clock3,
  CreditCard,
  Info,
  Mail,
  MessageCircle,
  MoreHorizontal,
  RotateCcw,
  Search,
  Settings2,
  Smartphone,
  Star,
  Trash2,
  Wrench,
  X,
} from 'lucide-react'
import { PageHeader } from '../../../shared/components/PageHeader'
import { useNotificationCenter } from '../notifications/NotificationCenter'
import {
  defaultNotificationSettings,
  notificationCategoryLabels,
  notificationLevelLabels,
  type NotificationCategory,
  type NotificationLevel,
  type NotificationSettings,
  type UserNotification,
} from '../notifications/notificationTypes'

type MainTab = 'all' | 'unread' | 'important'
type DateFilter = 'all' | 'today' | '7days' | '30days'
type CategoryFilter = 'all' | NotificationCategory
type VehicleFilter = 'all' | '59-B1 123.45'

const categories: CategoryFilter[] = ['all', 'session', 'vehicle', 'package', 'support', 'system']
const categoryIcons = {
  session: CarFront,
  vehicle: CarFront,
  package: CreditCard,
  support: MessageCircle,
  system: Wrench,
} satisfies Record<NotificationCategory, typeof Bell>
const weekdays = [
  { id: 1, label: 'T2' },
  { id: 2, label: 'T3' },
  { id: 3, label: 'T4' },
  { id: 4, label: 'T5' },
  { id: 5, label: 'T6' },
  { id: 6, label: 'T7' },
  { id: 0, label: 'CN' },
]

function dateOf(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function formatDateTime(value: string) {
  const date = dateOf(value)
  return date
    ? new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }).format(date)
    : 'Chưa xác định thời gian'
}

function timeAgo(value: string) {
  const date = dateOf(value)
  if (!date) return 'Vừa cập nhật'
  const minutes = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60_000))
  if (minutes < 1) return 'Vừa xong'
  if (minutes < 60) return `${minutes} phút trước`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} giờ trước`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'Hôm qua'
  if (days < 7) return `${days} ngày trước`
  return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit' }).format(date)
}

function dayGroup(value: string) {
  const date = dateOf(value)
  if (!date) return 'Trước đó'
  const today = new Date()
  const startToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()
  const startDate = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
  const delta = Math.round((startToday - startDate) / 86_400_000)
  if (delta <= 0) return 'Hôm nay'
  if (delta === 1) return 'Hôm qua'
  return 'Trước đó'
}

function isImportant(item: UserNotification) {
  return item.pinned || item.level === 'important' || item.level === 'action'
}

function categoryStyle(category: NotificationCategory) {
  switch (category) {
    case 'session': return 'bg-sky-50 text-sky-700'
    case 'vehicle': return 'bg-indigo-50 text-indigo-700'
    case 'package': return 'bg-amber-50 text-amber-800'
    case 'support': return 'bg-violet-50 text-violet-700'
    case 'system': return 'bg-slate-100 text-slate-700'
  }
}

function levelStyle(level: NotificationLevel) {
  switch (level) {
    case 'action': return 'bg-rose-50 text-rose-700'
    case 'important': return 'bg-orange-50 text-orange-800'
    case 'success': return 'bg-emerald-50 text-emerald-700'
    case 'info': return 'bg-slate-100 text-slate-600'
  }
}

function copySettings(settings: NotificationSettings): NotificationSettings {
  return {
    channels: Object.fromEntries(
      Object.entries(settings.channels).map(([category, value]) => [category, { ...value }]),
    ) as NotificationSettings['channels'],
    quietHours: { ...settings.quietHours, days: [...settings.quietHours.days] },
  }
}

function NotificationIcon({ category }: { category: NotificationCategory }) {
  const Icon = categoryIcons[category]
  return <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${categoryStyle(category)}`}><Icon className="size-5" strokeWidth={1.8} /></span>
}

function MockDataNotice() {
  return (
    <div className="mt-6 flex gap-2.5 rounded-xl border border-blue-100 bg-blue-50/70 px-3.5 py-3 text-xs leading-5 text-blue-900 sm:text-sm">
      <Info className="mt-0.5 size-4 shrink-0" />
      <p><strong>Dữ liệu minh họa:</strong> thông báo và cài đặt được lưu trên trình duyệt này, chưa đồng bộ với backend. Email và thông báo đẩy chưa được gửi thật.</p>
    </div>
  )
}

export function UserNotificationsPage() {
  const {
    notifications,
    settings,
    isReady,
    unreadCount,
    markRead,
    markAllRead,
    setRead,
    togglePinned,
    removeNotifications,
    saveSettings,
  } = useNotificationCenter()
  const [searchParams, setSearchParams] = useSearchParams()
  const selectedId = searchParams.get('notification')
  const [activeNotificationId, setActiveNotificationId] = useState<string | null>(null)
  const activeNotification = notifications.find((item) => item.id === (selectedId ?? activeNotificationId)) ?? null
  const [filterClock] = useState(() => {
    const now = Date.now()
    const date = new Date(now)
    return {
      now,
      startOfToday: new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime(),
    }
  })
  const [tab, setTab] = useState<MainTab>('all')
  const [category, setCategory] = useState<CategoryFilter>('all')
  const [dateFilter, setDateFilter] = useState<DateFilter>('all')
  const [vehicleFilter, setVehicleFilter] = useState<VehicleFilter>('all')
  const [sortNewestFirst, setSortNewestFirst] = useState(true)
  const [query, setQuery] = useState('')
  const [visibleCount, setVisibleCount] = useState(6)
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [settingsDraft, setSettingsDraft] = useState<NotificationSettings>(() => copySettings(settings))

  useEffect(() => {
    if (!selectedId || !isReady) return
    const selected = notifications.find((item) => item.id === selectedId)
    if (selected && !selected.read) markRead(selected.id)
  }, [isReady, markRead, notifications, selectedId])

  const filtered = useMemo(() => {
    const since = dateFilter === 'today'
      ? filterClock.startOfToday
      : dateFilter === '7days'
        ? filterClock.now - 7 * 86_400_000
        : dateFilter === '30days'
          ? filterClock.now - 30 * 86_400_000
          : null
    return notifications
      .filter((item) => {
        if (tab === 'unread' && item.read) return false
        if (tab === 'important' && !isImportant(item)) return false
        if (category !== 'all' && item.category !== category) return false
        if (vehicleFilter !== 'all' && item.vehicleLabel !== vehicleFilter) return false
        if (since && (!dateOf(item.createdAt) || Date.parse(item.createdAt) < since)) return false
        if (query.trim()) {
          const text = `${item.title} ${item.message} ${notificationCategoryLabels[item.category]}`.toLocaleLowerCase('vi-VN')
          if (!text.includes(query.trim().toLocaleLowerCase('vi-VN'))) return false
        }
        return true
      })
      .sort((a, b) => (Date.parse(a.createdAt) - Date.parse(b.createdAt)) * (sortNewestFirst ? -1 : 1))
  }, [category, dateFilter, filterClock, notifications, query, sortNewestFirst, tab, vehicleFilter])

  const visible = filtered.slice(0, visibleCount)
  const groups = ['Hôm nay', 'Hôm qua', 'Trước đó'].map((title) => ({
    title,
    items: visible.filter((item) => dayGroup(item.createdAt) === title),
  })).filter((group) => group.items.length)
  const pinned = notifications.filter((item) => item.pinned || item.level === 'action')
  const allVisibleSelected = visible.length > 0 && visible.every((item) => selectedIds.includes(item.id))

  function closeDetail() {
    setActiveNotificationId(null)
    if (selectedId) {
      const next = new URLSearchParams(searchParams)
      next.delete('notification')
      setSearchParams(next, { replace: true })
    }
  }

  function toggleSelected(id: string) {
    setSelectedIds((current) => current.includes(id) ? current.filter((itemId) => itemId !== id) : [...current, id])
  }

  function toggleAllVisible() {
    setSelectedIds((current) => allVisibleSelected
      ? current.filter((id) => !visible.some((item) => item.id === id))
      : [...new Set([...current, ...visible.map((item) => item.id)])])
  }

  function beginSettings() {
    setSettingsDraft(copySettings(settings))
    setIsSettingsOpen(true)
  }

  function toggleChannel(categoryId: Exclude<NotificationCategory, 'session'>, channel: 'email' | 'push') {
    setSettingsDraft((current) => ({
      ...current,
      channels: {
        ...current.channels,
        [categoryId]: { ...current.channels[categoryId], [channel]: !current.channels[categoryId][channel] },
      },
    }))
  }

  function toggleQuietDay(day: number) {
    setSettingsDraft((current) => ({
      ...current,
      quietHours: {
        ...current.quietHours,
        days: current.quietHours.days.includes(day)
          ? current.quietHours.days.filter((value) => value !== day)
          : [...current.quietHours.days, day],
      },
    }))
  }

  const tabs: { id: MainTab; label: string; count?: number }[] = [
    { id: 'all', label: 'Tất cả', count: notifications.length },
    { id: 'unread', label: 'Chưa đọc', count: unreadCount },
    { id: 'important', label: 'Quan trọng' },
  ]

  return (
    <div className="pb-12">
      <PageHeader
        title="Thông báo"
        description="Theo dõi cập nhật về lượt gửi xe, phương tiện, gói đỗ và hỗ trợ."
        action={(
          <div className="flex items-center gap-2">
            <button className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50" onClick={beginSettings} type="button">
              <Settings2 className="size-4" /> <span className="hidden sm:inline">Cài đặt</span>
            </button>
            <button className="inline-flex h-10 items-center gap-2 rounded-xl bg-slate-950 px-3.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50" disabled={!unreadCount} onClick={markAllRead} type="button">
              <CheckCheck className="size-4" /> <span className="hidden sm:inline">Đánh dấu đã đọc</span><span className="sm:hidden">Đã đọc hết</span>
            </button>
          </div>
        )}
      />
      <MockDataNotice />

      {!isReady ? (
        <div className="mt-8 rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center text-sm text-slate-500">Đang tải thông báo…</div>
      ) : (
        <>
          {pinned.length ? (
            <section className="mt-6 rounded-2xl border border-amber-200 bg-amber-50/70 p-4 sm:p-5" aria-labelledby="action-needed-heading">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="grid size-8 place-items-center rounded-lg bg-amber-100 text-amber-800"><AlertCircle className="size-4" /></span>
                  <div>
                    <h2 id="action-needed-heading" className="text-sm font-bold text-slate-900">Cần bạn xử lý</h2>
                    <p className="text-xs text-slate-600">{pinned.length} thông báo được ghim hoặc cần hành động</p>
                  </div>
                </div>
                <button className="text-xs font-semibold text-amber-900 underline decoration-amber-300 underline-offset-4" onClick={() => setTab('important')} type="button">Xem danh sách</button>
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {pinned.slice(0, 2).map((item) => (
                  <button key={item.id} className="flex items-center gap-3 rounded-xl border border-amber-100 bg-white/80 p-3 text-left hover:border-amber-300" onClick={() => { setActiveNotificationId(item.id); markRead(item.id) }} type="button">
                    <NotificationIcon category={item.category} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-slate-900">{item.title}</span>
                      <span className="mt-0.5 block text-xs text-slate-500">{timeAgo(item.createdAt)}</span>
                    </span>
                    <ChevronDown className="size-4 -rotate-90 text-slate-400" />
                  </button>
                ))}
              </div>
            </section>
          ) : null}

          <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-4 pt-4 sm:px-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex gap-1 overflow-x-auto" role="tablist" aria-label="Lọc trạng thái thông báo">
                  {tabs.map((item) => (
                    <button
                      aria-selected={tab === item.id}
                      className={`flex shrink-0 items-center gap-2 border-b-2 px-3 py-3 text-sm font-medium transition-colors ${tab === item.id ? 'border-slate-950 text-slate-950' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
                      key={item.id}
                      onClick={() => { setTab(item.id); setVisibleCount(6) }}
                      role="tab"
                      type="button"
                    >
                      {item.label}
                      {item.count !== undefined ? <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${tab === item.id ? 'bg-slate-100 text-slate-700' : 'bg-slate-50 text-slate-500'}`}>{item.count}</span> : null}
                    </button>
                  ))}
                </div>
                <button
                  className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                  onClick={() => { setSelectionMode((value) => !value); setSelectedIds([]) }}
                  type="button"
                >
                  {selectionMode ? <X className="size-3.5" /> : <Check className="size-3.5" />}
                  {selectionMode ? 'Hủy chọn' : 'Chọn nhiều'}
                </button>
              </div>

              <div className="grid gap-2 py-3 sm:grid-cols-[minmax(180px,1fr)_auto_auto_auto]">
                <label className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 px-3 text-slate-400 focus-within:border-slate-400">
                  <Search className="size-4 shrink-0" />
                  <input className="min-w-0 flex-1 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400" onChange={(event) => { setQuery(event.target.value); setVisibleCount(6) }} placeholder="Tìm thông báo..." value={query} />
                </label>
                <label className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 px-3 text-xs text-slate-500">
                  <CalendarDays className="size-4" />
                  <select aria-label="Lọc theo thời gian" className="bg-transparent text-sm text-slate-700 outline-none" onChange={(event) => { setDateFilter(event.target.value as DateFilter); setVisibleCount(6) }} value={dateFilter}>
                    <option value="all">Mọi thời gian</option><option value="today">Hôm nay</option><option value="7days">7 ngày qua</option><option value="30days">30 ngày qua</option>
                  </select>
                </label>
                <label className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 px-3 text-xs text-slate-500">
                  <CarFront className="size-4" />
                  <select aria-label="Lọc theo phương tiện" className="bg-transparent text-sm text-slate-700 outline-none" onChange={(event) => setVehicleFilter(event.target.value as VehicleFilter)} value={vehicleFilter}>
                    <option value="all">Mọi phương tiện</option><option value="59-B1 123.45">59-B1 123.45</option>
                  </select>
                </label>
                <button className="flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 text-sm text-slate-700 hover:bg-slate-50" onClick={() => setSortNewestFirst((value) => !value)} type="button">
                  <Clock3 className="size-4 text-slate-500" /> {sortNewestFirst ? 'Mới nhất' : 'Cũ nhất'} <ChevronDown className={`size-3.5 transition-transform ${sortNewestFirst ? '' : 'rotate-180'}`} />
                </button>
              </div>

              <div className="flex gap-2 overflow-x-auto pb-3">
                {categories.map((item) => (
                  <button
                    className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${category === item ? 'border-slate-950 bg-slate-950 text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-400'}`}
                    key={item}
                    onClick={() => { setCategory(item); setVisibleCount(6) }}
                    type="button"
                  >{item === 'all' ? 'Tất cả loại' : notificationCategoryLabels[item]}</button>
                ))}
              </div>
            </div>

            {selectionMode ? (
              <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 bg-slate-50 px-4 py-2.5 sm:px-5">
                <button className="mr-auto inline-flex items-center gap-2 text-xs font-medium text-slate-600" onClick={toggleAllVisible} type="button">
                  <span className={`grid size-4 place-items-center rounded border ${allVisibleSelected ? 'border-slate-950 bg-slate-950 text-white' : 'border-slate-300 bg-white'}`}>{allVisibleSelected ? <Check className="size-3" /> : null}</span>
                  {allVisibleSelected ? 'Bỏ chọn trang này' : 'Chọn trang này'}
                </button>
                <span className="mr-1 text-xs text-slate-500">Đã chọn {selectedIds.length}</span>
                <button className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-semibold text-slate-700 hover:bg-white disabled:opacity-40" disabled={!selectedIds.length} onClick={() => { setRead(selectedIds, true); setSelectedIds([]) }} type="button"><CheckCheck className="size-3.5" /> Đánh dấu đã đọc</button>
                <button className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-40" disabled={!selectedIds.length} onClick={() => { removeNotifications(selectedIds); setSelectedIds([]) }} type="button"><Trash2 className="size-3.5" /> Xóa</button>
              </div>
            ) : null}

            {filtered.length ? (
              <div>
                {groups.map((group) => (
                  <div key={group.title}>
                    <div className="flex items-center justify-between bg-slate-50/70 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500 sm:px-5">
                      <span>{group.title}</span><span>{group.items.length} thông báo</span>
                    </div>
                    <ul>
                      {group.items.map((item) => (
                        <li key={item.id} className={`relative flex gap-3 border-b border-slate-100 px-4 py-4 transition-colors hover:bg-slate-50/60 sm:gap-4 sm:px-5 ${item.read ? '' : 'bg-violet-50/25'}`}>
                          {selectionMode ? (
                            <button aria-label={`${selectedIds.includes(item.id) ? 'Bỏ chọn' : 'Chọn'} ${item.title}`} className={`mt-2 grid size-4 shrink-0 place-items-center rounded border ${selectedIds.includes(item.id) ? 'border-slate-950 bg-slate-950 text-white' : 'border-slate-300 bg-white'}`} onClick={() => toggleSelected(item.id)} type="button">{selectedIds.includes(item.id) ? <Check className="size-3" /> : null}</button>
                          ) : null}
                          <NotificationIcon category={item.category} />
                          <button className="min-w-0 flex-1 text-left" onClick={() => { setActiveNotificationId(item.id); markRead(item.id) }} type="button">
                            <span className="flex flex-wrap items-center gap-1.5">
                              <span className={`size-2 shrink-0 rounded-full ${item.read ? 'bg-transparent' : 'bg-violet-600'}`} />
                              <span className={`text-sm text-slate-900 ${item.read ? 'font-medium' : 'font-bold'}`}>{item.title}</span>
                              {item.pinned ? <Star className="size-3.5 fill-amber-400 text-amber-500" /> : null}
                              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${categoryStyle(item.category)}`}>{notificationCategoryLabels[item.category]}</span>
                              {item.level !== 'info' ? <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${levelStyle(item.level)}`}>{notificationLevelLabels[item.level]}</span> : null}
                            </span>
                            <span className="mt-1.5 line-clamp-2 block text-xs leading-5 text-slate-600 sm:text-sm">{item.message}</span>
                            <span className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-400">
                              <span>{timeAgo(item.createdAt)}</span><span>{formatDateTime(item.createdAt)}</span>
                              {item.actionLabel ? <span className="font-semibold text-violet-700">{item.actionLabel} →</span> : null}
                            </span>
                          </button>
                          <div className="relative shrink-0">
                            <button aria-expanded={openMenuId === item.id} aria-label={`Thao tác: ${item.title}`} className="grid size-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-200/70 hover:text-slate-700" onClick={() => setOpenMenuId((current) => current === item.id ? null : item.id)} type="button"><MoreHorizontal className="size-4" /></button>
                            {openMenuId === item.id ? (
                              <div className="absolute right-0 top-9 z-20 w-48 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg">
                                <button className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs text-slate-700 hover:bg-slate-50" onClick={() => { setRead([item.id], !item.read); setOpenMenuId(null) }} type="button"><CheckCheck className="size-3.5" /> Đánh dấu {item.read ? 'chưa đọc' : 'đã đọc'}</button>
                                <button className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs text-slate-700 hover:bg-slate-50" onClick={() => { togglePinned(item.id); setOpenMenuId(null) }} type="button"><Star className="size-3.5" /> {item.pinned ? 'Bỏ ghim' : 'Ghim thông báo'}</button>
                                <button className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs text-rose-700 hover:bg-rose-50" onClick={() => { removeNotifications([item.id]); setOpenMenuId(null) }} type="button"><Trash2 className="size-3.5" /> Xóa thông báo</button>
                              </div>
                            ) : null}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
                {filtered.length > visibleCount ? (
                  <div className="px-4 py-4 text-center">
                    <button className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50" onClick={() => setVisibleCount((count) => count + 6)} type="button">Tải thêm thông báo</button>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="px-5 py-16 text-center">
                <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-slate-100 text-slate-400"><Bell className="size-6" /></span>
                <h2 className="mt-4 text-sm font-bold text-slate-900">Không tìm thấy thông báo</h2>
                <p className="mt-1 text-sm text-slate-500">Thử đổi bộ lọc hoặc từ khóa tìm kiếm.</p>
                <button className="mt-3 text-sm font-semibold text-violet-700 hover:underline" onClick={() => { setTab('all'); setCategory('all'); setDateFilter('all'); setVehicleFilter('all'); setQuery('') }} type="button">Xóa bộ lọc</button>
              </div>
            )}
          </section>
          <p className="mt-3 text-center text-xs text-slate-400">Hiển thị {visible.length} trong tổng số {filtered.length} thông báo mẫu</p>
        </>
      )}

      {activeNotification ? <NotificationDetail item={activeNotification} onClose={closeDetail} /> : null}
      {isSettingsOpen ? (
        <SettingsDrawer
          settings={settingsDraft}
          onChange={setSettingsDraft}
          onClose={() => setIsSettingsOpen(false)}
          onReset={() => setSettingsDraft(copySettings(defaultNotificationSettings))}
          onSave={() => { saveSettings(settingsDraft); setIsSettingsOpen(false) }}
          onToggleChannel={toggleChannel}
          onToggleDay={toggleQuietDay}
        />
      ) : null}
    </div>
  )
}

function NotificationDetail({ item, onClose }: { item: UserNotification; onClose: () => void }) {
  const Icon = categoryIcons[item.category]
  return (
    <div className="fixed inset-0 z-[70] grid place-items-center bg-slate-950/40 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <section aria-labelledby="notification-detail-title" aria-modal="true" className="w-full max-w-lg rounded-2xl bg-white shadow-2xl" role="dialog">
        <header className="flex items-start justify-between border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-3"><NotificationIcon category={item.category} /><div><span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${categoryStyle(item.category)}`}>{notificationCategoryLabels[item.category]}</span><p className="mt-1 text-xs text-slate-500">{formatDateTime(item.createdAt)}</p></div></div>
          <button aria-label="Đóng chi tiết" className="grid size-8 place-items-center rounded-lg text-slate-500 hover:bg-slate-100" onClick={onClose} type="button"><X className="size-4" /></button>
        </header>
        <div className="px-5 py-5">
          <div className="flex flex-wrap items-center gap-2">
            <h2 id="notification-detail-title" className="text-lg font-bold text-slate-950">{item.title}</h2>
            <span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${levelStyle(item.level)}`}>{notificationLevelLabels[item.level]}</span>
          </div>
          <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-600">{item.message}</p>
          <div className="mt-5 rounded-xl bg-slate-50 p-3.5 text-xs leading-5 text-slate-500">
            <p className="flex items-center gap-2"><Icon className="size-4" /> Loại thông báo: {notificationCategoryLabels[item.category]}</p>
            <p className="mt-2 flex items-center gap-2"><Clock3 className="size-4" /> Thời gian: {formatDateTime(item.createdAt)}</p>
            <p className="mt-2 flex items-center gap-2"><Info className="size-4" /> Nội dung minh họa, chưa đồng bộ backend.</p>
          </div>
          <div className="mt-5 flex justify-end gap-2">
            {item.actionHref && item.actionLabel ? <Link className="inline-flex h-10 items-center rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white hover:bg-slate-800" onClick={onClose} to={item.actionHref}>{item.actionLabel}</Link> : null}
            <button className="h-10 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50" onClick={onClose} type="button">Đóng</button>
          </div>
        </div>
      </section>
    </div>
  )
}

function SettingsDrawer({
  settings,
  onChange,
  onClose,
  onReset,
  onSave,
  onToggleChannel,
  onToggleDay,
}: {
  settings: NotificationSettings
  onChange: (settings: NotificationSettings) => void
  onClose: () => void
  onReset: () => void
  onSave: () => void
  onToggleChannel: (category: Exclude<NotificationCategory, 'session'>, channel: 'email' | 'push') => void
  onToggleDay: (day: number) => void
}) {
  useEffect(() => {
    const onEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose() }
    document.addEventListener('keydown', onEscape)
    return () => document.removeEventListener('keydown', onEscape)
  }, [onClose])

  const settingCategories: Exclude<NotificationCategory, 'session'>[] = ['vehicle', 'package', 'support', 'system']
  return (
    <div className="fixed inset-0 z-[80] bg-slate-950/35" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <aside aria-labelledby="notification-settings-title" aria-modal="true" className="ml-auto flex h-full w-full max-w-[520px] flex-col bg-white shadow-2xl" role="dialog">
        <header className="flex items-start justify-between border-b border-slate-100 px-5 py-5 sm:px-6">
          <div><div className="flex items-center gap-2"><span className="grid size-9 place-items-center rounded-xl bg-violet-50 text-violet-700"><Settings2 className="size-5" /></span><h2 id="notification-settings-title" className="text-lg font-bold text-slate-950">Cài đặt thông báo</h2></div><p className="mt-2 text-sm text-slate-500">Tùy chỉnh loại thông báo và thời gian nhận.</p></div>
          <button aria-label="Đóng cài đặt" className="grid size-9 place-items-center rounded-lg text-slate-500 hover:bg-slate-100" onClick={onClose} type="button"><X className="size-5" /></button>
        </header>
        <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6">
          <div className="flex items-start gap-2 rounded-xl border border-blue-100 bg-blue-50 px-3.5 py-3 text-xs leading-5 text-blue-900"><Info className="mt-0.5 size-4 shrink-0" /><p>Các lựa chọn này chỉ được lưu trên trình duyệt để minh họa. Email và push chưa được kết nối.</p></div>
          <section className="mt-6">
            <div className="mb-3 flex items-center justify-between"><div><h3 className="text-sm font-bold text-slate-900">Kênh nhận thông báo</h3><p className="mt-0.5 text-xs text-slate-500">Bật hoặc tắt theo từng nhóm</p></div><div className="hidden gap-7 pr-2 text-[11px] font-semibold text-slate-500 sm:flex"><span className="flex items-center gap-1"><Mail className="size-3.5" /> Email</span><span className="flex items-center gap-1"><Smartphone className="size-3.5" /> Push</span></div></div>
            <div className="divide-y divide-slate-100 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between gap-3 px-3.5 py-3.5">
                <div><p className="text-sm font-semibold text-slate-900">Ra / Vào</p><p className="mt-0.5 text-xs text-slate-500">Cảnh báo phiên gửi xe luôn bật</p></div>
                <div className="flex items-center gap-2"><span className="text-[10px] text-slate-400 sm:hidden">Luôn bật</span><span className="grid size-8 place-items-center rounded-full bg-emerald-50 text-emerald-700"><Check className="size-4" /></span></div>
              </div>
              {settingCategories.map((categoryId) => (
                <div className="flex items-center justify-between gap-3 px-3.5 py-3.5" key={categoryId}>
                  <div><p className="text-sm font-semibold text-slate-900">{notificationCategoryLabels[categoryId]}</p><p className="mt-0.5 text-xs text-slate-500">Cập nhật và nhắc nhở {categoryId === 'vehicle' ? 'phương tiện' : categoryId === 'package' ? 'gói đỗ xe' : categoryId === 'support' ? 'yêu cầu hỗ trợ' : 'dịch vụ'}</p></div>
                  <div className="flex items-center gap-3 sm:gap-6">
                    {(['email', 'push'] as const).map((channel) => {
                      const checked = settings.channels[categoryId][channel]
                      const label = channel === 'email' ? `Email ${notificationCategoryLabels[categoryId]}` : `Push ${notificationCategoryLabels[categoryId]}`
                      return <button aria-checked={checked} aria-label={label} className={`relative h-5 w-9 rounded-full transition-colors ${checked ? 'bg-violet-700' : 'bg-slate-200'}`} key={channel} onClick={() => onToggleChannel(categoryId, channel)} role="switch" type="button"><span className={`absolute top-0.5 size-4 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-[18px]' : 'translate-x-0.5'}`} /></button>
                    })}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-7 rounded-xl border border-slate-200 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex gap-2.5"><span className="grid size-9 shrink-0 place-items-center rounded-lg bg-indigo-50 text-indigo-700"><Clock3 className="size-4" /></span><div><h3 className="text-sm font-bold text-slate-900">Giờ yên lặng</h3><p className="mt-0.5 text-xs leading-5 text-slate-500">Tạm ẩn thông báo trong khung giờ đã chọn.</p></div></div>
              <button aria-checked={settings.quietHours.enabled} aria-label="Bật giờ yên lặng" className={`relative mt-1 h-5 w-9 shrink-0 rounded-full transition-colors ${settings.quietHours.enabled ? 'bg-violet-700' : 'bg-slate-200'}`} onClick={() => onChange({ ...settings, quietHours: { ...settings.quietHours, enabled: !settings.quietHours.enabled } })} role="switch" type="button"><span className={`absolute top-0.5 size-4 rounded-full bg-white shadow transition-transform ${settings.quietHours.enabled ? 'translate-x-[18px]' : 'translate-x-0.5'}`} /></button>
            </div>
            <div className={`mt-4 ${settings.quietHours.enabled ? '' : 'pointer-events-none opacity-40'}`}>
              <div className="grid grid-cols-2 gap-3">
                <label className="text-xs font-medium text-slate-600">Bắt đầu<input className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-800" onChange={(event) => onChange({ ...settings, quietHours: { ...settings.quietHours, start: event.target.value } })} type="time" value={settings.quietHours.start} /></label>
                <label className="text-xs font-medium text-slate-600">Kết thúc<input className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-800" onChange={(event) => onChange({ ...settings, quietHours: { ...settings.quietHours, end: event.target.value } })} type="time" value={settings.quietHours.end} /></label>
              </div>
              <p className="mt-4 text-xs font-medium text-slate-600">Lặp lại</p>
              <div className="mt-2 flex gap-2">{weekdays.map((day) => {
                const active = settings.quietHours.days.includes(day.id)
                return <button aria-pressed={active} className={`grid size-9 place-items-center rounded-full border text-[11px] font-semibold ${active ? 'border-violet-700 bg-violet-700 text-white' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`} key={day.id} onClick={() => onToggleDay(day.id)} type="button">{day.label}</button>
              })}</div>
            </div>
          </section>
          <p className="mt-4 text-xs leading-5 text-slate-400">Cảnh báo an toàn liên quan đến lượt gửi xe luôn được giữ ở trạng thái bật.</p>
        </div>
        <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 px-5 py-4 sm:px-6">
          <button className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100" onClick={onReset} type="button"><RotateCcw className="size-3.5" /> Khôi phục mặc định</button>
          <div className="flex gap-2"><button className="h-10 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50" onClick={onClose} type="button">Hủy</button><button className="h-10 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white hover:bg-slate-800" onClick={onSave} type="button">Lưu cài đặt</button></div>
        </footer>
      </aside>
    </div>
  )
}
