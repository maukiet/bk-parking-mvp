import type { ParkingLotDto, UpdateParkingLotRequest } from '../../types/api'
import { requestAdmin } from './adminApi'

export function getParkingLots(signal: AbortSignal) {
  return requestAdmin<ParkingLotDto[]>('/parking-lots', { signal })
}

export function getParkingLot(id: number, signal: AbortSignal) {
  return requestAdmin<ParkingLotDto>(`/parking-lots/${id}`, { signal })
}

export function updateParkingLot(id: number, patch: UpdateParkingLotRequest) {
  return requestAdmin<ParkingLotDto>(`/parking-lots/${id}`, {
    method: 'PUT',
    body: JSON.stringify(patch),
  })
}
