import { apiDelete, apiGet, apiPost, apiUpload } from '../../shared/api/apiClient'
import type {
  CreateVehicleRequest,
  UserVehicleDto,
  VehicleDocumentType,
  VehicleDocumentUploadResponse,
  VehicleEligibilityDto,
} from '../../types/api'

export function getMyVehicles() {
  return apiGet<UserVehicleDto[]>('/vehicles/my')
}

export function getVehicleEligibility() {
  return apiGet<VehicleEligibilityDto>('/vehicles/eligibility')
}

export function uploadVehicleDocument(file: File, purpose: VehicleDocumentType) {
  const form = new FormData()
  form.append('purpose', purpose)
  form.append('file', file)
  return apiUpload<VehicleDocumentUploadResponse>('/vehicles/documents', form)
}

export function registerVehicle(request: CreateVehicleRequest) {
  return apiPost<UserVehicleDto>('/vehicles', request)
}

export function cancelMyVehicle(id: number) {
  return apiDelete<UserVehicleDto>(`/vehicles/${id}`)
}
