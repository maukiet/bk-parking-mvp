import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'
import { useAuth } from '../../../shared/auth/AuthContext'
import { Icon } from '../../../shared/components/Icon'
import type { IconName } from '../../../shared/components/Icon'
import { PageHeader } from '../../../shared/components/PageHeader'
import { ApiError, apiGetBlob } from '../../../shared/api/apiClient'
import type { UserVehicleDto, VehicleEligibilityDto, VehicleStatus } from '../../../types/api'
import { cancelMyVehicle, getMyVehicles, getVehicleEligibility } from '../vehiclesApi'

type Filter = 'ALL' | VehicleStatus | 'NEEDS_ATTENTION'

const statusLabels: Record<VehicleStatus, string> = {
  PENDING: 'Chờ duyệt',
  APPROVED: 'Đã duyệt',
  REJECTED: 'Bị từ chối',
  LOCKED: 'Đang khóa',
  CANCELED: 'Đã hủy',
}

const statusStyles: Record<VehicleStatus, string> = {
  PENDING: 'bg-amber-50 text-amber-800',
  APPROVED: 'bg-lime-100 text-lime-900',
  REJECTED: 'bg-red-50 text-red-700',
  LOCKED: 'bg-slate-200 text-slate-700',
  CANCELED: 'bg-slate-100 text-slate-600',
}

const typeLabels: Record<string, string> = {
  MOTORBIKE: 'Xe máy',
  ELECTRIC_BIKE: 'Xe điện',
  BICYCLE: 'Xe đạp',
  CAR: 'Ô tô',
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Không tải được dữ liệu. Vui lòng thử lại.'
}

function formatDate(value: string | null) {
  if (!value) return 'Chưa có thông tin'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'Chưa có thông tin' : new Intl.DateTimeFormat('vi-VN').format(date)
}

function Metric({ label, value, detail, icon }: { label: string; value: string | number; detail: string; icon: IconName }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-950/[0.02] sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
        <span className="grid size-8 place-items-center rounded-full bg-slate-100 text-slate-600"><Icon name={icon} className="size-4" /></span>
      </div>
      <p className="mt-3 text-2xl font-bold tracking-tight">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{detail}</p>
    </article>
  )
}

function VehiclePhoto({ url, alt }: { url: string | null; alt: string }) {
  const [src, setSrc] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    setFailed(false)
    setSrc(null)
    if (!url) {
      return
    }
    let objectUrl: string | null = null
    const controller = new AbortController()
    apiGetBlob(url, controller.signal).then((blob) => {
      objectUrl = URL.createObjectURL(blob)
      setSrc(objectUrl)
    }).catch(() => { if (!controller.signal.aborted) setFailed(true) })
    return () => {
      controller.abort()
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [url])

  return src && !failed
    ? <img src={src} alt={alt} className="size-14 shrink-0 rounded-xl bg-slate-100 object-cover" />
    : <span className="grid size-14 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-500"><Icon name="vehicles" className="size-7" /></span>
}

function VehicleCard({ vehicle, onCancel, canceling }: {
  vehicle: UserVehicleDto
  onCancel: (vehicle: UserVehicleDto) => void
  canceling: boolean
}) {
  const vehicleName = [vehicle.brand, vehicle.model].filter(Boolean).join(' ') || typeLabels[vehicle.vehicleType] || vehicle.vehicleType

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-950/[0.02] sm:p-5">
      <div className="flex items-start gap-3">
        <VehiclePhoto url={vehicle.vehiclePhotoUrl} alt={`Ảnh ${vehicleName}`} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-bold tracking-wide">{vehicle.licensePlate}</h2>
            <span className="rounded-md bg-black px-2 py-0.5 text-[10px] font-bold uppercase text-lime-300">{typeLabels[vehicle.vehicleType] ?? vehicle.vehicleType}</span>
          </div>
          <p className="mt-1 truncate text-sm text-slate-600">{vehicleName}{vehicle.color ? ` · ${vehicle.color}` : ''}</p>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyles[vehicle.status]}`}>{statusLabels[vehicle.status]}</span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 text-xs">
        <span className="rounded-full border border-slate-200 px-3 py-1.5 text-slate-600">{vehicle.ownerRelationship === 'RELATIVE' ? 'Xe người thân' : 'Xe chính chủ'}</span>
        {vehicle.currentlyParked && <span className="rounded-full bg-blue-50 px-3 py-1.5 font-medium text-blue-800">Đang gửi tại {vehicle.currentParkingLotName || 'bãi xe'}</span>}
      </div>

      {vehicle.status === 'REJECTED' && vehicle.rejectionReason && (
        <div className="mt-4 rounded-xl bg-red-50 px-3.5 py-3 text-sm text-red-800">
          <span className="font-semibold">Lý do từ chối: </span>{vehicle.rejectionReason}
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
        <p className="text-xs text-slate-500">Đăng ký ngày {formatDate(vehicle.createdAt)}</p>
        <div className="flex flex-wrap gap-2">
          {vehicle.status === 'APPROVED' && <Link to="/user/overview?tab=qr" className="rounded-full border border-slate-300 px-3.5 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50">Mã QR</Link>}
          {vehicle.status !== 'CANCELED' && (
            <button
              type="button"
              className="rounded-full border border-slate-300 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={canceling || vehicle.currentlyParked}
              title={vehicle.currentlyParked ? 'Xe cần rời bãi trước khi hủy đăng ký.' : undefined}
              onClick={() => onCancel(vehicle)}
            >
              {canceling ? 'Đang hủy…' : 'Hủy đăng ký'}
            </button>
          )}
        </div>
      </div>
    </article>
  )
}

export function UserVehiclesPage() {
  const { user, isLoading: isAuthLoading } = useAuth()
  const [vehicles, setVehicles] = useState<UserVehicleDto[]>([])
  const [eligibility, setEligibility] = useState<VehicleEligibilityDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<Filter>('ALL')
  const [cancelingId, setCancelingId] = useState<number | null>(null)
  const [reload, setReload] = useState(0)

  useEffect(() => {
    if (isAuthLoading || !user || user.role !== 'ROLE_USER') return
    let cancelled = false
    setLoading(true)
    setError('')
    Promise.all([getMyVehicles(), getVehicleEligibility()])
      .then(([rows, limit]) => {
        if (cancelled) return
        setVehicles(rows ?? [])
        setEligibility(limit)
      })
      .catch((reason: unknown) => {
        if (!cancelled) setError(errorMessage(reason))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [isAuthLoading, reload, user?.id, user?.role])

  const approvedCount = vehicles.filter((vehicle) => vehicle.status === 'APPROVED').length
  const pendingCount = vehicles.filter((vehicle) => vehicle.status === 'PENDING').length
  const attentionCount = vehicles.filter((vehicle) => vehicle.status === 'REJECTED' || vehicle.status === 'LOCKED').length
  const filteredVehicles = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('vi-VN')
    return vehicles.filter((vehicle) => {
      const matchesFilter = filter === 'ALL'
        || (filter === 'NEEDS_ATTENTION' ? vehicle.status === 'REJECTED' || vehicle.status === 'LOCKED' : vehicle.status === filter)
      const matchesSearch = !normalized || `${vehicle.licensePlate} ${vehicle.brand ?? ''} ${vehicle.model ?? ''}`.toLocaleLowerCase('vi-VN').includes(normalized)
      return matchesFilter && matchesSearch
    })
  }, [filter, query, vehicles])

  async function handleCancel(vehicle: UserVehicleDto) {
    if (!window.confirm(`Bạn muốn hủy đăng ký xe ${vehicle.licensePlate}?`)) return
    setCancelingId(vehicle.id)
    setError('')
    setNotice('')
    try {
      await cancelMyVehicle(vehicle.id)
      setNotice(`Đã hủy đăng ký xe ${vehicle.licensePlate}.`)
      setReload((value) => value + 1)
    } catch (reason) {
      setError(reason instanceof ApiError && reason.status === 409
        ? 'Xe đang có lượt gửi đang hoạt động nên chưa thể hủy đăng ký.'
        : errorMessage(reason))
    } finally {
      setCancelingId(null)
    }
  }

  if (isAuthLoading) return <div className="h-72 animate-pulse rounded-2xl bg-slate-200" />
  if (!user) return <AccessNotice title="Đăng nhập để quản lý phương tiện" message="Đăng nhập để xem xe đã đăng ký hoặc gửi yêu cầu đăng ký mới." />
  if (user.role !== 'ROLE_USER') return <AccessNotice title="Trang dành cho tài khoản người dùng" message="Tài khoản hiện tại không có quyền quản lý phương tiện cá nhân tại đây." />

  const canRegister = eligibility?.canRegister ?? false
  const maxCount = eligibility?.maxVehicleLimit ?? user.maxVehicleLimit
  const registeredCount = eligibility?.registeredVehicleCount ?? user.registeredVehicleCount

  return (
    <section aria-labelledby="page-title" className="space-y-7">
      <PageHeader
        title="Quản lý phương tiện"
        description="Đăng ký và theo dõi trạng thái xe của bạn."
        action={canRegister ? (
          <Link to="/user/vehicles/new" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-black px-5 text-sm font-semibold text-white hover:bg-slate-800">
            Đăng ký xe mới <span aria-hidden="true" className="grid size-5 place-items-center rounded-full bg-lime-400 text-black">+</span>
          </Link>
        ) : null}
      />

      {!canRegister && eligibility && <p className="rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-sm text-amber-900">Bạn đã đạt hạn mức đăng ký {maxCount} phương tiện.</p>}
      {notice && <p role="status" className="rounded-xl border border-lime-200 bg-lime-50 p-3.5 text-sm text-lime-900">{notice}</p>}
      {error && <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-800"><span>{error}</span><button type="button" onClick={() => setReload((value) => value + 1)} className="font-semibold underline">Thử tải lại</button></div>}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Phương tiện trong hạn mức" value={`${registeredCount} / ${maxCount}`} detail="Xe chờ duyệt và xe đã duyệt" icon="vehicles" />
        <Metric label="Đã được duyệt" value={approvedCount} detail="Có thể dùng mã QR tại bãi" icon="packages" />
        <Metric label="Đang chờ duyệt" value={pendingCount} detail="Hồ sơ đang được kiểm tra" icon="history" />
        <Metric label="Cần xem lại" value={attentionCount} detail="Hồ sơ bị từ chối hoặc đang khóa" icon="bell" />
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2" aria-label="Lọc phương tiện">
          {([
            ['ALL', 'Tất cả'], ['APPROVED', 'Đã duyệt'], ['PENDING', 'Chờ duyệt'], ['NEEDS_ATTENTION', 'Cần xem lại'], ['CANCELED', 'Đã hủy'],
          ] as [Filter, string][]).map(([value, label]) => (
            <button key={value} type="button" aria-pressed={filter === value} onClick={() => setFilter(value)} className={`rounded-full border px-3.5 py-2 text-xs font-semibold transition-colors ${filter === value ? 'border-black bg-black text-white' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}>
              {label}{value === 'ALL' ? ` ${vehicles.length}` : ''}
            </button>
          ))}
        </div>
        <label className="relative block w-full lg:max-w-xs">
          <span className="sr-only">Tìm theo biển số hoặc mẫu xe</span>
          <Icon name="search" className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} type="search" placeholder="Tìm biển số hoặc mẫu xe" className="h-10 w-full rounded-full border border-slate-200 bg-white pl-9 pr-4 text-sm outline-none focus:border-slate-400" />
        </label>
      </div>

      <div>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold">Phương tiện của tôi <span className="ml-1 rounded-full bg-black px-2 py-1 text-[10px] font-bold text-lime-300">{registeredCount.toString().padStart(2, '0')}/{maxCount.toString().padStart(2, '0')}</span></h2>
          <span className="text-xs text-slate-500">{filteredVehicles.length} phương tiện</span>
        </div>
        {loading ? <div className="grid gap-4 xl:grid-cols-2"><div className="h-52 animate-pulse rounded-2xl bg-slate-200" /><div className="h-52 animate-pulse rounded-2xl bg-slate-200" /></div> : filteredVehicles.length ? (
          <div className="grid gap-4 xl:grid-cols-2">
            {filteredVehicles.map((vehicle) => <VehicleCard key={vehicle.id} vehicle={vehicle} onCancel={(item) => void handleCancel(item)} canceling={cancelingId === vehicle.id} />)}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
            <span className="mx-auto grid size-12 place-items-center rounded-full bg-slate-100 text-slate-500"><Icon name="vehicles" className="size-6" /></span>
            <h3 className="mt-4 font-semibold">{vehicles.length ? 'Không tìm thấy phương tiện phù hợp' : 'Bạn chưa đăng ký phương tiện'}</h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">{vehicles.length ? 'Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.' : 'Đăng ký xe để theo dõi quá trình duyệt và sử dụng mã QR tại bãi.'}</p>
            {!vehicles.length && canRegister && <Link to="/user/vehicles/new" className="mt-5 inline-flex min-h-10 items-center rounded-full bg-black px-5 text-sm font-semibold text-white">Bắt đầu đăng ký</Link>}
          </div>
        )}
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <h2 className="font-semibold">Quy định đăng ký phương tiện</h2>
        <div className="mt-4 grid gap-4 text-sm leading-6 text-slate-600 md:grid-cols-3">
          <p><strong className="text-slate-900">Hạn mức:</strong> mỗi tài khoản đăng ký tối đa {maxCount} xe đang chờ duyệt hoặc đã được duyệt.</p>
          <p><strong className="text-slate-900">Hồ sơ:</strong> cần ảnh rõ mặt trước và mặt sau giấy đăng ký xe để gửi duyệt.</p>
          <p><strong className="text-slate-900">Trạng thái:</strong> xe chỉ có mã QR sau khi hồ sơ được duyệt.</p>
        </div>
      </section>
    </section>
  )
}

function AccessNotice({ title, message }: { title: string; message: string }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center">
      <h1 className="text-xl font-bold">{title}</h1>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">{message}</p>
      <Link to="/login?next=%2Fuser%2Fvehicles" className="mt-5 inline-flex min-h-10 items-center rounded-full bg-black px-5 text-sm font-semibold text-white">Đăng nhập</Link>
    </section>
  )
}
