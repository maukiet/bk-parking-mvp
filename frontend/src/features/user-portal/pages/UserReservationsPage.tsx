import { useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { Link } from 'react-router'
import { useAuth } from '../../../shared/auth/AuthContext'
import { Icon } from '../../../shared/components/Icon'
import { PageHeader } from '../../../shared/components/PageHeader'
import {
  createMockParkingLots,
  createMockReservations,
  localDateInputValue,
  mockReservationPolicy,
  mockVehicles,
  type MockParkingLot,
  type MockReservation,
  type ReservationStatus,
} from '../reservations/mockReservations'

type ReservationFilter = 'ALL' | 'UPCOMING' | 'COMPLETED' | 'CLOSED'

const statusLabels: Record<ReservationStatus, string> = {
  HELD: 'Đang giữ chỗ',
  COMPLETED: 'Đã hoàn thành',
  NO_SHOW: 'Đã vắng mặt',
  CANCELED: 'Đã hủy',
}

const statusStyles: Record<ReservationStatus, string> = {
  HELD: 'border-slate-300 bg-white text-slate-700',
  COMPLETED: 'border-slate-400 bg-white text-slate-900',
  NO_SHOW: 'border-red-300 bg-red-50 text-red-700',
  CANCELED: 'border-slate-200 bg-slate-100 text-slate-500',
}

const filterOptions: [ReservationFilter, string][] = [
  ['ALL', 'Tất cả'],
  ['UPCOMING', 'Sắp tới'],
  ['COMPLETED', 'Đã hoàn thành'],
  ['CLOSED', 'Đã hủy / Vắng mặt'],
]

function formatDateTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Chưa có thông tin'
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function formatTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '--:--'
  return new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function getDateLabel(value: string) {
  const date = new Date(value)
  const today = new Date()
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  if (date.toDateString() === today.toDateString()) return 'Hôm nay'
  if (date.toDateString() === tomorrow.toDateString()) return 'Ngày mai'
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium' }).format(date)
}

function MetricCard({ title, value, detail, badge, progress, accent = 'lime' }: {
  title: string
  value: string
  detail: string
  badge: string
  progress: number
  accent?: 'lime' | 'red' | 'black'
}) {
  const progressColor = accent === 'red' ? 'bg-red-500' : accent === 'black' ? 'bg-black' : 'bg-lime-400'
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-950/[0.02] sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{title}</h2>
        <span className="shrink-0 rounded-full border border-slate-200 px-2 py-1 text-[9px] font-bold uppercase text-slate-600">{badge}</span>
      </div>
      <p className="mt-2 text-2xl font-bold tracking-tight text-slate-950">{value}</p>
      <p className="mt-0.5 text-xs text-slate-500">{detail}</p>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full ${progressColor}`} style={{ width: `${Math.min(100, Math.max(0, progress))}%` }} />
      </div>
    </article>
  )
}

function StatusPill({ status }: { status: ReservationStatus }) {
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusStyles[status]}`}>{statusLabels[status]}</span>
}

function Modal({ title, description, onClose, children, footer }: {
  title: string
  description?: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
}) {
  return (
    <div className="fixed inset-0 z-50 grid overflow-y-auto bg-slate-950/45 p-4 sm:place-items-center" onClick={onClose} role="presentation">
      <section
        aria-labelledby="reservation-modal-title"
        aria-modal="true"
        className="my-auto w-full max-w-xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-950/20"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
      >
        <header className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4 sm:px-6">
          <div>
            <h2 className="text-lg font-bold text-slate-950" id="reservation-modal-title">{title}</h2>
            {description ? <p className="mt-1 text-sm leading-5 text-slate-500">{description}</p> : null}
          </div>
          <button aria-label="Đóng" className="grid size-9 shrink-0 place-items-center rounded-full text-slate-500 hover:bg-slate-100" onClick={onClose} type="button">
            <Icon name="close" className="size-4" />
          </button>
        </header>
        <div className="p-5 sm:p-6">{children}</div>
        {footer ? <footer className="flex flex-col-reverse gap-2 border-t border-slate-100 bg-slate-50/70 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">{footer}</footer> : null}
      </section>
    </div>
  )
}

export function UserReservationsPage() {
  const { user } = useAuth()
  const [parkingLots, setParkingLots] = useState<MockParkingLot[]>(createMockParkingLots)
  const [reservations, setReservations] = useState<MockReservation[]>(createMockReservations)
  const [isAccessLocked, setIsAccessLocked] = useState(false)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [detailReservation, setDetailReservation] = useState<MockReservation | null>(null)
  const [cancelReservation, setCancelReservation] = useState<MockReservation | null>(null)
  const [filter, setFilter] = useState<ReservationFilter>('ALL')
  const [search, setSearch] = useState('')
  const [selectedLotId, setSelectedLotId] = useState('lot-e')
  const [selectedVehicleId, setSelectedVehicleId] = useState(mockVehicles[0].id)
  const [bookingDate, setBookingDate] = useState(() => localDateInputValue(1))
  const [bookingTime, setBookingTime] = useState('08:00')
  const [formError, setFormError] = useState('')
  const [notice, setNotice] = useState('')

  const primaryLot = parkingLots.find((lot) => lot.id === 'lot-e') ?? parkingLots[0]
  const upcomingReservation = reservations
    .filter((reservation) => reservation.status === 'HELD')
    .sort((left, right) => left.appointmentAt.localeCompare(right.appointmentAt))[0]
  const noShowCount = isAccessLocked ? mockReservationPolicy.noShowLimit : mockReservationPolicy.noShowCount
  const displayedReservations = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase('vi-VN')
    return [...reservations]
      .filter((reservation) => {
        if (filter === 'UPCOMING' && reservation.status !== 'HELD') return false
        if (filter === 'COMPLETED' && reservation.status !== 'COMPLETED') return false
        if (filter === 'CLOSED' && reservation.status !== 'CANCELED' && reservation.status !== 'NO_SHOW') return false
        if (!normalizedSearch) return true
        const lot = parkingLots.find((item) => item.id === reservation.parkingLotId)
        const vehicle = mockVehicles.find((item) => item.id === reservation.vehicleId)
        return `${reservation.id} ${lot?.name ?? ''} ${vehicle?.licensePlate ?? ''} ${vehicle?.name ?? ''}`
          .toLocaleLowerCase('vi-VN')
          .includes(normalizedSearch)
      })
      .sort((left, right) => right.appointmentAt.localeCompare(left.appointmentAt))
  }, [filter, parkingLots, reservations, search])

  function openNewReservation() {
    setNotice('')
    setFormError('')
    setIsFormOpen(true)
  }

  function createReservation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError('')
    const lot = parkingLots.find((item) => item.id === selectedLotId)
    if (isAccessLocked) {
      setFormError(`Quyền đặt chỗ đang khóa do đủ ${mockReservationPolicy.noShowLimit} lần vắng mặt. Thời gian khóa mô phỏng: ${mockReservationPolicy.lockDays} ngày.`)
      return
    }
    if (reservations.some((reservation) => reservation.status === 'HELD')) {
      setFormError('Bạn đang có một lượt giữ chỗ. Hãy hủy lượt hiện tại trước khi tạo lượt mới.')
      return
    }
    if (!lot || lot.status !== 'OPEN' || lot.availableSlots < 1) {
      setFormError('Bãi xe đã hết chỗ. Hãy chọn bãi còn chỗ để tiếp tục.')
      return
    }
    const appointment = new Date(`${bookingDate}T${bookingTime}:00`)
    if (Number.isNaN(appointment.getTime()) || appointment.getTime() < Date.now()) {
      setFormError('Giờ hẹn phải ở hiện tại hoặc trong tương lai.')
      return
    }

    const appointmentAt = appointment.toISOString()
    const holdUntil = new Date(appointment.getTime() + mockReservationPolicy.holdMinutes * 60_000).toISOString()
    const newReservation: MockReservation = {
      id: `DC-${localDateInputValue().replaceAll('-', '').slice(2)}-${String(Date.now()).slice(-4)}`,
      parkingLotId: lot.id,
      vehicleId: selectedVehicleId,
      appointmentAt,
      holdUntil,
      status: 'HELD',
      createdAt: new Date().toISOString(),
    }
    setReservations((current) => [newReservation, ...current])
    setParkingLots((current) => current.map((item) => item.id === lot.id
      ? { ...item, availableSlots: item.availableSlots - 1, reserved: item.reserved + 1, status: item.availableSlots <= 1 ? 'FULL' : item.status }
      : item))
    setNotice(`Đã tạo lượt đặt chỗ ${newReservation.id}. Dữ liệu chỉ được lưu tạm trong phiên này.`)
    setIsFormOpen(false)
  }

  function confirmCancel() {
    if (!cancelReservation) return
    const target = cancelReservation
    setReservations((current) => current.map((reservation) => reservation.id === target.id
      ? { ...reservation, status: 'CANCELED' }
      : reservation))
    if (target.status === 'HELD') {
      setParkingLots((current) => current.map((lot) => lot.id === target.parkingLotId
        ? { ...lot, availableSlots: lot.availableSlots + 1, reserved: Math.max(0, lot.reserved - 1), status: 'OPEN' }
        : lot))
    }
    setNotice(`Đã hủy lượt đặt chỗ ${target.id}. Thay đổi chỉ nằm trong dữ liệu mô phỏng.`)
    setCancelReservation(null)
    setDetailReservation(null)
  }

  const displayName = user?.fullName || mockReservationPolicy.mockUserName
  const occupancy = primaryLot ? Math.round(((primaryLot.occupied + primaryLot.reserved) / primaryLot.capacity) * 100) : 0

  return (
    <section aria-labelledby="page-title" className="space-y-6">
      <PageHeader
        title="Đặt chỗ trước ô tô"
        description="Giữ chỗ tại bãi dành cho giảng viên và cán bộ cơ sở chính."
        action={(
          <div className="flex flex-col items-start gap-1 sm:items-end">
          <button
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-black px-5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
            disabled={isAccessLocked || Boolean(upcomingReservation)}
            onClick={openNewReservation}
            type="button"
            title={isAccessLocked ? 'Quyền đặt chỗ đang bị khóa.' : upcomingReservation ? 'Hủy lượt đang giữ trước khi tạo lượt mới.' : undefined}
          >
            <Icon name="plus" className="size-4" /> Đặt chỗ mới
          </button>
            {upcomingReservation && !isAccessLocked ? <span className="text-[10px] text-slate-500">Hủy lượt đang giữ để đặt lượt tiếp theo.</span> : null}
          </div>
        )}
      />

      <div className="flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-3">
          <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full bg-amber-100 text-amber-800">M</span>
          <div>
            <p className="text-sm font-semibold text-amber-950">Dữ liệu mô phỏng</p>
            <p className="mt-0.5 text-xs leading-5 text-amber-900/80">Tài khoản: {displayName} · {mockReservationPolicy.mockUserRole}. Tạo/hủy chỗ chỉ đổi dữ liệu trên trang, chưa gửi lên backend.</p>
          </div>
        </div>
        <button
          aria-pressed={isAccessLocked}
          className={`inline-flex min-h-9 shrink-0 items-center justify-center rounded-full border px-3.5 text-xs font-semibold transition ${isAccessLocked ? 'border-red-300 bg-white text-red-700 hover:bg-red-50' : 'border-amber-300 bg-white text-amber-950 hover:bg-amber-100'}`}
          onClick={() => {
            setIsAccessLocked((locked) => !locked)
            setNotice('')
          }}
          type="button"
        >
          {isAccessLocked ? 'Khôi phục quyền mô phỏng' : 'Mô phỏng khóa quyền'}
        </button>
      </div>

      {isAccessLocked ? (
        <div className="flex gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-900" role="status">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-red-100 text-sm font-bold">!</span>
          <div>
            <p className="text-sm font-bold">Quyền đặt chỗ đang bị khóa</p>
            <p className="mt-1 text-sm leading-5 text-red-800">Tài khoản đã chạm ngưỡng {mockReservationPolicy.noShowLimit} lần vắng mặt. Theo dữ liệu mô phỏng, quyền đặt mới sẽ khóa trong {mockReservationPolicy.lockDays} ngày. Bạn vẫn có thể xem chi tiết và hủy lượt đang giữ.</p>
          </div>
        </div>
      ) : null}

      {notice ? <p className="rounded-xl border border-lime-200 bg-lime-50 px-4 py-3 text-sm text-lime-900" role="status">{notice}</p> : null}

      <div className="grid gap-3 sm:grid-cols-3">
        <MetricCard
          title="Chỗ có thể đặt hôm nay"
          value={`${primaryLot?.availableSlots ?? 0} / ${primaryLot?.dailyLimit ?? 0}`}
          detail="suất còn lại tại Bãi E"
          badge={primaryLot?.availableSlots ? 'Còn chỗ' : 'Hết chỗ'}
          progress={((primaryLot?.dailyLimit ?? 0) - (primaryLot?.availableSlots ?? 0)) / Math.max(1, primaryLot?.dailyLimit ?? 1) * 100}
        />
        <MetricCard
          title="Vắng mặt trong học kỳ"
          value={`${noShowCount}`}
          detail={`/ ${mockReservationPolicy.noShowLimit} lần tối đa`}
          badge={isAccessLocked ? 'Đã khóa' : `Mức ${noShowCount}/${mockReservationPolicy.noShowLimit}`}
          progress={noShowCount / mockReservationPolicy.noShowLimit * 100}
          accent={isAccessLocked || noShowCount >= 2 ? 'red' : 'black'}
        />
        <MetricCard
          title="Thời gian giữ chỗ"
          value={`${mockReservationPolicy.holdMinutes}`}
          detail="phút tính từ giờ hẹn"
          badge="Chuẩn hóa"
          progress={100}
          accent="black"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.7fr)_minmax(250px,0.9fr)]">
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-950/[0.02] sm:p-5" aria-labelledby="upcoming-title">
          {upcomingReservation ? (
            <>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusPill status="HELD" />
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Mã đặt chỗ:</span>
                    <code className="rounded bg-slate-100 px-2 py-1 text-[11px] font-bold text-slate-800">{upcomingReservation.id}</code>
                  </div>
                  <h2 className="mt-3 text-lg font-bold tracking-tight text-slate-950" id="upcoming-title">
                    {parkingLots.find((lot) => lot.id === upcomingReservation.parkingLotId)?.name ?? 'Bãi xe'}
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">{parkingLots.find((lot) => lot.id === upcomingReservation.parkingLotId)?.location}</p>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Thời gian hẹn</p>
                  <p className="mt-1 text-sm font-bold text-slate-950">{getDateLabel(upcomingReservation.appointmentAt)}, {formatTime(upcomingReservation.appointmentAt)}</p>
                </div>
              </div>
              <div className="mt-5 grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:grid-cols-[1fr_auto_1fr_auto_1fr] sm:items-center sm:p-4">
                <div className="flex items-center gap-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-black text-lime-300"><Icon name="vehicles" className="size-5" /></span>
                  <div className="min-w-0"><p className="text-[10px] text-slate-400">Phương tiện đã duyệt</p><p className="truncate text-xs font-semibold text-slate-900">{mockVehicles.find((vehicle) => vehicle.id === upcomingReservation.vehicleId)?.name}</p><code className="text-[10px] font-bold text-slate-700">{mockVehicles.find((vehicle) => vehicle.id === upcomingReservation.vehicleId)?.licensePlate}</code></div>
                </div>
                <span className="hidden h-8 w-px bg-slate-200 sm:block" />
                <div><p className="text-[10px] text-slate-400">Cơ chế đỗ</p><p className="mt-1 text-xs font-semibold">Tự do trong bãi E</p></div>
                <span className="hidden h-8 w-px bg-slate-200 sm:block" />
                <div><p className="text-[10px] text-slate-400">Biểu phí áp dụng</p><p className="mt-1 text-xs font-semibold">0 VNĐ <span className="font-normal text-slate-500">(Miễn phí)</span></p></div>
              </div>
              <div className="mt-3 flex flex-col gap-2 rounded-xl bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div><p className="text-xs font-semibold text-slate-800">Giữ chỗ đến {formatTime(upcomingReservation.holdUntil)} (chuẩn {mockReservationPolicy.holdMinutes} phút)</p><p className="mt-1 text-[11px] text-slate-500">Đến trễ quá thời gian giữ chỗ có thể bị ghi nhận vắng mặt.</p></div>
                <span className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold tabular-nums text-slate-800">{formatDateTime(upcomingReservation.holdUntil)}</span>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
                <button className="inline-flex min-h-9 items-center rounded-full bg-black px-4 text-xs font-semibold text-white hover:bg-slate-800" onClick={() => setDetailReservation(upcomingReservation)} type="button">Xem chi tiết</button>
                <button className="inline-flex min-h-9 items-center rounded-full px-3 text-xs font-semibold text-red-600 hover:bg-red-50" onClick={() => setCancelReservation(upcomingReservation)} type="button">Hủy chỗ</button>
                <span className="ml-auto text-[11px] text-slate-400">Tạo lúc {formatTime(upcomingReservation.createdAt)}</span>
              </div>
            </>
          ) : (
            <div className="flex min-h-52 flex-col items-center justify-center text-center">
              <span className="grid size-11 place-items-center rounded-full bg-slate-100 text-slate-500"><Icon name="reservation" className="size-5" /></span>
              <h2 className="mt-3 font-semibold">Bạn chưa có lượt đặt sắp tới</h2>
              <p className="mt-1 text-sm text-slate-500">Chọn bãi còn chỗ và tạo lượt hẹn mới.</p>
              <button className="mt-4 rounded-full bg-black px-4 py-2 text-xs font-semibold text-white disabled:opacity-50" disabled={isAccessLocked} onClick={openNewReservation} type="button">Đặt chỗ mới</button>
            </div>
          )}
        </section>

        <section className="flex flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-950/[0.02] sm:p-5" aria-labelledby="lot-status-title">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-bold text-slate-950" id="lot-status-title">Tình trạng Bãi E</h2>
            <span className="text-[10px] uppercase tracking-wide text-slate-400">{primaryLot?.capacity ?? 0} chỗ tổng</span>
          </div>
          <div className="mt-5 flex items-end justify-between gap-2"><span className="text-xs text-slate-500">Tỷ lệ lấp đầy</span><span className="text-3xl font-bold tracking-tight">{occupancy}%</span></div>
          <div className="mt-2 flex h-2.5 overflow-hidden rounded-full bg-slate-100">
            <span className="bg-black" style={{ width: `${(primaryLot?.occupied ?? 0) / Math.max(1, primaryLot?.capacity ?? 1) * 100}%` }} />
            <span className="bg-lime-400" style={{ width: `${(primaryLot?.reserved ?? 0) / Math.max(1, primaryLot?.capacity ?? 1) * 100}%` }} />
          </div>
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-slate-500">
            <span><i className="mr-1 inline-block size-2 rounded-full bg-black" />Đỗ: {primaryLot?.occupied ?? 0}</span>
            <span><i className="mr-1 inline-block size-2 rounded-full bg-lime-400" />Giữ: {primaryLot?.reserved ?? 0}</span>
            <span><i className="mr-1 inline-block size-2 rounded-full bg-slate-300" />Trống: {primaryLot?.availableSlots ?? 0}</span>
          </div>
          <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="flex items-center justify-between"><p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Suất trống theo khung giờ</p><span className="rounded bg-lime-300 px-1.5 py-0.5 text-[9px] font-bold">MOCK</span></div>
            <div className="mt-3 grid grid-cols-6 items-end gap-1.5">
              {[['07h', 45], ['08h', 100], ['09h', 94], ['10h', 48], ['11h', 67], ['14h', 88]].map(([label, value]) => (
                <div className="text-center" key={label}>
                  <div className="flex h-12 items-end"><span className={`w-full rounded-t ${Number(value) > 80 ? 'bg-black' : 'bg-slate-300'}`} style={{ height: `${value}%` }} /></div>
                  <span className={`mt-1 block text-[9px] ${Number(value) > 80 ? 'font-bold text-slate-900' : 'text-slate-400'}`}>{label}</span>
                </div>
              ))}
            </div>
          </div>
          <p className="mt-auto pt-4 text-[11px] leading-5 text-slate-500">Bãi E còn <strong className="text-slate-900">{primaryLot?.availableSlots ?? 0} suất</strong> đặt trước hôm nay. Số liệu sức chứa đang được mô phỏng.</p>
        </section>
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-950/[0.02]" aria-labelledby="reservation-list-title">
        <div className="border-b border-slate-100 p-4 sm:p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div><h2 className="font-bold text-slate-950" id="reservation-list-title">Lịch sử & Danh sách các lượt đặt</h2><p className="mt-1 text-xs text-slate-500">Theo dõi trạng thái check-in, lượt đã hoàn thành và lịch sử hủy.</p></div>
            <div className="flex flex-wrap gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1" aria-label="Lọc lượt đặt">
              {filterOptions.map(([value, label]) => (
                <button aria-pressed={filter === value} className={`rounded-lg px-2.5 py-2 text-[10px] font-semibold transition sm:text-[11px] ${filter === value ? 'bg-black text-white shadow-sm' : 'text-slate-600 hover:bg-white'}`} key={value} onClick={() => setFilter(value)} type="button">{label}{value === 'ALL' ? ` (${reservations.length})` : ''}</button>
              ))}
            </div>
          </div>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
            <label className="relative block w-full sm:max-w-[280px]">
              <span className="sr-only">Tìm biển số hoặc mã đặt chỗ</span>
              <Icon name="search" className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <input className="h-10 w-full rounded-full border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs outline-none focus:border-slate-400" onChange={(event) => setSearch(event.target.value)} placeholder="Tìm biển số, mã đặt chỗ..." type="search" value={search} />
            </label>
            <span className="text-[11px] text-slate-500">Hiển thị {displayedReservations.length}/{reservations.length} lượt gần nhất</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-left">
            <thead><tr className="bg-slate-50 text-[10px] font-bold uppercase tracking-wide text-slate-500"><th className="px-4 py-3 sm:px-5">Mã đặt chỗ</th><th className="px-4 py-3">Biển số</th><th className="px-4 py-3">Giờ hẹn</th><th className="px-4 py-3">Hạn giữ chỗ</th><th className="px-4 py-3">Trạng thái</th><th className="px-4 py-3 text-right">Thao tác</th></tr></thead>
            <tbody>
              {displayedReservations.map((reservation) => {
                const vehicle = mockVehicles.find((item) => item.id === reservation.vehicleId)
                const lot = parkingLots.find((item) => item.id === reservation.parkingLotId)
                return (
                  <tr className="border-t border-slate-100 text-xs" key={reservation.id}>
                    <td className="px-4 py-3.5 sm:px-5"><button className="font-mono font-bold text-slate-900 hover:underline" onClick={() => setDetailReservation(reservation)} type="button">{reservation.id}</button><span className="mt-1 block max-w-40 truncate text-[10px] text-slate-500">{lot?.name ?? 'Bãi xe'}</span></td>
                    <td className="px-4 py-3.5"><span className="font-mono font-semibold text-slate-900">{vehicle?.licensePlate ?? '—'}</span><span className="mt-1 block text-[10px] text-slate-500">{vehicle?.name ?? 'Phương tiện'}</span></td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-slate-700">{formatDateTime(reservation.appointmentAt)}</td>
                    <td className="whitespace-nowrap px-4 py-3.5"><span className={reservation.status === 'NO_SHOW' ? 'font-semibold text-red-600' : 'text-slate-700'}>{reservation.status === 'COMPLETED' ? `Check-in: ${formatTime(reservation.appointmentAt)}` : reservation.status === 'NO_SHOW' ? `Hết hạn: ${formatTime(reservation.holdUntil)}` : `Hạn: ${formatTime(reservation.holdUntil)}`}</span></td>
                    <td className="px-4 py-3.5"><StatusPill status={reservation.status} /></td>
                    <td className="px-4 py-3.5"><div className="flex justify-end gap-1.5"><button className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-[10px] font-semibold text-slate-700 hover:bg-slate-50" onClick={() => setDetailReservation(reservation)} type="button">Chi tiết</button>{reservation.status === 'HELD' ? <button className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-[10px] font-semibold text-red-700 hover:bg-red-100" onClick={() => setCancelReservation(reservation)} type="button">Hủy</button> : null}</div></td>
                  </tr>
                )
              })}
              {displayedReservations.length === 0 ? <tr><td className="px-5 py-10 text-center text-sm text-slate-500" colSpan={6}>Không tìm thấy lượt đặt phù hợp.</td></tr> : null}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-[11px] text-slate-400 sm:px-5"><span>Trang 1 / 1 · Dữ liệu cục bộ</span><span>{reservations.length} lượt đặt</span></div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-950/[0.02] sm:p-5" aria-labelledby="reservation-rules-title">
        <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-bold text-slate-950" id="reservation-rules-title">Quy định & Hướng dẫn đặt chỗ ô tô (Bãi E)</h2><p className="mt-1 text-xs text-slate-500">Áp dụng cho tài khoản cán bộ, giảng viên có phương tiện được duyệt.</p></div><span className="rounded border border-slate-200 px-2 py-1 text-[10px] font-bold uppercase text-slate-500">Chính sách v2.4 · Mock</span></div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {[
            ['01', 'Đối tượng áp dụng', 'Dành riêng cho cán bộ, giảng viên đã đăng ký ô tô và được cấp quyền trên hệ thống.'],
            ['02', 'Phạm vi bãi xe', 'Đặt trước tại Bãi E (khu hành chính). Bãi A và B dành cho khu vực khác.'],
            ['03', 'Thời gian giữ chỗ', `Chỗ được giữ tối đa ${mockReservationPolicy.holdMinutes} phút từ giờ hẹn. Sau thời gian này, chỗ có thể được giải phóng.`],
            ['04', 'Giới hạn lượt đặt', 'Mỗi tài khoản chỉ duy trì một lượt giữ chỗ đang hoạt động.'],
            ['05', 'Xử lý vắng mặt', `Đủ ${mockReservationPolicy.noShowLimit} lần vắng mặt sẽ tạm khóa quyền đặt chỗ ${mockReservationPolicy.lockDays} ngày (đang mô phỏng).`],
            ['06', 'Biểu phí', 'Miễn phí đặt trước trong dữ liệu mẫu; phí thực tế tùy theo chính sách bãi.'],
          ].map(([number, title, description]) => (
            <article className="rounded-xl border border-slate-200 bg-slate-50 p-3" key={number}><h3 className="text-xs font-bold text-slate-950"><span className="mr-2 rounded bg-black px-1.5 py-1 text-[9px] text-lime-300">{number}</span>{title}</h3><p className="mt-2 text-[11px] leading-5 text-slate-500">{description}</p></article>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3 text-[11px] text-slate-500"><span>Cần thay đổi thông tin phương tiện hoặc biển số?</span><Link className="font-semibold text-slate-800 hover:underline" to="/user/vehicles">Quản lý phương tiện →</Link></div>
      </section>

      {isFormOpen ? (
        <Modal
          title="Tạo lượt đặt chỗ"
          description="Chọn phương tiện, bãi xe và giờ dự kiến đến. Dữ liệu được lưu tạm trong trang mô phỏng."
          onClose={() => setIsFormOpen(false)}
          footer={(
            <>
              <button className="min-h-10 rounded-full border border-slate-300 px-5 text-sm font-semibold text-slate-700 hover:bg-white" onClick={() => setIsFormOpen(false)} type="button">Đóng</button>
              <button className="min-h-10 rounded-full bg-black px-5 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50" disabled={isAccessLocked} form="new-reservation-form" type="submit">Xác nhận đặt chỗ</button>
            </>
          )}
        >
          <form className="space-y-4" id="new-reservation-form" onSubmit={createReservation}>
            {isAccessLocked ? <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">Quyền đặt chỗ đang khóa. Hãy khôi phục quyền mô phỏng ở đầu trang để tiếp tục.</p> : null}
            <label className="block text-sm font-semibold text-slate-800">Phương tiện
              <select className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-normal outline-none focus:border-slate-400" onChange={(event) => setSelectedVehicleId(event.target.value)} value={selectedVehicleId}>
                {mockVehicles.map((vehicle) => <option key={vehicle.id} value={vehicle.id}>{vehicle.licensePlate} · {vehicle.name}</option>)}
              </select>
            </label>
            <label className="block text-sm font-semibold text-slate-800">Bãi xe
              <select className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-normal outline-none focus:border-slate-400" onChange={(event) => setSelectedLotId(event.target.value)} value={selectedLotId}>
                {parkingLots.map((lot) => <option disabled={lot.status !== 'OPEN' || lot.availableSlots < 1} key={lot.id} value={lot.id}>{lot.name} · {lot.status === 'FULL' || lot.availableSlots < 1 ? 'Hết chỗ' : `${lot.availableSlots} chỗ trống`}</option>)}
              </select>
            </label>
            {parkingLots.some((lot) => lot.status === 'FULL' || lot.availableSlots < 1) ? <p className="-mt-2 text-xs text-slate-500">Bãi A đang hết chỗ nên không thể chọn. Bãi đầy sẽ bị khóa trong danh sách.</p> : null}
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm font-semibold text-slate-800">Ngày hẹn
                <input className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-normal outline-none focus:border-slate-400" min={localDateInputValue()} onChange={(event) => setBookingDate(event.target.value)} required type="date" value={bookingDate} />
              </label>
              <label className="block text-sm font-semibold text-slate-800">Giờ hẹn
                <select className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-normal outline-none focus:border-slate-400" onChange={(event) => setBookingTime(event.target.value)} value={bookingTime}>
                  {['07:00', '08:00', '09:00', '10:00', '13:30', '14:00', '15:00', '16:00'].map((time) => <option key={time} value={time}>{time}</option>)}
                </select>
              </label>
            </div>
            {formError ? <p className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-800" role="alert">{formError}</p> : null}
            <p className="rounded-xl bg-slate-50 px-3.5 py-3 text-xs leading-5 text-slate-600">Lượt đặt sẽ giữ chỗ {mockReservationPolicy.holdMinutes} phút tính từ giờ hẹn. Lượt này không tạo giao dịch và không ghi vào backend.</p>
          </form>
        </Modal>
      ) : null}

      {detailReservation ? (() => {
        const vehicle = mockVehicles.find((item) => item.id === detailReservation.vehicleId)
        const lot = parkingLots.find((item) => item.id === detailReservation.parkingLotId)
        return (
          <Modal
            title="Chi tiết lượt đặt"
            description={`Mã lượt ${detailReservation.id}`}
            onClose={() => setDetailReservation(null)}
            footer={(
              <>
                <button className="min-h-10 rounded-full border border-slate-300 px-5 text-sm font-semibold text-slate-700 hover:bg-white" onClick={() => setDetailReservation(null)} type="button">Đóng</button>
                {detailReservation.status === 'HELD' ? <button className="min-h-10 rounded-full bg-red-600 px-5 text-sm font-semibold text-white hover:bg-red-700" onClick={() => setCancelReservation(detailReservation)} type="button">Hủy lượt đặt</button> : null}
              </>
            )}
          >
            <div className="flex flex-wrap items-center justify-between gap-3"><StatusPill status={detailReservation.status} /><span className="text-xs text-slate-500">Tạo lúc {formatDateTime(detailReservation.createdAt)}</span></div>
            <dl className="mt-5 grid gap-3 sm:grid-cols-2">
              {[
                ['Bãi xe', lot?.name ?? 'Không rõ'],
                ['Vị trí', lot?.location ?? 'Không rõ'],
                ['Phương tiện', `${vehicle?.licensePlate ?? '—'} · ${vehicle?.name ?? 'Phương tiện'}`],
                ['Giờ hẹn', formatDateTime(detailReservation.appointmentAt)],
                ['Giữ chỗ đến', formatDateTime(detailReservation.holdUntil)],
                ['Phí đặt trước', '0 VNĐ · dữ liệu mô phỏng'],
              ].map(([label, value]) => <div className="rounded-xl border border-slate-200 bg-slate-50 p-3" key={label}><dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{label}</dt><dd className="mt-1 text-sm font-semibold text-slate-900">{value}</dd></div>)}
            </dl>
            {detailReservation.status === 'NO_SHOW' ? <p className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">Không ghi nhận check-in trước {formatTime(detailReservation.holdUntil)}. Lượt này được tính là vắng mặt trong dữ liệu mẫu.</p> : null}
            <p className="mt-4 text-xs leading-5 text-slate-500">Trạng thái và thông tin trong chi tiết này là dữ liệu mock; backend chưa cung cấp API đặt chỗ.</p>
          </Modal>
        )
      })() : null}

      {cancelReservation ? (
        <Modal
          title="Hủy lượt đặt chỗ?"
          description={`Bạn đang hủy lượt ${cancelReservation.id}. Chỗ trống sẽ được trả lại trong dữ liệu mô phỏng.`}
          onClose={() => setCancelReservation(null)}
          footer={(
            <>
              <button className="min-h-10 rounded-full border border-slate-300 px-5 text-sm font-semibold text-slate-700 hover:bg-white" onClick={() => setCancelReservation(null)} type="button">Giữ lượt đặt</button>
              <button className="min-h-10 rounded-full bg-red-600 px-5 text-sm font-semibold text-white hover:bg-red-700" onClick={confirmCancel} type="button">Xác nhận hủy</button>
            </>
          )}
        >
          <p className="text-sm leading-6 text-slate-600">Giờ hẹn: <strong className="text-slate-900">{formatDateTime(cancelReservation.appointmentAt)}</strong></p>
          <p className="mt-2 text-xs leading-5 text-slate-500">Hủy ở đây không gửi yêu cầu đến server và không thay đổi dữ liệu tài khoản thật.</p>
        </Modal>
      ) : null}
    </section>
  )
}
