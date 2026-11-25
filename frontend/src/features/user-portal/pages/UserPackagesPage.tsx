import { useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  BookOpenCheck,
  CalendarDays,
  CarFront,
  CheckCircle2,
  Clock3,
  CreditCard,
  Info,
  PackageCheck,
  ReceiptText,
  X,
} from 'lucide-react'
import { useAuth } from '../../../shared/auth/AuthContext'
import { ApiError } from '../../../shared/api/apiClient'
import { Icon } from '../../../shared/components/Icon'
import { PageHeader } from '../../../shared/components/PageHeader'
import type {
  PackagesOverviewResponse,
  ParkingPackageDto,
  UserPackageDto,
} from '../../../types/api'
import { getPackagesOverview } from '../packagesApi'

type PackageTab = 'mine' | 'fees' | 'history' | 'guide'
type PackageDetail =
  | { kind: 'available'; item: ParkingPackageDto }
  | { kind: 'subscription'; item: UserPackageDto }

const tabs: { id: PackageTab; label: string; icon: typeof PackageCheck }[] = [
  { id: 'mine', label: 'Gói của tôi', icon: PackageCheck },
  { id: 'fees', label: 'Bảng phí & Quy định', icon: CreditCard },
  { id: 'history', label: 'Lịch sử đăng ký', icon: ReceiptText },
  { id: 'guide', label: 'Quy trình & Hướng dẫn', icon: BookOpenCheck },
]

const vehicleTypeLabels: Record<string, string> = {
  MOTORBIKE: 'Xe máy',
  ELECTRIC_BIKE: 'Xe điện',
  BICYCLE: 'Xe đạp',
  CAR: 'Ô tô',
}

const subscriptionStatusLabels: Record<string, string> = {
  ACTIVE: 'Đang hiệu lực',
  EXPIRED: 'Đã hết hạn',
  CANCELED: 'Đã hủy',
  INACTIVE: 'Chưa hiệu lực',
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value)
}

function formatDate(value: string | null | undefined) {
  if (!value) return 'Chưa có thông tin'
  const [year, month, day] = value.slice(0, 10).split('-').map(Number)
  if (!year || !month || !day) return 'Chưa có thông tin'
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(year, month - 1, day))
}

function humanizeStatus(status: string) {
  return subscriptionStatusLabels[status.toUpperCase()]
    ?? status.toLocaleLowerCase('vi-VN').replaceAll('_', ' ')
}

function statusClasses(status: string) {
  switch (status.toUpperCase()) {
    case 'ACTIVE':
      return 'border-lime-200 bg-lime-50 text-lime-900'
    case 'EXPIRED':
    case 'CANCELED':
      return 'border-slate-200 bg-slate-100 text-slate-600'
    default:
      return 'border-amber-200 bg-amber-50 text-amber-900'
  }
}

function vehicleLabel(value: string) {
  return vehicleTypeLabels[value] ?? value.replaceAll('_', ' ')
}

function MetricCard({ label, value, detail, icon: MetricIcon }: {
  label: string
  value: string | number
  detail: string
  icon: typeof PackageCheck
}) {
  return (
    <article className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-950/[0.02] sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">{label}</p>
        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-600">
          <MetricIcon aria-hidden="true" className="size-4" />
        </span>
      </div>
      <p className="mt-3 truncate text-xl font-bold tracking-tight text-slate-950 sm:text-2xl">{value}</p>
      <p className="mt-1 min-h-8 text-xs leading-4 text-slate-500">{detail}</p>
    </article>
  )
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-12 text-center">
      <span className="mx-auto grid size-12 place-items-center rounded-full bg-slate-100 text-slate-500">
        <PackageCheck aria-hidden="true" className="size-6" />
      </span>
      <h3 className="mt-4 font-semibold text-slate-900">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">{description}</p>
    </div>
  )
}

function Notice({ children, tone = 'info' }: { children: ReactNode; tone?: 'info' | 'error' }) {
  const colors = tone === 'error'
    ? 'border-red-200 bg-red-50 text-red-800'
    : 'border-slate-200 bg-white text-slate-700'
  return (
    <div className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm leading-5 ${colors}`}>
      <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      <div>{children}</div>
    </div>
  )
}

function PackageCard({ item, onDetails }: {
  item: ParkingPackageDto
  onDetails: () => void
}) {
  return (
    <article className="flex min-w-0 flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-950/[0.02] sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-black px-3 py-1.5 text-[11px] font-semibold text-lime-300">
          <CarFront aria-hidden="true" className="size-3.5" />
          {vehicleLabel(item.vehicleType)}
        </span>
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-medium text-slate-600">{item.code}</span>
      </div>
      <h3 className="mt-5 text-lg font-bold text-slate-950">{item.name}</h3>
      <p className="mt-2 min-h-10 text-sm leading-5 text-slate-500">{item.description || 'Gói đỗ xe theo thông tin hiện có.'}</p>
      <div className="mt-5 rounded-xl bg-slate-50 p-4">
        <p className="text-xs text-slate-500">Mức phí</p>
        <p className="mt-1 text-xl font-bold tracking-tight text-slate-950">{formatCurrency(item.price)}</p>
        <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
          <Clock3 aria-hidden="true" className="size-3.5" />
          Thời hạn {item.durationDays} ngày
        </p>
      </div>
      <button
        className="mt-4 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-800 transition-colors hover:bg-slate-50"
        onClick={onDetails}
        type="button"
      >
        Xem chi tiết <span aria-hidden="true">→</span>
      </button>
    </article>
  )
}

function SubscriptionCard({ item, onDetails }: {
  item: UserPackageDto
  onDetails: () => void
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-950/[0.02] sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-slate-500">{item.packageCode}</p>
          <h3 className="mt-1 text-lg font-bold text-slate-950">{item.packageName}</h3>
        </div>
        <span className={`inline-flex shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold ${statusClasses(item.status)}`}>
          {humanizeStatus(item.status)}
        </span>
      </div>
      <div className="mt-5 grid gap-3 rounded-xl bg-slate-50 p-4 sm:grid-cols-3">
        <div>
          <p className="text-xs text-slate-500">Phương tiện</p>
          <p className="mt-1 text-sm font-semibold text-slate-800">{vehicleLabel(item.vehicleType)}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Phí gói</p>
          <p className="mt-1 text-sm font-semibold text-slate-800">{formatCurrency(item.price)}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Thời hạn</p>
          <p className="mt-1 text-sm font-semibold text-slate-800">{formatDate(item.startDate)} – {formatDate(item.endDate)}</p>
        </div>
      </div>
      <button
        className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        onClick={onDetails}
        type="button"
      >
        Xem chi tiết <span aria-hidden="true">→</span>
      </button>
    </article>
  )
}

function PackageDetailModal({ detail, onClose }: { detail: PackageDetail; onClose: () => void }) {
  const packageCode = detail.kind === 'available' ? detail.item.code : detail.item.packageCode
  const packageName = detail.kind === 'available' ? detail.item.name : detail.item.packageName
  const vehicleType = detail.item.vehicleType
  const price = detail.item.price

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 grid overflow-y-auto bg-slate-950/45 p-4 sm:place-items-center" onClick={onClose} role="presentation">
      <section
        aria-labelledby="package-detail-title"
        aria-modal="true"
        className="my-auto w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-950/20"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
      >
        <header className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4 sm:px-6">
          <div>
            <p className="text-xs font-medium text-slate-500">{packageCode}</p>
            <h2 className="mt-1 text-lg font-bold text-slate-950" id="package-detail-title">{packageName}</h2>
          </div>
          <button aria-label="Đóng chi tiết" className="grid size-9 shrink-0 place-items-center rounded-full text-slate-500 hover:bg-slate-100" onClick={onClose} type="button">
            <X aria-hidden="true" className="size-4" />
          </button>
        </header>
        <div className="space-y-4 p-5 sm:p-6">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs text-slate-500">Loại phương tiện</p>
              <p className="mt-1 font-semibold text-slate-900">{vehicleLabel(vehicleType)}</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs text-slate-500">Mức phí gói</p>
              <p className="mt-1 font-semibold text-slate-900">{formatCurrency(price)}</p>
            </div>
          </div>
          {detail.kind === 'available' ? (
            <>
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs text-slate-500">Thời hạn</p>
                <p className="mt-1 font-semibold text-slate-900">{detail.item.durationDays} ngày</p>
              </div>
              <p className="text-sm leading-6 text-slate-600">{detail.item.description || 'Chưa có mô tả cho gói này.'}</p>
            </>
          ) : (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs text-slate-500">Ngày bắt đầu</p>
                  <p className="mt-1 font-semibold text-slate-900">{formatDate(detail.item.startDate)}</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs text-slate-500">Ngày kết thúc</p>
                  <p className="mt-1 font-semibold text-slate-900">{formatDate(detail.item.endDate)}</p>
                </div>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-4">
                <span className="text-sm text-slate-600">Trạng thái gói</span>
                <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusClasses(detail.item.status)}`}>{humanizeStatus(detail.item.status)}</span>
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  )
}

function MyPackagesTab({ subscriptions, availablePackages, onDetails }: {
  subscriptions: UserPackageDto[]
  availablePackages: ParkingPackageDto[]
  onDetails: (detail: PackageDetail) => void
}) {
  return (
    <div className="space-y-8">
      <section>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-slate-950">Gói đã đăng ký</h2>
            <p className="mt-1 text-sm text-slate-500">Thông tin gói và thời hạn được trả về từ tài khoản của bạn.</p>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{subscriptions.length} gói</span>
        </div>
        {subscriptions.length ? (
          <div className="grid gap-4 xl:grid-cols-2">
            {subscriptions.map((item) => (
              <SubscriptionCard key={item.id} item={item} onDetails={() => onDetails({ kind: 'subscription', item })} />
            ))}
          </div>
        ) : (
          <EmptyState title="Bạn chưa có gói đỗ xe" description="Khi tài khoản có gói được ghi nhận, thông tin và thời hạn sẽ hiển thị tại đây." />
        )}
      </section>

      <section>
        <div className="mb-4">
          <h2 className="text-lg font-bold text-slate-950">Các gói hiện có</h2>
          <p className="mt-1 text-sm text-slate-500">Danh sách gói do hệ thống cung cấp.</p>
        </div>
        {availablePackages.length ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {availablePackages.map((item) => (
              <PackageCard key={item.id} item={item} onDetails={() => onDetails({ kind: 'available', item })} />
            ))}
          </div>
        ) : (
          <EmptyState title="Chưa có gói khả dụng" description="Hiện hệ thống chưa trả về gói đỗ xe nào." />
        )}
      </section>
    </div>
  )
}

function FeesTab({ packages, onDetails }: { packages: ParkingPackageDto[]; onDetails: (item: ParkingPackageDto) => void }) {
  if (!packages.length) return <EmptyState title="Chưa có bảng phí" description="Hệ thống chưa trả về thông tin gói để hiển thị mức phí." />
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-950/[0.02]">
      <div className="border-b border-slate-100 px-5 py-5 sm:px-7">
        <h2 className="text-lg font-bold text-slate-950">Mức phí các gói đỗ xe</h2>
        <p className="mt-1 text-sm text-slate-500">Giá và thời hạn lấy trực tiếp từ danh sách gói hiện có.</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[620px] border-collapse text-left text-sm">
          <thead className="bg-slate-50 text-xs font-semibold text-slate-500">
            <tr>
              <th className="px-5 py-3.5 sm:px-7">Gói</th>
              <th className="px-5 py-3.5">Loại phương tiện</th>
              <th className="px-5 py-3.5">Thời hạn</th>
              <th className="px-5 py-3.5 text-right sm:px-7">Mức phí</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {packages.map((item) => (
              <tr className="text-slate-700" key={item.id}>
                <td className="px-5 py-4 sm:px-7">
                  <button className="text-left font-semibold text-slate-900 hover:underline" onClick={() => onDetails(item)} type="button">{item.name}</button>
                  <p className="mt-1 text-xs text-slate-500">{item.code}</p>
                </td>
                <td className="px-5 py-4">{vehicleLabel(item.vehicleType)}</td>
                <td className="px-5 py-4">{item.durationDays} ngày</td>
                <td className="px-5 py-4 text-right font-semibold text-slate-950 sm:px-7">{formatCurrency(item.price)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="border-t border-slate-100 px-5 py-4 sm:px-7">
        <Notice>Thông tin phí hiển thị theo từng gói hệ thống đang cung cấp.</Notice>
      </div>
    </section>
  )
}

function HistoryTab({ subscriptions, onDetails }: {
  subscriptions: UserPackageDto[]
  onDetails: (item: UserPackageDto) => void
}) {
  if (!subscriptions.length) return <EmptyState title="Chưa có lịch sử gói" description="Các gói được ghi nhận cho tài khoản sẽ hiển thị tại đây." />
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-950/[0.02] sm:p-7">
      <div className="mb-5">
        <h2 className="text-lg font-bold text-slate-950">Lịch sử gói đã đăng ký</h2>
        <p className="mt-1 text-sm text-slate-500">Danh sách gói do hệ thống trả về, sắp xếp theo ngày kết thúc.</p>
      </div>
      <div className="divide-y divide-slate-100">
        {subscriptions.map((item) => (
          <button
            className="flex w-full flex-col gap-3 py-4 text-left first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
            key={item.id}
            onClick={() => onDetails(item)}
            type="button"
          >
            <span className="min-w-0">
              <span className="block truncate font-semibold text-slate-900">{item.packageName} · {vehicleLabel(item.vehicleType)}</span>
              <span className="mt-1 block text-xs leading-5 text-slate-500">{item.packageCode} · {formatDate(item.startDate)} – {formatDate(item.endDate)}</span>
            </span>
            <span className="flex shrink-0 items-center justify-between gap-3 sm:justify-end">
              <span className="text-sm font-semibold text-slate-800">{formatCurrency(item.price)}</span>
              <span className={`rounded-full border px-3 py-1 text-[11px] font-semibold ${statusClasses(item.status)}`}>{humanizeStatus(item.status)}</span>
            </span>
          </button>
        ))}
      </div>
    </section>
  )
}

const guideSteps = [
  { number: '01', title: 'Chọn loại phương tiện', description: 'Đối chiếu loại phương tiện của bạn với loại được áp dụng cho từng gói.' },
  { number: '02', title: 'Xem mức phí và thời hạn', description: 'Mỗi gói hiển thị mức phí và số ngày có hiệu lực theo dữ liệu hệ thống.' },
  { number: '03', title: 'Theo dõi gói của bạn', description: 'Kiểm tra trạng thái, ngày bắt đầu và ngày kết thúc trong mục Gói của tôi.' },
  { number: '04', title: 'Tra cứu lịch sử', description: 'Mở Lịch sử đăng ký để xem các gói được ghi nhận cho tài khoản.' },
]

function GuideTab() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {guideSteps.map((step) => (
        <article className="min-h-48 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-950/[0.02]" key={step.number}>
          <span className="inline-flex size-8 items-center justify-center rounded-full bg-slate-950 text-xs font-bold text-lime-300">{step.number}</span>
          <h2 className="mt-5 font-semibold text-slate-950">{step.title}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">{step.description}</p>
        </article>
      ))}
    </div>
  )
}

function AccessNotice({ title, message }: { title: string; message: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center shadow-sm shadow-slate-950/[0.02]">
      <span className="mx-auto grid size-12 place-items-center rounded-full bg-slate-100 text-slate-600"><Icon name="packages" className="size-6" /></span>
      <h1 className="mt-4 text-xl font-bold text-slate-950">{title}</h1>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">{message}</p>
    </div>
  )
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Không tải được thông tin gói. Vui lòng thử lại.'
}

export function UserPackagesPage() {
  const { user, isLoading: isAuthLoading } = useAuth()
  const [data, setData] = useState<PackagesOverviewResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reload, setReload] = useState(0)
  const [activeTab, setActiveTab] = useState<PackageTab>('mine')
  const [detail, setDetail] = useState<PackageDetail | null>(null)

  useEffect(() => {
    if (isAuthLoading || !user || user.role !== 'ROLE_USER') return
    let mounted = true
    setLoading(true)
    setError('')
    getPackagesOverview()
      .then((result) => { if (mounted) setData(result) })
      .catch((reason: unknown) => {
        if (mounted) setError(reason instanceof ApiError && reason.status === 401
          ? 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'
          : errorMessage(reason))
      })
      .finally(() => { if (mounted) setLoading(false) })
    return () => { mounted = false }
  }, [isAuthLoading, user, reload])

  const availablePackages = data?.availablePackages ?? []
  const subscriptions = data?.mySubscriptions ?? []
  const activeSubscriptions = useMemo(
    () => subscriptions.filter((item) => item.status.toUpperCase() === 'ACTIVE'),
    [subscriptions],
  )
  const nearestEndDate = useMemo(() => {
    const active = activeSubscriptions
      .map((item) => item.endDate)
      .filter(Boolean)
      .sort((left, right) => left.localeCompare(right))
    return active[0] ?? ''
  }, [activeSubscriptions])

  if (isAuthLoading) return <div className="h-72 animate-pulse rounded-2xl bg-slate-200" />
  if (!user) return <AccessNotice title="Đăng nhập để xem gói đỗ xe" message="Đăng nhập bằng tài khoản người dùng để xem các gói và thời hạn đã được ghi nhận." />
  if (user.role !== 'ROLE_USER') return <AccessNotice title="Trang dành cho tài khoản người dùng" message="Tài khoản hiện tại không có quyền xem các gói đỗ xe cá nhân tại đây." />

  const selectedTab = tabs.find((item) => item.id === activeTab)

  return (
    <section aria-labelledby="page-title" className="space-y-6 sm:space-y-7">
      <PageHeader
        title="Gói đỗ xe & Thanh toán"
        description="Theo dõi các gói đỗ xe, mức phí và thời hạn của bạn."
      />

      {error ? (
        <div role="alert" className="space-y-3">
          <Notice tone="error">{error}</Notice>
          <button className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-white" onClick={() => setReload((value) => value + 1)} type="button">Thử tải lại</button>
        </div>
      ) : null}

      {!error && !loading ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Gói hiện có" value={availablePackages.length.toString().padStart(2, '0')} detail="Gói được hệ thống cung cấp" icon={PackageCheck} />
          <MetricCard label="Gói đang hiệu lực" value={activeSubscriptions.length.toString().padStart(2, '0')} detail="Trạng thái gói do hệ thống trả về" icon={CheckCircle2} />
          <MetricCard label="Tổng gói đã ghi nhận" value={subscriptions.length.toString().padStart(2, '0')} detail="Gồm các trạng thái hiện có trên tài khoản" icon={ReceiptText} />
          <MetricCard label="Hạn gần nhất" value={nearestEndDate ? formatDate(nearestEndDate) : '—'} detail={nearestEndDate ? 'Ngày kết thúc của gói đang hiệu lực' : 'Chưa có gói đang hiệu lực'} icon={CalendarDays} />
        </div>
      ) : null}

      <div className="overflow-x-auto border-b border-slate-200">
        <div aria-label="Các mục gói đỗ xe" className="flex min-w-max gap-1" role="tablist">
          {tabs.map(({ id, label, icon: TabIcon }) => (
            <button
              aria-controls={`package-panel-${id}`}
              aria-selected={activeTab === id}
              className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-t-xl border-b-2 px-4 text-xs font-semibold transition-colors sm:min-w-40 sm:text-sm ${activeTab === id ? 'border-lime-400 bg-black text-white' : 'border-transparent text-slate-600 hover:bg-white hover:text-slate-950'}`}
              id={`package-tab-${id}`}
              key={id}
              onClick={() => setActiveTab(id)}
              role="tab"
              type="button"
            >
              <TabIcon aria-hidden="true" className={`size-4 ${activeTab === id ? 'text-lime-300' : ''}`} />
              {label}
              {id === 'mine' && subscriptions.length > 0 ? <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${activeTab === id ? 'bg-white/15 text-white' : 'bg-slate-100 text-slate-600'}`}>{subscriptions.length}</span> : null}
            </button>
          ))}
        </div>
      </div>

      <div aria-labelledby={`package-tab-${activeTab}`} id={`package-panel-${activeTab}`} role="tabpanel">
        {loading ? (
          <div className="grid gap-4 xl:grid-cols-2"><div className="h-56 animate-pulse rounded-2xl bg-slate-200" /><div className="h-56 animate-pulse rounded-2xl bg-slate-200" /></div>
        ) : error ? null : activeTab === 'mine' ? (
          <MyPackagesTab subscriptions={subscriptions} availablePackages={availablePackages} onDetails={setDetail} />
        ) : activeTab === 'fees' ? (
          <FeesTab packages={availablePackages} onDetails={(item) => setDetail({ kind: 'available', item })} />
        ) : activeTab === 'history' ? (
          <HistoryTab subscriptions={subscriptions} onDetails={(item) => setDetail({ kind: 'subscription', item })} />
        ) : (
          <GuideTab />
        )}
      </div>

      {!loading && !error ? (
        <footer className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-xs leading-5 text-slate-600 shadow-sm shadow-slate-950/[0.02] sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <span className="flex items-start gap-2"><CreditCard aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-slate-700" />{selectedTab?.id === 'fees' ? 'Mức phí và thời hạn được lấy từ thông tin gói hiện có.' : 'Thông tin gói và trạng thái được lấy từ tài khoản của bạn.'}</span>
          <span className="shrink-0 text-slate-500">{subscriptions.length} gói đã ghi nhận</span>
        </footer>
      ) : null}

      {detail ? <PackageDetailModal detail={detail} onClose={() => setDetail(null)} /> : null}
    </section>
  )
}
