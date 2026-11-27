import { Link, useOutletContext } from 'react-router'
import { useState } from 'react'
import type { AdminDashboardContext } from '../layout/AdminPortalLayout'
import { AdminDashboardInsights } from './AdminDashboardInsights'
import { AdminStatusBadge } from '../AdminStatusBadge'
import { formatAdminDateTime } from '../adminPresentation'
import { HourlyChart } from '../HourlyChart'
import { hourlySessionStats, latestSessionDate, useAdminSessionHistory, vietnamDate } from '../adminOperationalData'

const numberFormat = new Intl.NumberFormat('vi-VN')
const card = 'rounded-2xl border border-slate-200 bg-white p-5'

export function AdminDashboardPage() {
  const { state, refresh, revision, lotId } = useOutletContext<AdminDashboardContext>()
  const summary = state.status === 'ready' ? state.summary : null
  const sessionHistory = useAdminSessionHistory(revision)
  const [initialTime] = useState(() => new Date())
  const snapshotTime = state.status === 'ready' ? state.updatedAt : initialTime
  const today = vietnamDate(snapshotTime)
  const [chartDate, setChartDate] = useState(() => vietnamDate(initialTime))
  const lots = summary?.parkingLots.filter(lot => !lotId || String(lot.id) === lotId) ?? []
  const lotIds = new Set(lots.map(lot => lot.id))
  const chartCapacity = lots.reduce((sum, lot) => sum + lot.capacity, 0)
  const relevantSessions = sessionHistory.status === 'ready' ? sessionHistory.data.filter(session => lotIds.has(session.parkingLotId)) : []
  const recentDate = latestSessionDate(relevantSessions, snapshotTime.getTime())
  const hourly = summary && sessionHistory.status === 'ready'
    ? hourlySessionStats(relevantSessions, chartCapacity, chartDate, snapshotTime.getTime())
    : []
  const chartHours = hourly.map(row => row.hour)
  const chartTrafficMax = Math.max(1, ...hourly.flatMap(row => [row.entered, row.exited]))
  const occupancyRate = summary?.overallOccupancyRate
  const pendingApprovals = summary?.pendingVehicleApprovals ?? 0
  const metrics: {
    title: string
    value: number | undefined
    unit?: string
    hint?: string
    hintTone?: 'default' | 'warning'
    hintTo?: string
    progress?: number
  }[] = [
    {
      title: 'Xe đang đỗ',
      value: summary?.totalOccupied,
      hint: summary ? `Tổng sức chứa ${numberFormat.format(summary.totalCapacity)} chỗ` : undefined,
    },
    {
      title: 'Tỷ lệ lấp đầy toàn hệ thống',
      value: occupancyRate,
      unit: '%',
      progress: occupancyRate,
    },
    {
      title: 'Chỗ trống vật lý',
      value: summary?.totalAvailable,
      hint: summary ? `Tại ${numberFormat.format(summary.totalLots)} bãi đỗ` : undefined,
    },
    {
      title: 'Hồ sơ xe chờ duyệt',
      value: summary?.pendingVehicleApprovals,
      hint: summary
        ? pendingApprovals > 0
          ? 'Cần kiểm tra & duyệt →'
          : 'Không có hồ sơ chờ'
        : undefined,
      hintTone: pendingApprovals > 0 ? 'warning' : 'default',
      hintTo: pendingApprovals > 0 ? '/admin/vehicles?tab=pending' : undefined,
    },
    {
      title: 'Phiên gửi xe đã hoàn tất',
      value: summary?.completedSessionsCount,
      hint: summary ? `Đang gửi: ${numberFormat.format(summary.activeSessionsCount)} phiên` : undefined,
    },
  ]

  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bảng điều khiển</h1>
          {state.status === 'ready' && (
            <p className="mt-2 text-sm text-green-700">Cập nhật lúc {formatAdminDateTime(state.updatedAt)} (GMT+7)</p>
          )}
        </div>
        <button type="button" onClick={refresh} disabled={state.status === 'loading'} className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold disabled:opacity-50">
          Làm mới
        </button>
      </div>

      {state.status === 'loading' && <p role="status">Đang tải số liệu…</p>}
      {state.status === 'error' && <p role="alert" className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900">{state.message}</p>}

      <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {metrics.map(metric => (
          <div
            key={metric.title}
            className={`${card} flex min-w-0 flex-col justify-between gap-4 transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md motion-reduce:transition-none motion-reduce:hover:translate-y-0`}
          >
            <dt className="text-sm font-medium leading-snug text-slate-600">{metric.title}</dt>
            <div className="space-y-2">
              <dd className="text-3xl font-bold tracking-tight text-slate-950 tabular-nums">
                {metric.value === undefined ? '—' : numberFormat.format(metric.value) + (metric.unit ?? '')}
              </dd>
              <div className="flex min-h-4 items-center">
                {metric.progress !== undefined ? (
                  <div aria-hidden="true" className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full transition-[width] ${
                        metric.progress > 90
                          ? 'bg-red-500'
                          : metric.progress >= 70
                            ? 'bg-amber-500'
                            : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(0, metric.progress))}%` }}
                    />
                  </div>
                ) : metric.hintTo ? (
                  <Link
                    to={metric.hintTo}
                    className="inline-flex items-center gap-1.5 text-xs font-medium leading-4 text-amber-700 hover:underline"
                  >
                    <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-amber-500" />
                    <span>{metric.hint}</span>
                  </Link>
                ) : (
                  <p
                    className={`flex items-center gap-1.5 text-xs leading-4 ${
                      metric.hintTone === 'warning' ? 'font-medium text-amber-700' : 'text-slate-500'
                    }`}
                  >
                    {metric.hintTone === 'warning' && (
                      <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-amber-500" />
                    )}
                    <span>{metric.hint ?? '\u00A0'}</span>
                  </p>
                )}
              </div>
            </div>
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
            <article key={lot.id} className={`${card} flex min-w-0 flex-col justify-between gap-3 transition-shadow hover:shadow-md motion-reduce:transition-none`}>
              <div>
                <h3 className="font-bold">{lot.name}</h3>
                <p className="mt-1 text-xs text-slate-500">{lot.location}</p>
              </div>
              <div>
                <p className="mb-3 text-xl font-bold">{lot.status === 'CLOSED' || lot.status === 'MAINTENANCE' ? 'Không nhận xe' : `Còn ${numberFormat.format(lot.availableSlots)} chỗ`}</p>
                <div role="meter" aria-label={`Tỷ lệ lấp đầy ${lot.name}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.min(100, Math.max(0, lot.occupancyRate))} className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div className={`h-full rounded-full ${lot.occupancyRate > 90 ? 'bg-red-500' : lot.occupancyRate >= 70 ? 'bg-amber-500' : 'bg-green-500'}`} style={{ width: `${Math.min(100, Math.max(0, lot.occupancyRate))}%` }} />
                </div>
                <p className="mt-3 text-xs text-slate-600">{lot.occupancyRate}% · {lot.occupiedCount}/{lot.capacity} xe</p>
                <div className="mt-2"><AdminStatusBadge status={lot.status} /></div>
              </div>
            </article>
          ))}
        </div>
        {summary && !lots.length && <p className="text-sm text-slate-600">Không có bãi xe phù hợp.</p>}
      </section>

      <section className="space-y-3" aria-label="Thống kê gửi xe theo giờ">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-bold">Thống kê gửi xe theo giờ</h2>
          <div className="flex min-w-0 flex-wrap items-center gap-2 text-sm">
            {recentDate && recentDate !== chartDate && (
              <button
                type="button"
                className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 font-semibold text-slate-700 hover:bg-slate-50"
                onClick={() => setChartDate(recentDate)}
              >
                Ngày gần nhất ({recentDate.split('-').reverse().join('/')})
              </button>
            )}
            {chartDate !== today && (
              <button
                type="button"
                className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 font-semibold text-slate-700 hover:bg-slate-50"
                onClick={() => setChartDate(today)}
              >
                Hôm nay
              </button>
            )}
            <label className="flex flex-wrap items-center gap-2">
              <span className="text-slate-600">Ngày thống kê</span>
              <input
                name="date"
                type="date"
                max={today}
                value={chartDate}
                onChange={event => {
                  const date = event.target.value
                  if (date && date <= today) setChartDate(date)
                }}
                className="min-h-11 min-w-0 rounded-xl border border-slate-200 bg-white px-3 py-2"
              />
            </label>
          </div>
        </div>
        <p className="text-sm text-slate-600">Dữ liệu từ lịch sử gửi xe thật · GMT+7 · {lotId ? 'Bãi đang lọc' : 'Toàn hệ thống'}. Tỷ lệ tại mỗi giờ tính theo sức chứa hiện tại; giờ đang diễn ra tính đến lúc tải.</p>
        {sessionHistory.status === 'loading' && <p role="status">Đang tải lịch sử gửi xe…</p>}
        {sessionHistory.status === 'error' && <p role="alert" className="rounded-xl bg-amber-50 p-3">{sessionHistory.message}</p>}
        {summary && sessionHistory.status === 'ready' && lots.length > 0 && hourly.length > 0 && <div className="grid gap-4 lg:grid-cols-2">
        <section className={card} aria-labelledby="chart-heading">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 id="chart-heading" className="font-bold">Tỷ lệ lấp đầy theo giờ</h2>
          </div>
          <div className="mt-3"><HourlyChart hours={chartHours} series={[{ label: 'Lấp đầy', color: 'bg-slate-900', values: hourly.map(row => row.rate) }]} max={100} unit="%" /></div>
          <details className="mt-3 text-sm text-slate-600">
            <summary className="cursor-pointer">Xem số liệu chi tiết</summary>
            <dl className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {hourly.map(row => <div key={row.hour}><dt>{row.hour}</dt><dd>{row.rate}% · {row.occupied} xe</dd></div>)}
            </dl>
          </details>
        </section>
        <section className={card} aria-labelledby="traffic-heading">
          <h2 id="traffic-heading" className="font-bold">Lượt vào/ra theo giờ</h2>
          <p className="mt-1 text-xs text-slate-600">Đen: lượt vào · Xanh: lượt ra</p>
          <HourlyChart hours={chartHours} series={[{ label: 'Vào', color: 'bg-slate-900', values: hourly.map(row => row.entered) }, { label: 'Ra', color: 'bg-lime-500', values: hourly.map(row => row.exited) }]} max={chartTrafficMax} />
          <details className="mt-3 text-sm text-slate-600"><summary className="cursor-pointer">Xem dạng bảng</summary><table className="mt-2 w-full text-left"><thead><tr><th scope="col">Giờ</th><th scope="col">Vào</th><th scope="col">Ra</th></tr></thead><tbody>{hourly.map(row => <tr key={row.hour}><th scope="row" className="font-normal">{row.hour}</th><td>{row.entered}</td><td>{row.exited}</td></tr>)}</tbody></table></details>
        </section>
        </div>}
        {summary && !lots.length && <p className="text-sm text-slate-600">Không có bãi xe phù hợp để thống kê.</p>}
      </section>
      <AdminDashboardInsights lots={summary?.parkingLots} revision={revision} />
    </div>
  )
}
