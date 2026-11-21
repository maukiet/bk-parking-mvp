export type ReservationStatus = 'HELD' | 'COMPLETED' | 'NO_SHOW' | 'CANCELED'

export type MockParkingLot = {
  id: string
  name: string
  location: string
  capacity: number
  occupied: number
  reserved: number
  availableSlots: number
  dailyLimit: number
  status: 'OPEN' | 'FULL' | 'CLOSED'
}

export type MockVehicle = {
  id: string
  name: string
  licensePlate: string
  detail: string
}

export type MockReservation = {
  id: string
  parkingLotId: string
  vehicleId: string
  appointmentAt: string
  holdUntil: string
  status: ReservationStatus
  createdAt: string
}

function localDateTime(dayOffset: number, hour: number, minute = 0) {
  const date = new Date()
  date.setDate(date.getDate() + dayOffset)
  date.setHours(hour, minute, 0, 0)
  return date.toISOString()
}

export function localDateInputValue(dayOffset = 0) {
  const date = new Date()
  date.setDate(date.getDate() + dayOffset)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export const mockVehicles: MockVehicle[] = [
  {
    id: 'vehicle-1',
    name: 'Tesla Model 3',
    licensePlate: '59P1-123.45',
    detail: 'Ô tô · Trắng · Đã duyệt',
  },
  {
    id: 'vehicle-2',
    name: 'Toyota Vios',
    licensePlate: '51H-806.28',
    detail: 'Ô tô · Bạc · Đã duyệt',
  },
]

export function createMockParkingLots(): MockParkingLot[] {
  return [
    {
      id: 'lot-e',
      name: 'Bãi E – Khu Hành chính & Giảng viên',
      location: 'Cổng Nam trục lộ A2 · Ưu tiên ô tô cán bộ, giảng viên',
      capacity: 120,
      occupied: 88,
      reserved: 25,
      availableSlots: 7,
      dailyLimit: 20,
      status: 'OPEN',
    },
    {
      id: 'lot-a',
      name: 'Bãi A – Khu Giảng đường',
      location: 'Cổng chính · Khu vực xe máy',
      capacity: 20,
      occupied: 20,
      reserved: 0,
      availableSlots: 0,
      dailyLimit: 20,
      status: 'FULL',
    },
    {
      id: 'lot-b',
      name: 'Bãi B – Ký túc xá',
      location: 'Đường nội bộ phía Đông',
      capacity: 40,
      occupied: 29,
      reserved: 8,
      availableSlots: 3,
      dailyLimit: 12,
      status: 'OPEN',
    },
  ]
}

export function createMockReservations(): MockReservation[] {
  const tomorrowAtEight = localDateTime(1, 8)
  const tomorrowAtEightThirty = localDateTime(1, 8, 30)
  return [
    {
      id: 'DC-261121-0045',
      parkingLotId: 'lot-e',
      vehicleId: 'vehicle-1',
      appointmentAt: tomorrowAtEight,
      holdUntil: tomorrowAtEightThirty,
      status: 'HELD',
      createdAt: localDateTime(0, 7, 45),
    },
    {
      id: 'DC-261118-0021',
      parkingLotId: 'lot-e',
      vehicleId: 'vehicle-1',
      appointmentAt: localDateTime(-3, 8, 30),
      holdUntil: localDateTime(-3, 9),
      status: 'COMPLETED',
      createdAt: localDateTime(-4, 17, 20),
    },
    {
      id: 'DC-261114-0012',
      parkingLotId: 'lot-e',
      vehicleId: 'vehicle-1',
      appointmentAt: localDateTime(-7, 13, 30),
      holdUntil: localDateTime(-7, 14),
      status: 'NO_SHOW',
      createdAt: localDateTime(-8, 9, 10),
    },
    {
      id: 'DC-261111-0008',
      parkingLotId: 'lot-b',
      vehicleId: 'vehicle-2',
      appointmentAt: localDateTime(-10, 14),
      holdUntil: localDateTime(-10, 14, 30),
      status: 'CANCELED',
      createdAt: localDateTime(-11, 10, 5),
    },
  ]
}

export const mockReservationPolicy = {
  noShowCount: 1,
  noShowLimit: 3,
  lockDays: 14,
  holdMinutes: 30,
  mockUserName: 'Nguyễn Văn An',
  mockUserRole: 'Cán bộ / Giảng viên',
}
