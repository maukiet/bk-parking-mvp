import type { AdminDashboardSummary } from '../../types/api'
import { requestAdmin } from './adminApi'

export function getAdminDashboard(signal: AbortSignal) {
  return requestAdmin<AdminDashboardSummary>('/dashboard/summary', { signal })
}
