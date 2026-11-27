import { apiGet } from '../../shared/api/apiClient'
import type { PackagesOverviewResponse } from '../../types/api'

export function getPackagesOverview() {
  return apiGet<PackagesOverviewResponse>('/packages')
}
