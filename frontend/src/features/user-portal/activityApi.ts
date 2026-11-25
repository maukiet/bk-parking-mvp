import { apiGet } from '../../shared/api/apiClient'
import type { ParkingSessionDto } from '../../types/api'

export function getMySessionHistory() {
  return apiGet<ParkingSessionDto[]>('/sessions/my-history')
}
