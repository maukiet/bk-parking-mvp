import { useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  ArrowRight,
  CalendarDays,
  CarFront,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Download,
  FileClock,
  Info,
  List,
  PackageCheck,
  Search,
  X,
} from 'lucide-react'
import { ApiError } from '../../../shared/api/apiClient'
import { useAuth } from '../../../shared/auth/AuthContext'
import { PageHeader } from '../../../shared/components/PageHeader'
import type { ParkingSessionDto, UserPackageDto } from '../../../types/api'
import { getPackagesOverview } from '../packagesApi'
import { getMySessionHistory } from '../activityApi'

type ActivityCategory = 'sessions' | 'packages' | 'bookings' | 'all'
type DateRange = 'today' | '7days' | '30days' | 'all' | 'custom'
type ViewMode = 'list' | 'calendar'
type ActivityDetail =
  | { kind: 'session'; item: ParkingSessionDto }
  | { kind: 'package'; item: UserPackageDto }
type TimelineEntry =
  | { kind: 'session'; id: string; date: string | null; item: ParkingSessionDto }
  | { kind: 'package'; id: string; date: string; item: UserPackageDto }

const categories: { id: ActivityCategory; label: string }[] = [
  { id: 'sessions', label: 'Ra / Vào' },
  { id: 'packages', label: 'Gói & phí' },
  { id: 'bookings', label: 'Đặt chỗ trước' },
  { id: 'all', label: 'Tất cả hoạt động' },
]

const dateRanges: { id: DateRange; label: string }[] = [
  { id: 'today', label: 'Hôm nay' },
  { id: '7days', label: '7 ngày qua' },
  { id: '30days', label: '30 ngày' },
  { id: 'all', label: 'Tất cả' },
  { id: 'custom', label: 'Tùy chọn ngày' },
]

const weekdays = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']

function parseDate(value: string | null | undefined) {
  if (!value) return null
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function dateKey(value: Date) {
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, '0')
  const day = String(value.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatDate(value: string | null | undefined) {
  const date = parseDate(value)
  return date
    ? new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date)
    : 'Chưa ghi nhận'
}

function formatTime(value: string | null | undefined) {
  const date = parseDate(value)
  return date
    ? new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit' }).format(date)
    : '—'
}

function formatDateTime(value: string | null | undefined) {
  const date = parseDate(value)
  return date
    ? new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }).format(date)
    : 'Chưa ghi nhận'
}

function formatDuration(session: ParkingSessionDto) {
  const start = parseDate(session.checkinTime)
  const end = parseDate(session.checkoutTime) ?? (session.status === 'ACTIVE' ? new Date() : null)
  if (!start || !end) return 'Chưa ghi nhận'
  const minutes = Math.max(0, Math.floor((end.getTime() - start.getTime()) / 60_000))
  const hours = Math.floor(minutes / 60)
  const remainder = minutes % 60
  if (!hours) return `${remainder} phút`
  return remainder ? `${hours} giờ ${remainder} phút` : `${hours} giờ`
}

function vehicleLabel(value: string) {
  const labels: Record<string, string> = {
    MOTORBIKE: 'Xe máy',
    ELECTRIC_BIKE: 'Xe điện',
    BICYCLE: 'Xe đạp',
    CAR: 'Ô tô',
  }
  return labels[value] ?? value.replaceAll('_', ' ')
}

function sessionStatusLabel(status: string) {
  if (status === 'ACTIVE') return 'Đang trong bãi'
  if (status === 'COMPLETED') return 'Hoàn tất'
  return status.replaceAll('_', ' ')
}

function statusClasses(status: string) {
  if (status === 'ACTIVE') return 'border-lime-300 bg-black text-lime-300'
  if (status === 'COMPLETED') return 'border-slate-300 bg-slate-50 text-slate-700'
  return 'border-amber-300 bg-amber-50 text-amber-900'
}

function sessionDate(value: string | null) {
  const date = parseDate(value)
  return date ? dateKey(date) : 'unknown'
}

function dateGroupLabel(key: string) {
  if (key === 'unknown') return 'Chưa ghi nhận ngày'
  const today = dateKey(new Date())
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  if (key === today) return 'Hôm nay'
  if (key === dateKey(yesterday)) return 'Hôm qua'
  return formatDate(`${key}T12:00:00`)
}

function matchesDateRange(value: string | null, range: DateRange, customStart: string, customEnd: string) {
  if (range === 'all') return true
  const date = parseDate(value)
  if (!date) return false
  const key = dateKey(date)
  if (range === 'custom') {
    return (!customStart || key >= customStart) && (!customEnd || key <= customEnd)
  }
  const today = new Date()
  const todayKey = dateKey(today)
  if (range === 'today') return key === todayKey
  const days = range === '7days' ? 7 : 30
  const lowerBound = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  lowerBound.setDate(lowerBound.getDate() - days + 1)
  return key >= dateKey(lowerBound) && key <= todayKey
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Không tải được lịch sử. Vui lòng thử lại.'
}

function MetricCard({ label, value, detail, icon: MetricIcon, accent = 'normal' }: {
  label: string
  value: string | number
  detail: string
  icon: typeof CarFront
  accent?: 'normal' | 'warning'
}) {
  return (
    <article className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-950/[0.02] sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-500">{label}</p>
        <span className={`grid size-8 shrink-0 place-items-center rounded-full ${accent === 'warning' ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-600'}`}>
          <MetricIcon aria-hidden="true" className="size-4" />
        </span>
      </div>
      <p className={`mt-3 truncate text-xl font-bold tracking-tight sm:text-2xl ${accent === 'warning' ? 'text-red-600' : 'text-slate-950'}`}>{value}</p>
      <p className="mt-1 min-h-8 text-xs leading-4 text-slate-500">{detail}</p>
    </article>
  )
}

function EmptyState({ title, description, icon: EmptyIcon = FileClock }: {
  title: string
  description: string
  icon?: typeof FileClock
}) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-12 text-center">
      <span className="mx-auto grid size-12 place-items-center rounded-full bg-slate-100 text-slate-500">
        <EmptyIcon aria-hidden="true" className="size-6" />
      </span>
      <h2 className="mt-4 font-semibold text-slate-900">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">{description}</p>
    </div>
  )
}

function SessionRow({ item, onDetails }: { item: ParkingSessionDto; onDetails: () => void }) {
  const isActive = item.status === 'ACTIVE'
  return (
    <article className={`overflow-hidden rounded-2xl border bg-white shadow-sm shadow-slate-950/[0.02] ${isActive ? 'border-lime-300' : 'border-slate-200'}`}>
      <div className={`border-l-4 p-4 sm:p-5 ${isActive ? 'border-lime-400' : 'border-transparent'}`}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          <div className="flex min-w-0 flex-1 items-start gap-3">
            <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-slate-50 text-slate-700">
              <CarFront aria-hidden="true" className="size-6" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <h3 className="font-mono text-base font-bold tracking-wide text-slate-950">{item.licensePlate}</h3>
                <span className="text-xs text-slate-500">{vehicleLabel(item.vehicleType)}</span>
              </div>
              <p className="mt-1 truncate text-xs font-medium text-slate-600">
                {item.parkingLotName}{item.parkingLotCode ? ` (${item.parkingLotCode})` : ''}
              </p>
              <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-600">
                <span>{formatTime(item.checkinTime)}{item.entryGate ? ` · ${item.entryGate}` : ''}</span>
                <ArrowRight aria-hidden="true" className="size-3.5" />
                {item.status === 'ACTIVE' ? (
                  <span className="font-semibold text-lime-700">Đang gửi xe</span>
                ) : item.checkoutTime ? (
                  <span>{formatTime(item.checkoutTime)}{item.exitGate ? ` · ${item.exitGate}` : ''}</span>
                ) : (
                  <span className="text-slate-500">Chưa ghi nhận giờ ra</span>
                )}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 border-t border-slate-100 pt-3 text-xs sm:grid-cols-3 lg:w-[390px] lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Thời lượng</p>
              <p className="mt-1 font-semibold text-slate-900">{formatDuration(item)}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Trạng thái</p>
              <span className={`mt-1 inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold ${statusClasses(item.status)}`}>{sessionStatusLabel(item.status)}</span>
            </div>
            <div className="col-span-2 flex items-end justify-between gap-2 sm:col-span-1 sm:flex-col sm:items-start sm:justify-center">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Mã lượt #{item.sessionId}</p>
              <button className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-200" onClick={onDetails} type="button">Chi tiết</button>
            </div>
          </div>
        </div>
      </div>
    </article>
  )
}

function PackageActivityRow({ item, onDetails }: { item: UserPackageDto; onDetails: () => void }) {
  return (
    <article className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-950/[0.02] sm:flex-row sm:items-center sm:justify-between sm:p-5">
      <div className="flex min-w-0 items-start gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-slate-50 text-slate-700"><PackageCheck aria-hidden="true" className="size-5" /></span>
        <div className="min-w-0">
          <h3 className="truncate font-semibold text-slate-950">{item.packageName} · {vehicleLabel(item.vehicleType)}</h3>
          <p className="mt-1 text-xs leading-5 text-slate-500">{item.packageCode} · Bắt đầu {formatDate(item.startDate)} · Kết thúc {formatDate(item.endDate)}</p>
        </div>
      </div>
      <div className="flex items-center justify-between gap-3 sm:justify-end">
        <span className={`rounded-full border px-3 py-1 text-[11px] font-semibold ${item.status === 'ACTIVE' ? 'border-lime-200 bg-lime-50 text-lime-900' : 'border-slate-200 bg-slate-100 text-slate-600'}`}>{item.status === 'ACTIVE' ? 'Đang hiệu lực' : item.status.replaceAll('_', ' ')}</span>
        <button className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-200" onClick={onDetails} type="button">Chi tiết</button>
      </div>
    </article>
  )
}

function ActivityDetailModal({ detail, onClose }: { detail: ActivityDetail; onClose: () => void }) {
  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [onClose])

  const isSession = detail.kind === 'session'
  const title = isSession ? `Lượt gửi xe · ${detail.item.licensePlate}` : `Gói · ${detail.item.packageName}`

  return (
    <div className="fixed inset-0 z-50 grid overflow-y-auto bg-slate-950/45 p-4 sm:place-items-center" onClick={onClose} role="presentation">
      <section aria-labelledby="activity-detail-title" aria-modal="true" className="my-auto w-full max-w-xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-950/20" onClick={(event) => event.stopPropagation()} role="dialog">
        <header className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4 sm:px-6">
          <div>
            <p className="text-xs font-medium text-slate-500">{isSession ? `Mã lượt #${detail.item.sessionId}` : detail.item.packageCode}</p>
            <h2 className="mt-1 text-lg font-bold text-slate-950" id="activity-detail-title">{title}</h2>
          </div>
          <button aria-label="Đóng chi tiết" className="grid size-9 shrink-0 place-items-center rounded-full text-slate-500 hover:bg-slate-100" onClick={onClose} type="button"><X aria-hidden="true" className="size-4" /></button>
        </header>
        {isSession ? (
          <div className="grid gap-3 p-5 sm:grid-cols-2 sm:p-6">
            <DetailValue label="Phương tiện" value={`${detail.item.licensePlate} · ${vehicleLabel(detail.item.vehicleType)}`} />
            <DetailValue label="Trạng thái lượt" value={sessionStatusLabel(detail.item.status)} />
            <DetailValue label="Bãi đỗ" value={`${detail.item.parkingLotName}${detail.item.parkingLotCode ? ` (${detail.item.parkingLotCode})` : ''}`} />
            <DetailValue label="Thời lượng" value={formatDuration(detail.item)} />
            <DetailValue label="Vào bãi" value={`${formatDateTime(detail.item.checkinTime)}${detail.item.entryGate ? ` · ${detail.item.entryGate}` : ''}`} />
            <DetailValue label="Ra bãi" value={`${formatDateTime(detail.item.checkoutTime)}${detail.item.exitGate ? ` · ${detail.item.exitGate}` : ''}`} />
            {detail.item.note ? <div className="sm:col-span-2"><DetailValue label="Ghi chú" value={detail.item.note} /></div> : null}
          </div>
        ) : (
          <div className="grid gap-3 p-5 sm:grid-cols-2 sm:p-6">
            <DetailValue label="Mã gói" value={detail.item.packageCode} />
            <DetailValue label="Loại phương tiện" value={vehicleLabel(detail.item.vehicleType)} />
            <DetailValue label="Mức phí gói" value={new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(detail.item.price)} />
            <DetailValue label="Trạng thái gói" value={detail.item.status === 'ACTIVE' ? 'Đang hiệu lực' : detail.item.status.replaceAll('_', ' ')} />
            <DetailValue label="Bắt đầu" value={formatDate(detail.item.startDate)} />
            <DetailValue label="Kết thúc" value={formatDate(detail.item.endDate)} />
          </div>
        )}
      </section>
    </div>
  )
}

function DetailValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-50 p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 break-words text-sm font-semibold leading-5 text-slate-900">{value}</p>
    </div>
  )
}

function SessionCalendar({ sessions, month, selectedDay, onMonthChange, onSelectDay, onDetails }: {
  sessions: ParkingSessionDto[]
  month: Date
  selectedDay: string
  onMonthChange: (delta: number) => void
  onSelectDay: (day: string) => void
  onDetails: (item: ParkingSessionDto) => void
}) {
  const year = month.getFullYear()
  const monthIndex = month.getMonth()
  const firstDayOffset = (new Date(year, monthIndex, 1).getDay() + 6) % 7
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate()
  const byDay = useMemo(() => {
    const grouped = new Map<string, ParkingSessionDto[]>()
    sessions.forEach((session) => {
      if (!session.checkinTime) return
      const key = sessionDate(session.checkinTime)
      grouped.set(key, [...(grouped.get(key) ?? []), session])
    })
    return grouped
  }, [sessions])
  const cells: (number | null)[] = [
    ...Array.from({ length: firstDayOffset }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ]
  const selectedSessions = byDay.get(selectedDay) ?? []

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)]">
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-950/[0.02] sm:p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="font-bold text-slate-950">{new Intl.DateTimeFormat('vi-VN', { month: 'long', year: 'numeric' }).format(month)}</h2>
          <div className="flex gap-1">
            <button aria-label="Tháng trước" className="grid size-9 place-items-center rounded-lg hover:bg-slate-100" onClick={() => onMonthChange(-1)} type="button"><ChevronLeft aria-hidden="true" className="size-4" /></button>
            <button aria-label="Tháng sau" className="grid size-9 place-items-center rounded-lg hover:bg-slate-100" onClick={() => onMonthChange(1)} type="button"><ChevronRight aria-hidden="true" className="size-4" /></button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center">
          {weekdays.map((day) => <span className="py-2 text-[10px] font-semibold uppercase text-slate-400" key={day}>{day}</span>)}
          {cells.map((day, index) => {
            if (!day) return <span aria-hidden="true" className="min-h-14 rounded-xl" key={`blank-${index}`} />
            const key = dateKey(new Date(year, monthIndex, day))
            const count = byDay.get(key)?.length ?? 0
            return (
              <button aria-pressed={selectedDay === key} className={`min-h-14 rounded-xl border p-1 text-sm transition-colors ${selectedDay === key ? 'border-black bg-black text-white' : 'border-transparent hover:border-slate-200 hover:bg-slate-50'}`} key={key} onClick={() => onSelectDay(key)} type="button">
                <span>{day}</span>
                {count ? <span className={`mx-auto mt-1 block w-fit rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${selectedDay === key ? 'bg-lime-300 text-black' : 'bg-lime-100 text-lime-900'}`}>{count}</span> : null}
              </button>
            )
          })}
        </div>
      </section>
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-950/[0.02] sm:p-5">
        <h2 className="font-bold text-slate-950">{dateGroupLabel(selectedDay)}</h2>
        <p className="mt-1 text-xs text-slate-500">{selectedSessions.length} lượt gửi xe</p>
        <div className="mt-4 space-y-3">
          {selectedSessions.length ? selectedSessions.map((session) => (
            <button className="flex w-full items-center justify-between gap-3 rounded-xl bg-slate-50 p-3 text-left hover:bg-slate-100" key={session.sessionId} onClick={() => onDetails(session)} type="button">
              <span className="min-w-0"><span className="block truncate font-mono text-sm font-bold text-slate-950">{session.licensePlate}</span><span className="mt-1 block truncate text-xs text-slate-500">{session.parkingLotName}</span></span>
              <span className="shrink-0 text-xs font-semibold text-slate-700">{formatTime(session.checkinTime)}</span>
            </button>
          )) : <p className="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">Không có lượt gửi xe trong ngày này.</p>}
        </div>
      </section>
    </div>
  )
}

function groupSessions(sessions: ParkingSessionDto[]) {
  const grouped = new Map<string, ParkingSessionDto[]>()
  sessions.forEach((session) => {
    const key = sessionDate(session.checkinTime)
    grouped.set(key, [...(grouped.get(key) ?? []), session])
  })
  return [...grouped.entries()].sort(([left], [right]) => right.localeCompare(left))
}

function dateFilterControls(range: DateRange, setRange: (range: DateRange) => void, start: string, setStart: (value: string) => void, end: string, setEnd: (value: string) => void) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {dateRanges.map(({ id, label }) => (
          <button aria-pressed={range === id} className={`rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${range === id ? 'bg-slate-950 text-white' : 'text-slate-600 hover:bg-slate-100'}`} key={id} onClick={() => setRange(id)} type="button">{label}</button>
        ))}
      </div>
      {range === 'custom' ? (
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 text-xs text-slate-500">Từ <input aria-label="Từ ngày" className="h-9 rounded-lg border border-slate-200 px-2 text-sm text-slate-800" onChange={(event) => setStart(event.target.value)} type="date" value={start} /></label>
          <label className="flex items-center gap-2 text-xs text-slate-500">Đến <input aria-label="Đến ngày" className="h-9 rounded-lg border border-slate-200 px-2 text-sm text-slate-800" onChange={(event) => setEnd(event.target.value)} type="date" value={end} /></label>
        </div>
      ) : null}
    </div>
  )
}

function csvCell(value: string | number | null | undefined) {
  return `"${String(value ?? '').replaceAll('"', '""')}"`
}

function downloadCsv(filename: string, rows: (string | number | null | undefined)[][]) {
  const content = `\uFEFF${rows.map((row) => row.map(csvCell).join(',')).join('\r\n')}`
  const url = URL.createObjectURL(new Blob([content], { type: 'text/csv;charset=utf-8' }))
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

function AccessNotice({ title, message }: { title: string; message: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center shadow-sm shadow-slate-950/[0.02]">
      <span className="mx-auto grid size-12 place-items-center rounded-full bg-slate-100 text-slate-600"><FileClock aria-hidden="true" className="size-6" /></span>
      <h1 className="mt-4 text-xl font-bold text-slate-950">{title}</h1>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">{message}</p>
    </div>
  )
}

export function UserActivityPage() {
  const { user, isLoading: isAuthLoading } = useAuth()
  const [sessions, setSessions] = useState<ParkingSessionDto[]>([])
  const [subscriptions, setSubscriptions] = useState<UserPackageDto[]>([])
  const [sessionsLoading, setSessionsLoading] = useState(true)
  const [packagesLoading, setPackagesLoading] = useState(true)
  const [sessionsError, setSessionsError] = useState('')
  const [packagesError, setPackagesError] = useState('')
  const [reload, setReload] = useState(0)
  const [category, setCategory] = useState<ActivityCategory>('sessions')
  const [range, setRange] = useState<DateRange>('30days')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const [search, setSearch] = useState('')
  const [vehicleId, setVehicleId] = useState('ALL')
  const [parkingLotId, setParkingLotId] = useState('ALL')
  const [status, setStatus] = useState('ALL')
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [calendarMonth, setCalendarMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1))
  const [selectedDay, setSelectedDay] = useState(() => dateKey(new Date()))
  const [detail, setDetail] = useState<ActivityDetail | null>(null)

  useEffect(() => {
    if (isAuthLoading || !user || user.role !== 'ROLE_USER') return
    let mounted = true
    setSessionsLoading(true)
    setPackagesLoading(true)
    setSessionsError('')
    setPackagesError('')

    getMySessionHistory()
      .then((result) => { if (mounted) setSessions(result ?? []) })
      .catch((error: unknown) => { if (mounted) setSessionsError(errorMessage(error)) })
      .finally(() => { if (mounted) setSessionsLoading(false) })

    getPackagesOverview()
      .then((result) => { if (mounted) setSubscriptions(result.mySubscriptions ?? []) })
      .catch((error: unknown) => {
        if (mounted) setPackagesError(error instanceof ApiError && error.status === 401
          ? 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'
          : errorMessage(error))
      })
      .finally(() => { if (mounted) setPackagesLoading(false) })

    return () => { mounted = false }
  }, [isAuthLoading, user, reload])

  const vehicles = useMemo(() => {
    const unique = new Map<number, ParkingSessionDto>()
    sessions.forEach((item) => unique.set(item.vehicleId, item))
    return [...unique.values()].sort((left, right) => left.licensePlate.localeCompare(right.licensePlate))
  }, [sessions])

  const parkingLots = useMemo(() => {
    const unique = new Map<number, ParkingSessionDto>()
    sessions.forEach((item) => unique.set(item.parkingLotId, item))
    return [...unique.values()].sort((left, right) => left.parkingLotName.localeCompare(right.parkingLotName))
  }, [sessions])

  const activeSessions = sessions.filter((item) => item.status === 'ACTIVE')
  const completedCount = sessions.filter((item) => item.status === 'COMPLETED').length
  const frequentHour = useMemo(() => {
    const counts = new Map<string, number>()
    sessions.forEach((item) => {
      const hour = parseDate(item.checkinTime)?.getHours()
      if (hour !== undefined) {
        const key = `${String(hour).padStart(2, '0')}:00`
        counts.set(key, (counts.get(key) ?? 0) + 1)
      }
    })
    return [...counts.entries()].sort((left, right) => right[1] - left[1])[0]?.[0] ?? '—'
  }, [sessions])

  const normalizedSearch = search.trim().toLocaleLowerCase('vi-VN')
  const visibleSessions = useMemo(() => [...sessions]
    .filter((item) => {
      if (!matchesDateRange(item.checkinTime, range, customStart, customEnd)) return false
      const text = `${item.licensePlate} ${item.vehicleType} ${item.parkingLotName} ${item.parkingLotCode} ${item.entryGate ?? ''} ${item.exitGate ?? ''} ${item.note ?? ''}`.toLocaleLowerCase('vi-VN')
      if (normalizedSearch && !text.includes(normalizedSearch)) return false
      if (category === 'sessions') {
        if (vehicleId !== 'ALL' && item.vehicleId !== Number(vehicleId)) return false
        if (parkingLotId !== 'ALL' && item.parkingLotId !== Number(parkingLotId)) return false
        if (status !== 'ALL' && item.status !== status) return false
      }
      return true
    })
    .sort((left, right) => (right.checkinTime ?? '').localeCompare(left.checkinTime ?? '')),
  [sessions, range, customStart, customEnd, normalizedSearch, category, vehicleId, parkingLotId, status])

  const visiblePackages = useMemo(() => [...subscriptions]
    .filter((item) => {
      const startAt = `${item.startDate}T12:00:00`
      if (!matchesDateRange(startAt, range, customStart, customEnd)) return false
      const text = `${item.packageCode} ${item.packageName} ${item.vehicleType} ${item.status}`.toLocaleLowerCase('vi-VN')
      return !normalizedSearch || text.includes(normalizedSearch)
    })
    .sort((left, right) => right.startDate.localeCompare(left.startDate)),
  [subscriptions, range, customStart, customEnd, normalizedSearch])

  const timelineEntries = useMemo(() => [
    ...visibleSessions.map((item): TimelineEntry => ({ kind: 'session', id: `session-${item.sessionId}`, date: item.checkinTime, item })),
    ...visiblePackages.map((item): TimelineEntry => ({ kind: 'package', id: `package-${item.id}`, date: `${item.startDate}T12:00:00`, item })),
  ].sort((left, right) => (right.date ?? '').localeCompare(left.date ?? '')),
  [visibleSessions, visiblePackages])

  const selectedDataError = category === 'sessions'
    ? sessionsError
    : category === 'packages'
      ? packagesError
      : category === 'all'
        ? [sessionsError, packagesError].filter(Boolean).join(' ')
        : ''
  const selectedDataLoading = category === 'sessions'
    ? sessionsLoading
    : category === 'packages'
      ? packagesLoading
      : category === 'all'
        ? sessionsLoading || packagesLoading
        : false

  const exportRows = useMemo<(string | number | null | undefined)[][]>(() => {
    if (category === 'packages') return [
      ['Mã gói', 'Tên gói', 'Loại phương tiện', 'Phí', 'Trạng thái', 'Ngày bắt đầu', 'Ngày kết thúc'],
      ...visiblePackages.map((item) => [item.packageCode, item.packageName, vehicleLabel(item.vehicleType), item.price, item.status, item.startDate, item.endDate]),
    ]
    const sessionRows = [
      ['Mã lượt', 'Biển số', 'Loại xe', 'Bãi đỗ', 'Cổng vào', 'Thời điểm vào', 'Cổng ra', 'Thời điểm ra', 'Trạng thái', 'Ghi chú'],
      ...visibleSessions.map((item) => [item.sessionId, item.licensePlate, vehicleLabel(item.vehicleType), item.parkingLotName, item.entryGate, item.checkinTime, item.exitGate, item.checkoutTime, item.status, item.note]),
    ]
    if (category === 'all') return [
      ['Loại hoạt động', 'Mã', 'Tên', 'Thời điểm', 'Trạng thái', 'Thông tin'],
      ...timelineEntries.map((entry) => entry.kind === 'session'
        ? ['Lượt gửi xe', entry.item.sessionId, entry.item.licensePlate, entry.item.checkinTime, entry.item.status, entry.item.parkingLotName]
        : ['Gói', entry.item.packageCode, entry.item.packageName, entry.item.startDate, entry.item.status, `${entry.item.startDate} – ${entry.item.endDate}`]),
    ]
    return sessionRows
  }, [category, visiblePackages, visibleSessions, timelineEntries])

  if (isAuthLoading) return <div className="h-72 animate-pulse rounded-2xl bg-slate-200" />
  if (!user) return <AccessNotice title="Đăng nhập để xem lịch sử hoạt động" message="Đăng nhập để xem các lượt gửi xe và gói đã được ghi nhận cho tài khoản." />
  if (user.role !== 'ROLE_USER') return <AccessNotice title="Trang dành cho tài khoản người dùng" message="Tài khoản hiện tại không có quyền xem lịch sử hoạt động cá nhân." />

  function clearFilters() {
    setRange('all')
    setCustomStart('')
    setCustomEnd('')
    setSearch('')
    setVehicleId('ALL')
    setParkingLotId('ALL')
    setStatus('ALL')
  }

  function exportCurrentHistory() {
    if (exportRows.length <= 1) return
    downloadCsv(`bk-parking-activity-${category}.csv`, exportRows)
  }

  const isLoading = selectedDataLoading
  const allCount = sessions.length + subscriptions.length

  return (
    <section aria-labelledby="page-title" className="space-y-6 sm:space-y-7">
      <PageHeader
        title="Lịch sử hoạt động"
        description="Xem lại các lượt gửi xe và gói đã được ghi nhận cho bạn."
        action={(
          <div className="flex flex-col gap-2 sm:flex-row">
            <label className="relative block w-full sm:w-64 lg:w-72">
              <span className="sr-only">Tìm trong lịch sử</span>
              <Search aria-hidden="true" className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <input className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-xs outline-none placeholder:text-slate-400 focus:border-slate-400" onChange={(event) => setSearch(event.target.value)} placeholder="Tìm biển số, bãi xe, mã gói..." type="search" value={search} />
            </label>
            <button className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-800 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50" disabled={exportRows.length <= 1} onClick={exportCurrentHistory} type="button">
              <Download aria-hidden="true" className="size-4" /> Xuất lịch sử
            </button>
          </div>
        )}
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Xe đang trong bãi" value={activeSessions[0]?.licensePlate ?? '—'} detail={activeSessions[0] ? `${activeSessions[0].parkingLotName} · ${activeSessions.length} lượt đang mở` : 'Không có lượt gửi xe đang mở'} icon={CarFront} />
        <MetricCard label="Số lượt gửi xe" value={sessions.length} detail="Tổng số lượt được hệ thống trả về" icon={FileClock} />
        <MetricCard label="Giờ vào phổ biến" value={frequentHour} detail="Khung giờ có nhiều lượt vào nhất trong dữ liệu" icon={Clock3} />
        <MetricCard label="Lượt đã hoàn tất" value={completedCount} detail="Lượt đã có trạng thái hoàn tất" icon={CheckCircle2} />
      </div>

      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div aria-label="Nhóm hoạt động" className="flex w-fit max-w-full overflow-x-auto rounded-xl border border-slate-200 bg-slate-100/80 p-1" role="tablist">
          {categories.map(({ id, label }) => {
            const disabled = id === 'bookings'
            const count = id === 'sessions' ? sessions.length : id === 'packages' ? subscriptions.length : id === 'all' ? allCount : null
            return (
              <button aria-disabled={disabled} aria-selected={category === id} className={`inline-flex min-h-9 shrink-0 items-center gap-2 rounded-lg px-3 text-xs font-semibold transition-colors ${disabled ? 'cursor-not-allowed text-slate-400' : category === id ? 'bg-slate-950 text-white shadow-sm' : 'text-slate-600 hover:bg-white hover:text-slate-950'}`} disabled={disabled} key={id} onClick={() => setCategory(id)} role="tab" title={disabled ? 'Chưa có dữ liệu đặt chỗ trong backend hiện tại' : undefined} type="button">
                {label}
                {count !== null ? <span className={`rounded-full px-1.5 py-0.5 text-[9px] ${category === id ? 'bg-lime-300 text-black' : 'bg-slate-200 text-slate-600'}`}>{String(count).padStart(2, '0')}</span> : <span className="rounded-full bg-slate-200 px-1.5 py-0.5 text-[9px] text-slate-500">—</span>}
              </button>
            )
          })}
        </div>
        {category === 'sessions' ? (
          <div aria-label="Kiểu hiển thị" className="flex w-fit rounded-xl border border-slate-200 bg-slate-100/80 p-1">
            <button aria-pressed={viewMode === 'list'} className={`inline-flex min-h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold ${viewMode === 'list' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`} onClick={() => setViewMode('list')} type="button"><List aria-hidden="true" className="size-3.5" />Danh sách</button>
            <button aria-pressed={viewMode === 'calendar'} className={`inline-flex min-h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold ${viewMode === 'calendar' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`} onClick={() => setViewMode('calendar')} type="button"><CalendarDays aria-hidden="true" className="size-3.5" />Lịch tháng</button>
          </div>
        ) : null}
      </div>

      <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-950/[0.02] sm:p-5">
        {dateFilterControls(range, setRange, customStart, setCustomStart, customEnd, setCustomEnd)}
        {category === 'sessions' ? (
          <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
            <label className="sr-only" htmlFor="activity-vehicle">Lọc theo phương tiện</label>
            <select className="h-9 max-w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-700" id="activity-vehicle" onChange={(event) => setVehicleId(event.target.value)} value={vehicleId}>
              <option value="ALL">Tất cả xe</option>
              {vehicles.map((item) => <option key={item.vehicleId} value={item.vehicleId}>{item.licensePlate} · {vehicleLabel(item.vehicleType)}</option>)}
            </select>
            <label className="sr-only" htmlFor="activity-lot">Lọc theo bãi đỗ</label>
            <select className="h-9 max-w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-700" id="activity-lot" onChange={(event) => setParkingLotId(event.target.value)} value={parkingLotId}>
              <option value="ALL">Tất cả bãi</option>
              {parkingLots.map((item) => <option key={item.parkingLotId} value={item.parkingLotId}>{item.parkingLotName}</option>)}
            </select>
            <label className="sr-only" htmlFor="activity-status">Lọc theo trạng thái</label>
            <select className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-700" id="activity-status" onChange={(event) => setStatus(event.target.value)} value={status}>
              <option value="ALL">Tất cả trạng thái</option>
              <option value="ACTIVE">Đang trong bãi</option>
              <option value="COMPLETED">Hoàn tất</option>
            </select>
            <button className="ml-auto inline-flex min-h-9 items-center gap-1 rounded-lg px-2 text-xs font-medium text-slate-500 underline hover:text-slate-900" onClick={clearFilters} type="button">Xóa bộ lọc</button>
          </div>
        ) : (
          <div className="flex justify-end border-t border-slate-100 pt-3">
            <button className="inline-flex min-h-9 items-center gap-1 rounded-lg px-2 text-xs font-medium text-slate-500 underline hover:text-slate-900" onClick={clearFilters} type="button">Xóa bộ lọc</button>
          </div>
        )}
      </section>

      {selectedDataError ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800" role="alert">
          <span>{selectedDataError}</span>
          <button className="font-semibold underline" onClick={() => setReload((value) => value + 1)} type="button">Thử tải lại</button>
        </div>
      ) : null}

      {isLoading ? (
        <div className="space-y-3"><div className="h-20 animate-pulse rounded-2xl bg-slate-200" /><div className="h-20 animate-pulse rounded-2xl bg-slate-200" /></div>
      ) : category === 'bookings' ? (
        <EmptyState title="Chưa có dữ liệu đặt chỗ" description="Backend hiện chưa cung cấp lịch sử đặt chỗ cho trang này." icon={AlertCircle} />
      ) : category === 'sessions' && viewMode === 'calendar' ? (
        visibleSessions.length ? (
          <SessionCalendar sessions={visibleSessions} month={calendarMonth} selectedDay={selectedDay} onMonthChange={(delta) => setCalendarMonth((value) => new Date(value.getFullYear(), value.getMonth() + delta, 1))} onSelectDay={setSelectedDay} onDetails={(item) => setDetail({ kind: 'session', item })} />
        ) : <EmptyState title="Không có lượt gửi xe phù hợp" description="Thử đổi khoảng ngày hoặc xóa một số bộ lọc." />
      ) : category === 'sessions' ? (
        visibleSessions.length ? (
          <div className="space-y-5">
            {groupSessions(visibleSessions).map(([day, items]) => (
              <section className="space-y-3" key={day}>
                <div className="flex flex-wrap items-center gap-2 px-1">
                  <span className="rounded-full bg-black px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-lime-300">{dateGroupLabel(day)}</span>
                  <span className="text-xs text-slate-500">{day === 'unknown' ? '' : formatDate(`${day}T12:00:00`)}</span>
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-600">{items.length} lượt</span>
                </div>
                <div className="space-y-3">{items.map((item) => <SessionRow item={item} key={item.sessionId} onDetails={() => setDetail({ kind: 'session', item })} />)}</div>
              </section>
            ))}
          </div>
        ) : <EmptyState title="Không có lượt gửi xe phù hợp" description="Thử đổi khoảng ngày hoặc xóa một số bộ lọc." />
      ) : category === 'packages' ? (
        packagesError ? null : visiblePackages.length ? (
          <div className="space-y-3">{visiblePackages.map((item) => <PackageActivityRow item={item} key={item.id} onDetails={() => setDetail({ kind: 'package', item })} />)}</div>
        ) : <EmptyState title="Chưa có gói trong khoảng thời gian này" description="Thử đổi khoảng ngày hoặc kiểm tra lại bộ lọc tìm kiếm." icon={PackageCheck} />
      ) : (
        timelineEntries.length ? (
          <div className="space-y-3">
            {timelineEntries.map((entry) => entry.kind === 'session'
              ? <SessionRow item={entry.item} key={entry.id} onDetails={() => setDetail({ kind: 'session', item: entry.item })} />
              : <PackageActivityRow item={entry.item} key={entry.id} onDetails={() => setDetail({ kind: 'package', item: entry.item })} />)}
          </div>
        ) : selectedDataError ? null : <EmptyState title="Không có hoạt động phù hợp" description="Thử đổi khoảng ngày hoặc xóa bộ lọc tìm kiếm." />
      )}

      {!isLoading && !selectedDataError && category !== 'bookings' ? (
        <div className="flex flex-wrap items-center justify-between gap-3 px-1 text-xs text-slate-500">
          <span>Hiển thị {category === 'sessions' ? visibleSessions.length : category === 'packages' ? visiblePackages.length : timelineEntries.length} bản ghi phù hợp</span>
          {category === 'sessions' ? <span>{activeSessions.length} lượt đang mở · {completedCount} lượt hoàn tất</span> : category === 'packages' ? <span>{subscriptions.length} gói được ghi nhận</span> : <span>{sessions.length} lượt gửi xe · {subscriptions.length} gói</span>}
        </div>
      ) : null}

      <details className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-950/[0.02]">
        <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-4 sm:px-5">
          <span className="grid size-8 place-items-center rounded-full bg-emerald-50 text-emerald-700"><Info aria-hidden="true" className="size-4" /></span>
          <span className="flex-1 text-sm font-semibold text-slate-900">Cách đọc trạng thái lịch sử</span>
          <ChevronRight aria-hidden="true" className="size-4 rotate-90 text-slate-400" />
        </summary>
        <div className="space-y-2 border-t border-slate-100 px-5 py-4 text-xs leading-5 text-slate-600">
          <p><strong className="text-slate-900">Đang trong bãi:</strong> lượt xe chưa có thời điểm ra.</p>
          <p><strong className="text-slate-900">Hoàn tất:</strong> lượt xe đã có thời điểm ra được hệ thống ghi nhận.</p>
          <p>Lịch sử gói hiển thị trạng thái và thời hạn gói; trang này không suy diễn trạng thái thanh toán từ trạng thái lượt gửi xe.</p>
        </div>
      </details>

      {detail ? <ActivityDetailModal detail={detail} onClose={() => setDetail(null)} /> : null}
    </section>
  )
}
