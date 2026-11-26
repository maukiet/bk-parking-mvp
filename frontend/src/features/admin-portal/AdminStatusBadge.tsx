import type { ParkingLotStatus, VehicleStatus } from '../../types/api'
import { vehicleStatuses, parkingStatuses } from './adminPresentation'

const success = new Set(['APPROVED', 'OPEN', 'Đã xác nhận', 'Khớp', 'Đã ghi nhận'])
const warning = new Set(['PENDING', 'MAINTENANCE', 'Chờ xác nhận', 'Chênh lệch', 'Đang xử lý'])
const danger = new Set(['REJECTED', 'LOCKED', 'FULL', 'Chưa nhận tiền', 'Chưa xử lý'])

export function AdminStatusBadge({ status }: { status: string }) {
  const label = vehicleStatuses[status as VehicleStatus] ?? parkingStatuses[status as ParkingLotStatus] ?? status
  const style = success.has(status) ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
    : warning.has(status) ? 'border-amber-200 bg-amber-50 text-amber-800'
    : danger.has(status) ? 'border-red-200 bg-red-50 text-red-800'
    : 'border-slate-200 bg-slate-100 text-slate-700'
  return <span className={`inline-flex max-w-full items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-semibold ${style}`}><span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-current" />{label}</span>
}

