import { Link, useOutletContext } from 'react-router'
import { Icon, type IconName } from '../../../shared/components/Icon'
import type { AdminDashboardContext } from '../layout/AdminPortalLayout'
import type { ParkingLotStatus } from '../../../types/api'
import { AdminDashboardInsights } from './AdminDashboardInsights'

const numberFormat = new Intl.NumberFormat('vi-VN')
const card = 'rounded-2xl border border-slate-200 bg-white p-5'
const lotStatus: Record<ParkingLotStatus, string> = {
  OPEN: 'Đang mở', FULL: 'Đã đầy', CLOSED: 'Đã đóng', MAINTENANCE: 'Bảo trì',
}
const sampleOccupancy = [25, 54, 81, 83, 74, 69, 78, 73, 62, 68, 71, 47, 32, 23]

export function AdminDashboardPage() {
  const { state, refresh, lotId, query } = useOutletContext<AdminDashboardContext>()
  const summary = state.status === 'ready' ? state.summary : null
  const keyword = query.trim().toLocaleLowerCase('vi-VN')
  const lots = summary?.parkingLots.filter(lot =>
    (!lotId || String(lot.id) === lotId) &&
    `${lot.name} ${lot.code} ${lot.location}`.toLocaleLowerCase('vi-VN').includes(keyword),
  ) ?? []
  const metrics: { title: string; value: number | undefined; icon: IconName; unit?: string }[] = [
    { title: 'Xe đang đỗ', value: summary?.totalOccupied, icon: 'vehicles' },
    { title: 'Tỷ lệ lấp đầy toàn hệ thống', value: summary?.overallOccupancyRate, icon: 'dashboard', unit: '%' },
    { title: 'Chỗ đỗ còn trống', value: summary?.totalAvailable, icon: 'reservation' },
    { title: 'Hồ sơ xe chờ duyệt', value: summary?.pendingVehicleApprovals, icon: 'packages' },
    { title: 'Phiên gửi xe đã hoàn tất', value: summary?.completedSessionsCount, icon: 'history' },
    { title: 'Việc cần xử lý và cảnh báo', value: summary?.alerts.length, icon: 'bell' },
  ]

  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bảng điều khiển</h1>
          {state.status === 'ready' && (
            <p className="mt-2 text-sm text-green-700">Cập nhật lúc {state.updatedAt.toLocaleTimeString('vi-VN')}</p>
          )}
        </div>
        <button type="button" onClick={refresh} disabled={state.status === 'loading'} className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold disabled:opacity-50">
          Làm mới
        </button>
      </div>

      {state.status === 'loading' && <p role="status">Đang tải số liệu…</p>}
      {state.status === 'error' && <p role="alert" className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900">{state.message}</p>}

      <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {metrics.map(metric => (
          <div key={metric.title} className={card}>
            <div className="mb-4 grid size-10 place-items-center rounded-xl bg-black text-lime-400"><Icon name={metric.icon} /></div>
            <dt className="text-sm text-slate-600">{metric.title}</dt>
            <dd className="mt-2 text-2xl font-bold tabular-nums">
              {metric.value === undefined ? '—' : numberFormat.format(metric.value) + (metric.unit ?? '')}
            </dd>
          </div>
        ))}
      </dl>

      <section aria-labelledby="lot-heading">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 id="lot-heading" className="text-xl font-bold">{summary ? `Tình trạng ${summary.totalLots} bãi xe` : 'Tình trạng bãi xe'}</h2>
          <Link to="/admin/parking-lots" className="text-sm font-semibold hover:underline">Quản lý bãi đỗ →</Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {lots.map(lot => (
            <article key={lot.id} className={card}>
              <h3 className="font-bold">{lot.name}</h3>
              <p className="mt-1 text-xs text-slate-500">{lot.location}</p>
              <p className="my-3 text-xl font-bold">Còn {numberFormat.format(lot.availableSlots)} chỗ</p>
              <div role="meter" aria-label={`Tỷ lệ lấp đầy ${lot.name}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.min(100, Math.max(0, lot.occupancyRate))} className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div className={`h-full rounded-full ${lot.occupancyRate > 90 ? 'bg-red-500' : lot.occupancyRate >= 70 ? 'bg-amber-500' : 'bg-green-500'}`} style={{ width: `${Math.min(100, Math.max(0, lot.occupancyRate))}%` }} />
              </div>
              <p className="mt-3 text-xs text-slate-600">{lot.occupancyRate}% · {lot.occupiedCount}/{lot.capacity} xe · {lotStatus[lot.status]}</p>
            </article>
          ))}
        </div>
        {summary && !lots.length && <p className="text-sm text-slate-600">Không có bãi xe phù hợp.</p>}
      </section>

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <section className={card} aria-labelledby="chart-heading">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 id="chart-heading" className="font-bold">Tỷ lệ lấp đầy theo giờ</h2>
            <span className="text-xs text-slate-500">Dữ liệu minh họa</span>
          </div>
          <div aria-hidden="true" className="mt-5 flex h-44 items-end gap-1 border-b border-slate-200 sm:gap-2">
            {sampleOccupancy.map((value, index) => <div key={index} title={`${index + 6}:00 · ${value}%`} className="flex-1 rounded-t-sm bg-slate-900" style={{ height: `${value}%` }} />)}
          </div>
          <details className="mt-3 text-sm text-slate-600">
            <summary className="cursor-pointer">Xem số liệu minh họa</summary>
            <dl className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {sampleOccupancy.map((value, index) => <div key={index}><dt>{index + 6}:00</dt><dd>{value}%</dd></div>)}
            </dl>
          </details>
        </section>
        <section className={card} aria-labelledby="alerts-heading">
          <h2 id="alerts-heading" className="font-bold">Việc cần xử lý và cảnh báo</h2>
          {summary?.alerts.length === 0 && <p className="mt-3 text-sm text-slate-600">Hiện chưa có cảnh báo.</p>}
          {summary && (
            <ul className="mt-3 space-y-2">
              {summary.alerts.map((alert, index) => (
                <li key={`${alert.targetRoute}-${index}`} className={`flex flex-wrap items-center justify-between gap-2 rounded-xl p-3 text-sm ${alert.type === 'WARNING' ? 'bg-red-50 text-red-800' : 'bg-slate-50'}`}>
                  <span>{alert.title}</span>
                  <Link to={alert.targetRoute} className="font-semibold underline">{alert.type === 'WARNING' ? 'Xem bãi đỗ' : 'Xử lý'}</Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
      <AdminDashboardInsights />
    </div>
  )
}
