import type { ParkingLotStatus, VehicleStatus } from '../../types/api'

export const vehicleStatuses: Record<VehicleStatus, string> = {
  PENDING: 'Chờ duyệt', APPROVED: 'Đã duyệt', REJECTED: 'Đã từ chối', LOCKED: 'Đã khóa', CANCELED: 'Đã hủy',
}

export const parkingStatuses: Record<ParkingLotStatus, string> = {
  OPEN: 'Hoạt động', FULL: 'Đã đầy', CLOSED: 'Tạm đóng', MAINTENANCE: 'Bảo trì',
}

export const vehicleTypes: Record<string, string> = {
  MOTORBIKE: 'Xe máy', ELECTRIC_BIKE: 'Xe điện', BICYCLE: 'Xe đạp', CAR: 'Ô tô',
}

export function vehicleTypeLabel(type: string) {
  return vehicleTypes[type] ?? 'Loại xe khác'
}

const dateFormatter = new Intl.DateTimeFormat('vi-VN', {
  timeZone: 'Asia/Ho_Chi_Minh', day: '2-digit', month: '2-digit', year: 'numeric',
  hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
})

export function formatAdminDateTime(value: string | Date | null | undefined) {
  if (!value) return 'Chưa có thông tin'
  // The current Docker backend serializes UTC LocalDateTime without an offset.
  const date = typeof value === 'string'
    ? new Date(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?$/.test(value) ? `${value}Z` : value)
    : value
  return Number.isNaN(date.getTime()) ? 'Chưa có thông tin' : dateFormatter.format(date)
}
