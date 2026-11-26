import { useEffect, useState } from 'react'
import { apiRequest } from '../../shared/api/apiClient'
import type { PackagesOverviewResponse, ParkingLotDto, ParkingPackageDto, ParkingSessionDto } from '../../types/api'
import { adminErrorMessage } from './adminApi'
import { getParkingLots } from './parkingLotsApi'

type LoadResult<T> = { status: 'loading' } | { status: 'error'; message: string } | { status: 'ready'; data: T }

function useOperationalData<T>(load: (signal: AbortSignal) => Promise<T>, revision = 0) {
  const [result, setResult] = useState<{ revision: number; state: LoadResult<T> }>()
  useEffect(() => {
    const controller = new AbortController()
    load(controller.signal).then(data => {
      if (!controller.signal.aborted) setResult({ revision, state: { status: 'ready', data } })
    }).catch(error => {
      if (!controller.signal.aborted) setResult({ revision, state: { status: 'error', message: adminErrorMessage(error) } })
    })
    return () => controller.abort()
  }, [load, revision])
  return result?.revision === revision ? result.state : { status: 'loading' } as const
}

async function loadCatalog(signal: AbortSignal) {
  const response = await apiRequest<PackagesOverviewResponse>('/packages', { signal })
  return response.availablePackages
}

function loadSessions(signal: AbortSignal) {
  return apiRequest<ParkingSessionDto[]>('/staff/sessions/history', { signal })
}

export const useAdminPackageCatalog = (revision = 0) => useOperationalData(loadCatalog, revision)
export const useAdminSessionHistory = (revision = 0) => useOperationalData(loadSessions, revision)
export const useAdminLotReference = () => useOperationalData(getParkingLots)

export type DemoTransaction = { code: string; description: string; channel: string; expected: number; received: number }

// Only use actual catalog names and prices. Payment outcomes are illustrative, not receipts.
export function buildDemoTransactions(catalog: ParkingPackageDto[]): DemoTransaction[] {
  const sorted = [...catalog].sort((a, b) => a.id - b.id)
  if (!sorted.length) return []
  const semester = sorted.find(p => p.code === 'PKG_SEM_261') ?? sorted[0]
  const month = sorted.find(p => p.code === 'PKG_MONTH_STD') ?? sorted[1] ?? sorted[0]
  return [
    { code: 'GD-001', package: month, channel: 'Chuyển khoản', ratio: 1 },
    { code: 'GD-002', package: month, channel: 'Cổng thanh toán', ratio: 0.8 },
    { code: 'GD-003', package: semester, channel: 'Chuyển khoản', ratio: 1 },
    { code: 'GD-004', package: month, channel: 'Cổng thanh toán', ratio: 0 },
  ].map(row => ({ code: row.code, description: row.package.name, channel: row.channel, expected: row.package.price, received: Math.round(row.package.price * row.ratio) }))
}

export function transactionTotals(rows: DemoTransaction[]) {
  const expected = rows.reduce((sum, row) => sum + row.expected, 0)
  const received = rows.reduce((sum, row) => sum + row.received, 0)
  return { expected, received, discrepancy: expected - received, matched: rows.filter(row => row.expected === row.received).length, count: rows.length }
}

export const money = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })

export type DemoReservation = { code: string; owner: string; lotId: number; lot: string; time: string; status: string }

// Reservations do not alter real occupied/available counts. Only reference actual open car lots.
export function buildDemoReservations(lots: ParkingLotDto[]): DemoReservation[] {
  const eligible = lots.filter(lot => lot.status === 'OPEN' && lot.availableSlots > 0 && (lot.allowedVehicleTypes ?? '').split(',').map(t => t.trim()).includes('CAR')).sort((a, b) => a.id - b.id)
  if (!eligible.length) return []
  const examples = [
    { code: 'DC-001', owner: 'DEMO-01', time: '07:30–11:30', status: 'Đã xác nhận' },
    { code: 'DC-002', owner: 'DEMO-02', time: '13:00–17:00', status: 'Chờ xác nhận' },
    { code: 'DC-003', owner: 'DEMO-03', time: '08:00–12:00', status: 'Đã hủy' },
  ]
  return examples.map((row, index) => ({ ...row, lotId: eligible[index % eligible.length].id, lot: eligible[index % eligible.length].name }))
}

export function vietnamDate(date: Date) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date)
  return ['year', 'month', 'day'].map(type => parts.find(part => part.type === type)?.value).join('-')
}

function instant(value: string | null) {
  if (!value) return null
  const date = new Date(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?$/.test(value) ? `${value}Z` : value)
  return Number.isNaN(date.getTime()) ? null : date.getTime()
}

export function latestSessionDate(sessions: ParkingSessionDto[], now: number) {
  const timestamps = sessions.flatMap(session => [instant(session.checkinTime), instant(session.checkoutTime)])
    .filter((time): time is number => time !== null && time <= now)
  if (!timestamps.length) return null
  return vietnamDate(new Date(timestamps.reduce((latest, value) => Math.max(latest, value))))
}

export function hourlySessionStats(sessions: ParkingSessionDto[], capacity: number, date: string, now = Date.now()) {
  const start = Date.parse(`${date}T00:00:00+07:00`)
  if (!Number.isFinite(start) || start > now) return []
  const hourCount = Math.min(24, Math.floor((now - start) / 3600000) + 1)
  const intervals = sessions.map(session => ({ start: instant(session.checkinTime), end: instant(session.checkoutTime), status: session.status }))
    .filter(s => s.start !== null && (s.end !== null || s.status === 'ACTIVE'))
  return Array.from({ length: hourCount }, (_, hour) => {
    const from = start + hour * 3600000
    const to = Math.min(from + 3600000, now + 1)
    const entered = intervals.filter(s => s.start! >= from && s.start! < to).length
    const exited = intervals.filter(s => s.end !== null && s.end >= from && s.end < to).length
    const occupied = intervals.filter(s => s.start! < to && (s.end === null || s.end >= to)).length
    return { hour: `${String(hour).padStart(2, '0')}:00`, entered, exited, occupied, rate: capacity > 0 ? Math.round(occupied / capacity * 1000) / 10 : 0 }
  })
}
