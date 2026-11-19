import type { AdminVehicleDto } from '../../types/api'
import { requestAdmin } from './adminApi'

export function getAdminVehicles(filters: { status: string; keyword: string }, signal: AbortSignal) {
  const query = new URLSearchParams()
  if (filters.status) query.set('status', filters.status)
  if (filters.keyword) query.set('keyword', filters.keyword)
  return requestAdmin<AdminVehicleDto[]>(`/vehicles?${query}`, { signal })
}

export function getAdminVehicle(id: number, signal: AbortSignal) {
  return requestAdmin<AdminVehicleDto>(`/vehicles/${id}`, { signal })
}

export function reviewAdminVehicle(id: number, action: 'approve' | 'reject', reason: string) {
  return requestAdmin<AdminVehicleDto>(`/vehicles/${id}/${action}`, {
    method: 'PATCH',
    body: action === 'reject' ? JSON.stringify({ reason }) : undefined,
  })
}
